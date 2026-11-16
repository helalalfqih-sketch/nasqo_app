const List<String> kCurrencies = ['ريال', 'دولار', 'يورو', 'عملة 2'];

const List<String> kExpenseCategories = [
  'مشتريات بضائع',
  'مصروفات تشغيلية',
  'شحن ونقل',
  'رواتب وأجور',
  'صيانة ومرافق',
  'تسويق ومبيعات',
  'إيجار ومقر',
  'أخرى',
];

enum AccountCategory {
  purchases,
  sales,
  clients,
  employees,
  transfers,
  shop;

  String get key => name;

  String get labelAr {
    switch (this) {
      case AccountCategory.purchases:
        return 'المشتريات';
      case AccountCategory.sales:
        return 'المبيعات';
      case AccountCategory.clients:
        return 'العملاء';
      case AccountCategory.employees:
        return 'الموظفون';
      case AccountCategory.transfers:
        return 'الحوالات';
      case AccountCategory.shop:
        return 'المحل';
    }
  }

  static AccountCategory fromKey(String? raw) {
    return AccountCategory.values.firstWhere(
      (e) => e.name == raw,
      orElse: () => AccountCategory.purchases,
    );
  }
}

enum LedgerKind {
  voucher,
  invoice,
  returnDoc,
  quote,
  order,
  transfer,
  currency,
  simpleEntry,
  opening;

  String get firestoreKey {
    switch (this) {
      case LedgerKind.returnDoc:
        return 'return';
      case LedgerKind.simpleEntry:
        return 'simple-entry';
      default:
        return name;
    }
  }

  static LedgerKind fromKey(String? raw) {
    if (raw == 'return') return LedgerKind.returnDoc;
    if (raw == 'simple-entry') return LedgerKind.simpleEntry;
    return LedgerKind.values.firstWhere(
      (e) => e.name == raw,
      orElse: () => LedgerKind.voucher,
    );
  }
}

class WorkspaceSettings {
  final String id;
  final String ownerId;
  final String companyName;
  final String defaultCurrency;
  final String whatsappProvider; // 'nasqo' | 'external'
  final bool whatsappInstantEnabled;
  final String whatsappPhone;

  const WorkspaceSettings({
    required this.id,
    required this.ownerId,
    required this.companyName,
    this.defaultCurrency = 'ريال',
    this.whatsappProvider = 'nasqo',
    this.whatsappInstantEnabled = false,
    this.whatsappPhone = '',
  });

  WorkspaceSettings copyWith({
    String? companyName,
    String? defaultCurrency,
    String? whatsappProvider,
    bool? whatsappInstantEnabled,
    String? whatsappPhone,
  }) {
    return WorkspaceSettings(
      id: id,
      ownerId: ownerId,
      companyName: companyName ?? this.companyName,
      defaultCurrency: defaultCurrency ?? this.defaultCurrency,
      whatsappProvider: whatsappProvider ?? this.whatsappProvider,
      whatsappInstantEnabled:
          whatsappInstantEnabled ?? this.whatsappInstantEnabled,
      whatsappPhone: whatsappPhone ?? this.whatsappPhone,
    );
  }

  Map<String, dynamic> toMap() => {
        'ownerId': ownerId,
        'companyName': companyName,
        'defaultCurrency': defaultCurrency,
        'whatsappProvider': whatsappProvider,
        'whatsappInstantEnabled': whatsappInstantEnabled,
        'whatsappPhone': whatsappPhone,
      };

  factory WorkspaceSettings.fromMap(String id, Map<String, dynamic> data) {
    return WorkspaceSettings(
      id: id,
      ownerId: (data['ownerId'] ?? id).toString(),
      companyName: (data['companyName'] ?? 'نسقو برو').toString(),
      defaultCurrency: (data['defaultCurrency'] ?? 'ريال').toString(),
      whatsappProvider:
          data['whatsappProvider'] == 'external' ? 'external' : 'nasqo',
      whatsappInstantEnabled: data['whatsappInstantEnabled'] == true,
      whatsappPhone: (data['whatsappPhone'] ?? '').toString(),
    );
  }
}

class AccountRecord {
  final String id;
  final String ownerId;
  final String name;
  final AccountCategory category;
  final String phone;
  final double creditLimit;
  final String currency;
  final bool isCashAccount;
  final String accountImage;
  final int sortOrder;
  final bool settlement;
  final bool documentNumberRequired;
  final String messageMethod; // 'sms' | 'whatsapp'
  final String sendMode; // 'auto' | 'confirm' | 'never'
  final String note;
  final double openingBalance;
  final String openingDirection; // 'debit' | 'credit'
  final int codeNumber;

  const AccountRecord({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.category,
    this.phone = '',
    this.creditLimit = 0,
    this.currency = 'ريال',
    this.isCashAccount = false,
    this.accountImage = '1',
    this.sortOrder = 1,
    this.settlement = false,
    this.documentNumberRequired = false,
    this.messageMethod = 'sms',
    this.sendMode = 'never',
    this.note = '',
    this.openingBalance = 0,
    this.openingDirection = 'debit',
    this.codeNumber = 1,
  });

  AccountRecord copyWith({
    String? name,
    AccountCategory? category,
    String? phone,
    double? creditLimit,
    String? currency,
    bool? isCashAccount,
    String? messageMethod,
    String? sendMode,
    String? note,
    double? openingBalance,
    String? openingDirection,
    int? codeNumber,
  }) {
    return AccountRecord(
      id: id,
      ownerId: ownerId,
      name: name ?? this.name,
      category: category ?? this.category,
      phone: phone ?? this.phone,
      creditLimit: creditLimit ?? this.creditLimit,
      currency: currency ?? this.currency,
      isCashAccount: isCashAccount ?? this.isCashAccount,
      accountImage: accountImage,
      sortOrder: sortOrder,
      settlement: settlement,
      documentNumberRequired: documentNumberRequired,
      messageMethod: messageMethod ?? this.messageMethod,
      sendMode: sendMode ?? this.sendMode,
      note: note ?? this.note,
      openingBalance: openingBalance ?? this.openingBalance,
      openingDirection: openingDirection ?? this.openingDirection,
      codeNumber: codeNumber ?? this.codeNumber,
    );
  }

  Map<String, dynamic> toMap() => {
        'ownerId': ownerId,
        'name': name,
        'category': category.key,
        'phone': phone,
        'creditLimit': creditLimit,
        'currency': currency,
        'isCashAccount': isCashAccount,
        'accountImage': accountImage,
        'sortOrder': sortOrder,
        'settlement': settlement,
        'documentNumberRequired': documentNumberRequired,
        'messageMethod': messageMethod,
        'sendMode': sendMode,
        'note': note,
        'openingBalance': openingBalance,
        'openingDirection': openingDirection,
        'codeNumber': codeNumber,
      };

  factory AccountRecord.fromMap(String id, Map<String, dynamic> data) {
    return AccountRecord(
      id: id,
      ownerId: (data['ownerId'] ?? '').toString(),
      name: (data['name'] ?? '').toString(),
      category: AccountCategory.fromKey(data['category']?.toString()),
      phone: (data['phone'] ?? '').toString(),
      creditLimit: (data['creditLimit'] as num?)?.toDouble() ?? 0,
      currency: (data['currency'] ?? 'ريال').toString(),
      isCashAccount: data['isCashAccount'] == true,
      accountImage: (data['accountImage'] ?? '1').toString(),
      sortOrder: (data['sortOrder'] as num?)?.toInt() ?? 1,
      settlement: data['settlement'] == true,
      documentNumberRequired: data['documentNumberRequired'] == true,
      messageMethod:
          data['messageMethod'] == 'whatsapp' ? 'whatsapp' : 'sms',
      sendMode: ['auto', 'confirm', 'never'].contains(data['sendMode'])
          ? data['sendMode'].toString()
          : 'never',
      note: (data['note'] ?? '').toString(),
      openingBalance: (data['openingBalance'] as num?)?.toDouble() ?? 0,
      openingDirection:
          data['openingDirection'] == 'credit' ? 'credit' : 'debit',
      codeNumber: (data['codeNumber'] as num?)?.toInt() ?? 1,
    );
  }
}

class LedgerEntryRecord {
  final String id;
  final String ownerId;
  final String accountId;
  final String accountName;
  final String counterpartAccountId;
  final String counterpartAccountName;
  final LedgerKind kind;
  final String typeLabel;
  final String payment; // 'cash' | 'credit' | 'balance'
  final String direction; // 'debit' | 'credit'
  final double amount;
  final String currency;
  final double exchangeRate;
  final String details;
  final String documentNumber;
  final String warehouseId;
  final String warehouseName;
  final String invoiceContent; // 'items' | 'free' | 'none'
  final int entryNumber;
  final bool deleted;
  final String entryDate;
  final String? dueDate;
  final String? expenseCategory;
  final int? deliveryDays;
  final int createdAtMs;

  const LedgerEntryRecord({
    required this.id,
    required this.ownerId,
    required this.accountId,
    required this.accountName,
    this.counterpartAccountId = '',
    this.counterpartAccountName = '',
    required this.kind,
    required this.typeLabel,
    this.payment = 'cash',
    required this.direction,
    required this.amount,
    this.currency = 'ريال',
    this.exchangeRate = 1,
    this.details = '',
    this.documentNumber = '',
    this.warehouseId = '',
    this.warehouseName = '',
    this.invoiceContent = 'none',
    required this.entryNumber,
    this.deleted = false,
    required this.entryDate,
    this.dueDate,
    this.expenseCategory,
    this.deliveryDays,
    required this.createdAtMs,
  });

  LedgerEntryRecord copyWith({
    bool? deleted,
    double? amount,
    String? details,
    String? direction,
    String? currency,
    String? documentNumber,
  }) {
    return LedgerEntryRecord(
      id: id,
      ownerId: ownerId,
      accountId: accountId,
      accountName: accountName,
      counterpartAccountId: counterpartAccountId,
      counterpartAccountName: counterpartAccountName,
      kind: kind,
      typeLabel: typeLabel,
      payment: payment,
      direction: direction ?? this.direction,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      exchangeRate: exchangeRate,
      details: details ?? this.details,
      documentNumber: documentNumber ?? this.documentNumber,
      warehouseId: warehouseId,
      warehouseName: warehouseName,
      invoiceContent: invoiceContent,
      entryNumber: entryNumber,
      deleted: deleted ?? this.deleted,
      entryDate: entryDate,
      dueDate: dueDate,
      expenseCategory: expenseCategory,
      deliveryDays: deliveryDays,
      createdAtMs: createdAtMs,
    );
  }

  Map<String, dynamic> toMap() => {
        'ownerId': ownerId,
        'accountId': accountId,
        'accountName': accountName,
        'counterpartAccountId': counterpartAccountId,
        'counterpartAccountName': counterpartAccountName,
        'kind': kind.firestoreKey,
        'typeLabel': typeLabel,
        'payment': payment,
        'direction': direction,
        'amount': amount,
        'currency': currency,
        'exchangeRate': exchangeRate,
        'details': details,
        'documentNumber': documentNumber,
        'warehouseId': warehouseId,
        'warehouseName': warehouseName,
        'invoiceContent': invoiceContent,
        'entryNumber': entryNumber,
        'deleted': deleted,
        'entryDate': entryDate,
        if (dueDate != null && dueDate!.isNotEmpty) 'dueDate': dueDate,
        if (expenseCategory != null && expenseCategory!.isNotEmpty)
          'expenseCategory': expenseCategory,
        if (deliveryDays != null) 'deliveryDays': deliveryDays,
      };

  factory LedgerEntryRecord.fromMap(
    String id,
    Map<String, dynamic> data, {
    int? createdAtMsOverride,
  }) {
    return LedgerEntryRecord(
      id: id,
      ownerId: (data['ownerId'] ?? '').toString(),
      accountId: (data['accountId'] ?? '').toString(),
      accountName: (data['accountName'] ?? '').toString(),
      counterpartAccountId: (data['counterpartAccountId'] ?? '').toString(),
      counterpartAccountName:
          (data['counterpartAccountName'] ?? '').toString(),
      kind: LedgerKind.fromKey(data['kind']?.toString()),
      typeLabel: (data['typeLabel'] ?? 'سند').toString(),
      payment: (data['payment'] ?? 'cash').toString(),
      direction: data['direction'] == 'credit' ? 'credit' : 'debit',
      amount: (data['amount'] as num?)?.toDouble() ?? 0,
      currency: (data['currency'] ?? 'ريال').toString(),
      exchangeRate: (data['exchangeRate'] as num?)?.toDouble() ?? 1,
      details: (data['details'] ?? '').toString(),
      documentNumber: (data['documentNumber'] ?? '').toString(),
      warehouseId: (data['warehouseId'] ?? '').toString(),
      warehouseName: (data['warehouseName'] ?? '').toString(),
      invoiceContent: (data['invoiceContent'] ?? 'none').toString(),
      entryNumber: (data['entryNumber'] as num?)?.toInt() ?? 1,
      deleted: data['deleted'] == true,
      entryDate: (data['entryDate'] ?? '').toString(),
      dueDate: data['dueDate']?.toString(),
      expenseCategory: data['expenseCategory']?.toString(),
      deliveryDays: (data['deliveryDays'] as num?)?.toInt(),
      createdAtMs:
          createdAtMsOverride ?? DateTime.now().millisecondsSinceEpoch,
    );
  }
}

class WarehouseRecord {
  final String id;
  final String ownerId;
  final String name;
  final String details;
  final bool isDefault;
  final int codeNumber;

  const WarehouseRecord({
    required this.id,
    required this.ownerId,
    required this.name,
    this.details = '',
    this.isDefault = false,
    this.codeNumber = 1,
  });

  Map<String, dynamic> toMap() => {
        'ownerId': ownerId,
        'name': name,
        'details': details,
        'isDefault': isDefault,
        'codeNumber': codeNumber,
      };

  factory WarehouseRecord.fromMap(String id, Map<String, dynamic> data) {
    return WarehouseRecord(
      id: id,
      ownerId: (data['ownerId'] ?? '').toString(),
      name: (data['name'] ?? '').toString(),
      details: (data['details'] ?? '').toString(),
      isDefault: data['isDefault'] == true,
      codeNumber: (data['codeNumber'] as num?)?.toInt() ?? 1,
    );
  }
}

class InventoryItemRecord {
  final String id;
  final String ownerId;
  final String name;
  final String unit;
  final double quantity;
  final double avgCost;
  final double minThreshold;
  final String? sku;
  final String warehouseId;

  const InventoryItemRecord({
    required this.id,
    required this.ownerId,
    required this.name,
    this.unit = 'حبة',
    required this.quantity,
    required this.avgCost,
    this.minThreshold = 25,
    this.sku,
    required this.warehouseId,
  });

  Map<String, dynamic> toMap() => {
        'ownerId': ownerId,
        'name': name,
        'unit': unit,
        'quantity': quantity,
        'avgCost': avgCost,
        'minThreshold': minThreshold,
        if (sku != null && sku!.isNotEmpty) 'sku': sku,
        'warehouseId': warehouseId,
      };

  factory InventoryItemRecord.fromMap(String id, Map<String, dynamic> data) {
    return InventoryItemRecord(
      id: id,
      ownerId: (data['ownerId'] ?? '').toString(),
      name: (data['name'] ?? '').toString(),
      unit: (data['unit'] ?? 'حبة').toString(),
      quantity: (data['quantity'] as num?)?.toDouble() ?? 0,
      avgCost: (data['avgCost'] as num?)?.toDouble() ?? 0,
      minThreshold: (data['minThreshold'] as num?)?.toDouble() ?? 25,
      sku: data['sku']?.toString(),
      warehouseId: (data['warehouseId'] ?? '').toString(),
    );
  }
}

class StatementRowWithBalance {
  final LedgerEntryRecord entry;
  final double runningBalance;

  const StatementRowWithBalance({
    required this.entry,
    required this.runningBalance,
  });
}
