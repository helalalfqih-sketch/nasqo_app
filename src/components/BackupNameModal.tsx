import { useEffect, useState } from "react";
import { KeyboardInput, useKeyboard } from "../mobile";
import { triggerHaptic } from "../utils/haptics";

interface BackupNameModalProps {
  open: boolean;
  onClose: () => void;
  onSaveLocal: (backupName: string) => void;
  onSaveToGoogle: (backupName: string) => Promise<void>;
}

export function BackupNameModal({
  open,
  onClose,
  onSaveLocal,
  onSaveToGoogle,
}: BackupNameModalProps) {
  const keyboard = useKeyboard();
  const [name, setName] = useState("");
  const [savingCloud, setSavingCloud] = useState(false);

  useEffect(() => {
    if (open) {
      setName(`نسخة-${new Date().toISOString().slice(0, 10)}`);
    }
  }, [open]);

  if (!open) return null;

  const trimmed = name.trim() || `نسخة-${new Date().toISOString().slice(0, 10)}`;

  const handleClose = () => {
    keyboard.hide();
    onClose();
  };

  const handleLocalSave = () => {
    keyboard.hide();
    triggerHaptic("success");
    onSaveLocal(trimmed);
    onClose();
  };

  const handleGoogleSave = async () => {
    keyboard.hide();
    setSavingCloud(true);
    try {
      await onSaveToGoogle(trimmed);
      triggerHaptic("success");
      onClose();
    } catch {
      triggerHaptic("warning");
    } finally {
      setSavingCloud(false);
    }
  };

  return (
    <div className="center-modal-layer" data-testid="backup-name-modal">
      <button
        type="button"
        className="center-modal-backdrop"
        onClick={handleClose}
        aria-label="إغلاق اسم النسخة الاحتياطية"
      />
      <section
        className="ref-dialog-card backup-name-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-name-title"
      >
        <h2 id="backup-name-title">اسم النسخة الاحتياطية</h2>

        <label className="ref-outlined-input" htmlFor="backup-name-input">
          <span>اسم النسخة الاحتياطية</span>
          <KeyboardInput
            id="backup-name-input"
            data-testid="backup-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="أدخل اسم النسخة الاحتياطية"
          />
        </label>

        <div className="ref-action-bar cols-3">
          <button
            type="button"
            className="ref-btn blue"
            disabled={savingCloud}
            onClick={handleLocalSave}
            data-testid="backup-save-local-btn"
          >
            حفظ
          </button>
          <button
            type="button"
            className="ref-btn green"
            disabled={savingCloud}
            onClick={() => void handleGoogleSave()}
            data-testid="backup-save-google-btn"
          >
            {savingCloud ? "جاري الحفظ..." : "حفظ إلى جوجل"}
          </button>
          <button
            type="button"
            className="ref-btn purple"
            disabled={savingCloud}
            onClick={handleClose}
          >
            إغلاق
          </button>
        </div>
      </section>
    </div>
  );
}
