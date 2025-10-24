/**
 * Revenue Aggregation Utilities
 * Cohort analysis and forecasting for business metrics
 */

export interface RevenueCohort {
  month: string; // YYYY-MM
  newCustomers: number;
  recurringRevenue: number;
  churnRate: number;
}

/**
 * Aggregate revenue by cohort (monthly)
 * @param transactions Array of transaction records
 * @returns Array of cohort summaries
 */
export function aggregateRevenueByCohort(
  transactions: Array<{ amount: number; userId: string; createdAt: string }>
): RevenueCohort[] {
  const cohorts = new Map<string, RevenueCohort>();

  transactions.forEach((txn) => {
    const month = txn.createdAt.slice(0, 7); // YYYY-MM
    if (!cohorts.has(month)) {
      cohorts.set(month, {
        month,
        newCustomers: 0,
        recurringRevenue: 0,
        churnRate: 0,
      });
    }
    const cohort = cohorts.get(month)!;
    cohort.recurringRevenue += txn.amount;
    cohort.newCustomers += 1; // stub: should track unique users
  });

  return Array.from(cohorts.values()).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate churn rate for a cohort
 * @param activeUsers Active users this month
 * @param previousUsers Active users last month
 * @returns Churn rate (0-1)
 */
export function calculateChurnRate(activeUsers: number, previousUsers: number): number {
  if (previousUsers === 0) return 0;
  const churned = previousUsers - activeUsers;
  return parseFloat((churned / previousUsers).toFixed(4));
}

/**
 * Forecast revenue for next N months (simple linear regression)
 * @param cohorts Historical cohort data
 * @param monthsAhead Number of months to forecast
 * @returns Forecasted revenue
 */
export function forecastRevenue(cohorts: RevenueCohort[], monthsAhead = 3): number {
  if (cohorts.length < 2) return 0;

  // Simple average growth rate
  const recentCohorts = cohorts.slice(-6); // last 6 months
  const avgRevenue =
    recentCohorts.reduce((sum, c) => sum + c.recurringRevenue, 0) / recentCohorts.length;
  const growthRate = recentCohorts.length > 1
    ? (recentCohorts[recentCohorts.length - 1].recurringRevenue - recentCohorts[0].recurringRevenue) /
      recentCohorts[0].recurringRevenue
    : 0;

  return parseFloat((avgRevenue * (1 + growthRate) ** monthsAhead).toFixed(2));
}
