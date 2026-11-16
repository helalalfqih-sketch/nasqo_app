import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nasqo_models.dart';
import '../state/workspace_provider.dart';
import '../theme/app_theme.dart';

class WarehousesScreen extends StatelessWidget {
  const WarehousesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkspaceProvider>();
    final primary = Theme.of(context).colorScheme.primary;

    return Scaffold(
      appBar: AppBar(title: const Text('المخازن')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: NasqoColors.orange,
        foregroundColor: Colors.white,
        onPressed: () => _showCreateWarehouse(context),
        child: const Icon(Icons.add),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.fromLTRB(10, 12, 10, 80),
        itemCount: provider.warehouses.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final wh = provider.warehouses[i];
          return Card(
            margin: EdgeInsets.zero,
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.white,
                child: Icon(Icons.warehouse_outlined, color: primary),
              ),
              title: Text(
                wh.name,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: Text(wh.details),
              trailing: Text(
                '#${wh.codeNumber}',
                style: const TextStyle(
                  color: NasqoColors.red,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _showCreateWarehouse(BuildContext context) async {
    final provider = context.read<WorkspaceProvider>();
    final nameCtrl = TextEditingController();
    final detailsCtrl = TextEditingController();
    var isDefault = false;

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('إضافة مخزن'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'اسم المخزن'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: detailsCtrl,
                decoration: const InputDecoration(labelText: 'التفاصيل'),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('المخزن الافتراضي'),
                value: isDefault,
                onChanged: (v) => setState(() => isDefault = v),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            FilledButton(
              onPressed: () async {
                final name = nameCtrl.text.trim();
                if (name.isEmpty) return;
                await provider.addWarehouse(
                  WarehouseRecord(
                    id: 'wh_${DateTime.now().millisecondsSinceEpoch}',
                    ownerId: provider.activeUid,
                    name: name,
                    details: detailsCtrl.text.trim(),
                    isDefault: isDefault,
                    codeNumber: provider.warehouses.length + 1,
                  ),
                );
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('حفظ'),
            ),
          ],
        ),
      ),
    );
  }
}
