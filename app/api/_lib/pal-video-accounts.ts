import { palDbGet } from './pal-db-client';

type PalDbAccount = {
  id: string;
  paletteId: string;
  name: string;
  status: string;
  chatLoginId: string | null;
  chatPasswordSet: boolean;
  isStandard?: boolean;
  planCode?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ContractItem = {
  accountId: string;
  planId: string;
};

type PlanItem = {
  id: string;
  code: string;
};

const normalize = (value: string | null | undefined) => String(value || '').trim().toLowerCase();

const isPalVideoPlanCode = (code: string): boolean => {
  const normalized = normalize(code).replace(/-/g, '_');
  return (
    normalized === 'pal_video_lite' ||
    normalized === 'pal_video_standard' ||
    normalized === 'pal_video_pro'
  );
};

const getPalVideoPlanTier = (code: string): string => {
  const normalized = normalize(code).replace(/-/g, '_');
  if (normalized === 'pal_video_pro') return 'pro';
  if (normalized === 'pal_video_standard') return 'standard';
  return 'lite';
};

const todayYmd = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const listPalVideoAccountsFromPalDb = async (): Promise<PalDbAccount[]> => {
  const activeOn = todayYmd();
  const [accountsRes, contractsRes, plansRes] = await Promise.all([
    palDbGet('/api/accounts'),
    palDbGet(`/api/contracts?activeOn=${encodeURIComponent(activeOn)}`),
    palDbGet('/api/plans?includeInactive=1'),
  ]);

  if (!accountsRes.ok) throw new Error('pal_db の顧客一覧取得に失敗しました');
  if (!contractsRes.ok) throw new Error('pal_db の契約一覧取得に失敗しました');
  if (!plansRes.ok) throw new Error('pal_db のプラン一覧取得に失敗しました');

  const accountsBody = await accountsRes.json().catch(() => ({}));
  const contractsBody = await contractsRes.json().catch(() => ({}));
  const plansBody = await plansRes.json().catch(() => ({}));

  const accounts: PalDbAccount[] = Array.isArray(accountsBody?.accounts) ? accountsBody.accounts : [];
  const contracts: ContractItem[] = Array.isArray(contractsBody?.contracts) ? contractsBody.contracts : [];
  const plans: PlanItem[] = Array.isArray(plansBody?.plans) ? plansBody.plans : [];

  const targetPlanIds = new Set(
    plans
      .filter((plan) => isPalVideoPlanCode(plan.code))
      .map((plan) => String(plan.id || '').trim())
      .filter(Boolean),
  );

  const targetAccountIds = new Set(
    contracts
      .filter((item) => targetPlanIds.has(String(item.planId || '').trim()))
      .map((item) => String(item.accountId || '').trim())
      .filter(Boolean),
  );

  // Build a map from accountId -> best plan code
  const planById = new Map(plans.map((p) => [String(p.id || '').trim(), p.code]));
  const accountPlanMap = new Map<string, string>();
  contracts.forEach((item) => {
    const accountId = String(item.accountId || '').trim();
    const planId = String(item.planId || '').trim();
    const planCode = planById.get(planId) || '';
    if (!accountId || !isPalVideoPlanCode(planCode)) return;
    // Prefer higher tier
    const existing = accountPlanMap.get(accountId);
    if (!existing) {
      accountPlanMap.set(accountId, planCode);
    } else {
      const existingTier = getPalVideoPlanTier(existing);
      const newTier = getPalVideoPlanTier(planCode);
      const tierOrder = ['lite', 'standard', 'pro'];
      if (tierOrder.indexOf(newTier) > tierOrder.indexOf(existingTier)) {
        accountPlanMap.set(accountId, planCode);
      }
    }
  });

  return accounts
    .filter((account) => targetAccountIds.has(String(account.id || '').trim()))
    .map((account) => {
      const accountId = String(account.id || '').trim();
      const planCode = accountPlanMap.get(accountId) || 'pal_video_lite';
      const isStandard = getPalVideoPlanTier(planCode) !== 'lite';
      return { ...account, isStandard, planCode };
    });
};

export const findPalVideoAccountByPaletteId = async (paletteId: string): Promise<PalDbAccount | null> => {
  const target = String(paletteId || '').trim().toUpperCase();
  if (!target) return null;
  const accounts = await listPalVideoAccountsFromPalDb();
  return accounts.find((account) => String(account.paletteId || '').trim().toUpperCase() === target) || null;
};

export const canLoginPalVideoByPaletteId = async (paletteId: string): Promise<boolean> => {
  const target = String(paletteId || '').trim().toUpperCase();
  if (!target) return false;

  const activeOn = todayYmd();
  const [accountsRes, contractsRes, plansRes] = await Promise.all([
    palDbGet('/api/accounts'),
    palDbGet(`/api/contracts?activeOn=${encodeURIComponent(activeOn)}`),
    palDbGet('/api/plans?includeInactive=1'),
  ]);

  if (!accountsRes.ok || !contractsRes.ok || !plansRes.ok) {
    throw new Error('pal_db のプラン照合に失敗しました');
  }

  const accountsBody = await accountsRes.json().catch(() => ({}));
  const contractsBody = await contractsRes.json().catch(() => ({}));
  const plansBody = await plansRes.json().catch(() => ({}));

  const accounts: PalDbAccount[] = Array.isArray(accountsBody?.accounts) ? accountsBody.accounts : [];
  const contracts: ContractItem[] = Array.isArray(contractsBody?.contracts) ? contractsBody.contracts : [];
  const plans: PlanItem[] = Array.isArray(plansBody?.plans) ? plansBody.plans : [];

  const account = accounts.find((item) => String(item.paletteId || '').trim().toUpperCase() === target);
  if (!account) return false;

  const videoPlanIds = new Set(
    plans
      .filter((plan) => isPalVideoPlanCode(plan.code))
      .map((plan) => String(plan.id || '').trim())
      .filter(Boolean),
  );

  return contracts.some((item) => {
    const accountId = String(item.accountId || '').trim();
    const planId = String(item.planId || '').trim();
    return accountId === String(account.id || '').trim() && videoPlanIds.has(planId);
  });
};
