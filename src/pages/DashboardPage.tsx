import { useState } from 'react';
import { AlertTriangle, ChevronRight, Gauge, Info, ReceiptText, Sparkles, TrendingUp, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useUserProfile } from '../hooks/useUserProfile';
import { useFinancialIntelligence } from '../hooks/useFinancialIntelligence';
import { formatMoney } from '../utils/format';

export function DashboardPage() {
  const { currentUser } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(currentUser?.uid);

  const monthlyBudget = profile?.monthlyBudget ?? 0;
  const dashboardUserId = profileError ? null : currentUser?.uid;
  const {
    expenses,
    monthExpenses,
    loading,
    error,
    totalSpentToday,
    totalSpentThisWeek,
    totalSpentThisMonth,
    totalSpentLastWeek,
    totalSpentLastMonth,
    remainingBudget,
    budgetUsagePercent,
    isBudgetWarning,
    daysLeftInMonth,
    safeDailySpend,
    categoryBreakdown,
    weeklyCategoryBreakdown,
    todayExpenses,
    weeklyTrend,
    peakDayLabel,
    monthlyTrend,
  } = useDashboardData(dashboardUserId, monthlyBudget);

  const { insights, projectedSpend, projectedStatus, safetyRating, statusNarrative } = useFinancialIntelligence({
    expenses,
    monthExpenses,
    totalSpentThisMonth,
    totalSpentLastMonth,
    monthlyBudget,
    categoryBreakdown,
  });

  const [trendPeriod, setTrendPeriod] = useState<'weekly' | 'monthly'>('weekly');

  if (profileError) {
    return (
      <section className="surface-card border-danger/40 bg-danger/10 p-4">
        <h2 className="text-lg font-bold text-textPrimary">Firestore is not ready</h2>
        <p className="mt-1 text-sm text-textMuted">{profileError}</p>
        <Link
          to="/setup/firestore"
          className="focus-ring touch-target mt-4 inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Open setup guide
        </Link>
      </section>
    );
  }

  if (profileLoading || loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const progressWidth = Math.min(100, Math.max(0, budgetUsagePercent));
  const weeklyPeak = Math.max(...weeklyTrend.map((day) => day.total), 0);
  const topWeeklyCategory = weeklyCategoryBreakdown[0];

  return (
    <div className="space-y-6">
      <section className="surface-card p-5 bg-gradient-to-br from-accent/[0.08] via-transparent to-transparent border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-accent/10 p-2">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-textMuted">Financial Narrative</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-6 px-2 flex items-center justify-center rounded-lg border text-[10px] font-black transition-colors ${
              safetyRating >= 7 ? 'bg-success/10 border-success/20 text-success' : 
              safetyRating >= 4 ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' :
              'bg-danger/10 border-danger/20 text-danger'
            }`}>
              {safetyRating}/10 Health
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white/[0.02] p-3 border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-y-0 left-0 w-1 bg-accent/20" />
          <p className="text-[11px] font-bold text-textPrimary leading-relaxed">
            {statusNarrative}
          </p>
          <div className="mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Info className="h-2.5 w-2.5 text-textMuted/40" />
            <p className="text-[8px] font-bold uppercase tracking-tight text-textMuted/40">Computed using your 30-day velocity</p>
          </div>
        </div>

        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-3 group">
              <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                insight.severity === 'warning' ? 'bg-danger' : 
                insight.severity === 'positive' ? 'bg-success' : 'bg-sky-400'
              }`} />
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-bold text-textPrimary leading-none">{insight.title}</p>
                <p className="text-[10px] font-medium text-textMuted leading-relaxed line-clamp-2">{insight.description}</p>
              </div>
            </div>
          ))}
          
          {insights.length === 0 && (
            <div className="flex items-center gap-2 py-1">
              <Info className="h-3 w-3 text-textMuted/40" />
              <p className="text-[10px] font-medium text-textMuted/60 italic">Observing your spending patterns to provide relevant insights...</p>
            </div>
          )}
        </div>
      </section>

      <section className="surface-card relative overflow-hidden p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-textMuted">Today's spend</p>
            <h2 className="mt-1.5 text-4xl font-black tracking-tight text-textPrimary">{formatMoney(totalSpentToday)}</h2>
            <p className="mt-2 text-xs font-medium text-textMuted/80">
              {todayExpenses.length} {todayExpenses.length === 1 ? 'transaction' : 'transactions'} today
            </p>
          </div>
          <Link
            to="/expenses"
            className="focus-ring touch-target inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-textPrimary transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            History
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/5 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-textMuted">
              <TrendingUp aria-hidden="true" className="h-3.5 w-3.5 text-sky-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider">This week</p>
            </div>
            <p className="truncate text-xl font-extrabold text-textPrimary">{formatMoney(totalSpentThisWeek)}</p>
            <p className="text-[10px] font-medium text-textMuted">vs {formatMoney(totalSpentLastWeek)} last wk</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-textMuted">
              <WalletCards aria-hidden="true" className="h-3.5 w-3.5 text-success" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Remaining</p>
            </div>
            <p className={`truncate text-xl font-extrabold ${remainingBudget >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatMoney(remainingBudget)}
            </p>
            <p className="text-[10px] font-medium text-textMuted">of monthly limit</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-textMuted">
              <Gauge aria-hidden="true" className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Safe daily</p>
            </div>
            <p className="truncate text-xl font-extrabold text-textPrimary">{formatMoney(safeDailySpend)}</p>
            <p className="text-[10px] font-medium text-textMuted">{daysLeftInMonth} days left</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-textMuted">
              <ReceiptText aria-hidden="true" className="h-3.5 w-3.5 text-fuchsia-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Top category</p>
            </div>
            <p className="truncate text-xl font-extrabold text-textPrimary">
              {topWeeklyCategory ? topWeeklyCategory.category : 'None'}
            </p>
            <p className="truncate text-[10px] font-medium text-textMuted">
              {topWeeklyCategory ? formatMoney(topWeeklyCategory.total) : 'No spend yet'}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-textMuted">Analytics</p>
            <h2 className="text-lg font-extrabold text-textPrimary">
              {trendPeriod === 'weekly' 
                ? (peakDayLabel ? `Peak: ${peakDayLabel}` : 'Weekly Pattern')
                : 'Monthly Evolution'}
            </h2>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setTrendPeriod('weekly')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${trendPeriod === 'weekly' ? 'bg-accent text-white shadow-sm' : 'text-textMuted hover:text-textPrimary'}`}
            >
              Wk
            </button>
            <button 
              onClick={() => setTrendPeriod('monthly')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${trendPeriod === 'monthly' ? 'bg-accent text-white shadow-sm' : 'text-textMuted hover:text-textPrimary'}`}
            >
              Mo
            </button>
          </div>
        </div>

        <div className="mt-8 flex h-36 items-end gap-2.5">
          {trendPeriod === 'weekly' ? weeklyTrend.map((day) => {
            const barHeight = day.total > 0 && weeklyPeak > 0 ? Math.max(16, (day.total / weeklyPeak) * 100) : 6;

            return (
              <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <p className="min-h-[12px] text-[9px] font-bold text-textMuted/60">
                  {day.total > 0 ? formatMoney(day.total).replace('₹', '') : ''}
                </p>
                <div className="group relative flex h-24 w-full items-end justify-center rounded-xl bg-white/[0.02] p-1 transition-colors hover:bg-white/[0.05]">
                  <div
                    className={`w-full max-w-[28px] rounded-lg transition-all duration-300 ${
                      day.isToday ? 'bg-accent shadow-[0_0_12px_rgba(99,102,241,0.4)]' : day.total > 0 ? 'bg-sky-500/80' : 'bg-white/10'
                    } group-hover:opacity-100 opacity-90`}
                    style={{ height: `${barHeight}%` }}
                    aria-label={`${day.label}: ${formatMoney(day.total)}`}
                  />
                </div>
                <p className={`text-[10px] font-bold tracking-tighter ${day.isToday ? 'text-accent' : 'text-textMuted'}`}>
                  {day.label}
                </p>
              </div>
            );
          }) : monthlyTrend.map((week) => {
            const maxWeekTotal = Math.max(...monthlyTrend.map(w => w.total), 1);
            const barHeight = Math.max(16, (week.total / maxWeekTotal) * 100);

            return (
              <div key={week.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <p className="min-h-[12px] text-[9px] font-bold text-textMuted/60">
                  {week.total > 0 ? formatMoney(week.total).replace('₹', '') : ''}
                </p>
                <div className="group relative flex h-24 w-full items-end justify-center rounded-xl bg-white/[0.02] p-1 transition-colors hover:bg-white/[0.05]">
                  <div
                    className={`w-full max-w-[36px] rounded-lg transition-all duration-300 ${
                      week.isCurrent ? 'bg-accent/80' : week.total > 0 ? 'bg-sky-500/60' : 'bg-white/10'
                    } group-hover:opacity-100 opacity-90`}
                    style={{ height: `${barHeight}%` }}
                    aria-label={`${week.label}: ${formatMoney(week.total)}`}
                  />
                </div>
                <p className={`text-[10px] font-bold tracking-tighter text-center leading-none ${week.isCurrent ? 'text-accent' : 'text-textMuted'}`}>
                  {week.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-textMuted">Budget</p>
            <h2 className="text-lg font-extrabold text-textPrimary">{budgetUsagePercent.toFixed(0)}% Utilized</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-textPrimary">{formatMoney(totalSpentThisMonth)}</p>
            <p className="text-[10px] font-semibold text-textMuted">vs {formatMoney(totalSpentLastMonth)} last mo</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-3 overflow-hidden rounded-full bg-white/5 relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${isBudgetWarning ? 'bg-danger shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'bg-success shadow-[0_0_12px_rgba(16,185,129,0.3)]'}`}
              style={{ width: `${progressWidth}%` }}
            />
            {monthlyBudget > 0 && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/30 border-r border-dashed border-white/50"
                style={{ left: `${Math.min(100, (projectedSpend / monthlyBudget) * 100)}%` }}
                title={`Projected: ${formatMoney(projectedSpend)}`}
              />
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-textMuted">
            <span className="flex items-center gap-1">
              Limit: {formatMoney(monthlyBudget)}
              <Info className="h-2 w-2 opacity-30" />
            </span>
            <span className={projectedStatus === 'over' ? 'text-danger' : 'text-success'}>
              Proj: {formatMoney(projectedSpend)}
            </span>
          </div>
        </div>

        {isBudgetWarning ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 text-danger" />
            <p className="text-xs font-semibold leading-relaxed text-danger/90">
              Heads up! You've utilized 80%+ of your monthly budget. Consider reviewing your upcoming expenses.
            </p>
          </div>
        ) : null}
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-textMuted">Distribution</h2>
            <p className="text-[9px] font-bold text-textMuted/40 uppercase">
              {insights.some(i => i.id.startsWith('spike-')) ? 'Volatility Detected' : 'Behavior Stable'}
            </p>
          </div>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-textMuted">
            {categoryBreakdown.length} Categories
          </span>
        </div>
        <div className="mt-4 space-y-5">
          {categoryBreakdown.length === 0 ? (
            <p className="py-4 text-center text-xs font-medium text-textMuted">No spending activity recorded this month.</p>
          ) : (
            categoryBreakdown.map((item) => {
              const insight = insights.find(i => i.id === `spike-${item.category}`);
              return (
                <div key={item.category} className="group">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="truncate text-xs font-bold text-textPrimary">{item.category}</p>
                      {insight && (
                        <span className="flex items-center gap-0.5 text-[8px] font-black uppercase text-danger bg-danger/10 px-1.5 py-0.5 rounded-full">
                          <TrendingUp className="h-2 w-2" />
                          Spiking
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-black text-textPrimary">{formatMoney(item.total)}</p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-amber-400/80 transition-all duration-500 group-hover:bg-amber-400" style={{ width: `${item.percentage}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between">
                    <p className="text-[9px] font-bold uppercase tracking-tighter text-textMuted/60">{item.percentage.toFixed(1)}% weight</p>
                    {insight && (
                      <p className="text-[9px] font-bold text-danger/80 text-right">
                        High Volatility detected
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-textMuted">Historical Context</h2>
          <span className="text-[9px] font-bold text-textMuted opacity-40 uppercase tracking-widest text-right">Last 30 Days</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/[0.02] p-4 border border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Volume</p>
            <p className="mt-1 text-2xl font-black text-textPrimary">{expenses.length}</p>
            <p className="text-[9px] font-bold text-textMuted/60 uppercase">Entries logged</p>
          </div>
          <div className="rounded-xl bg-white/[0.02] p-4 border border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Efficiency</p>
            <p className="mt-1 text-2xl font-black text-textPrimary">{formatMoney(totalSpentLastMonth / 30).replace('₹', '')}</p>
            <p className="text-[9px] font-bold text-textMuted/60 uppercase">Avg daily cost</p>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-danger/20 bg-danger/5 p-4">
          <p className="text-xs font-semibold text-danger">{error}</p>
        </section>
      ) : null}

      <div className="pt-2 pb-6 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-textMuted/30">
          Encrypted & Synced • Analysis Engine v2.1
        </p>
      </div>
    </div>
  );
}
