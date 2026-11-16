import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import jsQR from "jsqr";
import {
  CameraIcon,
  CheckCircledIcon,
  Cross2Icon,
  MagnifyingGlassIcon,
  PlusIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { KeyboardInput } from "../mobile";
import {
  formatAmount,
  normalizeArabicSearch,
  parseArabicNumber,
  parseQrStockPayload,
} from "../accounting";
import { createInventoryItem, updateInventoryItem } from "../firebase";
import { triggerHaptic } from "../utils/haptics";
import type { InventoryItemRecord, WarehouseRecord } from "../types";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  uid: string;
  inventory: readonly InventoryItemRecord[];
  warehouses: readonly WarehouseRecord[];
  onNotify: (message: string) => void;
  onOpenInventoryReport: () => void;
}

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue?: string }[]>;
};

export function QrScannerModal({
  open,
  onClose,
  uid,
  inventory,
  warehouses,
  onNotify,
  onOpenInventoryReport,
}: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [scannedRaw, setScannedRaw] = useState("");
  const [restockDelta, setRestockDelta] = useState("1");
  const [saving, setSaving] = useState(false);

  // Fields for adding a new item when QR doesn't match an existing inventory SKU
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newUnit, setNewUnit] = useState("حبة");
  const [newQty, setNewQty] = useState("10");
  const [newCost, setNewCost] = useState("");
  const [newThreshold, setNewThreshold] = useState("25");
  const [newWarehouseId, setNewWarehouseId] = useState(
    warehouses.find((w) => w.isDefault)?.id ?? warehouses[0]?.id ?? "",
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const applyScannedValue = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      setScannedRaw(trimmed);
      setManualCode(trimmed);
      const parsed = parseQrStockPayload(trimmed);
      setNewName(parsed.name || (!parsed.sku ? parsed.lookupKey : ""));
      setNewSku(parsed.sku || "");
      if (parsed.unit) setNewUnit(parsed.unit);
      if (parsed.quantity !== undefined) setNewQty(String(parsed.quantity));
      if (parsed.avgCost !== undefined) setNewCost(String(parsed.avgCost));
      if (parsed.minThreshold !== undefined) setNewThreshold(String(parsed.minThreshold));
      stopCamera();
      triggerHaptic("success");
      onNotify("تمت قراءة رمز QR بنجاح");
    },
    [onNotify, stopCamera],
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      setCameraError("");
      return;
    }
    if (!newWarehouseId && warehouses.length > 0) {
      setNewWarehouseId(warehouses.find((w) => w.isDefault)?.id ?? warehouses[0].id);
    }
  }, [newWarehouseId, open, stopCamera, warehouses]);

  useEffect(() => {
    if (!open || !cameraActive) return;

    let cancelled = false;
    let rafId = 0;
    let lastTick = 0;

    const DetectorCtor = (
      window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike }
    ).BarcodeDetector;
    const detector = DetectorCtor ? new DetectorCtor({ formats: ["qr_code"] }) : null;

    const scanFrame = async (timestamp: number) => {
      if (cancelled) return;
      if (timestamp - lastTick >= 180) {
        lastTick = timestamp;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            if (detector) {
              try {
                const hits = await detector.detect(canvas);
                const hit = hits.find((h) => h.rawValue);
                if (hit?.rawValue) {
                  applyScannedValue(hit.rawValue);
                  return;
                }
              } catch {
                // Fall back to jsQR below
              }
            }
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code?.data) {
              applyScannedValue(code.data);
              return;
            }
          }
        }
      }
      rafId = window.requestAnimationFrame(scanFrame);
    };

    rafId = window.requestAnimationFrame(scanFrame);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [applyScannedValue, cameraActive, open]);

  const startCamera = async () => {
    setCameraError("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("المتصفح لا يدعم الوصول إلى الكاميرا — يمكنك رفع صورة QR أو إدخال الكود يدويًا.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError("تعذر تشغيل الكاميرا أو تم رفض الإذن — استخدم رفع صورة QR أو الإدخال اليدوي.");
      stopCamera();
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height);
      if (code?.data) {
        applyScannedValue(code.data);
      } else {
        onNotify("لم يتم العثور على رمز QR صالح داخل الصورة");
      }
    } catch {
      onNotify("تعذر قراءة الصورة المختارة");
    }
  };

  const parsedPayload = useMemo(() => parseQrStockPayload(scannedRaw), [scannedRaw]);

  const matchedItem = useMemo(() => {
    if (!parsedPayload.lookupKey) return null;
    const keyNorm = normalizeArabicSearch(parsedPayload.lookupKey);
    const skuNorm = normalizeArabicSearch(parsedPayload.sku ?? "");
    const nameNorm = normalizeArabicSearch(parsedPayload.name ?? "");

    return (
      inventory.find((item) => {
        const itemSku = normalizeArabicSearch(item.sku ?? "");
        const itemName = normalizeArabicSearch(item.name);
        if (item.id === parsedPayload.lookupKey) return true;
        if (skuNorm && itemSku && itemSku === skuNorm) return true;
        if (keyNorm && itemSku && itemSku === keyNorm) return true;
        if (nameNorm && itemName.includes(nameNorm)) return true;
        if (keyNorm && itemName.includes(keyNorm)) return true;
        return false;
      }) ?? null
    );
  }, [inventory, parsedPayload]);

  const warehouseName = useMemo(
    () => warehouses.find((w) => w.id === matchedItem?.warehouseId)?.name ?? "مخزن عام",
    [matchedItem, warehouses],
  );

  const handleQuickRestock = async () => {
    if (!matchedItem) return;
    const addQty = Math.max(1, parseArabicNumber(restockDelta));
    setSaving(true);
    try {
      await updateInventoryItem(uid, matchedItem.id, {
        ...matchedItem,
        quantity: matchedItem.quantity + addQty,
      });
      triggerHaptic("success");
      onNotify(`تمت إضافة ${formatAmount(addQty)} ${matchedItem.unit} إلى "${matchedItem.name}"`);
      onClose();
    } catch {
      triggerHaptic("warning");
      onNotify("تعذر تحديث كمية الصنف — تحقق من الاتصال والصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateScannedItem = async () => {
    if (!newName.trim() || !newWarehouseId) {
      triggerHaptic("warning");
      onNotify("أدخل اسم الصنف واختر المخزن أولًا");
      return;
    }
    setSaving(true);
    try {
      await createInventoryItem(uid, {
        name: newName.trim(),
        sku: newSku.trim() || undefined,
        unit: newUnit.trim() || "حبة",
        quantity: parseArabicNumber(newQty),
        avgCost: parseArabicNumber(newCost),
        minThreshold: parseArabicNumber(newThreshold) || 25,
        warehouseId: newWarehouseId,
      });
      triggerHaptic("success");
      onNotify(`تمت إضافة "${newName.trim()}" إلى المخزون`);
      setScannedRaw("");
      setManualCode("");
      onClose();
    } catch {
      triggerHaptic("warning");
      onNotify("تعذر حفظ الصنف في قاعدة البيانات — حاول مجددًا");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="center-modal-layer" data-testid="qr-scanner-modal">
      <button className="center-modal-backdrop" aria-label="إغلاق ماسح QR" onClick={onClose} />
      <section
        className="exec-modal exec-qr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-scanner-title"
      >
        <header className="exec-modal-header">
          <div className="exec-modal-title-wrap">
            <CameraIcon />
            <div>
              <h2 id="qr-scanner-title">ماسح QR للمخزون والأصناف</h2>
              <p>استعلم عن تفاصيل الصنف أو أضف كمية للمخزون بالكاميرا أو بالكود</p>
            </div>
          </div>
          <button type="button" className="exec-icon-close" aria-label="إغلاق" onClick={onClose}>
            <Cross2Icon />
          </button>
        </header>

        <div className="exec-qr-body">
          <div className="exec-qr-camera-box">
            {cameraActive ? (
              <div className="exec-qr-video-wrap">
                <video ref={videoRef} playsInline muted className="exec-qr-video" />
                <button type="button" className="exec-action-secondary" onClick={stopCamera}>
                  إيقاف الكاميرا
                </button>
              </div>
            ) : (
              <div className="exec-qr-camera-actions">
                <button
                  type="button"
                  className="exec-action-primary"
                  onClick={startCamera}
                  data-testid="qr-start-camera-btn"
                >
                  <CameraIcon />
                  <span>تشغيل الكاميرا للمسح</span>
                </button>
                <button
                  type="button"
                  className="exec-action-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  <span>رفع صورة QR</span>
                </button>
              </div>
            )}
            {cameraError ? (
              <p className="form-error" role="status">
                {cameraError}
              </p>
            ) : null}
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
          </div>

          <div className="exec-qr-lookup-row">
            <KeyboardInput
              aria-label="إدخال كود QR أو رمز الصنف"
              placeholder="أدخل رمز QR أو كود الصنف (مثال: SKU-1005)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <button
              type="button"
              className="exec-action-primary"
              onClick={() => applyScannedValue(manualCode)}
              data-testid="qr-lookup-btn"
            >
              <MagnifyingGlassIcon />
              <span>بحث</span>
            </button>
          </div>

          {scannedRaw && matchedItem ? (
            <div className="exec-qr-result found" data-testid="qr-matched-item">
              <div className="exec-qr-result-head">
                <strong>
                  <CheckCircledIcon /> تم العثور على الصنف: {matchedItem.name}
                </strong>
                <span className="exec-row-meta">
                  {matchedItem.sku || matchedItem.id} · {warehouseName}
                </span>
              </div>
              <div className="exec-qr-specs">
                <span>
                  الرصيد الحالي: <b>{formatAmount(matchedItem.quantity)} {matchedItem.unit}</b>
                </span>
                <span>
                  الحد الأدنى: <b>{formatAmount(matchedItem.minThreshold ?? 25)}</b>
                </span>
                <span>
                  متوسط التكلفة: <b>{formatAmount(matchedItem.avgCost)}</b>
                </span>
              </div>
              <div className="exec-qr-restock-bar">
                <KeyboardInput
                  aria-label="الكمية المضافة للمخزون"
                  inputMode="decimal"
                  placeholder="الكمية"
                  value={restockDelta}
                  onChange={(e) => setRestockDelta(e.target.value)}
                />
                <button
                  type="button"
                  className="exec-action-primary"
                  disabled={saving}
                  onClick={handleQuickRestock}
                >
                  <PlusIcon />
                  <span>{saving ? "جاري التحديث..." : "توريد للمخزون"}</span>
                </button>
                <button type="button" className="exec-action-link" onClick={onOpenInventoryReport}>
                  تقرير المخزون
                </button>
              </div>
            </div>
          ) : scannedRaw ? (
            <div className="exec-qr-result new" data-testid="qr-new-item-form">
              <strong>لم يُطابق الكود صنفًا مسجلًا — أضفه للمخزون فورًا:</strong>
              <div className="exec-qr-form-grid">
                <KeyboardInput
                  aria-label="اسم الصنف الجديد"
                  placeholder="اسم الصنف"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <KeyboardInput
                  aria-label="رمز SKU"
                  placeholder="رمز QR / SKU"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                />
                <KeyboardInput
                  aria-label="الكمية الافتتاحية"
                  inputMode="decimal"
                  placeholder="الكمية"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                />
                <KeyboardInput
                  aria-label="الحد الأدنى للتنبيه"
                  inputMode="decimal"
                  placeholder="الحد الأدنى"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                />
                <KeyboardInput
                  aria-label="الوحدة"
                  placeholder="الوحدة (حبة)"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                />
                <KeyboardInput
                  aria-label="متوسط التكلفة"
                  inputMode="decimal"
                  placeholder="التكلفة"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                />
              </div>
              <select
                aria-label="المخزن المستهدف"
                className="exec-select"
                value={newWarehouseId}
                onChange={(e) => setNewWarehouseId(e.target.value)}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="exec-action-primary"
                disabled={saving}
                onClick={handleCreateScannedItem}
              >
                <PlusIcon />
                <span>{saving ? "جاري الحفظ..." : "إضافة الصنف إلى المخزون"}</span>
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
