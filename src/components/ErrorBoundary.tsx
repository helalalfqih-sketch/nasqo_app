import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "حدث خطأ غير متوقع في التطبيق",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: "100dvh",
            padding: "24px",
            background: "#f7f9fc",
            color: "#152536",
            textAlign: "center",
            fontFamily: '"Noto Sans Arabic", Tahoma, Arial, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: "420px",
              padding: "24px",
              borderRadius: "14px",
              background: "#ffffff",
              border: "1px solid #d4e2f0",
              boxShadow: "0 10px 30px rgba(7, 54, 93, 0.1)",
            }}
          >
            <h1 style={{ fontSize: "20px", color: "#075da8", marginBottom: "10px" }}>
              تعذر عرض هذه الشاشة مؤقتًا
            </h1>
            <p style={{ fontSize: "13px", color: "#566a7b", marginBottom: "18px" }}>
              حدث خلل غير متوقع أثناء معالجة البيانات. يمكنك إعادة تحميل الواجهة للمتابعة بأمان.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 22px",
                border: 0,
                borderRadius: "9px",
                background: "#075da8",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
