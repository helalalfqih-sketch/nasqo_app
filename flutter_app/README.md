# نسقو برو — تطبيق Flutter

نسخة Flutter متكاملة من تطبيق **نسقو برو (Nasqo Pro)** لإدارة الحسابات، الموردين، العملاء، السندات، الفواتير، المخازن، والتقارير المالية باللغة العربية (RTL).

## المتطلبات والتشغيل محلياً

1. تأكد من تثبيت **Flutter SDK 3.22+** و **Dart 3.4+**.
2. انتقل إلى مجلد التطبيق وقم بتثبيت الحزم:
   ```bash
   cd flutter_app
   flutter pub get
   ```
3. (اختياري لربط Android/iOS بـ Firebase):
   ```bash
   dart pub global activate flutterfire_cli
   flutterfire configure --project=autonomous-surge-w01dl
   ```
   > تم تضمين إعدادات الويب والمشروع وقاعدة Firestore المسماة `ai-studio-nasqopromobile-1dc18ee9-cd53-4f64-8c4e-27f7763bc423` مسبقاً في `lib/firebase_options.dart`.
4. تشغيل التطبيق:
   ```bash
   flutter run
   ```

## هيكل المشروع
- `lib/models/nasqo_models.dart`: نماذج البيانات (الحسابات، القيود، المخازن، الأصناف، إعدادات مساحة العمل).
- `lib/services/accounting_service.dart`: محرك الحسابات (الأرصدة التراكمية، تطبيع البحث العربي، تحويل الأرقام العربية، ملخص لوحة التحكم، كشوف الحساب).
- `lib/services/firebase_service.dart`: تكامل Firebase Auth و Cloud Firestore مع التهيئة التلقائية للبيانات الأولية.
- `lib/state/workspace_provider.dart`: إدارة الحالة (مع وضع العرض المحلي والاتصال المباشر بـ Firestore).
- `lib/screens/`: الشاشات الرئيسية (لوحة التحكم، المشتريات والموردين، كشف الحساب النقدي والآجل، القيد البسيط، المخازن، حركة المخزون، معاينة الفاتورة، الإعدادات).
- `lib/widgets/`: القائمة الجانبية والنوافذ المنبثقة (إنشاء حساب، فاتورة، سند، مصارفة عملة، تفعيل).
