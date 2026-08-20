import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { AppContext, type AppContextValue, type AppState } from './appContextCore';
import type {
  AppUser,
  Budget,
  Category,
  HouseholdGroup,
  NotificationSettings,
  PaymentMethod,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
} from '../types';

const emptyState: AppState = {
  transactions: [],
  categories: [],
  paymentMethods: [],
  budgets: [],
  recurring: [],
  savingsGoals: [],
  notificationSettings: { thresholds: [80, 90, 100], pushEnabled: true },
  users: [],
  group: { id: '', name: '', memberIds: [], adminId: '', inviteCode: '' },
  darkMode: localStorage.getItem('kakeibo-dark-mode') === '1',
  viewMode: 'all',
};

function withId<T>(id: string, data: any): T {
  return { ...data, id } as T;
}

export function CloudAppProvider({ groupId, children }: { groupId: string; children: ReactNode }) {
  const { user, signOutUser } = useAuth();
  const [state, setState] = useState<AppState>(emptyState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state.darkMode]);

  useEffect(() => {
    if (!db || !groupId) return;
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(doc(db, 'groups', groupId), (snap) => {
        const data = snap.data();
        if (!data) return;
        const membersById = (data.membersById ?? {}) as Record<
          string,
          { name: string; color: string; avatarEmoji: string }
        >;
        const memberIds: string[] = data.memberIds ?? [];
        const users: AppUser[] = memberIds.map((id) => ({
          id,
          name: membersById[id]?.name ?? '',
          color: membersById[id]?.color ?? '#7FD3EE',
          avatarEmoji: membersById[id]?.avatarEmoji ?? '🙂',
        }));
        const group: HouseholdGroup = {
          id: groupId,
          name: data.name ?? 'ふたりの家計',
          memberIds,
          adminId: data.adminId ?? '',
          inviteCode: data.inviteCode ?? '',
        };
        setState((s) => ({ ...s, users, group }));
        setLoaded(true);
      })
    );

    const col = (name: string) => collection(db!, 'groups', groupId, name);

    unsubs.push(
      onSnapshot(col('transactions'), (snap) => {
        const transactions = snap.docs
          .map((d) => withId<Transaction>(d.id, d.data()))
          .sort((a, b) => (a.date < b.date ? 1 : -1));
        setState((s) => ({ ...s, transactions }));
      })
    );
    unsubs.push(
      onSnapshot(col('categories'), (snap) => {
        const categories = snap.docs
          .map((d) => withId<Category>(d.id, d.data()))
          .sort((a, b) => a.order - b.order);
        setState((s) => ({ ...s, categories }));
      })
    );
    unsubs.push(
      onSnapshot(col('paymentMethods'), (snap) => {
        setState((s) => ({ ...s, paymentMethods: snap.docs.map((d) => withId<PaymentMethod>(d.id, d.data())) }));
      })
    );
    unsubs.push(
      onSnapshot(col('budgets'), (snap) => {
        setState((s) => ({ ...s, budgets: snap.docs.map((d) => withId<Budget>(d.id, d.data())) }));
      })
    );
    unsubs.push(
      onSnapshot(col('recurring'), (snap) => {
        setState((s) => ({ ...s, recurring: snap.docs.map((d) => withId<RecurringTransaction>(d.id, d.data())) }));
      })
    );
    unsubs.push(
      onSnapshot(col('savingsGoals'), (snap) => {
        setState((s) => ({ ...s, savingsGoals: snap.docs.map((d) => withId<SavingsGoal>(d.id, d.data())) }));
      })
    );
    unsubs.push(
      onSnapshot(doc(db, 'groups', groupId, 'meta', 'notifications'), (snap) => {
        if (snap.exists()) {
          setState((s) => ({ ...s, notificationSettings: snap.data() as NotificationSettings }));
        }
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [groupId]);

  const value = useMemo<AppContextValue>(() => {
    const g = (name: string) => collection(db!, 'groups', groupId, name);
    return {
      ...state,
      mode: 'cloud',
      currentUserId: user?.uid ?? '',
      addTransaction: (t) => void addDoc(g('transactions'), { ...t, createdAt: new Date().toISOString() }),
      updateTransaction: (id, t) => void updateDoc(doc(db!, 'groups', groupId, 'transactions', id), t as any),
      deleteTransaction: (id) => void deleteDoc(doc(db!, 'groups', groupId, 'transactions', id)),
      addCategory: (c) =>
        void addDoc(g('categories'), { ...c, order: state.categories.length }),
      updateCategory: (id, c) => void updateDoc(doc(db!, 'groups', groupId, 'categories', id), c as any),
      deleteCategory: (id) => void deleteDoc(doc(db!, 'groups', groupId, 'categories', id)),
      reorderCategories: (ids) => {
        const batch = writeBatch(db!);
        ids.forEach((id, idx) => batch.update(doc(db!, 'groups', groupId, 'categories', id), { order: idx }));
        void batch.commit();
      },
      addPaymentMethod: (p) => void addDoc(g('paymentMethods'), p),
      updatePaymentMethod: (id, p) => void updateDoc(doc(db!, 'groups', groupId, 'paymentMethods', id), p as any),
      deletePaymentMethod: (id) => void deleteDoc(doc(db!, 'groups', groupId, 'paymentMethods', id)),
      setBudget: (month, totalBudget, categoryBudgets) =>
        void setDoc(doc(db!, 'groups', groupId, 'budgets', month), { month, totalBudget, categoryBudgets }),
      addRecurring: (r) => void addDoc(g('recurring'), r),
      updateRecurring: (id, r) => void updateDoc(doc(db!, 'groups', groupId, 'recurring', id), r as any),
      deleteRecurring: (id) => void deleteDoc(doc(db!, 'groups', groupId, 'recurring', id)),
      addSavingsGoal: (sg) => void addDoc(g('savingsGoals'), sg),
      updateSavingsGoal: (id, sg) => void updateDoc(doc(db!, 'groups', groupId, 'savingsGoals', id), sg as any),
      deleteSavingsGoal: (id) => void deleteDoc(doc(db!, 'groups', groupId, 'savingsGoals', id)),
      updateNotificationSettings: (n) =>
        void setDoc(doc(db!, 'groups', groupId, 'meta', 'notifications'), n, { merge: true }),
      toggleDarkMode: () =>
        setState((s) => {
          const next = !s.darkMode;
          localStorage.setItem('kakeibo-dark-mode', next ? '1' : '0');
          return { ...s, darkMode: next };
        }),
      setViewMode: (v) => setState((s) => ({ ...s, viewMode: v })),
      addMember: () => {
        /* クラウドモードでは招待コードでの参加のみサポート（Sharedページ側で案内） */
      },
      removeMember: (userId) => void updateDoc(doc(db!, 'groups', groupId), { memberIds: arrayRemove(userId) }),
      updateUserName: (userId, name) =>
        void updateDoc(doc(db!, 'groups', groupId), { [`membersById.${userId}.name`]: name }),
      clearTransactions: async () => {
        const snap = await getDocs(g('transactions'));
        const batch = writeBatch(db!);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      },
      resetDummyData: () => {
        /* クラウドモードには「お試しダミーデータ」の概念がないため何もしない */
      },
      signOutUser,
    };
  }, [state, groupId, user, signOutUser]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text-muted)] text-sm">
        読み込み中…
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
