import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/accounting_service.dart';
import '../state/workspace_provider.dart';
import '../theme/app_theme.dart';

class InventoryReportScreen extends StatefulWidget {
  const InventoryReportScreen({super.key});

  @override
  State<InventoryReportScreen> createState() => _InventoryReportScreenState();
}

class _InventoryReportScreenState extends State<InventoryReportScreen> {
  String _selectedWarehouseId = '';

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkspaceProvider>();
    final primary = Theme.of(context).colorScheme.primary;
    final summary = AccountingService.computeInventorySummary(
      provider.inventory,
      warehouseId: _selectedWarehouseId.isEmpty ? null : _selectedWarehouseId,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('تقرير حركة المخزون'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.ios_share),
            onSelected: (v) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('تصدير: $v (وضع المعاينة)')),
              );
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'طباعة PDF', child: Text('طباعة PDF')),
              PopupMenuItem(value: 'مشاركة PDF', child: Text('مشاركة PDF')),
              PopupMenuItem(value: 'تصدير Excel', child: Text('تصدير Excel')),
              PopupMenuItem(value: 'مشاركة Excel', child: Text('مشاركة Excel')),
            ],
          ),
        ],
      ),
      bottomNavigationBar: Container(
        color: primary,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: SafeArea(
          top: false,
          child: Text(
            'إجمالي الكمية: ${AccountingService.formatAmount(summary.totalQuantity)}   |   إجمالي القيمة: ${AccountingService.formatAmount(summary.totalValue)}',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(10),
            child: DropdownButtonFormField<String>(
              value: _selectedWarehouseId,
              decoration: const InputDecoration(labelText: 'تصفية حسب المخزن'),
              items: [
                const DropdownMenuItem(value: '', child: Text('جميع المخازن')),
                ...provider.warehouses.map(
                  (w) => DropdownMenuItem(value: w.id, child: Text(w.name)),
                ),
              ],
              onChanged: (v) => setState(() => _selectedWarehouseId = v ?? ''),
            ),
          ),
          Container(
            color: primary,
            padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 8),
            child: const Row(
              children: [
                Expanded(
                    flex: 3,
                    child: Text('الصنف',
                        style: TextStyle(color: Colors.white, fontSize: 12))),
                Expanded(
                    flex: 2,
                    child: Text('الكمية',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontSize: 12))),
                Expanded(
                    flex: 2,
                    child: Text('المتوسط',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontSize: 12))),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: summary.items.length,
              itemBuilder: (_, i) {
                final item = summary.items[i];
                final isEven = i.isOdd;
                return Container(
                  color: isEven ? NasqoColors.tableAlt : Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Text(
                          '${item.name} (${item.unit})',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          AccountingService.formatAmount(item.quantity),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: item.quantity < item.minThreshold
                                ? NasqoColors.red
                                : NasqoColors.ink,
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          AccountingService.formatAmount(item.avgCost),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
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
