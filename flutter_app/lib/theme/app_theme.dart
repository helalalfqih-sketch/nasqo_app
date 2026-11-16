import 'package:flutter/material.dart';

class NasqoColors {
  static const Color blue = Color(0xFF0B5CA8);
  static const Color navy = Color(0xFF07365D);
  static const Color orange = Color(0xFFF39A16);
  static const Color brandTint = Color(0xFFEAF3FC);
  static const Color canvas = Color(0xFFF4F7FB);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color ink = Color(0xFF132238);
  static const Color muted = Color(0xFF6D7C90);
  static const Color line = Color(0xFFD5E0EB);
  static const Color green = Color(0xFF169B62);
  static const Color red = Color(0xFFD84949);
  static const Color cashBlue = Color(0xFF0A66C2);
  static const Color tableAlt = Color(0xFFBAF0F8);
}

class NasqoTheme {
  static ThemeData light({Color brandColor = NasqoColors.blue}) {
    final scheme = ColorScheme.fromSeed(
      seedColor: brandColor,
      primary: brandColor,
      secondary: NasqoColors.orange,
      surface: NasqoColors.surface,
      brightness: Brightness.light,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: NasqoColors.canvas,
      appBarTheme: AppBarTheme(
        backgroundColor: brandColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        color: NasqoColors.surface,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(11),
          side: const BorderSide(color: Color(0xFFE4E4E4)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: NasqoColors.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: NasqoColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: brandColor, width: 1.5),
        ),
      ),
    );
  }

  static ThemeData dark({Color brandColor = NasqoColors.blue}) {
    final scheme = ColorScheme.fromSeed(
      seedColor: brandColor,
      primary: brandColor,
      secondary: NasqoColors.orange,
      brightness: Brightness.dark,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      appBarTheme: AppBarTheme(
        backgroundColor: brandColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
    );
  }
}
