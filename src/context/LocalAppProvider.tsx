import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppUser } from '../types';
import * as dummy from '../data/dummyData';
import { AppContext, type AppContextValue, type AppState } from './appContextCore';

const STORAGE_KEY = 'kakeibo-app-state-v1';

function freshState(withDummyTransactions = false): AppState {
  return {
    transactions: withDummyTransactions ? dummy.transactions : [],
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
    outgoingInvitations: [],
  };
}

/**
 * localStorage の内容はアプリのバージョン差で欠けうる。欠損フィールドを既定値で埋め、
 * 配列であるべき所が配列でなければ捨てる。ここを素通しすると各画面が undefined 参照で落ちる。
 */
function normalize(raw: unknown): AppState {
  const base = freshState();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<AppState>;
  const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);

  return {
    transactions: arr(s.transactions, base.transactions),
    categories: arr(s.categories, base.categories),
    paymentMethods: arr(s.paymentMethods, base.paymentMethods),
    budgets: arr(s.budgets, base.budgets),
    recurring: arr(s.recurring, base.recurring),
    savingsGoals: arr(s.savingsGoals, base.savingsGoals),
    notificationSettings: {
      ...base.notificationSettings,
      ...(s.notificationSettings && typeof s.notificationSettings === 'object' ? s.notificationSettings : {}),
      thresholds: arr(s.notificationSettings?.thresholds, base.notificationSettings.thresholds),
    },
    users: arr(s.users, base.users),
    group: { ...base.group, ...(s.group && typeof s.group === 'object' ? s.group : {}) },
    darkMode: typeof s.darkMode === 'boolean' ? s.darkMode : base.darkMode,
    viewMode: typeof s.viewMode === 'string' ? s.viewMode : base.viewMode,
    outgoingInvitations: [],
  };
}

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* 壊れた JSON は初期状態にフォールバックする */
  }
  return freshState();
}

let idSeq = 1000;
function genId(prefix: string) {
  idSeq += 1;
  return `${prefix}${Date.now().toString(36)}${idSeq}`;
}

export function LocalAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadInitial);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 容量超過（レシート画像の入れすぎなど）を黙って捨てない
      setSyncError('端末の保存領域がいっぱいで保存できませんでした。レシート画像を減らすか、古い明細を整理してください。');
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state.darkMode]);

  const dismissSyncError = useCallback(() => setSyncError(null), []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      mode: 'local',
      currentUserId: dummy.currentUserId,
      syncError,
      dismissSyncError,
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
      // カテゴリを消したら、予算に残ったカテゴリ別予算も一緒に片付ける（明細は「未分類」表示にフォールバック）
      deleteCategory: (id) =>
        setState((s) => ({
          ...s,
          categories: s.categories.filter((x) => x.id !== id),
          budgets: s.budgets.map((b) => ({
            ...b,
            categoryBudgets: b.categoryBudgets.filter((cb) => cb.categoryId !== id),
          })),
        })),
      reorderCategories: (ids) =>
        setState((s) => ({
          ...s,
          categories: ids
            .map((id, idx) => {
              const cat = s.categories.find((c) => c.id === id);
              return cat ? { ...cat, order: idx } : null;
            })
            .filter((c): c is NonNullable<typeof c> => c !== null)
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
      // ローカルモードには実際のメール送信・承認フローが無いため、
      // 入力されたメールアドレスからその場でメンバーを追加する疑似デモとして扱う
      invitePartnerByEmail: async (email) => {
        setState((s) => {
          const newUser: AppUser = {
            id: genId('u'),
            name: `招待メンバー(${email.split('@')[0].slice(0, 10)})`,
            color: '#7FD3EE',
            avatarEmoji: '🙂',
          };
          return {
            ...s,
            users: [...s.users, newUser],
            group: { ...s.group, memberIds: [...s.group.memberIds, newUser.id] },
          };
        });
      },
      cancelInvitation: () => {
        /* ローカルモードでは送信済み招待の概念が無い */
      },
      // memberIds だけ消すと users に幽霊が残り、ホームの絞り込みタブに出続ける
      removeMember: (userId) =>
        setState((s) => ({
          ...s,
          users: s.users.filter((u) => u.id !== userId),
          group: { ...s.group, memberIds: s.group.memberIds.filter((id) => id !== userId) },
          viewMode: s.viewMode === userId ? 'all' : s.viewMode,
        })),
      updateUserName: (userId, name) =>
        setState((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === userId ? { ...u, name } : u)),
        })),
      clearTransactions: () => setState((s) => ({ ...s, transactions: [] })),
      // localStorage.clear() は同じオリジン（GitHub Pages）の他アプリのデータまで消してしまう。
      // このアプリのキーだけを消し、ダミー値が復活しない「空の家計」を明示的に書き込む。
      deleteAllData: () => {
        try {
          Object.keys(localStorage)
            .filter((k) => k.startsWith('kakeibo-'))
            .forEach((k) => localStorage.removeItem(k));
        } catch {
          /* 消せなくても state は差し替える */
        }
        setState({
          ...freshState(),
          transactions: [],
          budgets: [],
          recurring: [],
          savingsGoals: [],
          paymentMethods: dummy.paymentMethods.map((p) => ({ ...p, balance: 0, creditLimit: 0 })),
          viewMode: 'all',
        });
      },
      // 「ダミーデータにリセット」は明細まで含めて戻す（従来は明細が空のままで説明文と食い違っていた）
      resetDummyData: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* 削除できなくても state は差し替える */
        }
        setState(freshState(true));
      },
      signOutUser: async () => {
        /* ローカルモードにはログアウトの概念がない */
      },
    }),
    [state, syncError, dismissSyncError]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
