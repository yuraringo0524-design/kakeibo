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
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, firebaseEnabled } from '../lib/firebase';
import { defaultCategories, paymentMethods, defaultNotificationSettings } from '../data/dummyData';

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
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  createGroup: (groupName: string) => Promise<void>;
  joinGroup: (inviteCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const palette = ['#FF8C42', '#4FC1E9', '#5AC8E8', '#F4A65E', '#7FD3EE'];
const avatars = ['🧑', '🧑‍🦱', '🙂', '👩', '🧑‍🦰'];

function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `KAKEI-${code}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(firebaseEnabled);
  const [error, setError] = useState<string | null>(null);

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
      clearError: () => setError(null),
      signUp: async (email, password, displayName) => {
        if (!auth || !db) return;
        setError(null);
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(cred.user, { displayName });
          const newProfile: UserProfile = {
            email,
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

          // 招待コードは重複すると別のグループに合流してしまうため、空きが出るまで引き直す
          let inviteCode = genInviteCode();
          for (let i = 0; i < 8; i++) {
            const taken = await getDoc(doc(firestore, 'inviteCodes', inviteCode));
            if (!taken.exists()) break;
            inviteCode = genInviteCode();
          }

          const batch = writeBatch(firestore);
          batch.set(groupRef, {
            name: groupName || 'ふたりの家計',
            adminId: uid,
            inviteCode,
            memberIds: [uid],
            membersById: { [uid]: { name: meName, color: meColor, avatarEmoji: meAvatar } },
          });
          // 招待コード → groupId の逆引き。groups コレクション全体を list 可能にしないための索引。
          batch.set(doc(firestore, 'inviteCodes', inviteCode), { groupId, createdBy: uid });
          batch.set(doc(firestore, 'users', uid), { groupId }, { merge: true });
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
      joinGroup: async (inviteCode) => {
        if (!auth?.currentUser || !db) return;
        const firestore = db;
        setError(null);
        const uid = auth.currentUser.uid;
        const code = inviteCode.trim().toUpperCase();

        // groups を全件 list せず、招待コードの索引 doc だけを引く
        const indexSnap = await getDoc(doc(firestore, 'inviteCodes', code));
        const groupId = indexSnap.exists() ? (indexSnap.data().groupId as string | undefined) : undefined;
        if (!groupId) {
          setError('招待コードが見つかりませんでした。');
          throw new Error('invite-not-found');
        }

        try {
          const meColor = profile?.color ?? palette[1];
          const meAvatar = profile?.avatarEmoji ?? avatars[1];
          const meName = profile?.displayName ?? auth.currentUser.displayName ?? '';

          // 読み込み→書き戻しだと同時参加で片方が消えるため arrayUnion で追加する
          await updateDoc(doc(firestore, 'groups', groupId), {
            memberIds: arrayUnion(uid),
            [`membersById.${uid}`]: { name: meName, color: meColor, avatarEmoji: meAvatar },
          });
          await setDoc(doc(firestore, 'users', uid), { groupId }, { merge: true });
        } catch (e) {
          setError(friendlyError(String((e as { code?: string })?.code ?? '')));
          throw e;
        }
      },
    }),
    [loading, user, profile, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
