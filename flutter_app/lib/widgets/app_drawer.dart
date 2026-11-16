import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nasqo_models.dart';
import '../state/workspace_provider.dart';
import '../theme/app_theme.dart';
import '../screens/accounts_list_screen.dart';
import '../screens/inventory_report_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/simple_entry_screen.dart';
import '../screens/warehouses_screen.dart';
import 'modals.dart';

class NasqoDrawer extends StatelessWidget {
  const NasqoDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkspaceProvider>();
    final primary = Theme.of(context).colorScheme.primary;

    return Drawer(
      width: MediaQuery.of(context).size.width * 0.84,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 44, 16, 18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [primary, NasqoColors.navy],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(Icons.account_balance_wallet,
                          color: primary, size: 28),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            provider.workspace.companyName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            provider.cloudConnected
                                ? 'متصل بالسحابة (${provider.user?.email ?? ''})'
                                : 'الوضع المحلي التجريبي',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          _item(context, Icons.palette_outlined, 'اللغة والمظهر', () {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            );
          }),
          _item(context, Icons.notifications_none, 'الإشعارات', () {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('مركز الإشعارات نشط')),
            );
          }),
          _item(context, Icons.sms_outlined, 'الرسائل النصية (SMS)', () {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            );
          }),
          _item(context, Icons.chat_outlined, 'إشعارات الواتساب', () {
            Navigator.pop(context);
            NasqoModals.showWhatsAppSettings(context);
          }),
          _item(context, Icons.assessment_outlined, 'تقرير حركة المخزون', () {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const InventoryReportScreen()),
            );
          }),
          _item(context, Icons.swap_horiz, 'قيد بسيط (من حساب إلى حساب)', () {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SimpleEntryScreen()),
            );
          }),
          _item(context, Icons.shopping_bag_outlined, 'حسابات المشتريات', () {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const AccountsListScreen(
                  category: AccountCategory.purchases,
                ),
              ),
            );
          }),
          _item(context, Icons.delete_outline, 'سلة المحذوفات', () {
            Navigator.pop(context);
            NasqoModals.showTrash(context);
          }),
          _item(context, Icons.settings_outlined, 'الإعدادات العامة', () {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            );
          }),
          const Divider(),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Text(
              'المخازن والحسابات',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: NasqoColors.muted,
              ),
            ),
          ),
          _item(context, Icons.warehouse_outlined, 'إدارة المخازن', () {
            Navigator.pop(context);
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const WarehousesScreen()),
            );
          }),
          _item(context, Icons.currency_exchange, 'مصارفة العملات', () {
            Navigator.pop(context);
            NasqoModals.showCurrencyExchange(context);
          }),
          _item(context, Icons.verified_user_outlined, 'تفعيل التطبيق', () {
            Navigator.pop(context);
            NasqoModals.showActivationModal(context);
          }),
          const Divider(),
          _item(context, Icons.cloud_upload_outlined, 'النسخ الاحتياطي السحابي',
              () {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('النسخ الاحتياطي السحابي محفوظ محلياً للمعاينة')),
            );
          }),
          _item(context, Icons.info_outline, 'حول التطبيق', () {
            Navigator.pop(context);
            showAboutDialog(
              context: context,
              applicationName: 'نسقو برو',
              applicationVersion: '1.0.0',
              applicationLegalese: 'نظام إدارة الأعمال والحسابات والمخازن',
            );
          }),
        ],
      ),
    );
  }

  Widget _item(
    BuildContext context,
    IconData icon,
    String title,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(title, style: const TextStyle(fontSize: 14)),
      dense: true,
      onTap: onTap,
    );
  }
}
