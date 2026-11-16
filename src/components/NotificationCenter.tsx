import { useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  BellIcon,
  CheckCircledIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  FileTextIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import type { NotificationCategory, WorkspaceNotification } from "../accounting";

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: readonly WorkspaceNotification[];
  readIds: ReadonlySet<string>;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onSelectNotification: (notification: WorkspaceNotification) => void;
}

const FILTER_TABS: readonly { id: "all" | NotificationCategory; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "due-invoice", label: "استحقاق الفواتير" },
  { id: "low-stock", label: "المخزون" },
  { id: "system", label: "النظام" },
];

export function NotificationCenter({
  open,
  onClose,
  notifications,
  readIds,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onSelectNotification,
}: NotificationCenterProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | NotificationCategory>("all");

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? notifications
        : notifications.filter((n) => n.category === activeCategory),
    [activeCategory, notifications],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  if (!open) return null;

  const severityLabel = (severity: WorkspaceNotification["severity"]) =>
    severity === "critical" ? "عاجل" : severity === "warning" ? "تنبيه" : "معلومة";

  const CategoryIcon = (category: NotificationCategory) => {
    if (category === "due-invoice") return FileTextIcon;
    if (category === "low-stock") return ExclamationTriangleIcon;
    return InfoCircledIcon;
  };

  return (
    <div className="center-modal-layer" data-testid="notification-center-modal">
      <button className="center-modal-backdrop" aria-label="إغلاق مركز الإشعارات" onClick={onClose} />
      <section
        className="exec-modal exec-notif-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-center-title"
      >
        <header className="exec-modal-header">
          <div className="exec-modal-title-wrap">
            <BellIcon />
            <div>
              <h2 id="notif-center-title">مركز الإشعارات والتنبيهات</h2>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} تنبيه غير مقروء من إجمالي ${notifications.length}`
                  : `جميع التنبيهات مقروءة (${notifications.length})`}
              </p>
            </div>
          </div>
          <div className="exec-modal-header-actions">
            {unreadCount > 0 ? (
              <button type="button" className="exec-action-link" onClick={onMarkAllRead}>
                <CheckCircledIcon />
                <span>تحديد الكل كمقروء</span>
              </button>
            ) : null}
            <button type="button" className="exec-icon-close" aria-label="إغلاق" onClick={onClose}>
              <Cross2Icon />
            </button>
          </div>
        </header>

        <div className="exec-segmented exec-notif-tabs" role="tablist" aria-label="تصنيف الإشعارات">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.id === "all"
                ? notifications.length
                : notifications.filter((n) => n.category === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.id}
                className={activeCategory === tab.id ? "active" : ""}
                onClick={() => setActiveCategory(tab.id)}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="exec-notif-body">
          {filtered.length === 0 ? (
            <div className="exec-empty">
              <p>لا توجد تنبيهات ضمن هذا التصنيف حاليًا.</p>
            </div>
          ) : (
            <ul className="exec-list" data-testid="notification-center-list">
              {filtered.map((item) => {
                const Icon = CategoryIcon(item.category);
                const isUnread = !readIds.has(item.id);
                return (
                  <li key={item.id} className={isUnread ? "exec-notif-item unread" : "exec-notif-item"}>
                    <div className="exec-notif-row">
                      <button
                        type="button"
                        className="exec-notif-main"
                        onClick={() => {
                          onMarkRead(item.id);
                          onSelectNotification(item);
                        }}
                      >
                        <div className="exec-notif-top">
                          <span className={`exec-severity ${item.severity}`}>
                            <Icon />
                            <span>{severityLabel(item.severity)}</span>
                          </span>
                          <span className="exec-row-meta">{item.dateLabel}</span>
                        </div>
                        <strong>{item.title}</strong>
                        <span className="exec-row-detail">{item.message}</span>
                        <span className="exec-row-link">
                          فتح التفاصيل <ArrowLeftIcon />
                        </span>
                      </button>
                      <button
                        type="button"
                        className="exec-notif-dismiss"
                        aria-label={`إخفاء تنبيه ${item.title}`}
                        onClick={() => onDismiss(item.id)}
                      >
                        <Cross2Icon />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
