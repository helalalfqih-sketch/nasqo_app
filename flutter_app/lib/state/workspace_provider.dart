import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../models/nasqo_models.dart';
import '../services/firebase_service.dart';
import '../services/local_workspace_store.dart';
import '../theme/app_theme.dart';

class WorkspaceProvider extends ChangeNotifier {
  static const String _demoUid = 'demo_workspace';

  bool _firebaseReady = false;
  bool _cloudConnected = false;
  User? _user;
  ThemeMode _themeMode = ThemeMode.light;
  Color _brandColor = NasqoColors.blue;

  WorkspaceSettings _workspace = const WorkspaceSettings(
    id: _demoUid,
    ownerId: _demoUid,
    companyName: 'نسقو برو',
    defaultCurrency: 'ريال',
    whatsappProvider: 'nasqo',
    whatsappInstantEnabled: false,
    whatsappPhone: '',
  );

  List<AccountRecord> _accounts = [];
  List<LedgerEntryRecord> _ledger = [];
  List<WarehouseRecord> _warehouses = [];
  List<InventoryItemRecord> _inventory = [];
  final List<StreamSubscription<dynamic>> _subs = [];
  final LocalWorkspaceStore _localStore = LocalWorkspaceStore();
  bool _localReady = false;

  WorkspaceProvider() {
    _loadDemoSeed();
  }

  bool get firebaseReady => _firebaseReady;
  bool get localReady => _localReady;
  bool get cloudConnected => _cloudConnected;
  User? get user => _user;
  ThemeMode get themeMode => _themeMode;
  Color get brandColor => _brandColor;
  WorkspaceSettings get workspace => _workspace;
  List<AccountRecord> get accounts => List.unmodifiable(_accounts);
  List<LedgerEntryRecord> get ledger => List.unmodifiable(_ledger);
  List<WarehouseRecord> get warehouses => List.unmodifiable(_warehouses);
  List<InventoryItemRecord> get inventory => List.unmodifiable(_inventory);
  String get activeUid => _user?.uid ?? _demoUid;

  /// Loads persisted device data; a fresh installation starts with no
  /// financial entries. Demo data must never appear as real transactions.
  Future<void> initLocal() async {
    await _localStore.open();
    final savedWorkspace = await _localStore.readSettings();
    if (savedWorkspace != null) {
      _workspace = savedWorkspace;
    } else {
      await _localStore.saveSettings(_workspace);
    }
    _accounts = await _localStore.readAccounts()
      ..sort((a, b) {
        final result = a.sortOrder.compareTo(b.sortOrder);
        return result != 0 ? result : a.codeNumber.compareTo(b.codeNumber);
      });
    _ledger = await _localStore.readLedger();
    _warehouses = await _localStore.readWarehouses();
    _inventory = await _localStore.readInventory();
    _cloudConnected = false;
    _localReady = true;
    notifyListeners();
  }

  void _loadDemoSeed() {
    _accounts = FirebaseService.starterAccounts(_demoUid);
    _ledger = FirebaseService.starterLedger(_demoUid);
    _warehouses = FirebaseService.starterWarehouses(_demoUid);
    _inventory = FirebaseService.starterInventory(_demoUid);
    notifyListeners();
  }

  Future<void> initFirebase() async {
    try {
      _firebaseReady = true;
      _subs.add(
        FirebaseService.auth.authStateChanges().listen((user) async {
          _user = user;
          if (user != null) {
            await _attachFirestoreWorkspace(user);
          } else {
            _cloudConnected = false;
            _loadDemoSeed();
          }
          notifyListeners();
        }),
      );
    } catch (_) {
      _firebaseReady = false;
    }
  }

  Future<void> _attachFirestoreWorkspace(User user) async {
    for (final s in _subs.skip(1)) {
      await s.cancel();
    }
    _subs.removeRange(1, _subs.length);

    final uid = user.uid;
    await FirebaseService.ensureWorkspaceSeeded(
      uid,
      displayName: user.displayName,
    );
    final db = FirebaseService.firestore;
    final wsRef = db.collection('workspaces').doc(uid);

    _subs.add(wsRef.snapshots().listen((snap) {
      if (snap.exists && snap.data() != null) {
        _workspace = WorkspaceSettings.fromMap(snap.id, snap.data()!);
        _cloudConnected = true;
        notifyListeners();
      }
    }));

    _subs.add(
      wsRef
          .collection('accounts')
          .where('ownerId', isEqualTo: uid)
          .snapshots()
          .listen((snap) {
        _accounts = snap.docs
            .map((d) => AccountRecord.fromMap(d.id, d.data()))
            .toList()
          ..sort((a, b) {
            final c = a.sortOrder.compareTo(b.sortOrder);
            return c != 0 ? c : a.codeNumber.compareTo(b.codeNumber);
          });
        notifyListeners();
      }),
    );

    _subs.add(
      wsRef
          .collection('ledger')
          .where('ownerId', isEqualTo: uid)
          .snapshots()
          .listen((snap) {
        _ledger = snap.docs.map((d) {
          final data = d.data();
          final ts = data['createdAt'];
          final ms = ts is Timestamp
              ? ts.millisecondsSinceEpoch
              : DateTime.now().millisecondsSinceEpoch;
          return LedgerEntryRecord.fromMap(
            d.id,
            data,
            createdAtMsOverride: ms,
          );
        }).toList();
        notifyListeners();
      }),
    );

    _subs.add(
      wsRef
          .collection('warehouses')
          .where('ownerId', isEqualTo: uid)
          .snapshots()
          .listen((snap) {
        _warehouses = snap.docs
            .map((d) => WarehouseRecord.fromMap(d.id, d.data()))
            .toList()
          ..sort((a, b) => a.codeNumber.compareTo(b.codeNumber));
        notifyListeners();
      }),
    );

    _subs.add(
      wsRef
          .collection('inventory')
          .where('ownerId', isEqualTo: uid)
          .snapshots()
          .listen((snap) {
        _inventory = snap.docs
            .map((d) => InventoryItemRecord.fromMap(d.id, d.data()))
            .toList()
          ..sort((a, b) => a.name.compareTo(b.name));
        notifyListeners();
      }),
    );
  }

  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }

  void setBrandColor(Color color) {
    _brandColor = color;
    notifyListeners();
  }

  Future<void> updateWorkspaceSettings(WorkspaceSettings next) async {
    await _localStore.saveSettings(next);
    _workspace = next;
    notifyListeners();
  }

  Future<AccountRecord> addOrUpdateAccount(AccountRecord account) async {
    await _localStore.saveAccount(account);
    final idx = _accounts.indexWhere((a) => a.id == account.id);
    if (idx >= 0) {
      _accounts[idx] = account;
    } else {
      _accounts = [..._accounts, account];
    }
    notifyListeners();
    return account;
  }

  Future<LedgerEntryRecord> addLedgerEntry(LedgerEntryRecord entry) async {
    await _localStore.saveLedger(entry);
    _ledger = [entry, ..._ledger];
    notifyListeners();
    return entry;
  }

  Future<void> softDeleteLedgerEntry(String entryId, bool deleted) async {
    final target = _ledger.firstWhere((e) => e.id == entryId).copyWith(deleted: deleted);
    await _localStore.saveLedger(target);
    _ledger = _ledger.map((e) => e.id == entryId ? target : e).toList();
    notifyListeners();
  }

  Future<void> addWarehouse(WarehouseRecord warehouse) async {
    await _localStore.saveWarehouse(warehouse);
    _warehouses = [..._warehouses, warehouse];
    notifyListeners();
  }

  int nextEntryNumber() {
    if (_ledger.isEmpty) return 1240;
    final maxNum =
        _ledger.map((e) => e.entryNumber).reduce((a, b) => a > b ? a : b);
    return maxNum + 1;
  }

  int nextAccountCode() {
    if (_accounts.isEmpty) return 1;
    final maxCode =
        _accounts.map((a) => a.codeNumber).reduce((a, b) => a > b ? a : b);
    return maxCode + 1;
  }

  @override
  void dispose() {
    for (final s in _subs) {
      s.cancel();
    }
    _localStore.close();
    super.dispose();
  }
}
