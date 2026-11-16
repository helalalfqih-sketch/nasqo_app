import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nasqo_models.dart';
import '../services/accounting_service.dart';
import '../state/workspace_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/modals.dart';
import 'statement_screen.dart';

class AccountsListScreen extends StatefulWidget {
  final AccountCategory category;
  const AccountsListScreen({super.key, required this.category});

  @override
  State<AccountsListScreen> createState() => _AccountsListScreenState();
}

class _AccountsListScreenState extends State<AccountsListScreen> {
  String _search = '';
  String _currencyFilter = 'الكل';

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkspaceProvider>();
    final primary = Theme.of(context).colorScheme.primary;

    final accounts = provider.accounts.where((acc) {
      if (acc.category != widget.category) return false;
      return AccountingService.accountMatchesQuery(acc, _search);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.category.labelAr),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (v) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('تم اختيار: $v (وضع المعاينة)')),
              );
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'طباعة PDF', child: Text('طباعة PDF')),
              PopupMenuItem(value: 'مشاركة PDF', child: Text('مشاركة PDF')),
              PopupMenuItem(value: 'تصدير Excel', child: Text('تصدير Excel')),
              PopupMenuItem(value: 'مشاركة Excel', child: Text('مشاركة Excel')),
              PopupMenuItem(value: 'استيراد حسابات', child: Text('استيراد حسابات')),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: NasqoColors.orange,
        foregroundColor: Colors.white,
        onPressed: () => NasqoModals.showCreateAccount(
          context,
          initialCategory: widget.category,
          extended: true,
        ),
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'بحث في الحسابات...',
                    prefixIcon: Icon(Icons.search),
                    isDense: true,
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Text('العملة: ', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 8),
                    DropdownButton<String>(
                      value: _currencyFilter,
                      items: ['الكل', ...kCurrencies]
                          .map((c) =>
                              DropdownMenuItem(value: c, child: Text(c)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => _currencyFilter = v);
                      },
                    ),
                    const Spacer(),
                    Text(
                      '${accounts.length} حساب',
                      style: const TextStyle(
                        fontSize: 12,
                        color: NasqoColors.muted,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 84),
              itemCount: accounts.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final acc = accounts[i];
                final summary = AccountingService.computeAccountSummary(
                  acc,
                  provider.ledger,
                  currencyFilter: _currencyFilter,
                );
                final balColor = summary.tone == 'credit'
                    ? NasqoColors.green
                    : (summary.tone == 'debit'
                        ? NasqoColors.red
                        : NasqoColors.muted);
                return Card(
                  margin: EdgeInsets.zero,
                  child: ListTile(
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    leading: CircleAvatar(
                      backgroundColor: NasqoColors.brandTint,
                      child: Text(
                        '${acc.codeNumber}',
                        style: TextStyle(
                          color: primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    title: Text(
                      acc.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    subtitle: Text(
                      acc.isCashAccount
                          ? 'حساب نقدي • ${acc.currency}'
                          : (acc.phone.isEmpty ? acc.currency : acc.phone),
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          AccountingService.formatAmount(summary.netBalance),
                          style: TextStyle(
                            color: balColor,
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          summary.tone == 'credit'
                              ? 'له'
                              : (summary.tone == 'debit' ? 'عليه' : 'متزن'),
                          style: TextStyle(fontSize: 11, color: balColor),
                        ),
                      ],
                    ),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => StatementScreen(account: acc),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
