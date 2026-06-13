export const PLAN_LIMITS: Record<string, number> = {
  solo: 1,
  business: 5,
  agency: 20,
}

export function getPlanLimit(plan: string | null | undefined): number {
  return PLAN_LIMITS[plan ?? ''] ?? 1
}
