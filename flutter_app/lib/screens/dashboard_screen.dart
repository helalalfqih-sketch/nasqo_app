import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nasqo_models.dart';
import '../services/accounting_service.dart';
import '../state/workspace_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_drawer.dart';
import '../widgets/modals.dart';
import 'accounts_list_screen.dart';
import 'inventory_report_screen.dart';
import 'simple_entry_screen.dart';
import 'warehouses_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkspaceProvider>();
    final totals = AccountingService.computeCategoryTotals(
      provider.accounts,
      provider.ledger,
    );
    final primary = Theme.of(context).colorScheme.primary;

    final cards = [
      _DashCardSpec(
        title: 'المبيعات',
        icon: Icons.point_of_sale,
        bucket: totals[AccountCategory.sales]!,
        onTap: () => _openCategory(context, AccountCategory.sales),
      ),
      _DashCardSpec(
        title: 'المشتريات',
        icon: Icons.shopping_cart_outlined,
        bucket: totals[AccountCategory.purchases]!,
        onTap: () => _openCategory(context, AccountCategory.purchases),
      ),
      _DashCardSpec(
        title: 'العملاء',
        icon: Icons.people_outline,
        bucket: totals[AccountCategory.clients]!,
        onTap: () => _openCategory(context, AccountCategory.clients),
      ),
      _DashCardSpec(
        title: 'الموظفون',
        icon: Icons.badge_outlined,
        bucket: totals[AccountCategory.employees]!,
        onTap: () => _openCategory(context, AccountCategory.employees),
      ),
      _DashCardSpec(
        title: 'الحوالات',
        icon: Icons.swap_horiz,
        bucket: totals[AccountCategory.transfers]!,
        onTap: () => _openCategory(context, AccountCategory.transfers),
      ),
      _DashCardSpec(
        title: 'المحل',
        icon: Icons.storefront_outlined,
        bucket: totals[AccountCategory.shop]!,
        onTap: () => _openCategory(context, AccountCategory.shop),
      ),
      _DashCardSpec(
        title: 'المخازن',
        icon: Icons.warehouse_outlined,
        customCount: provider.warehouses.length,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const WarehousesScreen()),
        ),
      ),
      _DashCardSpec(
        title: 'المخزون',
        icon: Icons.inventory_2_outlined,
        customCount: provider.inventory.length,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const InventoryReportScreen()),
        ),
      ),
    ];

    return Scaffold(
      drawer: const NasqoDrawer(),
      appBar: AppBar(
        title: Text(provider.workspace.companyName),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.add_circle_outline),
            onSelected: (value) {
              switch (value) {
                case 'tx':
                  NasqoModals.showTransactionModal(context);
                  break;
                case 'invoice':
                  NasqoModals.showInvoiceModal(context);
                  break;
                case 'simple':
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const SimpleEntryScreen()),
                  );
                  break;
                case 'account':
                  NasqoModals.showCreateAccount(context);
                  break;
                case 'account_ext':
                  NasqoModals.showCreateAccount(context, extended: true);
                  break;
                case 'currency':
                  NasqoModals.showCurrencyExchange(context);
                  break;
              }
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'tx', child: Text('سند جديد')),
              PopupMenuItem(value: 'invoice', child: Text('فاتورة جديدة')),
              PopupMenuItem(value: 'simple', child: Text('قيد بسيط')),
              PopupMenuItem(value: 'account', child: Text('إضافة حساب سريع')),
              PopupMenuItem(
                  value: 'account_ext', child: Text('إضافة حساب مفصل')),
              PopupMenuItem(value: 'currency', child: Text('مصارفة العملات')),
            ],
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.55,
            ),
            itemCount: cards.length,
            itemBuilder: (_, i) => _DashboardCard(spec: cards[i]),
          ),
          const SizedBox(height: 16),
          const Text(
            'إجراءات سريعة',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 3,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 1.35,
            children: [
              _QuickActionTile(
                icon: Icons.receipt_long,
                label: 'فاتورة',
                color: primary,
                onTap: () => NasqoModals.showInvoiceModal(context),
              ),
              _QuickActionTile(
                icon: Icons.add_card,
                label: 'سند',
                color: primary,
                onTap: () => NasqoModals.showTransactionModal(context),
              ),
              _QuickActionTile(
                icon: Icons.swap_horiz,
                label: 'قيد بسيط',
                color: primary,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SimpleEntryScreen()),
                ),
              ),
              _QuickActionTile(
                icon: Icons.person_add_alt,
                label: 'حساب جديد',
                color: primary,
                onTap: () => NasqoModals.showCreateAccount(context),
              ),
              _QuickActionTile(
                icon: Icons.currency_exchange,
                label: 'مصارفة',
                color: primary,
                onTap: () => NasqoModals.showCurrencyExchange(context),
              ),
              _QuickActionTile(
                icon: Icons.assessment,
                label: 'تقرير مخزون',
                color: primary,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const InventoryReportScreen()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Center(
            child: Text(
              'نسقو برو — الإصدار 1.0.0 (Flutter)',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
            ),
          ),
        ],
      ),
    );
  }

  void _openCategory(BuildContext context, AccountCategory category) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AccountsListScreen(category: category),
      ),
    );
  }
}

class _DashCardSpec {
  final String title;
  final IconData icon;
  final CategoryBucket? bucket;
  final int? customCount;
  final VoidCallback onTap;

  const _DashCardSpec({
    required this.title,
    required this.icon,
    this.bucket,
    this.customCount,
    required this.onTap,
  });
}

class _DashboardCard extends StatelessWidget {
  final _DashCardSpec spec;
  const _DashboardCard({required this.spec});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final net = spec.bucket?.netSigned ?? 0;
    final balanceColor = net >= 0 ? NasqoColors.green : NasqoColors.red;

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(11),
        onTap: spec.onTap,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: NasqoColors.brandTint,
                    child: Icon(spec.icon, size: 18, color: primary),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      spec.title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              if (spec.bucket != null)
                Text(
                  AccountingService.formatAmount(net.abs()),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: balanceColor,
                  ),
                )
              else
                Text(
                  '${spec.customCount ?? 0} عنصر',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: primary,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(11),
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
