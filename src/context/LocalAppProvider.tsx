import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppUser } from '../types';
import * as dummy from '../data/dummyData';
import { AppContext, type AppContextValue, type AppState } from './appContextCore';

const STORAGE_KEY = 'kakeibo-app-state-v1';

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    transactions: [],
    categories: dummy.defaultCategories,
    paymentMethods: dummy.paymentMethods,
    budgets: dummy.budgets,
    recurring: dummy.recurringTransactions,
    savingsGoals: dummy.savingsGoals,
    notificationSettings: dummy.defaultNotificationSettings,
    users: dummy.users,
    group: dummy.group,
    darkMode: false,
    viewMode: 'all',
  };
}

let idSeq = 1000;
function genId(prefix: string) {
  idSeq += 1;
  return `${prefix}${Date.now().toString(36)}${idSeq}`;
}

export function LocalAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state.darkMode]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      mode: 'local',
      currentUserId: dummy.currentUserId,
      addTransaction: (t) =>
        setState((s) => ({
          ...s,
          transactions: [
            { ...t, id: genId('t'), createdAt: new Date().toISOString() },
            ...s.transactions,
          ],
        })),
      updateTransaction: (id, t) =>
        setState((s) => ({
          ...s,
          transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...t } : x)),
        })),
      deleteTransaction: (id) =>
        setState((s) => ({ ...s, transactions: s.transactions.filter((x) => x.id !== id) })),
      addCategory: (c) =>
        setState((s) => ({
          ...s,
          categories: [...s.categories, { ...c, id: genId('c'), order: s.categories.length }],
        })),
      updateCategory: (id, c) =>
        setState((s) => ({
          ...s,
          categories: s.categories.map((x) => (x.id === id ? { ...x, ...c } : x)),
        })),
      deleteCategory: (id) =>
        setState((s) => ({ ...s, categories: s.categories.filter((x) => x.id !== id) })),
      reorderCategories: (ids) =>
        setState((s) => ({
          ...s,
          categories: ids
            .map((id, idx) => {
              const cat = s.categories.find((c) => c.id === id)!;
              return { ...cat, order: idx };
            })
            .concat(s.categories.filter((c) => !ids.includes(c.id))),
        })),
      addPaymentMethod: (p) =>
        setState((s) => ({
          ...s,
          paymentMethods: [...s.paymentMethods, { ...p, id: genId('p') }],
        })),
      updatePaymentMethod: (id, p) =>
        setState((s) => ({
          ...s,
          paymentMethods: s.paymentMethods.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),
      deletePaymentMethod: (id) =>
        setState((s) => ({ ...s, paymentMethods: s.paymentMethods.filter((x) => x.id !== id) })),
      setBudget: (month, totalBudget, categoryBudgets) =>
        setState((s) => {
          const exists = s.budgets.find((b) => b.month === month);
          if (exists) {
            return {
              ...s,
              budgets: s.budgets.map((b) =>
                b.month === month ? { ...b, totalBudget, categoryBudgets } : b
              ),
            };
          }
          return {
            ...s,
            budgets: [...s.budgets, { id: genId('b'), month, totalBudget, categoryBudgets }],
          };
        }),
      addRecurring: (r) =>
        setState((s) => ({ ...s, recurring: [...s.recurring, { ...r, id: genId('r') }] })),
      updateRecurring: (id, r) =>
        setState((s) => ({
          ...s,
          recurring: s.recurring.map((x) => (x.id === id ? { ...x, ...r } : x)),
        })),
      deleteRecurring: (id) =>
        setState((s) => ({ ...s, recurring: s.recurring.filter((x) => x.id !== id) })),
      addSavingsGoal: (g) =>
        setState((s) => ({ ...s, savingsGoals: [...s.savingsGoals, { ...g, id: genId('s') }] })),
      updateSavingsGoal: (id, g) =>
        setState((s) => ({
          ...s,
          savingsGoals: s.savingsGoals.map((x) => (x.id === id ? { ...x, ...g } : x)),
        })),
      deleteSavingsGoal: (id) =>
        setState((s) => ({ ...s, savingsGoals: s.savingsGoals.filter((x) => x.id !== id) })),
      updateNotificationSettings: (n) =>
        setState((s) => ({ ...s, notificationSettings: { ...s.notificationSettings, ...n } })),
      toggleDarkMode: () => setState((s) => ({ ...s, darkMode: !s.darkMode })),
      setViewMode: (v) => setState((s) => ({ ...s, viewMode: v })),
      addMember: (name) =>
        setState((s) => {
          const newUser: AppUser = {
            id: genId('u'),
            name,
            color: '#7FD3EE',
            avatarEmoji: '🙂',
          };
          return {
            ...s,
            users: [...s.users, newUser],
            group: { ...s.group, memberIds: [...s.group.memberIds, newUser.id] },
          };
        }),
      removeMember: (userId) =>
        setState((s) => ({
          ...s,
          group: { ...s.group, memberIds: s.group.memberIds.filter((id) => id !== userId) },
        })),
      updateUserName: (userId, name) =>
        setState((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === userId ? { ...u, name } : u)),
        })),
      clearTransactions: () => setState((s) => ({ ...s, transactions: [] })),
      resetDummyData: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(loadInitial());
      },
      signOutUser: async () => {
        /* ローカルモードにはログアウトの概念がない */
      },
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
