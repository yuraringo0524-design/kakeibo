export type TransactionType = 'expense' | 'income';
export type Frequency = 'weekly' | 'monthly' | 'yearly';
export type PaymentMethodType = 'cash' | 'bank' | 'credit' | 'emoney';

export interface AppUser {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
}

export interface HouseholdGroup {
  id: string;
  name: string;
  memberIds: string[];
  adminId: string;
  inviteCode: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  type: TransactionType | 'both';
  isDefault?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  icon: string;
  color: string;
  balance: number; // 現金/口座残高、クレジットは今月利用額の目安として利用可能額から逆算
  creditLimit?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  paymentMethodId: string;
  userId: string;
  memo: string;
  receiptImage?: string | null;
  createdAt: string;
}

export interface CategoryBudget {
  categoryId: string;
  amount: number;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  totalBudget: number;
  categoryBudgets: CategoryBudget[];
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  paymentMethodId: string;
  userId: string;
  memo: string;
  frequency: Frequency;
  startDate: string;
  nextDate: string;
  active: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
}

export interface NotificationSettings {
  thresholds: number[]; // e.g. [80, 90, 100]
  pushEnabled: boolean;
}

export type PeriodUnit = 'day' | 'week' | 'month' | 'year';
