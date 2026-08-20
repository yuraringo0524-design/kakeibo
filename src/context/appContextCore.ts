import { createContext, useContext } from 'react';
import type {
  Transaction,
  Category,
  PaymentMethod,
  Budget,
  RecurringTransaction,
  SavingsGoal,
  NotificationSettings,
  AppUser,
  HouseholdGroup,
} from '../types';

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  savingsGoals: SavingsGoal[];
  notificationSettings: NotificationSettings;
  users: AppUser[];
  group: HouseholdGroup;
  darkMode: boolean;
  viewMode: 'all' | string; // 'all' or userId
}

export interface AppContextValue extends AppState {
  /** 'local' = この端末だけに保存（お試しモード）。'cloud' = Firebaseでパートナーとリアルタイム共有。 */
  mode: 'local' | 'cloud';
  currentUserId: string;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, 'id' | 'order'>) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (ids: string[]) => void;
  addPaymentMethod: (p: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (id: string, p: Partial<PaymentMethod>) => void;
  deletePaymentMethod: (id: string) => void;
  setBudget: (month: string, totalBudget: number, categoryBudgets: Budget['categoryBudgets']) => void;
  addRecurring: (r: Omit<RecurringTransaction, 'id'>) => void;
  updateRecurring: (id: string, r: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  addSavingsGoal: (g: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (id: string, g: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  updateNotificationSettings: (n: Partial<NotificationSettings>) => void;
  toggleDarkMode: () => void;
  setViewMode: (v: string) => void;
  addMember: (name: string) => void;
  removeMember: (userId: string) => void;
  updateUserName: (userId: string, name: string) => void;
  clearTransactions: () => void;
  resetDummyData: () => void;
  /** ログアウト（クラウドモードのみ有効） */
  signOutUser: () => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
