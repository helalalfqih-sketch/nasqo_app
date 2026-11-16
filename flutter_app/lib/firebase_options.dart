import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// إعدادات Firebase المطابقة لملف firebase-applet-config.json في المشروع.
class DefaultFirebaseOptions {
  static const String firestoreDatabaseId =
      'ai-studio-nasqopromobile-1dc18ee9-cd53-4f64-8c4e-27f7763bc423';

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return ios;
      default:
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBUuQe7mGQ_nB0M5Z3e36XvwIW6pMS0EEc',
    appId: '1:44986645256:web:d2c619b98481d31dac4abd',
    messagingSenderId: '44986645256',
    projectId: 'autonomous-surge-w01dl',
    authDomain: 'autonomous-surge-w01dl.firebaseapp.com',
    storageBucket: 'autonomous-surge-w01dl.firebasestorage.app',
  );

  // ملاحظة: على Android و iOS يُفضل تشغيل `flutterfire configure` لتوليد معرفات التطبيقات الخاصة بكل منصة.
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBUuQe7mGQ_nB0M5Z3e36XvwIW6pMS0EEc',
    appId: '1:44986645256:web:d2c619b98481d31dac4abd',
    messagingSenderId: '44986645256',
    projectId: 'autonomous-surge-w01dl',
    storageBucket: 'autonomous-surge-w01dl.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBUuQe7mGQ_nB0M5Z3e36XvwIW6pMS0EEc',
    appId: '1:44986645256:web:d2c619b98481d31dac4abd',
    messagingSenderId: '44986645256',
    projectId: 'autonomous-surge-w01dl',
    authDomain: 'autonomous-surge-w01dl.firebaseapp.com',
    storageBucket: 'autonomous-surge-w01dl.firebasestorage.app',
  );
}
