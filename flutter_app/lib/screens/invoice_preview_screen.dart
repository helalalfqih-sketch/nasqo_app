import 'package:flutter/material.dart';
import '../models/nasqo_models.dart';
import '../services/accounting_service.dart';
import '../theme/app_theme.dart';

class InvoicePreviewScreen extends StatelessWidget {
  final LedgerEntryRecord entry;
  const InvoicePreviewScreen({super.key, required this.entry});

  @override
  Widget build(BuildContext context) {
    final lines = entry.details
        .split('\n')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    return Scaffold(
      appBar: AppBar(title: Text('معاينة مستند #${entry.entryNumber}')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(14),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  color: NasqoColors.brandTint,
                  child: const Text(
                    'معاينة مستند داخلي (للعرض فقط)',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: NasqoColors.blue,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'نسقو برو للأعمال',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      'NASQO PRO',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
                const Divider(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  decoration: BoxDecoration(
                    border: Border.all(color: NasqoColors.blue),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    entry.typeLabel,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: NasqoColors.blue,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text('الرقم: ${entry.entryNumber}'),
                Text('التاريخ: ${entry.entryDate}'),
                Text('الحساب: ${entry.accountName}'),
                if (entry.warehouseName.isNotEmpty)
                  Text('المخزن: ${entry.warehouseName}'),
                const SizedBox(height: 12),
                Table(
                  border: TableBorder.all(color: NasqoColors.line),
                  columnWidths: const {
                    0: FlexColumnWidth(1),
                    1: FlexColumnWidth(3),
                    2: FlexColumnWidth(1.5),
                  },
                  children: [
                    const TableRow(
                      decoration: BoxDecoration(color: NasqoColors.blue),
                      children: [
                        Padding(
                          padding: EdgeInsets.all(6),
                          child: Text('م',
                              style: TextStyle(color: Colors.white)),
                        ),
                        Padding(
                          padding: EdgeInsets.all(6),
                          child: Text('الصنف / البيان',
                              style: TextStyle(color: Colors.white)),
                        ),
                        Padding(
                          padding: EdgeInsets.all(6),
                          child: Text('المبلغ',
                              style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                    ...List.generate(lines.isEmpty ? 1 : lines.length, (i) {
                      final text = lines.isEmpty ? entry.details : lines[i];
                      return TableRow(
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(6),
                            child: Text('${i + 1}'),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(6),
                            child: Text(text),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(6),
                            child: Text(
                              i == 0
                                  ? AccountingService.formatAmount(entry.amount)
                                  : '-',
                            ),
                          ),
                        ],
                      );
                    }),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  'الإجمالي: ${AccountingService.formatAmount(entry.amount)} ${entry.currency}',
                  textAlign: TextAlign.end,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: NasqoColors.blue,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
