import 'package:intl/intl.dart';
import '../models/nasqo_models.dart';

class AccountSummary {
  final double debitTotal;
  final double creditTotal;
  final double netBalance;
  final String tone; // 'credit' | 'debit' | 'neutral'
  final int entryCount;

  const AccountSummary({
    required this.debitTotal,
    required this.creditTotal,
    required this.netBalance,
    required this.tone,
    required this.entryCount,
  });
}

class CategoryBucket {
  final double netSigned;
  final double debitTotal;
  final double creditTotal;
  final int count;

  const CategoryBucket({
    required this.netSigned,
    required this.debitTotal,
    required this.creditTotal,
    required this.count,
  });
}

class StatementResult {
  final List<StatementRowWithBalance> rows;
  final double debitTotal;
  final double creditTotal;
  final double netBalance;
  final String netDirection; // 'credit' | 'debit' | 'neutral'

  const StatementResult({
    required this.rows,
    required this.debitTotal,
    required this.creditTotal,
    required this.netBalance,
    required this.netDirection,
  });
}

class InventorySummaryResult {
  final List<InventoryItemRecord> items;
  final double totalQuantity;
  final double totalValue;

  const InventorySummaryResult({
    required this.items,
    required this.totalQuantity,
    required this.totalValue,
  });
}

class AccountingService {
  static const _arabicIndic = '٠١٢٣٤٥٦٧٨٩';
  static const _persianIndic = '۰۱۲۳۴۵۶۷۸۹';
  static final NumberFormat _amountFormatter = NumberFormat('#,##0.##', 'en_US');

  static double parseArabicNumber(dynamic raw) {
    if (raw == null) return 0;
    if (raw is num) return raw.isFinite ? raw.toDouble() : 0;
    var str = raw.toString();
    for (var i = 0; i < 10; i++) {
      str = str.replaceAll(_arabicIndic[i], '$i');
      str = str.replaceAll(_persianIndic[i], '$i');
    }
    str = str
        .replaceAll(RegExp(r'[,٬\s]'), '')
        .replaceAll('٫', '.');
    return double.tryParse(str) ?? 0;
  }

  static String formatAmount(double value) {
    if (!value.isFinite) return '0';
    final rounded = (value * 100).roundToDouble() / 100;
    return _amountFormatter.format(rounded);
  }

  static String normalizeArabicSearch(String text) {
    var out = text
        .replaceAll(RegExp(r'[أإآ]'), 'ا')
        .replaceAll(RegExp(r'[ـ,٬]'), '');
    for (var i = 0; i < 10; i++) {
      out = out.replaceAll(_arabicIndic[i], '$i');
      out = out.replaceAll(_persianIndic[i], '$i');
    }
    return out.toLowerCase().trim();
  }

  static bool affectsAccountBalance(LedgerEntryRecord entry) {
    if (entry.deleted) return false;
    return entry.kind != LedgerKind.quote && entry.kind != LedgerKind.order;
  }

  static AccountSummary computeAccountSummary(
    AccountRecord account,
    List<LedgerEntryRecord> entries, {
    String? currencyFilter,
  }) {
    double debitTotal = 0;
    double creditTotal = 0;
    int entryCount = 0;

    if (account.openingBalance > 0 &&
        (currencyFilter == null ||
            currencyFilter == 'الكل' ||
            currencyFilter == account.currency)) {
      if (account.openingDirection == 'credit') {
        creditTotal += account.openingBalance;
      } else {
        debitTotal += account.openingBalance;
      }
    }

    for (final entry in entries) {
      if (entry.deleted) continue;
      final isPrimary = entry.accountId == account.id;
      final isCounterpart = entry.counterpartAccountId == account.id &&
          entry.counterpartAccountId.isNotEmpty;
      if (!isPrimary && !isCounterpart) continue;

      if (currencyFilter != null &&
          currencyFilter != 'الكل' &&
          currencyFilter != 'جميع العملات بدون مصارفة' &&
          currencyFilter != 'مصارفة الكل بعملة ريال' &&
          entry.currency != currencyFilter) {
        continue;
      }

      entryCount += 1;
      if (!affectsAccountBalance(entry)) continue;

      final effectiveAmount = currencyFilter == 'مصارفة الكل بعملة ريال'
          ? entry.amount * (entry.exchangeRate > 0 ? entry.exchangeRate : 1)
          : entry.amount;

      if (isPrimary) {
        if (account.isCashAccount && entry.payment == 'cash') {
          creditTotal += effectiveAmount;
          debitTotal += effectiveAmount;
        } else if (entry.direction == 'credit') {
          creditTotal += effectiveAmount;
        } else {
          debitTotal += effectiveAmount;
        }
      } else if (isCounterpart) {
        if (entry.direction == 'credit') {
          debitTotal += effectiveAmount;
        } else {
          creditTotal += effectiveAmount;
        }
      }
    }

    final netSigned = creditTotal - debitTotal;
    final tone = netSigned.abs() < 0.005
        ? 'neutral'
        : (netSigned > 0 ? 'credit' : 'debit');

    return AccountSummary(
      debitTotal: debitTotal,
      creditTotal: creditTotal,
      netBalance: netSigned.abs(),
      tone: tone,
      entryCount: entryCount,
    );
  }

  static Map<AccountCategory, CategoryBucket> computeCategoryTotals(
    List<AccountRecord> accounts,
    List<LedgerEntryRecord> entries,
  ) {
    final map = <AccountCategory, CategoryBucket>{
      for (final cat in AccountCategory.values)
        cat: const CategoryBucket(
          netSigned: 0,
          debitTotal: 0,
          creditTotal: 0,
          count: 0,
        ),
    };

    for (final account in accounts) {
      final summary = computeAccountSummary(account, entries);
      final prev = map[account.category]!;
      map[account.category] = CategoryBucket(
        netSigned: prev.netSigned + (summary.creditTotal - summary.debitTotal),
        debitTotal: prev.debitTotal + summary.debitTotal,
        creditTotal: prev.creditTotal + summary.creditTotal,
        count: prev.count + 1,
      );
    }

    return map;
  }

  static StatementResult computeStatementRows(
    AccountRecord account,
    List<LedgerEntryRecord> entries, {
    String currency = 'الكل',
    String searchQuery = '',
    String searchMode = 'الكل',
    bool showPreviousBalance = false,
  }) {
    final query = normalizeArabicSearch(searchQuery);

    final relevant = entries.where((entry) {
      if (entry.deleted) return false;
      final belongs = entry.accountId == account.id ||
          entry.counterpartAccountId == account.id;
      if (!belongs) return false;
      if (currency != 'الكل' &&
          currency != 'جميع العملات بدون مصارفة' &&
          currency != 'مصارفة الكل بعملة ريال' &&
          entry.currency != currency) {
        return false;
      }
      if (query.isEmpty) return true;
      return ledgerEntryMatchesQuery(entry, query, searchMode);
    }).toList()
      ..sort((a, b) {
        final cmp = a.createdAtMs.compareTo(b.createdAtMs);
        return cmp != 0 ? cmp : a.entryNumber.compareTo(b.entryNumber);
      });

    double running = showPreviousBalance
        ? (account.openingDirection == 'credit'
            ? account.openingBalance
            : -account.openingBalance)
        : 0;
    double debitTotal = 0;
    double creditTotal = 0;

    final chronological = relevant.map((entry) {
      final isPrimary = entry.accountId == account.id;
      final amount = currency == 'مصارفة الكل بعملة ريال'
          ? entry.amount * (entry.exchangeRate > 0 ? entry.exchangeRate : 1)
          : entry.amount;

      if (affectsAccountBalance(entry)) {
        if (account.isCashAccount && entry.payment == 'cash') {
          creditTotal += amount;
          debitTotal += amount;
        } else if (isPrimary) {
          if (entry.direction == 'credit') {
            creditTotal += amount;
            running += amount;
          } else {
            debitTotal += amount;
            running -= amount;
          }
        } else {
          if (entry.direction == 'credit') {
            debitTotal += amount;
            running -= amount;
          } else {
            creditTotal += amount;
            running += amount;
          }
        }
      }

      return StatementRowWithBalance(
        entry: entry,
        runningBalance: account.isCashAccount ? 0 : running.abs(),
      );
    }).toList();

    final rows = chronological.reversed.toList();
    final netSigned = creditTotal -
        debitTotal +
        (showPreviousBalance
            ? (account.openingDirection == 'credit'
                ? account.openingBalance
                : -account.openingBalance)
            : 0);

    return StatementResult(
      rows: rows,
      debitTotal: debitTotal,
      creditTotal: creditTotal,
      netBalance: netSigned.abs(),
      netDirection: netSigned.abs() < 0.005
          ? 'neutral'
          : (netSigned > 0 ? 'credit' : 'debit'),
    );
  }

  static bool ledgerEntryMatchesQuery(
    LedgerEntryRecord entry,
    String normalizedQuery,
    String mode,
  ) {
    if (normalizedQuery.isEmpty) return true;
    final amountText = entry.amount.toString();
    final fields = <String, String>{
      'الرقم': entry.entryNumber.toString(),
      'البيان': entry.details,
      'رقم المستند': entry.documentNumber,
      'اسم المرسل': entry.counterpartAccountName,
      'اسم المستلم': entry.accountName,
      'اسم الشركة': entry.warehouseName,
      'المبلغ عليه': entry.direction == 'debit' ? amountText : '',
      'المبلغ له': entry.direction == 'credit' ? amountText : '',
    };
    if (mode == 'الكل') {
      final combined = [
        ...fields.values,
        entry.typeLabel,
        entry.entryDate,
      ].join(' ');
      return normalizeArabicSearch(combined).contains(normalizedQuery);
    }
    return normalizeArabicSearch(fields[mode] ?? '').contains(normalizedQuery);
  }

  static bool accountMatchesQuery(AccountRecord account, String query) {
    final needle = normalizeArabicSearch(query);
    if (needle.isEmpty) return true;
    return normalizeArabicSearch(
      '${account.name} ${account.phone} ${account.codeNumber}',
    ).contains(needle);
  }

  static InventorySummaryResult computeInventorySummary(
    List<InventoryItemRecord> items, {
    String? warehouseId,
  }) {
    final filtered = warehouseId == null || warehouseId.isEmpty
        ? items
        : items.where((item) => item.warehouseId == warehouseId).toList();
    double totalQuantity = 0;
    double totalValue = 0;
    for (final item in filtered) {
      totalQuantity += item.quantity;
      totalValue += item.quantity * item.avgCost;
    }
    return InventorySummaryResult(
      items: filtered,
      totalQuantity: totalQuantity,
      totalValue: totalValue,
    );
  }
}
