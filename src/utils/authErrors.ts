export function getFirebaseAuthErrorCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/auth\/[a-z0-9-]+/i);
  return match ? match[0] : "";
}

export function formatAuthError(err: unknown, hostnameOverride?: string): string {
  const code = getFirebaseAuthErrorCode(err);
  const hostname =
    hostnameOverride ?? (typeof window !== "undefined" ? window.location.hostname : "");

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.";
    case "auth/popup-blocked":
      return "قام المتصفح بحظر النافذة المنبثقة. اسمح بالنوافذ المنبثقة أو استخدم المتابعة بإعادة التوجيه.";
    case "auth/unauthorized-domain":
      return `النطاق الحالي (${hostname}) غير مصرح به في Firebase Authentication (auth/unauthorized-domain).`;
    case "auth/operation-not-allowed":
      return "طريقة تسجيل الدخول هذه غير مفعّلة في إعدادات Firebase Authentication (auth/operation-not-allowed).";
    case "auth/operation-not-supported-in-this-environment":
      return "المتصفح أو الإطار الحالي لا يدعم النوافذ المنبثقة لتسجيل الدخول (auth/operation-not-supported-in-this-environment).";
    case "auth/invalid-email":
      return "صيغة البريد الإلكتروني غير صحيحة.";
    case "auth/user-disabled":
      return "تم تعطيل هذا الحساب.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    case "auth/email-already-in-use":
      return "هذا البريد الإلكتروني مسجّل بالفعل. يمكنك تسجيل الدخول أو استعادة كلمة المرور.";
    case "auth/weak-password":
      return "كلمة المرور ضعيفة جدًا؛ يجب أن تكون 6 أحرف على الأقل.";
    case "auth/too-many-requests":
      return "تم إرسال محاولات كثيرة مؤقتًا. انتظر قليلًا ثم حاول مجددًا.";
    case "auth/network-request-failed":
      return "تعذر الاتصال بخدمة المصادقة. تحقق من اتصال الإنترنت وحاول مجددًا.";
    default:
      return code
        ? `تعذر إتمام العملية (${code}).`
        : "تعذر إتمام تسجيل الدخول. تأكد من صحة البيانات وحاول مجددًا.";
  }
}

export function isFirestorePermissionError(err: unknown): boolean {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code ?? "")
      : "";
  if (code === "permission-denied") {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /missing or insufficient permissions|permission-denied/i.test(msg);
}

export function formatWorkspaceInitError(err: unknown): string {
  if (isFirestorePermissionError(err)) {
    return "تم التحقق من البريد الإلكتروني، لكن قاعدة بيانات Firestore رفضت الوصول (Missing or insufficient permissions). أعد المحاولة لتحديث رمز الجلسة، أو تأكد من نشر قواعد firestore.rules في وحدة تحكم Firebase.";
  }
  const authCode = getFirebaseAuthErrorCode(err);
  if (authCode) {
    return formatAuthError(err);
  }
  return "تعذر تحميل أو تهيئة مساحة العمل السحابية. تحقق من الاتصال وأعد المحاولة.";
}
