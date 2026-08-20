import type {
  AppUser,
  HouseholdGroup,
  Category,
  PaymentMethod,
  Transaction,
  Budget,
  RecurringTransaction,
  SavingsGoal,
  NotificationSettings,
} from '../types';

export const users: AppUser[] = [
  { id: 'u1', name: 'あなた', color: '#FF8C42', avatarEmoji: '🧑' },
  { id: 'u2', name: 'かずま', color: '#4FC1E9', avatarEmoji: '🧑‍🦱' },
];

export const currentUserId = 'u1';

export const group: HouseholdGroup = {
  id: 'g1',
  name: 'ふたりの家計',
  memberIds: ['u1', 'u2'],
  adminId: 'u1',
  inviteCode: 'KAKEI-7X2P',
};

export const defaultCategories: Category[] = [
  { id: 'c1', name: '食費', icon: '🍚', color: '#FF8C42', order: 0, type: 'expense', isDefault: true },
  { id: 'c2', name: '日用品', icon: '🧴', color: '#F4A65E', order: 1, type: 'expense', isDefault: true },
  { id: 'c3', name: '家賃', icon: '🏠', color: '#E8672A', order: 2, type: 'expense', isDefault: true },
  { id: 'c4', name: '光熱費', icon: '💡', color: '#FFB067', order: 3, type: 'expense', isDefault: true },
  { id: 'c5', name: '通信費', icon: '📱', color: '#4FC1E9', order: 4, type: 'expense', isDefault: true },
  { id: 'c6', name: '交通費', icon: '🚃', color: '#7FD3EE', order: 5, type: 'expense', isDefault: true },
  { id: 'c7', name: '医療費', icon: '🏥', color: '#57B8D6', order: 6, type: 'expense', isDefault: true },
  { id: 'c8', name: '交際費', icon: '🍻', color: '#FFA45C', order: 7, type: 'expense', isDefault: true },
  { id: 'c9', name: '趣味', icon: '🎮', color: '#6FCBE0', order: 8, type: 'expense', isDefault: true },
  { id: 'c10', name: '教育', icon: '📚', color: '#3AA6C4', order: 9, type: 'expense', isDefault: true },
  { id: 'c11', name: '保険', icon: '🛡️', color: '#F08A4B', order: 10, type: 'expense', isDefault: true },
  { id: 'c12', name: '貯金', icon: '🐷', color: '#5AC8E8', order: 11, type: 'expense', isDefault: true },
  { id: 'c13', name: 'その他', icon: '📦', color: '#B7ADA3', order: 12, type: 'expense', isDefault: true },
  { id: 'ci1', name: '給与', icon: '💰', color: '#4FC1E9', order: 13, type: 'income', isDefault: true },
  { id: 'ci2', name: '副業', icon: '💻', color: '#7FD3EE', order: 14, type: 'income', isDefault: true },
  { id: 'ci3', name: '臨時収入', icon: '🎁', color: '#5AC8E8', order: 15, type: 'income', isDefault: true },
];

export const paymentMethods: PaymentMethod[] = [
  { id: 'p1', name: '現金', type: 'cash', icon: '💵', color: '#8A7B6C', balance: 32500 },
  { id: 'p2', name: '銀行口座', type: 'bank', icon: '🏦', color: '#4FC1E9', balance: 842300 },
  { id: 'p3', name: 'クレジットカード', type: 'credit', icon: '💳', color: '#FF8C42', balance: -68400, creditLimit: 500000 },
  { id: 'p4', name: '電子マネー', type: 'emoney', icon: '📲', color: '#5AC8E8', balance: 15200 },
];

// --- generate transactions for the last few months (deterministic pseudo-random) ---
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

const expenseCategoryWeights: { id: string; min: number; max: number; weight: number; memo: string[] }[] = [
  { id: 'c1', min: 400, max: 3200, weight: 10, memo: ['スーパー', 'コンビニ', '外食', 'カフェ', '弁当'] },
  { id: 'c2', min: 300, max: 4500, weight: 4, memo: ['ドラッグストア', '洗剤', 'ティッシュ'] },
  { id: 'c3', min: 78000, max: 78000, weight: 0.3, memo: ['家賃'] },
  { id: 'c4', min: 4000, max: 13000, weight: 0.4, memo: ['電気代', 'ガス代', '水道代'] },
  { id: 'c5', min: 3800, max: 9800, weight: 0.4, memo: ['携帯代', 'Wi-Fi'] },
  { id: 'c6', min: 200, max: 2500, weight: 3, memo: ['電車', 'バス', 'タクシー'] },
  { id: 'c7', min: 800, max: 8000, weight: 1, memo: ['病院', '薬局'] },
  { id: 'c8', min: 1000, max: 12000, weight: 2, memo: ['飲み会', 'プレゼント'] },
  { id: 'c9', min: 500, max: 15000, weight: 2, memo: ['映画', 'ゲーム', '本'] },
  { id: 'c10', min: 2000, max: 20000, weight: 0.3, memo: ['書籍', '講座'] },
  { id: 'c11', min: 3500, max: 12000, weight: 0.3, memo: ['生命保険', '医療保険'] },
  { id: 'c13', min: 300, max: 5000, weight: 1.5, memo: ['雑費'] },
];

function weightedPick() {
  const total = expenseCategoryWeights.reduce((s, c) => s + c.weight, 0);
  let r = rand() * total;
  for (const c of expenseCategoryWeights) {
    if (r < c.weight) return c;
    r -= c.weight;
  }
  return expenseCategoryWeights[0];
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function generateTransactions(): Transaction[] {
  const txs: Transaction[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3);
  start.setDate(1);
  const totalDays = daysBetween(start, today);
  let idCounter = 1;

  // recurring-like fixed monthly expenses (rent, utilities, subscriptions) per month
  for (let m = 0; m <= 3; m++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + m);
    if (d > today) break;
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const cap = monthEnd > today ? today : monthEnd;
    if (monthStart > cap) continue;

    txs.push({
      id: `t${idCounter++}`,
      type: 'expense',
      amount: 78000,
      date: toISODate(new Date(d.getFullYear(), d.getMonth(), 27 > cap.getDate() ? cap.getDate() : 27)),
      categoryId: 'c3',
      paymentMethodId: 'p2',
      userId: 'u1',
      memo: '家賃',
      createdAt: new Date().toISOString(),
    });
    txs.push({
      id: `t${idCounter++}`,
      type: 'expense',
      amount: randInt(6500, 11500),
      date: toISODate(new Date(d.getFullYear(), d.getMonth(), Math.min(15, cap.getDate()))),
      categoryId: 'c4',
      paymentMethodId: 'p3',
      userId: 'u2',
      memo: '電気代・ガス代・水道代',
      createdAt: new Date().toISOString(),
    });
    txs.push({
      id: `t${idCounter++}`,
      type: 'expense',
      amount: 6480,
      date: toISODate(new Date(d.getFullYear(), d.getMonth(), Math.min(10, cap.getDate()))),
      categoryId: 'c5',
      paymentMethodId: 'p3',
      userId: 'u1',
      memo: 'モバイル通信費',
      createdAt: new Date().toISOString(),
    });
    // income: salary x2
    txs.push({
      id: `t${idCounter++}`,
      type: 'income',
      amount: 285000,
      date: toISODate(new Date(d.getFullYear(), d.getMonth(), Math.min(25, cap.getDate()))),
      categoryId: 'ci1',
      paymentMethodId: 'p2',
      userId: 'u1',
      memo: '給与',
      createdAt: new Date().toISOString(),
    });
    txs.push({
      id: `t${idCounter++}`,
      type: 'income',
      amount: 258000,
      date: toISODate(new Date(d.getFullYear(), d.getMonth(), Math.min(25, cap.getDate()))),
      categoryId: 'ci1',
      paymentMethodId: 'p2',
      userId: 'u2',
      memo: '給与',
      createdAt: new Date().toISOString(),
    });
  }

  // random daily-ish expenses
  const count = Math.round(totalDays * 1.6);
  for (let i = 0; i < count; i++) {
    const dayOffset = randInt(0, totalDays);
    const date = new Date(start);
    date.setDate(date.getDate() + dayOffset);
    if (date > today) continue;
    const cat = weightedPick();
    const amount = randInt(cat.min, cat.max);
    const paymentMethodId = pick(['p1', 'p1', 'p2', 'p3', 'p3', 'p4']);
    const userId = pick(['u1', 'u2']);
    txs.push({
      id: `t${idCounter++}`,
      type: 'expense',
      amount,
      date: toISODate(date),
      categoryId: cat.id,
      paymentMethodId,
      userId,
      memo: pick(cat.memo),
      createdAt: new Date().toISOString(),
    });
  }

  // occasional side income
  for (let i = 0; i < 3; i++) {
    const dayOffset = randInt(0, totalDays);
    const date = new Date(start);
    date.setDate(date.getDate() + dayOffset);
    if (date > today) continue;
    txs.push({
      id: `t${idCounter++}`,
      type: 'income',
      amount: randInt(5000, 30000),
      date: toISODate(date),
      categoryId: pick(['ci2', 'ci3']),
      paymentMethodId: 'p2',
      userId: pick(['u1', 'u2']),
      memo: pick(['フリマ売上', '臨時ボーナス', '副業収入']),
      createdAt: new Date().toISOString(),
    });
  }

  txs.sort((a, b) => (a.date < b.date ? 1 : -1));
  return txs;
}

export const transactions: Transaction[] = generateTransactions();

function ym(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const budgets: Budget[] = [
  {
    id: 'b0',
    month: ym(0),
    totalBudget: 220000,
    categoryBudgets: [
      { categoryId: 'c1', amount: 55000 },
      { categoryId: 'c2', amount: 12000 },
      { categoryId: 'c4', amount: 15000 },
      { categoryId: 'c6', amount: 8000 },
      { categoryId: 'c8', amount: 15000 },
      { categoryId: 'c9', amount: 12000 },
    ],
  },
  {
    id: 'b-1',
    month: ym(-1),
    totalBudget: 220000,
    categoryBudgets: [
      { categoryId: 'c1', amount: 55000 },
      { categoryId: 'c2', amount: 12000 },
      { categoryId: 'c4', amount: 15000 },
      { categoryId: 'c6', amount: 8000 },
      { categoryId: 'c8', amount: 15000 },
      { categoryId: 'c9', amount: 12000 },
    ],
  },
];

export const recurringTransactions: RecurringTransaction[] = [
  {
    id: 'r1',
    type: 'expense',
    amount: 78000,
    categoryId: 'c3',
    paymentMethodId: 'p2',
    userId: 'u1',
    memo: '家賃',
    frequency: 'monthly',
    startDate: '2024-04-27',
    nextDate: '2026-09-27',
    active: true,
  },
  {
    id: 'r2',
    type: 'expense',
    amount: 6480,
    categoryId: 'c5',
    paymentMethodId: 'p3',
    userId: 'u1',
    memo: 'モバイル通信費',
    frequency: 'monthly',
    startDate: '2024-01-10',
    nextDate: '2026-09-10',
    active: true,
  },
  {
    id: 'r3',
    type: 'expense',
    amount: 1490,
    categoryId: 'c9',
    paymentMethodId: 'p3',
    userId: 'u2',
    memo: '動画配信サブスク',
    frequency: 'monthly',
    startDate: '2024-02-05',
    nextDate: '2026-09-05',
    active: true,
  },
  {
    id: 'r4',
    type: 'income',
    amount: 285000,
    categoryId: 'ci1',
    paymentMethodId: 'p2',
    userId: 'u1',
    memo: '給与',
    frequency: 'monthly',
    startDate: '2024-01-25',
    nextDate: '2026-09-25',
    active: true,
  },
  {
    id: 'r5',
    type: 'expense',
    amount: 4200,
    categoryId: 'c11',
    paymentMethodId: 'p2',
    userId: 'u2',
    memo: '医療保険料',
    frequency: 'monthly',
    startDate: '2024-03-15',
    nextDate: '2026-09-15',
    active: true,
  },
];

export const savingsGoals: SavingsGoal[] = [
  {
    id: 's1',
    name: '沖縄旅行',
    icon: '🏖️',
    color: '#4FC1E9',
    targetAmount: 300000,
    currentAmount: 148000,
    deadline: '2027-03-31',
  },
  {
    id: 's2',
    name: '引っ越し費用',
    icon: '📦',
    color: '#FF8C42',
    targetAmount: 500000,
    currentAmount: 210000,
    deadline: '2027-06-30',
  },
  {
    id: 's3',
    name: '緊急用資金',
    icon: '🛟',
    color: '#5AC8E8',
    targetAmount: 1000000,
    currentAmount: 620000,
    deadline: '2028-01-01',
  },
];

export const defaultNotificationSettings: NotificationSettings = {
  thresholds: [80, 90, 100],
  pushEnabled: true,
};
