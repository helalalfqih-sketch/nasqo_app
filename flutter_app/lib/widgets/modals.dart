import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nasqo_models.dart';
import '../services/accounting_service.dart';
import '../state/workspace_provider.dart';
import '../theme/app_theme.dart';

class NasqoModals {
  static Future<AccountRecord?> showAccountPicker(
    BuildContext context, {
    String title = 'اختر الحساب',
    AccountCategory? filterCategory,
  }) {
    final accounts = context.read<WorkspaceProvider>().accounts.where((a) {
      return filterCategory == null || a.category == filterCategory;
    }).toList();
    String query = '';

    return showModalBottomSheet<AccountRecord>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setState) {
            final filtered = accounts
                .where((a) => AccountingService.accountMatchesQuery(a, query))
                .toList();
            return DraggableScrollableSheet(
              expand: false,
              initialChildSize: 0.72,
              maxChildSize: 0.92,
              builder: (_, controller) {
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                      child: Row(
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Spacer(),
                          IconButton(
                            onPressed: () => Navigator.pop(ctx),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: 'ابحث بالاسم أو الهاتف أو الرقم...',
                          prefixIcon: Icon(Icons.search),
                        ),
                        onChanged: (v) => setState(() => query = v),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Expanded(
                      child: ListView.separated(
                        controller: controller,
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (_, i) {
                          final acc = filtered[i];
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: NasqoColors.brandTint,
                              child: Text(
                                '${acc.codeNumber}',
                                style: const TextStyle(
                                  color: NasqoColors.blue,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            title: Text(acc.name),
                            subtitle: Text(
                              '${acc.category.labelAr} • ${acc.currency}',
                            ),
                            trailing: acc.isCashAccount
                                ? const Chip(label: Text('نقدي'))
                                : null,
                            onTap: () => Navigator.pop(ctx, acc),
                          );
                        },
                      ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  static Future<void> showCreateAccount(
    BuildContext context, {
    AccountCategory initialCategory = AccountCategory.purchases,
    bool extended = false,
  }) async {
    final provider = context.read<WorkspaceProvider>();
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final limitCtrl = TextEditingController(text: '0');
    final openingCtrl = TextEditingController(text: '0');
    final noteCtrl = TextEditingController();

    var category = initialCategory;
    var currency = provider.workspace.defaultCurrency;
    var isCash = false;
    var openingExpanded = false;
    var openingDirection = 'credit';
    var messageMethod = 'sms';
    var sendMode = 'never';

    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setState) {
            return AlertDialog(
              title: Text(extended ? 'إنشاء حساب مفصل' : 'إضافة حساب جديد'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(labelText: 'اسم الحساب'),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<AccountCategory>(
                      value: category,
                      decoration: const InputDecoration(labelText: 'التصنيف'),
                      items: AccountCategory.values
                          .map((c) => DropdownMenuItem(
                              value: c, child: Text(c.labelAr)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => category = v);
                      },
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'رقم الهاتف'),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: currency,
                      decoration: const InputDecoration(labelText: 'العملة'),
                      items: kCurrencies
                          .map((c) =>
                              DropdownMenuItem(value: c, child: Text(c)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => currency = v);
                      },
                    ),
                    if (extended) ...[
                      const SizedBox(height: 10),
                      TextField(
                        controller: limitCtrl,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'سقف المديونية'),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: messageMethod,
                              decoration:
                                  const InputDecoration(labelText: 'الرسائل'),
                              items: const [
                                DropdownMenuItem(
                                    value: 'sms', child: Text('SMS')),
                                DropdownMenuItem(
                                    value: 'whatsapp', child: Text('واتساب')),
                              ],
                              onChanged: (v) {
                                if (v != null) {
                                  setState(() => messageMethod = v);
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: sendMode,
                              decoration:
                                  const InputDecoration(labelText: 'الإرسال'),
                              items: const [
                                DropdownMenuItem(
                                    value: 'never', child: Text('لا ترسل')),
                                DropdownMenuItem(
                                    value: 'confirm',
                                    child: Text('بعد التأكيد')),
                                DropdownMenuItem(
                                    value: 'auto', child: Text('تلقائي')),
                              ],
                              onChanged: (v) {
                                if (v != null) setState(() => sendMode = v);
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('حساب نقدي'),
                      value: isCash,
                      onChanged: (v) => setState(() => isCash = v),
                    ),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('رصيد افتتاحي'),
                      trailing: Icon(openingExpanded
                          ? Icons.expand_less
                          : Icons.expand_more),
                      onTap: () =>
                          setState(() => openingExpanded = !openingExpanded),
                    ),
                    if (openingExpanded) ...[
                      TextField(
                        controller: openingCtrl,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'المبلغ الافتتاحي'),
                      ),
                      const SizedBox(height: 8),
                      SegmentedButton<String>(
                        segments: const [
                          ButtonSegment(value: 'credit', label: Text('له')),
                          ButtonSegment(value: 'debit', label: Text('عليه')),
                        ],
                        selected: {openingDirection},
                        onSelectionChanged: (s) =>
                            setState(() => openingDirection = s.first),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: noteCtrl,
                        decoration:
                            const InputDecoration(labelText: 'البيان الافتتاحي'),
                      ),
                    ],
                  ],
                ),
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
                    final acc = AccountRecord(
                      id: 'acc_${DateTime.now().millisecondsSinceEpoch}',
                      ownerId: provider.activeUid,
                      name: name,
                      category: category,
                      phone: phoneCtrl.text.trim(),
                      creditLimit:
                          AccountingService.parseArabicNumber(limitCtrl.text),
                      currency: currency,
                      isCashAccount: isCash,
                      messageMethod: messageMethod,
                      sendMode: sendMode,
                      note: noteCtrl.text.trim(),
                      openingBalance:
                          AccountingService.parseArabicNumber(openingCtrl.text),
                      openingDirection: openingDirection,
                      codeNumber: provider.nextAccountCode(),
                      sortOrder: provider.accounts.length + 1,
                    );
                    await provider.addOrUpdateAccount(acc);
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                  child: const Text('حفظ'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  static Future<void> showTransactionModal(
    BuildContext context, {
    AccountRecord? account,
  }) async {
    final provider = context.read<WorkspaceProvider>();
    AccountRecord? selectedAccount =
        account ?? (provider.accounts.isNotEmpty ? provider.accounts.first : null);
    final amountCtrl = TextEditingController();
    final detailsCtrl = TextEditingController();
    final docCtrl = TextEditingController();
    var direction = 'debit';
    var currency = selectedAccount?.currency ?? provider.workspace.defaultCurrency;

    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setState) {
            return AlertDialog(
              title: const Text('إضافة سند / عملية مالية'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(selectedAccount?.name ?? 'اختر الحساب'),
                      subtitle: const Text('اضغط لتغيير الحساب'),
                      trailing: const Icon(Icons.chevron_left),
                      onTap: () async {
                        final picked = await showAccountPicker(ctx);
                        if (picked != null) {
                          setState(() {
                            selectedAccount = picked;
                            currency = picked.currency;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 8),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'debit', label: Text('عليه (قبض/خصم)')),
                        ButtonSegment(value: 'credit', label: Text('له (صرف/إيداع)')),
                      ],
                      selected: {direction},
                      onSelectionChanged: (s) =>
                          setState(() => direction = s.first),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: amountCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'المبلغ'),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      value: currency,
                      decoration: const InputDecoration(labelText: 'العملة'),
                      items: kCurrencies
                          .map((c) =>
                              DropdownMenuItem(value: c, child: Text(c)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setState(() => currency = v);
                      },
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: detailsCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(labelText: 'البيان'),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: docCtrl,
                      decoration:
                          const InputDecoration(labelText: 'رقم المستند (اختياري)'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('إلغاء'),
                ),
                FilledButton(
                  onPressed: () async {
                    final amount =
                        AccountingService.parseArabicNumber(amountCtrl.text);
                    if (selectedAccount == null || amount <= 0) return;
                    final now = DateTime.now();
                    final entry = LedgerEntryRecord(
                      id: 'ent_${now.millisecondsSinceEpoch}',
                      ownerId: provider.activeUid,
                      accountId: selectedAccount!.id,
                      accountName: selectedAccount!.name,
                      kind: LedgerKind.voucher,
                      typeLabel: direction == 'credit' ? 'له' : 'عليه',
                      payment: selectedAccount!.isCashAccount ? 'cash' : 'credit',
                      direction: direction,
                      amount: amount,
                      currency: currency,
                      details: detailsCtrl.text.trim().isEmpty
                          ? 'سند مالي'
                          : detailsCtrl.text.trim(),
                      documentNumber: docCtrl.text.trim(),
                      warehouseId: provider.warehouses.isNotEmpty
                          ? provider.warehouses.first.id
                          : '',
                      warehouseName: provider.warehouses.isNotEmpty
                          ? provider.warehouses.first.name
                          : '',
                      entryNumber: provider.nextEntryNumber(),
                      entryDate: now.toIso8601String().substring(0, 10),
                      createdAtMs: now.millisecondsSinceEpoch,
                    );
                    await provider.addLedgerEntry(entry);
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                  child: const Text('حفظ'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  static Future<void> showInvoiceModal(
    BuildContext context, {
    AccountRecord? account,
    String intentLabel = 'فاتورة',
    LedgerKind kind = LedgerKind.invoice,
  }) async {
    final provider = context.read<WorkspaceProvider>();
    AccountRecord? selectedAccount =
        account ?? (provider.accounts.isNotEmpty ? provider.accounts.first : null);
    final amountCtrl = TextEditingController();
    final detailsCtrl = TextEditingController();
    var payment = 'cash';
    var tradeType = 'purchase'; // 'purchase' | 'sale'
    var contentMode = 'items'; // 'items' | 'free'
    var warehouseId = provider.warehouses.isNotEmpty
        ? provider.warehouses.first.id
        : '';

    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setState) {
            return AlertDialog(
              title: Text('إنشاء $intentLabel'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'purchase', label: Text('شراء')),
                        ButtonSegment(value: 'sale', label: Text('بيع')),
                      ],
                      selected: {tradeType},
                      onSelectionChanged: (s) =>
                          setState(() => tradeType = s.first),
                    ),
                    const SizedBox(height: 8),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'cash', label: Text('نقد')),
                        ButtonSegment(value: 'credit', label: Text('آجل')),
                      ],
                      selected: {payment},
                      onSelectionChanged: (s) =>
                          setState(() => payment = s.first),
                    ),
                    const SizedBox(height: 8),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'items', label: Text('أصناف')),
                        ButtonSegment(value: 'free', label: Text('حرة')),
                      ],
                      selected: {contentMode},
                      onSelectionChanged: (s) =>
                          setState(() => contentMode = s.first),
                    ),
                    const SizedBox(height: 8),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(selectedAccount?.name ?? 'اختر الحساب'),
                      trailing: const Icon(Icons.person_search),
                      onTap: () async {
                        final picked = await showAccountPicker(ctx);
                        if (picked != null) {
                          setState(() => selectedAccount = picked);
                        }
                      },
                    ),
                    if (provider.warehouses.isNotEmpty)
                      DropdownButtonFormField<String>(
                        value: warehouseId,
                        decoration: const InputDecoration(labelText: 'المخزن'),
                        items: provider.warehouses
                            .map((w) => DropdownMenuItem(
                                value: w.id, child: Text(w.name)))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) setState(() => warehouseId = v);
                        },
                      ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: amountCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'الإجمالي'),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: detailsCtrl,
                      maxLines: 2,
                      decoration:
                          const InputDecoration(labelText: 'تفاصيل الأصناف / البيان'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('إلغاء'),
                ),
                FilledButton(
                  onPressed: () async {
                    final amount =
                        AccountingService.parseArabicNumber(amountCtrl.text);
                    if (selectedAccount == null || amount <= 0) return;
                    final now = DateTime.now();
                    final wh = provider.warehouses.firstWhere(
                      (w) => w.id == warehouseId,
                      orElse: () => WarehouseRecord(
                        id: '',
                        ownerId: provider.activeUid,
                        name: 'المخزن الرئيسي',
                      ),
                    );
                    final entry = LedgerEntryRecord(
                      id: 'ent_${now.millisecondsSinceEpoch}',
                      ownerId: provider.activeUid,
                      accountId: selectedAccount!.id,
                      accountName: selectedAccount!.name,
                      kind: kind,
                      typeLabel: tradeType == 'purchase'
                          ? (payment == 'cash' ? 'ف.ش.نقدي' : 'فاتورة آجلة')
                          : (payment == 'cash' ? 'ف.ب.نقدي' : 'فاتورة مبيعات'),
                      payment: payment,
                      direction: tradeType == 'purchase' ? 'credit' : 'debit',
                      amount: amount,
                      currency: selectedAccount!.currency,
                      details: detailsCtrl.text.trim().isEmpty
                          ? intentLabel
                          : detailsCtrl.text.trim(),
                      warehouseId: wh.id,
                      warehouseName: wh.name,
                      invoiceContent: contentMode,
                      entryNumber: provider.nextEntryNumber(),
                      entryDate: now.toIso8601String().substring(0, 10),
                      createdAtMs: now.millisecondsSinceEpoch,
                    );
                    await provider.addLedgerEntry(entry);
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                  child: const Text('حفظ الفاتورة'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  static Future<void> showCurrencyExchange(
    BuildContext context, {
    AccountRecord? account,
  }) async {
    final amountCtrl = TextEditingController();
    final rateCtrl = TextEditingController(text: '1');
    var fromCurrency = 'دولار';
    var toCurrency = 'ريال';

    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setState) {
            final amount =
                AccountingService.parseArabicNumber(amountCtrl.text);
            final rate = AccountingService.parseArabicNumber(rateCtrl.text);
            final converted = amount * (rate > 0 ? rate : 1);
            return AlertDialog(
              title: Text(account != null
                  ? 'مصارفة عملات — ${account.name}'
                  : 'مصارفة العملات'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: fromCurrency,
                          decoration: const InputDecoration(labelText: 'من'),
                          items: kCurrencies
                              .map((c) =>
                                  DropdownMenuItem(value: c, child: Text(c)))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setState(() => fromCurrency = v);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: toCurrency,
                          decoration: const InputDecoration(labelText: 'إلى'),
                          items: kCurrencies
                              .map((c) =>
                                  DropdownMenuItem(value: c, child: Text(c)))
                              .toList(),
                          onChanged: (v) {
                            if (v != null) setState(() => toCurrency = v);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: amountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'المبلغ'),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: rateCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'سعر الصرف'),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: NasqoColors.brandTint,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'المعادل: ${AccountingService.formatAmount(converted)} $toCurrency',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: NasqoColors.blue,
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('إغلاق'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  static Future<void> showWhatsAppSettings(BuildContext context) async {
    final provider = context.read<WorkspaceProvider>();
    final ws = provider.workspace;
    final phoneCtrl = TextEditingController(text: ws.whatsappPhone);
    var enabled = ws.whatsappInstantEnabled;
    var waProvider = ws.whatsappProvider;

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('إعدادات إشعارات الواتساب'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('تفعيل الإرسال الفوري'),
                value: enabled,
                onChanged: (v) => setState(() => enabled = v),
              ),
              DropdownButtonFormField<String>(
                value: waProvider,
                decoration: const InputDecoration(labelText: 'مزود الخدمة'),
                items: const [
                  DropdownMenuItem(value: 'nasqo', child: Text('خادم نسقو')),
                  DropdownMenuItem(value: 'external', child: Text('تطبيق واتساب')),
                ],
                onChanged: (v) {
                  if (v != null) setState(() => waProvider = v);
                },
              ),
              const SizedBox(height: 10),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'رقم الواتساب'),
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
                await provider.updateWorkspaceSettings(
                  ws.copyWith(
                    whatsappInstantEnabled: enabled,
                    whatsappProvider: waProvider,
                    whatsappPhone: phoneCtrl.text.trim(),
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

  static Future<void> showActivationModal(BuildContext context) async {
    final codeCtrl = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تفعيل النسخة الكاملة'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('أدخل رمز التفعيل للمعاينة المحلية:'),
            const SizedBox(height: 10),
            TextField(
              controller: codeCtrl,
              decoration: const InputDecoration(labelText: 'رمز التفعيل'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إغلاق'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('تم التحقق في وضع المعاينة')),
              );
            },
            child: const Text('تفعيل'),
          ),
        ],
      ),
    );
  }

  static Future<void> showTrash(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      builder: (ctx) {
        final deleted = context
            .watch<WorkspaceProvider>()
            .ledger
            .where((e) => e.deleted)
            .toList();
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'سلة المحذوفات',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              if (deleted.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('سلة المحذوفات فارغة'),
                )
              else
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: deleted.length,
                    itemBuilder: (_, i) {
                      final entry = deleted[i];
                      return ListTile(
                        title: Text('${entry.accountName} (${entry.typeLabel})'),
                        subtitle: Text(
                          '${AccountingService.formatAmount(entry.amount)} ${entry.currency}',
                        ),
                        trailing: TextButton(
                          onPressed: () => ctx
                              .read<WorkspaceProvider>()
                              .softDeleteLedgerEntry(entry.id, false),
                          child: const Text('استعادة'),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
