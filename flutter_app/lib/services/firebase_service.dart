import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import '../firebase_options.dart';
import '../models/nasqo_models.dart';

class FirebaseService {
  static FirebaseFirestore get firestore => FirebaseFirestore.instanceFor(
        app: Firebase.app(),
        databaseId: DefaultFirebaseOptions.firestoreDatabaseId,
      );

  static FirebaseAuth get auth => FirebaseAuth.instance;

  static Future<void> ensureWorkspaceSeeded(
    String uid, {
    String? displayName,
  }) async {
    final wsRef = firestore.collection('workspaces').doc(uid);
    final wsSnap = await wsRef.get();
    if (!wsSnap.exists) {
      await wsRef.set({
        'ownerId': uid,
        'companyName':
            displayName != null && displayName.isNotEmpty ? 'نشاط $displayName' : 'نسقو برو',
        'defaultCurrency': 'ريال',
        'whatsappProvider': 'nasqo',
        'whatsappInstantEnabled': false,
        'whatsappPhone': '',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }

    final accountsCheck = await wsRef
        .collection('accounts')
        .where('ownerId', isEqualTo: uid)
        .limit(1)
        .get();
    if (accountsCheck.docs.isNotEmpty) return;

    final batch = firestore.batch();
    for (final wh in starterWarehouses(uid)) {
      batch.set(wsRef.collection('warehouses').doc(wh.id), {
        ...wh.toMap(),
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
    for (final item in starterInventory(uid)) {
      batch.set(wsRef.collection('inventory').doc(item.id), {
        ...item.toMap(),
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
    for (final acc in starterAccounts(uid)) {
      batch.set(wsRef.collection('accounts').doc(acc.id), {
        ...acc.toMap(),
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
    for (final entry in starterLedger(uid)) {
      batch.set(wsRef.collection('ledger').doc(entry.id), {
        ...entry.toMap(),
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  static Future<void> saveAccount(String uid, AccountRecord account) async {
    final col = firestore.collection('workspaces').doc(uid).collection('accounts');
    await col.doc(account.id).set({
      ...account.toMap(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  static Future<void> saveLedgerEntry(
      String uid, LedgerEntryRecord entry) async {
    final col = firestore.collection('workspaces').doc(uid).collection('ledger');
    await col.doc(entry.id).set({
      ...entry.toMap(),
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  static Future<void> saveWarehouse(String uid, WarehouseRecord warehouse) async {
    final col =
        firestore.collection('workspaces').doc(uid).collection('warehouses');
    await col.doc(warehouse.id).set({
      ...warehouse.toMap(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  static Future<void> saveWorkspaceSettings(
      String uid, WorkspaceSettings settings) async {
    await firestore.collection('workspaces').doc(uid).set({
      ...settings.toMap(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  static List<WarehouseRecord> starterWarehouses(String uid) => [
        WarehouseRecord(
          id: 'wh_1',
          ownerId: uid,
          name: 'المخزن الرئيسي',
          details: 'المستودع الافتراضي',
          isDefault: true,
          codeNumber: 1,
        ),
        WarehouseRecord(
          id: 'wh_3',
          ownerId: uid,
          name: 'مخازن بينون',
          details: 'مستودع البضائع العام',
          isDefault: false,
          codeNumber: 3,
        ),
        WarehouseRecord(
          id: 'wh_4',
          ownerId: uid,
          name: 'بينون',
          details: 'فرع التوريد',
          isDefault: false,
          codeNumber: 4,
        ),
      ];

  static List<InventoryItemRecord> starterInventory(String uid) => [
        InventoryItemRecord(
          id: 'inv_1',
          ownerId: uid,
          name: 'ابجورة شكل قمر',
          unit: 'حبة',
          quantity: 40,
          avgCost: 2200,
          minThreshold: 25,
          sku: 'SKU-1001',
          warehouseId: 'wh_3',
        ),
        InventoryItemRecord(
          id: 'inv_2',
          ownerId: uid,
          name: 'توصيلة تايب سي 2 متر',
          unit: 'حبة',
          quantity: 120,
          avgCost: 1500,
          minThreshold: 30,
          sku: 'SKU-1002',
          warehouseId: 'wh_1',
        ),
        InventoryItemRecord(
          id: 'inv_3',
          ownerId: uid,
          name: 'بطارية جهاز كشف الذهب',
          unit: 'حبة',
          quantity: 25,
          avgCost: 1500,
          minThreshold: 25,
          sku: 'SKU-1003',
          warehouseId: 'wh_1',
        ),
        InventoryItemRecord(
          id: 'inv_4',
          ownerId: uid,
          name: 'فواحة عطرية خازن',
          unit: 'حبة',
          quantity: 35,
          avgCost: 3400,
          minThreshold: 20,
          sku: 'SKU-1004',
          warehouseId: 'wh_3',
        ),
        InventoryItemRecord(
          id: 'inv_5',
          ownerId: uid,
          name: 'مكينة خياطة كبير',
          unit: 'حبة',
          quantity: 12,
          avgCost: 10000,
          minThreshold: 25,
          sku: 'SKU-1005',
          warehouseId: 'wh_1',
        ),
        InventoryItemRecord(
          id: 'inv_6',
          ownerId: uid,
          name: 'عازل سطوح 10 كيلو',
          unit: 'كيلو',
          quantity: 18,
          avgCost: 33000,
          minThreshold: 25,
          sku: 'SKU-1006',
          warehouseId: 'wh_1',
        ),
        InventoryItemRecord(
          id: 'inv_7',
          ownerId: uid,
          name: 'فرامة لحم',
          unit: 'حبة',
          quantity: 15,
          avgCost: 3000,
          minThreshold: 25,
          sku: 'SKU-1007',
          warehouseId: 'wh_4',
        ),
      ];

  static List<AccountRecord> starterAccounts(String uid) => [
        AccountRecord(
          id: 'acc_barari',
          ownerId: uid,
          name: 'البراري للتوريد',
          category: AccountCategory.purchases,
          phone: '055 832 1042',
          creditLimit: 1000000,
          openingBalance: 243450,
          openingDirection: 'credit',
          codeNumber: 34,
          sortOrder: 1,
        ),
        AccountRecord(
          id: 'acc_naqd_hilal',
          ownerId: uid,
          name: 'نقـد هلال',
          category: AccountCategory.purchases,
          phone: '050 441 7731',
          creditLimit: 500000,
          isCashAccount: true,
          note: 'حساب المشتريات النقدية',
          openingBalance: 0,
          openingDirection: 'credit',
          codeNumber: 9,
          sortOrder: 2,
        ),
        AccountRecord(
          id: 'acc_waha',
          ownerId: uid,
          name: 'الواحة التجارية',
          category: AccountCategory.purchases,
          phone: '053 190 6208',
          creditLimit: 750000,
          openingBalance: 227601,
          openingDirection: 'credit',
          codeNumber: 49,
          sortOrder: 3,
        ),
        AccountRecord(
          id: 'acc_khatabi',
          ownerId: uid,
          name: 'خطابي وشركاه',
          category: AccountCategory.purchases,
          phone: '056 710 8824',
          creditLimit: 250000,
          openingBalance: 64000,
          openingDirection: 'debit',
          codeNumber: 53,
          sortOrder: 4,
        ),
        AccountRecord(
          id: 'acc_bashar',
          ownerId: uid,
          name: 'بشار العزي',
          category: AccountCategory.purchases,
          creditLimit: 1000000,
          openingBalance: 227601,
          openingDirection: 'credit',
          codeNumber: 6,
          sortOrder: 5,
        ),
        AccountRecord(
          id: 'acc_shop_main',
          ownerId: uid,
          name: 'حساب المحل',
          category: AccountCategory.shop,
          creditLimit: 500000,
          accountImage: '2',
          note: 'مصروفات وتشغيل المحل',
          openingBalance: 261100,
          openingDirection: 'debit',
          codeNumber: 60,
          sortOrder: 6,
        ),
        AccountRecord(
          id: 'acc_emp_1',
          ownerId: uid,
          name: 'رواتب الموظفين',
          category: AccountCategory.employees,
          creditLimit: 200000,
          openingBalance: 10500,
          openingDirection: 'credit',
          codeNumber: 61,
          sortOrder: 7,
        ),
        AccountRecord(
          id: 'acc_sales_1',
          ownerId: uid,
          name: 'المبيعات العامة',
          category: AccountCategory.sales,
          creditLimit: 2000000,
          accountImage: '3',
          openingBalance: 172650,
          openingDirection: 'debit',
          codeNumber: 62,
          sortOrder: 8,
        ),
      ];

  static String _daysAgoIso(int days) => DateTime.now()
      .subtract(Duration(days: days))
      .toIso8601String()
      .substring(0, 10);

  static List<LedgerEntryRecord> starterLedger(String uid) {
    final now = DateTime.now().millisecondsSinceEpoch;
    return [
      LedgerEntryRecord(
        id: 'ent_1108',
        ownerId: uid,
        accountId: 'acc_barari',
        accountName: 'البراري للتوريد',
        kind: LedgerKind.voucher,
        typeLabel: 'عليه',
        payment: 'cash',
        direction: 'debit',
        amount: 20000,
        details: 'تسوية حساب مورد',
        warehouseId: 'wh_1',
        warehouseName: 'المخزن الرئيسي',
        entryNumber: 1108,
        entryDate: _daysAgoIso(18),
        expenseCategory: 'مشتريات بضائع',
        deliveryDays: 3,
        createdAtMs: now - 18 * 86400000,
      ),
      LedgerEntryRecord(
        id: 'ent_1136',
        ownerId: uid,
        accountId: 'acc_barari',
        accountName: 'البراري للتوريد',
        kind: LedgerKind.invoice,
        typeLabel: 'فاتورة آجلة',
        payment: 'credit',
        direction: 'credit',
        amount: 4000,
        details: 'زينة منازل شكل شجرة | 1 حبة',
        warehouseId: 'wh_1',
        warehouseName: 'المخزن الرئيسي',
        invoiceContent: 'items',
        entryNumber: 1136,
        entryDate: _daysAgoIso(11),
        expenseCategory: 'مشتريات بضائع',
        deliveryDays: 2,
        createdAtMs: now - 11 * 86400000,
      ),
      LedgerEntryRecord(
        id: 'ent_1178',
        ownerId: uid,
        accountId: 'acc_barari',
        accountName: 'البراري للتوريد',
        kind: LedgerKind.invoice,
        typeLabel: 'فاتورة آجلة',
        payment: 'credit',
        direction: 'credit',
        amount: 33000,
        details: 'عازل سطوح 10 كيلو | 1 كيلو',
        warehouseId: 'wh_1',
        warehouseName: 'المخزن الرئيسي',
        invoiceContent: 'items',
        entryNumber: 1178,
        entryDate: _daysAgoIso(5),
        dueDate: _daysAgoIso(-3),
        expenseCategory: 'مشتريات بضائع',
        deliveryDays: 4,
        createdAtMs: now - 5 * 86400000,
      ),
      LedgerEntryRecord(
        id: 'ent_1090',
        ownerId: uid,
        accountId: 'acc_naqd_hilal',
        accountName: 'نقـد هلال',
        kind: LedgerKind.invoice,
        typeLabel: 'ف.ش.نقدي',
        payment: 'cash',
        direction: 'credit',
        amount: 17000,
        details: 'فواحة عطرية خازن | 5 حبة',
        warehouseId: 'wh_3',
        warehouseName: 'مخازن بينون',
        invoiceContent: 'items',
        entryNumber: 1090,
        entryDate: _daysAgoIso(14),
        expenseCategory: 'مشتريات بضائع',
        deliveryDays: 1,
        createdAtMs: now - 14 * 86400000,
      ),
      LedgerEntryRecord(
        id: 'ent_1140',
        ownerId: uid,
        accountId: 'acc_naqd_hilal',
        accountName: 'نقـد هلال',
        kind: LedgerKind.invoice,
        typeLabel: 'ف.ش.نقدي',
        payment: 'cash',
        direction: 'credit',
        amount: 3000,
        details: 'توصيلة تايب سي 2 متر | 1 حبة\nبطارية جهاز كشف الذهب | 1 حبة',
        documentNumber: '1140',
        warehouseId: 'wh_1',
        warehouseName: 'المخزن الرئيسي',
        invoiceContent: 'items',
        entryNumber: 1140,
        entryDate: _daysAgoIso(6),
        expenseCategory: 'مشتريات بضائع',
        deliveryDays: 2,
        createdAtMs: now - 6 * 86400000,
      ),
      LedgerEntryRecord(
        id: 'ent_1218',
        ownerId: uid,
        accountId: 'acc_naqd_hilal',
        accountName: 'نقـد هلال',
        kind: LedgerKind.invoice,
        typeLabel: 'ف.ش.نقدي',
        payment: 'cash',
        direction: 'credit',
        amount: 20000,
        details: 'محلات بن عوضة\nمكينة خياطة كبير | 2 حبة',
        warehouseId: 'wh_1',
        warehouseName: 'المخزن الرئيسي',
        invoiceContent: 'items',
        entryNumber: 1218,
        entryDate: _daysAgoIso(3),
        expenseCategory: 'شحن ونقل',
        deliveryDays: 2,
        createdAtMs: now - 3 * 86400000,
      ),
      LedgerEntryRecord(
        id: 'ent_1225',
        ownerId: uid,
        accountId: 'acc_shop_main',
        accountName: 'حساب المحل',
        kind: LedgerKind.voucher,
        typeLabel: 'عليه (سند)',
        payment: 'cash',
        direction: 'debit',
        amount: 6500,
        details: 'فاتورة كهرباء وصيانة مستودع',
        documentNumber: '1225',
        warehouseId: 'wh_1',
        warehouseName: 'المخزن الرئيسي',
        entryNumber: 1225,
        entryDate: _daysAgoIso(4),
        expenseCategory: 'صيانة ومرافق',
        createdAtMs: now - 4 * 86400000,
      ),
      LedgerEntryRecord(
        id: 'ent_1230',
        ownerId: uid,
        accountId: 'acc_emp_1',
        accountName: 'رواتب الموظفين',
        kind: LedgerKind.voucher,
        typeLabel: 'عليه (سند)',
        payment: 'cash',
        direction: 'debit',
        amount: 12000,
        details: 'دفعة رواتب شهرية',
        documentNumber: '1230',
        warehouseId: 'wh_1',
        warehouseName: 'المخزن الرئيسي',
        entryNumber: 1230,
        entryDate: _daysAgoIso(2),
        expenseCategory: 'رواتب وأجور',
        createdAtMs: now - 2 * 86400000,
      ),
      LedgerEntryRecord(
        id: 'ent_1235',
        ownerId: uid,
        accountId: 'acc_sales_1',
        accountName: 'المبيعات العامة',
        kind: LedgerKind.invoice,
        typeLabel: 'ف.ش.نقدي',
        payment: 'cash',
        direction: 'debit',
        amount: 24500,
        details: 'مبيعات أجهزة وتجهيزات',
        documentNumber: '1235',
        warehouseId: 'wh_1',
        warehouseName: 'المخزن الرئيسي',
        invoiceContent: 'items',
        entryNumber: 1235,
        entryDate: _daysAgoIso(1),
        createdAtMs: now - 86400000,
      ),
    ];
  }
}
