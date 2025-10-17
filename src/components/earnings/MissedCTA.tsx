/**
 * Missed Earnings CTA
 * Shows how much the user is leaving on the table
 */

interface MissedCTAProps {
  tierPct: number;
  missedCents30d: number;
}

export function MissedCTA({ tierPct, missedCents30d }: MissedCTAProps) {
  const targetPct = 0.04; // Tier 2 (4%)
  const uplift = Math.max(0, (targetPct - tierPct) / Math.max(tierPct, 0.0001));
  const recovered = missedCents30d * (targetPct / (1 - tierPct));

  if (tierPct >= targetPct || missedCents30d < 100) {
    return null; // Already at max or trivial amount
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">💰</div>
        <div className="flex-1">
          <div className="font-semibold text-amber-900 dark:text-amber-100">
            You're leaving money on the table
          </div>
          <div className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            Capturing at {(tierPct * 100).toFixed(1)}%. Upgrade to{' '}
            {(targetPct * 100).toFixed(1)}% to recover approximately{' '}
            <span className="font-semibold">
              ${(recovered / 100).toFixed(2)}
            </span>{' '}
            based on last 30 days.
          </div>
          <a
            href="/dashboard?m=earnings&cta=upgrade"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Upgrade Membership
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
