import 'dart:convert';

import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

import '../models/nasqo_models.dart';

/// Device-only persistence for the first offline release.
///
/// No cloud credentials or network calls are used here. Every write is
/// committed before callers update the visible workspace state.
class LocalWorkspaceStore {
  static const _databaseName = 'nasqo_local_v1.db';
  static const _table = 'records';
  Database? _database;

  Future<void> open() async {
    if (_database != null) return;
    final path = p.join(await getDatabasesPath(), _databaseName);
    _database = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE $_table (
            kind TEXT NOT NULL,
            id TEXT NOT NULL,
            payload TEXT NOT NULL,
            PRIMARY KEY (kind, id)
          )
        ''');
      },
    );
  }

  Database get _db {
    final db = _database;
    if (db == null) throw StateError('Local database has not been opened');
    return db;
  }

  Future<void> _put(String kind, String id, Map<String, dynamic> payload) async {
    await _db.transaction((txn) async {
      await txn.insert(
        _table,
        {'kind': kind, 'id': id, 'payload': jsonEncode(payload)},
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    });
  }

  Future<List<(String, Map<String, dynamic>)>> _read(String kind) async {
    final rows = await _db.query(
      _table,
      columns: ['id', 'payload'],
      where: 'kind = ?',
      whereArgs: [kind],
    );
    return rows.map((row) {
      final payload = jsonDecode(row['payload'] as String) as Map<String, dynamic>;
      return (row['id'] as String, payload);
    }).toList();
  }

  Future<WorkspaceSettings?> readSettings() async {
    final rows = await _db.query(
      _table,
      columns: ['id', 'payload'],
      where: 'kind = ? AND id = ?',
      whereArgs: ['settings', 'local_workspace'],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return WorkspaceSettings.fromMap(
      'local_workspace',
      jsonDecode(rows.first['payload'] as String) as Map<String, dynamic>,
    );
  }

  Future<void> saveSettings(WorkspaceSettings settings) =>
      _put('settings', 'local_workspace', settings.toMap());

  Future<List<AccountRecord>> readAccounts() async =>
      (await _read('accounts'))
          .map((r) => AccountRecord.fromMap(r.$1, r.$2))
          .toList();

  Future<List<LedgerEntryRecord>> readLedger() async =>
      (await _read('ledger'))
          .map((r) => LedgerEntryRecord.fromMap(r.$1, r.$2))
          .toList();

  Future<List<WarehouseRecord>> readWarehouses() async =>
      (await _read('warehouses'))
          .map((r) => WarehouseRecord.fromMap(r.$1, r.$2))
          .toList();

  Future<List<InventoryItemRecord>> readInventory() async =>
      (await _read('inventory'))
          .map((r) => InventoryItemRecord.fromMap(r.$1, r.$2))
          .toList();

  Future<void> saveAccount(AccountRecord account) =>
      _put('accounts', account.id, account.toMap());

  Future<void> saveLedger(LedgerEntryRecord entry) =>
      _put('ledger', entry.id, {
        ...entry.toMap(),
        'createdAtMs': entry.createdAtMs,
      });

  Future<void> saveWarehouse(WarehouseRecord warehouse) =>
      _put('warehouses', warehouse.id, warehouse.toMap());

  Future<void> saveInventory(InventoryItemRecord item) =>
      _put('inventory', item.id, item.toMap());

  Future<void> close() async {
    await _database?.close();
    _database = null;
  }
}
