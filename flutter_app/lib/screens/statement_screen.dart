import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nasqo_models.dart';
import '../services/accounting_service.dart';
import '../state/workspace_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/modals.dart';
import 'invoice_preview_screen.dart';
import 'simple_entry_screen.dart';

class StatementScreen extends StatefulWidget {
  final AccountRecord account;
  const StatementScreen({super.key, required this.account});

  @override
  State<StatementScreen> createState() => _StatementScreenState();
}

class _StatementScreenState extends State<StatementScreen> {
  String _currency = 'جميع العملات بدون مصارفة';
  String _searchQuery = '';
  String _searchMode = 'الكل';

  static const _currencyOptions = [
    'ريال',
    'عملة 2',
    'دولار',
    'جميع العملات بدون مصارفة',
    'مصارفة الكل بعملة ريال',
  ];

  static const _searchModes = [
    'الكل',
    'الرقم',
    'البيان',
    'رقم المستند',
    'اسم المرسل',
    'اسم المستلم',
    'اسم الشركة',
    'المبلغ عليه',
    'المبلغ له',
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkspaceProvider>();
    final result = AccountingService.computeStatementRows(
      widget.account,
      provider.ledger,
      currency: _currency,
      searchQuery: _searchQuery,
      searchMode: _searchMode,
      showPreviousBalance: true,
    );
    final isCash = widget.account.isCashAccount;
    final primary = Theme.of(context).colorScheme.primary;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.account.name),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.currency_exchange),
            onSelected: (v) => setState(() => _currency = v),
            itemBuilder: (_) => _currencyOptions
                .map((c) => PopupMenuItem(value: c, child: Text(c)))
                .toList(),
          ),
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () => NasqoModals.showTransactionModal(
              context,
              account: widget.account,
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        color: primary,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: SafeArea(
          top: false,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _FooterStat(
                label: 'عليه',
                value: AccountingService.formatAmount(result.debitTotal),
              ),
              _FooterStat(
                label: 'له',
                value: AccountingService.formatAmount(result.creditTotal),
              ),
              _FooterStat(
                label: result.netDirection == 'credit'
                    ? 'الرصيد له'
                    : (result.netDirection == 'debit'
                        ? 'الرصيد عليه'
                        : 'الرصيد'),
                value: AccountingService.formatAmount(result.netBalance),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.small(
        backgroundColor: NasqoColors.orange,
        foregroundColor: Colors.white,
        onPressed: () => _openOperationsMenu(context),
        child: const Icon(Icons.menu_open),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'بحث ($_searchMode)...',
                      prefixIcon: const Icon(Icons.search, size: 18),
                      isDense: true,
                    ),
                    onChanged: (v) => setState(() => _searchQuery = v),
                  ),
                ),
                const SizedBox(width: 6),
                PopupMenuButton<String>(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
                    decoration: BoxDecoration(
                      border: Border.all(color: primary),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _searchMode,
                      style: TextStyle(fontSize: 12, color: primary),
                    ),
                  ),
                  onSelected: (v) => setState(() => _searchMode = v),
                  itemBuilder: (_) => _searchModes
                      .map((m) => PopupMenuItem(value: m, child: Text(m)))
                      .toList(),
                ),
              ],
            ),
          ),
          Container(
            color: primary,
            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
            child: const Row(
              children: [
                Expanded(
                    flex: 2,
                    child: Text('النوع/التاريخ',
                        style: TextStyle(color: Colors.white, fontSize: 11))),
                Expanded(
                    flex: 2,
                    child: Text('المبلغ',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontSize: 11))),
                Expanded(
                    flex: 3,
                    child: Text('البيان',
                        style: TextStyle(color: Colors.white, fontSize: 11))),
                Expanded(
                    flex: 2,
                    child: Text('الرصيد',
                        textAlign: TextAlign.end,
                        style: TextStyle(color: Colors.white, fontSize: 11))),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.only(bottom: 72),
              itemCount: result.rows.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final row = result.rows[i];
                final entry = row.entry;
                final amountColor = isCash
                    ? NasqoColors.cashBlue
                    : (entry.direction == 'credit'
                        ? NasqoColors.green
                        : NasqoColors.red);
                return InkWell(
                  onTap: () {
                    if (entry.kind == LedgerKind.invoice) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => InvoicePreviewScreen(entry: entry),
                        ),
                      );
                    }
                  },
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 2,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                entry.typeLabel,
                                style: TextStyle(
                                  color: amountColor,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 11,
                                ),
                              ),
                              Text(
                                entry.entryDate,
                                style: TextStyle(
                                  color: isCash
                                      ? NasqoColors.cashBlue
                                      : NasqoColors.muted,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            AccountingService.formatAmount(entry.amount),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: amountColor,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Text(
                            entry.details,
                            style: const TextStyle(fontSize: 11),
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            AccountingService.formatAmount(row.runningBalance),
                            textAlign: TextAlign.end,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
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

  void _openOperationsMenu(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _opItem(ctx, 'فاتورة', () {
              Navigator.pop(ctx);
              NasqoModals.showInvoiceModal(context,
                  account: widget.account,
                  intentLabel: 'فاتورة',
                  kind: LedgerKind.invoice);
            }),
            _opItem(ctx, 'مرتجع', () {
              Navigator.pop(ctx);
              NasqoModals.showInvoiceModal(context,
                  account: widget.account,
                  intentLabel: 'مرتجع',
                  kind: LedgerKind.returnDoc);
            }),
            _opItem(ctx, 'قيد بسيط / تحويل', () {
              Navigator.pop(ctx);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SimpleEntryScreen()),
              );
            }),
            _opItem(ctx, 'مصارفة عملة', () {
              Navigator.pop(ctx);
              NasqoModals.showCurrencyExchange(context,
                  account: widget.account);
            }),
            _opItem(ctx, 'عرض سعر', () {
              Navigator.pop(ctx);
              NasqoModals.showInvoiceModal(context,
                  account: widget.account,
                  intentLabel: 'عرض سعر',
                  kind: LedgerKind.quote);
            }),
            _opItem(ctx, 'طلب شراء / بيع', () {
              Navigator.pop(ctx);
              NasqoModals.showInvoiceModal(context,
                  account: widget.account,
                  intentLabel: 'طلب',
                  kind: LedgerKind.order);
            }),
          ],
        ),
      ),
    );
  }

  Widget _opItem(BuildContext ctx, String title, VoidCallback onTap) {
    return ListTile(
      dense: true,
      title: Text(title, textAlign: TextAlign.center),
      onTap: onTap,
    );
  }
}

class _FooterStat extends StatelessWidget {
  final String label;
  final String value;
  const _FooterStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label,
            style: const TextStyle(color: Colors.white70, fontSize: 10)),
        Text(value,
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
      ],
    );
  }
}
