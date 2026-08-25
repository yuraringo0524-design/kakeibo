import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  deleteField,
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

function storedDarkMode(): boolean {
  try {
    return localStorage.getItem('kakeibo-dark-mode') === '1';
  } catch {
    return false;
  }
}

const emptyState: AppState = {
  transactions: [],
  categories: [],
  paymentMethods: [],
  budgets: [],
  recurring: [],
  savingsGoals: [],
  notificationSettings: { thresholds: [80, 90, 100], pushEnabled: true },
  users: [],
  group: { id: '', name: '', memberIds: [], adminId: '' },
  darkMode: storedDarkMode(),
  viewMode: 'all',
  outgoingInvitations: [],
};

function withId<T>(id: string, data: unknown): T {
  return { ...(data as object), id } as T;
}

export function CloudAppProvider({ groupId, children }: { groupId: string; children: ReactNode }) {
  const { user, signOutUser, invitePartner } = useAuth();
  const [state, setState] = useState<AppState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state.darkMode]);

  useEffect(() => {
    if (!db || !groupId) {
      // Firebase が無い / groupId が空でも「読み込み中…」で固まらせない
      setLoaded(true);
      return;
    }
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'groups', groupId),
        (snap) => {
          const data = snap.data();
          // グループが消えている場合も loaded にしないと永久ローディングになる
          if (!data) {
            setLoadError('家計グループが見つかりませんでした。パートナーに再度招待してもらってください。');
            setLoaded(true);
            return;
          }
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
          };
          setLoadError(null);
          setState((s) => ({
            ...s,
            users,
            group,
            // 抜けたメンバーで絞り込んだままにしない
            viewMode: s.viewMode !== 'all' && !memberIds.includes(s.viewMode) ? 'all' : s.viewMode,
          }));
          setLoaded(true);
        },
        (err) => {
          console.error(err);
          setLoadError('家計データを読み込めませんでした。通信状態とログイン状態を確認してください。');
          setLoaded(true);
        }
      )
    );

    const col = (name: string) => collection(db!, 'groups', groupId, name);
    const onErr = (err: unknown) => {
      console.error(err);
      setSyncError('同期に失敗しました。通信状態を確認してください。');
    };

    unsubs.push(
      onSnapshot(
        col('transactions'),
        (snap) => {
          const transactions = snap.docs
            .map((d) => withId<Transaction>(d.id, d.data()))
            .sort((a, b) => {
              if (a.date !== b.date) return a.date < b.date ? 1 : -1;
              const ca = a.createdAt ?? '';
              const cb = b.createdAt ?? '';
              if (ca !== cb) return ca < cb ? 1 : -1;
              return 0;
            });
          setState((s) => ({ ...s, transactions }));
        },
        onErr
      )
    );
    unsubs.push(
      onSnapshot(
        col('categories'),
        (snap) => {
          const categories = snap.docs
            .map((d) => withId<Category>(d.id, d.data()))
            .sort((a, b) => a.order - b.order);
          setState((s) => ({ ...s, categories }));
        },
        onErr
      )
    );
    unsubs.push(
      onSnapshot(
        col('paymentMethods'),
        (snap) => {
          setState((s) => ({ ...s, paymentMethods: snap.docs.map((d) => withId<PaymentMethod>(d.id, d.data())) }));
        },
        onErr
      )
    );
    unsubs.push(
      onSnapshot(
        col('budgets'),
        (snap) => {
          setState((s) => ({ ...s, budgets: snap.docs.map((d) => withId<Budget>(d.id, d.data())) }));
        },
        onErr
      )
    );
    unsubs.push(
      onSnapshot(
        col('recurring'),
        (snap) => {
          setState((s) => ({ ...s, recurring: snap.docs.map((d) => withId<RecurringTransaction>(d.id, d.data())) }));
        },
        onErr
      )
    );
    unsubs.push(
      onSnapshot(
        col('savingsGoals'),
        (snap) => {
          setState((s) => ({ ...s, savingsGoals: snap.docs.map((d) => withId<SavingsGoal>(d.id, d.data())) }));
        },
        onErr
      )
    );
    unsubs.push(
      onSnapshot(
        doc(db, 'groups', groupId, 'meta', 'notifications'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<NotificationSettings>;
            setState((s) => ({
              ...s,
              notificationSettings: {
                thresholds: Array.isArray(data.thresholds) ? data.thresholds : s.notificationSettings.thresholds,
                pushEnabled: typeof data.pushEnabled === 'boolean' ? data.pushEnabled : s.notificationSettings.pushEnabled,
              },
            }));
          }
        },
        onErr
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [groupId]);

  const dismissSyncError = useCallback(() => setSyncError(null), []);

  const value = useMemo<AppContextValue>(() => {
    const g = (name: string) => collection(db!, 'groups', groupId, name);
    const d = (name: string, id: string) => doc(db!, 'groups', groupId, name, id);
    /** 書き込みは非同期。失敗を握り潰すと保存できていないことに気づけないので、必ず画面に出す。 */
    const run = (p: Promise<unknown>, what: string) => {
      void p.catch((e) => {
        console.error(e);
        setSyncError(`${what}に失敗しました。通信状態を確認してもう一度お試しください。`);
      });
    };

    return {
      ...state,
      mode: 'cloud',
      currentUserId: user?.uid ?? '',
      syncError: syncError ?? loadError,
      dismissSyncError,
      addTransaction: (t) => run(addDoc(g('transactions'), { ...t, createdAt: new Date().toISOString() }), '明細の追加'),
      updateTransaction: (id, t) => run(updateDoc(d('transactions', id), { ...t }), '明細の更新'),
      deleteTransaction: (id) => run(deleteDoc(d('transactions', id)), '明細の削除'),
      addCategory: (c) => run(addDoc(g('categories'), { ...c, order: state.categories.length }), 'カテゴリの追加'),
      updateCategory: (id, c) => run(updateDoc(d('categories', id), { ...c }), 'カテゴリの更新'),
      // カテゴリ削除時は、各月の予算に残るカテゴリ別予算も同時に片付ける
      deleteCategory: (id) => {
        const batch = writeBatch(db!);
        batch.delete(d('categories', id));
        state.budgets
          .filter((b) => b.categoryBudgets?.some((cb) => cb.categoryId === id))
          .forEach((b) =>
            batch.update(d('budgets', b.id), {
              categoryBudgets: b.categoryBudgets.filter((cb) => cb.categoryId !== id),
            })
          );
        run(batch.commit(), 'カテゴリの削除');
      },
      reorderCategories: (ids) => {
        const batch = writeBatch(db!);
        ids.forEach((id, idx) => batch.update(d('categories', id), { order: idx }));
        run(batch.commit(), 'カテゴリの並び替え');
      },
      addPaymentMethod: (p) => run(addDoc(g('paymentMethods'), p), '支払い方法の追加'),
      updatePaymentMethod: (id, p) => run(updateDoc(d('paymentMethods', id), { ...p }), '支払い方法の更新'),
      deletePaymentMethod: (id) => run(deleteDoc(d('paymentMethods', id)), '支払い方法の削除'),
      setBudget: (month, totalBudget, categoryBudgets) =>
        run(setDoc(d('budgets', month), { month, totalBudget, categoryBudgets }), '予算の保存'),
      addRecurring: (r) => run(addDoc(g('recurring'), r), '定期取引の追加'),
      updateRecurring: (id, r) => run(updateDoc(d('recurring', id), { ...r }), '定期取引の更新'),
      deleteRecurring: (id) => run(deleteDoc(d('recurring', id)), '定期取引の削除'),
      addSavingsGoal: (sg) => run(addDoc(g('savingsGoals'), sg), '貯金目標の追加'),
      updateSavingsGoal: (id, sg) => run(updateDoc(d('savingsGoals', id), { ...sg }), '貯金目標の更新'),
      deleteSavingsGoal: (id) => run(deleteDoc(d('savingsGoals', id)), '貯金目標の削除'),
      updateNotificationSettings: (n) =>
        run(setDoc(doc(db!, 'groups', groupId, 'meta', 'notifications'), n, { merge: true }), '通知設定の保存'),
      toggleDarkMode: () =>
        setState((s) => {
          const next = !s.darkMode;
          try {
            localStorage.setItem('kakeibo-dark-mode', next ? '1' : '0');
          } catch {
            /* 保存できなくても表示は切り替える */
          }
          return { ...s, darkMode: next };
        }),
      setViewMode: (v) => setState((s) => ({ ...s, viewMode: v })),
      addMember: () => {
        /* クラウドモードではメールアドレスでの招待のみサポート（invitePartnerByEmail） */
      },
      invitePartnerByEmail: (email) => invitePartner(groupId, state.group.name, email),
      cancelInvitation: (email) =>
        run(deleteDoc(d('invitations', email.trim().toLowerCase())), '招待の取り消し'),
      removeMember: (userId) =>
        run(
          updateDoc(doc(db!, 'groups', groupId), {
            memberIds: arrayRemove(userId),
            [`membersById.${userId}`]: deleteField(),
          }),
          'メンバーの削除'
        ),
      updateUserName: (userId, name) =>
        run(updateDoc(doc(db!, 'groups', groupId), { [`membersById.${userId}.name`]: name }), '表示名の保存'),
      clearTransactions: () => {
        run(
          (async () => {
            const snap = await getDocs(g('transactions'));
            // writeBatch は 1 回あたり 500 件まで。件数が多い家計簿では分割が必須。
            for (let i = 0; i < snap.docs.length; i += 450) {
              const batch = writeBatch(db!);
              snap.docs.slice(i, i + 450).forEach((docSnap) => batch.delete(docSnap.ref));
              await batch.commit();
            }
          })(),
          '明細の一括削除'
        );
      },
      deleteAllData: () => {
        /* クラウドは共有データのため、この画面からの一括削除は提供しない */
      },
      resetDummyData: () => {
        /* クラウドモードには「お試しダミーデータ」の概念がないため何もしない */
      },
      signOutUser,
    };
  }, [state, groupId, user, signOutUser, syncError, loadError, dismissSyncError, invitePartner]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text-muted)] text-sm">
        読み込み中…
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
