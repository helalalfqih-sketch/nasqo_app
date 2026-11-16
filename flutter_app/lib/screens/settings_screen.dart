import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nasqo_models.dart';
import '../state/workspace_provider.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _companyCtrl;
  late String _currency;

  @override
  void initState() {
    super.initState();
    final ws = context.read<WorkspaceProvider>().workspace;
    _companyCtrl = TextEditingController(text: ws.companyName);
    _currency = ws.defaultCurrency;
  }

  @override
  void dispose() {
    _companyCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkspaceProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات العامة')),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          TextField(
            controller: _companyCtrl,
            decoration: const InputDecoration(labelText: 'اسم المنشأة / النشاط'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _currency,
            decoration: const InputDecoration(labelText: 'العملة الافتراضية'),
            items: kCurrencies
                .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                .toList(),
            onChanged: (v) {
              if (v != null) setState(() => _currency = v);
            },
          ),
          const SizedBox(height: 16),
          const Text('المظهر', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(value: ThemeMode.light, label: Text('فاتح')),
              ButtonSegment(value: ThemeMode.dark, label: Text('داكن')),
              ButtonSegment(value: ThemeMode.system, label: Text('النظام')),
            ],
            selected: {provider.themeMode},
            onSelectionChanged: (s) => provider.setThemeMode(s.first),
          ),
          const SizedBox(height: 16),
          const Text('لون الهوية',
              style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            children: [
              NasqoColors.blue,
              NasqoColors.navy,
              const Color(0xFF0D9488),
              const Color(0xFF7C3AED),
              NasqoColors.orange,
            ]
                .map(
                  (c) => GestureDetector(
                    onTap: () => provider.setBrandColor(c),
                    child: CircleAvatar(
                      radius: 18,
                      backgroundColor: c,
                      child: provider.brandColor == c
                          ? const Icon(Icons.check, color: Colors.white)
                          : null,
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () async {
              await provider.updateWorkspaceSettings(
                provider.workspace.copyWith(
                  companyName: _companyCtrl.text.trim().isEmpty
                      ? 'نسقو برو'
                      : _companyCtrl.text.trim(),
                  defaultCurrency: _currency,
                ),
              );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('تم حفظ الإعدادات')),
                );
              }
            },
            child: const Text('حفظ التغييرات'),
          ),
        ],
      ),
    );
  }
}
