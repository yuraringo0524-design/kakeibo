import type { PaymentMethod, Transaction } from '../types';
import { getPeriodRange, filterByRange } from './period';

function netFor(paymentMethodId: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.paymentMethodId === paymentMethodId)
    .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
}

/** 現金・口座・電子マネーの現在残高＝登録時の初期残高 ± 明細の増減。 */
export function currentBalance(pm: PaymentMethod, transactions: Transaction[]): number {
  const base = Number.isFinite(pm.balance) ? pm.balance : 0;
  return base + netFor(pm.id, transactions);
}

/** クレジットカードの「今月の利用額」＝当月にこのカードで発生した支出−返金。明細から算出する。 */
export function creditUsageThisMonth(
  pm: PaymentMethod,
  transactions: Transaction[],
  now: Date = new Date()
): number {
  const monthTx = filterByRange(transactions, getPeriodRange('month', now, 0));
  return Math.max(0, -netFor(pm.id, monthTx));
}
