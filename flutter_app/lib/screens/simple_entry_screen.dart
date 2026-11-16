import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nasqo_models.dart';
import '../services/accounting_service.dart';
import '../state/workspace_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/modals.dart';

class SimpleEntryScreen extends StatefulWidget {
  const SimpleEntryScreen({super.key});

  @override
  State<SimpleEntryScreen> createState() => _SimpleEntryScreenState();
}

class _SimpleEntryScreenState extends State<SimpleEntryScreen> {
  AccountRecord? _fromAccount;
  AccountRecord? _toAccount;
  String _currency = 'ريال';
  final _amountCtrl = TextEditingController();
  final _detailsCtrl = TextEditingController();
  final _docCtrl = TextEditingController();

  @override
  void dispose() {
    _amountCtrl.dispose();
    _detailsCtrl.dispose();
    _docCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkspaceProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('قيد بسيط')),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          _accountBox(
            label: 'من حساب',
            account: _fromAccount,
            provider: provider,
            onPick: () async {
              final picked = await NasqoModals.showAccountPicker(context,
                  title: 'من حساب');
              if (picked != null) setState(() => _fromAccount = picked);
            },
          ),
          const SizedBox(height: 8),
          Center(
            child: IconButton.filledTonal(
              onPressed: () {
                setState(() {
                  final tmp = _fromAccount;
                  _fromAccount = _toAccount;
                  _toAccount = tmp;
                });
              },
              icon: const Icon(Icons.swap_vert),
              tooltip: 'تبديل الحسابين',
            ),
          ),
          const SizedBox(height: 8),
          _accountBox(
            label: 'إلى حساب',
            account: _toAccount,
            provider: provider,
            onPick: () async {
              final picked = await NasqoModals.showAccountPicker(context,
                  title: 'إلى حساب');
              if (picked != null) setState(() => _toAccount = picked);
            },
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _amountCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'المبلغ'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _currency,
                  decoration: const InputDecoration(labelText: 'العملة'),
                  items: kCurrencies
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _currency = v);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _detailsCtrl,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'البيان'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _docCtrl,
            decoration: const InputDecoration(labelText: 'رقم المستند'),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('إلغاء'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content:
                            Text('تم حفظ القيد البسيط في حالة المعاينة المحلية'),
                      ),
                    );
                    Navigator.pop(context);
                  },
                  child: const Text('حفظ'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _accountBox({
    required String label,
    required AccountRecord? account,
    required WorkspaceProvider provider,
    required VoidCallback onPick,
  }) {
    final balanceText = account == null
        ? 'لم يتم الاختيار'
        : AccountingService.formatAmount(
            AccountingService.computeAccountSummary(account, provider.ledger)
                .netBalance,
          );
    return Card(
      margin: EdgeInsets.zero,
      child: Column(
        children: [
          ListTile(
            title: Text(account?.name ?? label),
            subtitle: account != null ? Text(label) : null,
            trailing: const Icon(Icons.search),
            onTap: onPick,
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: const BoxDecoration(
              color: NasqoColors.orange,
              borderRadius:
                  BorderRadius.vertical(bottom: Radius.circular(11)),
            ),
            child: Text(
              'الرصيد: $balanceText',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
