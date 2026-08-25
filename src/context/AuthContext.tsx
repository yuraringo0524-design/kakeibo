import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, firebaseEnabled } from '../lib/firebase';
import { defaultCategories, paymentMethods, defaultNotificationSettings } from '../data/dummyData';
import type { PendingInvitation } from '../types';

interface UserProfile {
  email: string;
  displayName: string;
  groupId: string | null;
  color: string;
  avatarEmoji: string;
}

interface AuthContextValue {
  enabled: boolean;
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  error: string | null;
  clearError: () => void;
  /** 自分のメールアドレス宛に届いている、まだ承認していない招待。 */
  pendingInvitations: PendingInvitation[];
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  createGroup: (groupName: string) => Promise<void>;
  /** 管理者が、パートナーのメールアドレス宛に招待を送る。 */
  invitePartner: (groupId: string, groupName: string, email: string) => Promise<void>;
  /** 招待を承認してグループに参加する。 */
  acceptInvitation: (invitation: PendingInvitation) => Promise<void>;
  /** 招待を辞退する（届いた側）。 */
  declineInvitation: (invitation: PendingInvitation) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const palette = ['#FF8C42', '#4FC1E9', '#5AC8E8', '#F4A65E', '#7FD3EE'];
const avatars = ['🧑', '🧑‍🦱', '🙂', '👩', '🧑‍🦰'];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(firebaseEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseEnabled || !db || !user) {
      setProfile(null);
      return;
    }
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
          return;
        }
        // プロフィール doc が無いと Gate が「読み込み中…」から進めなくなる。
        // サインアップが途中で落ちた場合などに備え、その場で作り直す。
        const recovered: UserProfile = {
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          groupId: null,
          color: palette[Math.floor(Math.random() * palette.length)],
          avatarEmoji: avatars[Math.floor(Math.random() * avatars.length)],
        };
        setProfile(recovered);
        void setDoc(ref, recovered, { merge: true }).catch((e) => console.error(e));
      },
      (e) => {
        console.error(e);
        setError('プロフィールを読み込めませんでした。通信状態を確認してください。');
      }
    );
    return unsub;
  }, [user]);

  // 自分のメールアドレス宛の招待をグループ横断で監視する。
  // Firestore ルール側で resource.data.invitedEmail == 自分のメールアドレス のときだけ
  // list を許可しているため、他人宛の招待は取得できない。
  useEffect(() => {
    if (!firebaseEnabled || !db || !user?.email) {
      setPendingInvitations([]);
      return;
    }
    const firestore = db;
    const email = normalizeEmail(user.email);
    const q = query(collectionGroup(firestore, 'invitations'), where('invitedEmail', '==', email));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: PendingInvitation[] = snap.docs.map((d) => {
          const data = d.data() as { groupId: string; groupName: string; invitedEmail: string };
          return {
            id: d.ref.path,
            groupId: data.groupId,
            groupName: data.groupName || 'ふたりの家計',
            invitedEmail: data.invitedEmail,
          };
        });
        setPendingInvitations(list);
      },
      (e) => {
        console.error(e);
        // 招待の取得に失敗してもオンボーディング自体は続けられるようにする
      }
    );
    return unsub;
  }, [user]);

  function friendlyError(code: string): string {
    if (code.includes('email-already-in-use')) return 'このメールアドレスは既に登録されています。';
    if (code.includes('invalid-email')) return 'メールアドレスの形式が正しくありません。';
    if (code.includes('weak-password')) return 'パスワードは6文字以上で入力してください。';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential'))
      return 'メールアドレスまたはパスワードが正しくありません。';
    if (code.includes('permission-denied')) return '権限がありません。ログインし直してからお試しください。';
    return '通信エラーが発生しました。しばらくしてから再度お試しください。';
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled: firebaseEnabled,
      loading,
      user,
      profile,
      error,
      pendingInvitations,
      clearError: () => setError(null),
      signUp: async (email, password, displayName) => {
        if (!auth || !db) return;
        setError(null);
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(cred.user, { displayName });
          const newProfile: UserProfile = {
            email: normalizeEmail(email),
            displayName,
            groupId: null,
            color: palette[Math.floor(Math.random() * palette.length)],
            avatarEmoji: avatars[Math.floor(Math.random() * avatars.length)],
          };
          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
        } catch (e) {
          setError(friendlyError(String((e as { code?: string })?.code ?? '')));
          throw e;
        }
      },
      signIn: async (email, password) => {
        if (!auth) return;
        setError(null);
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
          setError(friendlyError(String((e as { code?: string })?.code ?? '')));
          throw e;
        }
      },
      signOutUser: async () => {
        if (!auth) return;
        setProfile(null);
        await signOut(auth);
      },
      createGroup: async (groupName) => {
        if (!auth?.currentUser || !db) return;
        const firestore = db;
        setError(null);
        try {
          const uid = auth.currentUser.uid;
          const groupRef = doc(collection(firestore, 'groups'));
          const groupId = groupRef.id;
          const meColor = profile?.color ?? palette[0];
          const meAvatar = profile?.avatarEmoji ?? avatars[0];
          const meName = profile?.displayName ?? auth.currentUser.displayName ?? '';

          const batch = writeBatch(firestore);
          batch.set(groupRef, {
            name: groupName || 'ふたりの家計',
            adminId: uid,
            memberIds: [uid],
            membersById: { [uid]: { name: meName, color: meColor, avatarEmoji: meAvatar } },
          });
          defaultCategories.forEach((c) => {
            const { id, ...rest } = c;
            batch.set(doc(firestore, 'groups', groupId, 'categories', id), rest);
          });
          paymentMethods.forEach((p) => {
            const { id, ...rest } = p;
            batch.set(doc(firestore, 'groups', groupId, 'paymentMethods', id), { ...rest, balance: 0 });
          });
          batch.set(doc(firestore, 'groups', groupId, 'meta', 'notifications'), defaultNotificationSettings);
          await batch.commit();
        } catch (e) {
          setError(friendlyError(String((e as { code?: string })?.code ?? '')));
          throw e;
        }
      },
      invitePartner: async (groupId, groupName, email) => {
        if (!auth?.currentUser || !db) return;
        setError(null);
        const normalized = normalizeEmail(email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
          setError('メールアドレスの形式が正しくありません。');
          throw new Error('invalid-email');
        }
        if (normalized === normalizeEmail(auth.currentUser.email ?? '')) {
          setError('自分自身のメールアドレスは招待できません。');
          throw new Error('self-invite');
        }
        try {
          // ドキュメントIDをメールアドレス（小文字化）にすることで、
          // 参加時に Firestore ルールから「自分宛の招待が存在するか」を
          // get() 1回で判定できるようにする。
          await setDoc(doc(db, 'groups', groupId, 'invitations', normalized), {
            invitedEmail: normalized,
            invitedBy: auth.currentUser.uid,
            groupName: groupName || 'ふたりの家計',
          });
        } catch (e) {
          setError(friendlyError(String((e as { code?: string })?.code ?? '')));
          throw e;
        }
      },
      acceptInvitation: async (invitation) => {
        if (!auth?.currentUser || !db) return;
        const firestore = db;
        setError(null);
        try {
          const uid = auth.currentUser.uid;
          const meColor = profile?.color ?? palette[1];
          const meAvatar = profile?.avatarEmoji ?? avatars[1];
          const meName = profile?.displayName ?? auth.currentUser.displayName ?? '';

          // 読み込み→書き戻しだと同時参加で片方が消えるため arrayUnion で追加する
          await updateDoc(doc(firestore, 'groups', invitation.groupId), {
            memberIds: arrayUnion(uid),
            [`membersById.${uid}`]: { name: meName, color: meColor, avatarEmoji: meAvatar },
          });
          await setDoc(doc(firestore, 'users', uid), { groupId: invitation.groupId }, { merge: true });
          // 使い終わった招待は消しておく（招待した側の一覧からも消える）
          await deleteDoc(doc(firestore, invitation.id)).catch(() => {});
        } catch (e) {
          setError(friendlyError(String((e as { code?: string })?.code ?? '')));
          throw e;
        }
      },
      declineInvitation: async (invitation) => {
        if (!db) return;
        await deleteDoc(doc(db, invitation.id)).catch((e) => console.error(e));
      },
    }),
    [loading, user, profile, error, pendingInvitations]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
