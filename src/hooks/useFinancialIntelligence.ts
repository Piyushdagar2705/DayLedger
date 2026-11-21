import { useMemo } from 'react';
import {
  getDate,
  getDaysInMonth,
  isSameMonth,
  subMonths,
} from 'date-fns';
import type { Category, Expense } from '../types';
import { toDate } from '../utils/format';

interface CategoryBreakdown {
  category: Category;
  total: number;
  percentage: number;
}

export interface FinancialInsight {
  id: string;
  type: 'forecast' | 'behavior' | 'velocity' | 'anomaly' | 'recurring';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'positive';
  confidence: number; // 0 to 1
}

interface IntelligenceOptions {
  expenses: Expense[];
  monthExpenses: Expense[];
  totalSpentThisMonth: number;
  totalSpentLastMonth: number;
  monthlyBudget: number;
  categoryBreakdown: CategoryBreakdown[];
}

export function useFinancialIntelligence({
  expenses,
  monthExpenses,
  totalSpentThisMonth,
  totalSpentLastMonth,
  monthlyBudget,
  categoryBreakdown,
}: IntelligenceOptions) {
  return useMemo(() => {
    const now = new Date();
    const daysPassed = getDate(now);
    const totalDays = getDaysInMonth(now);
    const insights: FinancialInsight[] = [];

    // --- 1. Forecast Reliability & Insights ---
    const dailyAverage = daysPassed > 0 ? totalSpentThisMonth / daysPassed : 0;
    const projectedSpend = dailyAverage * totalDays;
    
    // Threshold: Only show forecast after day 3 for statistical significance
    if (daysPassed >= 3 && monthlyBudget > 0) {
      const isOver = projectedSpend > monthlyBudget;
      const margin = Math.abs(projectedSpend - monthlyBudget);
      
      insights.push({
        id: 'forecast-projection',
        type: 'forecast',
        title: isOver ? 'Budget Trend Alert' : 'Positive Trajectory',
        description: isOver 
          ? `At your current pace, you might exceed your limit by ₹${margin.toLocaleString()}. Consider adjusting minor expenses.`
          : `Great job! You're on track to finish the month with ₹${margin.toLocaleString()} to spare.`,
        severity: isOver ? 'warning' : 'positive',
        confidence: Math.min(0.5 + (daysPassed / totalDays) * 0.5, 0.95),
      });
    }

    // --- 2. Weekend vs Weekday Smoothing ---
    const weekendSpend = monthExpenses
      .filter(ex => {
        const day = toDate(ex.date).getDay();
        return day === 0 || day === 6;
      })
      .reduce((sum, ex) => sum + ex.amount, 0);
    
    const weekendPercentage = totalSpentThisMonth > 0 ? (weekendSpend / totalSpentThisMonth) * 100 : 0;
    
    // Threshold: Significant behavioral skew
    if (totalSpentThisMonth > (monthlyBudget * 0.2) && weekendPercentage > 60) {
      insights.push({
        id: 'behavior-weekend',
        type: 'behavior',
        title: 'Weekend Spend Pattern',
        description: `Your spending peaks significantly on weekends. This is a common pattern, but worth noting for planning.`,
        severity: 'info',
        confidence: 0.8,
      });
    }

    // --- 3. Spending Velocity (Confidence-Weighted) ---
    const lastMonthDays = getDaysInMonth(subMonths(now, 1));
    const lastMonthDailyAvg = lastMonthDays > 0 ? totalSpentLastMonth / lastMonthDays : 0;
    
    if (lastMonthDailyAvg > 0 && daysPassed >= 5) {
      const velocityIncrease = (dailyAverage / lastMonthDailyAvg) - 1;
      
      if (Math.abs(velocityIncrease) > 0.15) {
        const isFaster = velocityIncrease > 0;
        insights.push({
          id: 'velocity-check',
          type: 'velocity',
          title: isFaster ? 'Spending Momentum' : 'Spending Efficiency',
          description: isFaster 
            ? `Your daily average is slightly higher than last month. Keep an eye on non-essential logs.`
            : `You're spending more efficiently than last month. Your discipline is showing!`,
          severity: isFaster ? 'warning' : 'positive',
          confidence: 0.85,
        });
      }
    }

    // --- 4. Anomaly & Spike Detection (Noise-Filtered) ---
    categoryBreakdown.forEach(cat => {
      if (cat.percentage < 10) return;

      const lastMonthCatTotal = expenses
        .filter(ex => isSameMonth(toDate(ex.date), subMonths(now, 1)) && ex.category === cat.category)
        .reduce((sum, ex) => sum + ex.amount, 0);
      
      if (lastMonthCatTotal > 0 && cat.total > lastMonthCatTotal * 1.6) {
        insights.push({
          id: `spike-${cat.category}`,
          type: 'anomaly',
          title: `${cat.category} Analysis`,
          description: `You've spent significantly more on ${cat.category} compared to last month's baseline.`,
          severity: 'info',
          confidence: 0.9,
        });
      }
    });

    // --- 5. Simple Recurring Detection ---
    const recurringMap = new Map<string, number>();
    expenses.slice(0, 15).forEach(ex => {
      const key = `${ex.category}-${ex.amount}`;
      recurringMap.set(key, (recurringMap.get(key) || 0) + 1);
    });

    const potentialRecurring = Array.from(recurringMap.entries())
      .filter(([_, count]) => count >= 2)
      .map(([key]) => key.split('-')[0])[0]; 

    if (potentialRecurring) {
      insights.push({
        id: 'recurring-detect',
        type: 'recurring',
        title: 'Fixed Cost Detection',
        description: `We've noticed regular transactions in ${potentialRecurring}. These look like predictable fixed costs.`,
        severity: 'info',
        confidence: 0.7,
      });
    }

    // --- 6. Spending Safety Zone Rating ---
    const safetyCushion = monthlyBudget - projectedSpend;
    const safetyRating = monthlyBudget > 0 
      ? Math.max(1, Math.min(10, Math.round((safetyCushion / monthlyBudget) * 10 + 5)))
      : 5;

    // --- 7. Status Narrative ---
    const getStatusNarrative = () => {
      if (monthlyBudget <= 0) return "Add a budget to get personalized insights.";
      if (daysPassed < 3) return "Analyzing your month... Insights will appear in a few days.";
      
      const isOver = projectedSpend > monthlyBudget;
      if (isOver) return "Budget management required. Let's look for saving opportunities.";
      if (safetyRating >= 8) return "Excellent budget control. You're building strong financial habits.";
      return "Stable month so far. You're managing your limits well.";
    };

    return {
      insights: insights.sort((a, b) => b.confidence - a.confidence).slice(0, 2), 
      projectedSpend,
      projectedStatus: monthlyBudget > 0 ? (projectedSpend > monthlyBudget ? 'over' : 'under') : 'neutral',
      safetyRating,
      statusNarrative: getStatusNarrative(),
    };
  }, [expenses, monthExpenses, totalSpentThisMonth, totalSpentLastMonth, monthlyBudget, categoryBreakdown]);
}
