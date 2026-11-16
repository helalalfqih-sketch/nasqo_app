import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'screens/dashboard_screen.dart';
import 'state/workspace_provider.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final provider = WorkspaceProvider();
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    await provider.initFirebase();
  } catch (_) {
    // يعمل التطبيق بالبيانات المحلية التجريبية عند عدم توفر تهيئة Firebase على المنصة.
  }

  runApp(
    ChangeNotifierProvider.value(
      value: provider,
      child: const NasqoProApp(),
    ),
  );
}

class NasqoProApp extends StatelessWidget {
  const NasqoProApp({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkspaceProvider>();

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'نسقو برو',
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      themeMode: provider.themeMode,
      theme: NasqoTheme.light(brandColor: provider.brandColor),
      darkTheme: NasqoTheme.dark(brandColor: provider.brandColor),
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        );
      },
      home: const DashboardScreen(),
    );
  }
}
