import InputModal from '@/components/InputModal';
import MonthConfirmModal from '@/components/MonthConfirmModal';
import RebalanceModal from '@/components/RebalanceModal';
import SavingsModal from '@/components/SavingsModal';
import SecurityModal from '@/components/SecurityModal';
import TransactionModal from '@/components/TransactionModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, SharedStyles } from '@/constants/Colors';
import { Transaction, useBudget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Dashboard() {
  const {
    getSafeToSpend,
    getCurrentMonthIncome,
    getCurrentMonthExpenses,
    getTotalRecurringBills,
    getRemainingSavingsGoal,
    transactions,
    budgets,
    getBudgetStatus,
    getDebts,
    getCurrentMonthTransactions,
    currentPeriod,
    selectedPeriod,
    setSelectedPeriod,
    getAllPeriods,
    categories,
    savingsTransactions,
    savingsBalance,
    monthlySavingsGoal,
    addSavingsTransaction,
    updateSavingsTransaction,
    deleteSavingsTransaction,
    updateMonthlySavingsGoal,
    userPin,
    updateUserPin,
    recurringBills,
    isBillPaid,
    initialBalance,
    updateInitialBalance,
    reconcileBalance,
    getAccountBalance,
    isMainCardPrivacyEnabled,
    isBudgetsPrivacyEnabled,
    isHistoryPrivacyEnabled,
    toggleMainCardPrivacy,
    toggleBudgetsPrivacy,
    toggleHistoryPrivacy,
    rebalanceBudgets,
  } = useBudget();

  const insets = useSafeAreaInsets();
  const theme = Colors.light;

  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  const [rebalanceTarget, setRebalanceTarget] = useState<{ category: string, amount: number } | null>(null);

  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showInitialBalanceModal, setShowInitialBalanceModal] = useState(false);
  const [_, setSecurityAction] = useState<'reveal_balance' | 'manage_savings'>('manage_savings');
  const [tempInitialBalance, setTempInitialBalance] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string | null>(null);

  const safeToSpend = getSafeToSpend();
  const totalRecurringBills = getTotalRecurringBills();
  const currentSpent = getCurrentMonthExpenses();

  const getMonthName = (period = selectedPeriod || currentPeriod) => {
    if (!period) return 'This Month';
    const [year, month] = period.month.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount: number, privacyType?: 'dashboard' | 'budgets' | 'history') => {
    if (privacyType === 'dashboard' && isMainCardPrivacyEnabled) return '₦ ••••••';
    if (privacyType === 'budgets' && isBudgetsPrivacyEnabled) return '₦ ••••••';
    if (privacyType === 'history' && isHistoryPrivacyEnabled) return '₦ ••••••';
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getBudgetColor = (status: { velocityStatus: 'good' | 'warning' | 'danger' | 'over' }) => {
    if (status.velocityStatus === 'over') return theme.danger + 'B3';
    if (status.velocityStatus === 'danger') return theme.danger + 'B3';
    if (status.velocityStatus === 'warning') return theme.warning + 'B3';
    return theme.tint;
  };

  const getCategoryIcon = (categoryName: string, type?: string) => {
    if (type === 'income' || categoryName === 'Income') return 'arrow.down.circle.fill';
    if (type === 'debt' || categoryName === 'Debt') return 'arrow.up.circle.fill';
    const category = categories.find(c => c.name === categoryName);
    return category?.icon || (type === 'expense' ? 'arrow.up.circle.fill' : 'ellipsis.circle.fill');
  };

  const recentTransactions = getCurrentMonthTransactions()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const groupTransactionsByDate = (txns: typeof transactions) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { label: string; data: typeof transactions }[] = [];
    const seen: Record<string, number> = {};

    for (const t of txns) {
      const d = new Date(t.date);
      d.setHours(0, 0, 0, 0);
      let label: string;
      if (d.getTime() === today.getTime()) label = 'Today';
      else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
      else label = d.toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' });

      if (seen[label] === undefined) {
        seen[label] = groups.length;
        groups.push({ label, data: [] });
      }
      groups[seen[label]].data.push(t);
    }
    return groups;
  };

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isHistorical = selectedPeriod && selectedPeriod.month !== currentMonthKey;

  const currentMonthTransactions = getCurrentMonthTransactions();
  const currentIncome = getCurrentMonthIncome();
  const totalExpenses = getCurrentMonthExpenses();

  const monthlySavingsDeposits = currentMonthTransactions
    .filter(t => t.type === 'expense' && t.category === 'Savings')
    .reduce((acc, t) => acc + t.amount, 0);

  const coreSpent = totalExpenses - monthlySavingsDeposits;
  const monthlyUnused = currentIncome - (coreSpent + monthlySavingsDeposits);

  const getOpeningBalance = () => {
    const period = selectedPeriod || currentPeriod;
    if (!period) return initialBalance;

    const [year, month] = period.month.split('-');
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);

    const netBefore = transactions.reduce((acc, t) => {
      if (t.isCarryOver === true) return acc;
      if (new Date(t.date) < startOfMonth) {
        const amount = Number(t.amount) || 0;
        if (t.type === 'income') return acc + amount;
        if (t.type === 'expense' || t.type === 'debt') return acc - amount;
      }
      return acc;
    }, 0);

    return initialBalance + netBefore;
  };

  const openingBalance = getOpeningBalance();
  const closingBalance = getAccountBalance();

  const handleExportCSV = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      let csvContent = 'Date,Description,Category,Amount,Type\n';
      transactions.forEach(t => {
        const date = new Date(t.date).toLocaleString();
        const desc = t.note ? t.note.replace(/,/g, ';') : '';
        const category = t.category;
        const amount = t.amount;
        const type = t.type;
        csvContent += `${date},${desc},${category},${amount},${type}\n`;
      });
      const filename = `transactions_${new Date().getTime()}.csv`;
      const fileUri = (FileSystem as any).documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' as any });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Transactions',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  return (
    <>
      <MonthConfirmModal />
      <ScrollView
        style={{ backgroundColor: theme.backgroundSecondary }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerGreeting, { color: theme.textMuted }]}>
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>My Finances</Text>
          </View>
          <TouchableOpacity
            style={[styles.periodChip, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPeriodModal(true);
            }}
          >
            <Text style={[styles.periodChipText, { color: theme.text }]}>{getMonthName()}</Text>
            <Ionicons name="chevron-down" size={12} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        {isHistorical ? (
          <View style={[styles.heroCard, { backgroundColor: theme.card }, SharedStyles.softShadowMd]}>
            <View style={styles.heroCardTopRow}>
              <View style={[styles.histBadge, { backgroundColor: theme.backgroundSecondary }]}>
                <Text style={[styles.histBadgeText, { color: theme.textSecondary }]}>Past Month</Text>
              </View>
              <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>Summary</Text>
            </View>

            <View style={styles.historicalGrid}>
              <View style={styles.historicalRow}>
                <View style={styles.histStat}>
                  <Text style={[styles.histStatLabel, { color: theme.textMuted }]}>Opening</Text>
                  <Text style={[styles.histStatValue, { color: theme.text }]}>
                    {formatCurrency(openingBalance, 'dashboard')}
                  </Text>
                </View>
                <View style={[styles.histDivider, { backgroundColor: theme.borderLight }]} />
                <View style={styles.histStat}>
                  <Text style={[styles.histStatLabel, { color: theme.textMuted }]}>Closing</Text>
                  <Text style={[styles.histStatValue, { color: theme.text }]}>
                    {formatCurrency(closingBalance, 'dashboard')}
                  </Text>
                </View>
              </View>
              <View style={[styles.histRowDivider, { backgroundColor: theme.borderLight }]} />
              <View style={styles.historicalRow}>
                <View style={styles.histStat}>
                  <Text style={[styles.histStatLabel, { color: theme.textMuted }]}>Spent</Text>
                  <Text style={[styles.histStatValue, { color: theme.text }]}>
                    {formatCurrency(coreSpent, 'dashboard')}
                  </Text>
                </View>
                <View style={[styles.histDivider, { backgroundColor: theme.borderLight }]} />
                <View style={styles.histStat}>
                  <Text style={[styles.histStatLabel, { color: theme.textMuted }]}>Saved</Text>
                  <Text style={[styles.histStatValue, { color: theme.text }]}>
                    {formatCurrency(monthlySavingsDeposits, 'dashboard')}
                  </Text>
                </View>
                <View style={[styles.histDivider, { backgroundColor: theme.borderLight }]} />
                <View style={styles.histStat}>
                  <Text style={[styles.histStatLabel, { color: theme.textMuted }]}>Unused</Text>
                  <Text style={[styles.histStatValue, { color: monthlyUnused >= 0 ? theme.success : theme.danger }]}>
                    {formatCurrency(monthlyUnused, 'dashboard')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.heroCard, { backgroundColor: theme.hero }, SharedStyles.softShadowMd]}>
            <View style={styles.heroTopRow}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  toggleMainCardPrivacy();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.heroLabel}>Safe to Spend</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
              <Text style={styles.heroAmount}>
                {formatCurrency(safeToSpend, 'dashboard')}
              </Text>
              {!isMainCardPrivacyEnabled && safeToSpend > 0 && (() => {
                const d = new Date();
                const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                const daysLeft = daysInMonth - d.getDate() + 1;
                const perDay = safeToSpend / daysLeft;
                return (
                  <Text style={styles.heroPerDay}>
                    {formatCurrency(perDay)}/day
                  </Text>
                );
              })()}
            </View>

            {/* Stats Row */}
            <View style={styles.heroStatsRow}>
              <TouchableOpacity
                style={styles.heroStat}
                onPress={() => {
                  if (isMainCardPrivacyEnabled) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTempInitialBalance(getAccountBalance().toString());
                  setShowInitialBalanceModal(true);
                }}
                activeOpacity={isMainCardPrivacyEnabled ? 1 : 0.7}
              >
                <Text style={styles.heroStatLabel}>Balance</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(getAccountBalance(), 'dashboard')}</Text>
              </TouchableOpacity>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Spent</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(totalExpenses, 'dashboard')}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <TouchableOpacity
                style={styles.heroStat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSecurityAction('manage_savings');
                  setShowSecurityModal(true);
                }}
              >
                <Text style={styles.heroStatLabel}>Saved</Text>
                <Text style={styles.heroStatValue}>{formatCurrency(savingsBalance, 'dashboard')}</Text>
                {!isMainCardPrivacyEnabled && getRemainingSavingsGoal() > 0 && (
                  <Text style={styles.heroStatSub}>{formatCurrency(getRemainingSavingsGoal())} left</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {!isHistorical && (
          <View style={styles.quickActions}>
            <Link href="/budgets" asChild style={{ flex: 1 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <View style={[styles.actionTile, { backgroundColor: theme.card }]}>
                  <View style={[styles.actionIconBg, { backgroundColor: theme.primarySoft }]}>
                    <Ionicons name="pie-chart" size={20} color={theme.tint} />
                  </View>
                  <Text style={[styles.actionTileText, { color: theme.text }]}>Budgets</Text>
                </View>
              </TouchableOpacity>
            </Link>
            <Link href="/bills" asChild style={{ flex: 1 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <View style={[styles.actionTile, { backgroundColor: theme.card }]}>
                  <View style={[styles.actionIconBg, { backgroundColor: theme.warningSoft }]}>
                    <Ionicons name="receipt" size={20} color={theme.warning} />
                  </View>
                  <Text style={[styles.actionTileText, { color: theme.text }]}>Bills</Text>
                </View>
              </TouchableOpacity>
            </Link>
            <Link href="/debts" asChild style={{ flex: 1 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <View style={[styles.actionTile, { backgroundColor: theme.card }]}>
                  <View style={[styles.actionIconBg, { backgroundColor: theme.successSoft }]}>
                    <Ionicons name="cash" size={20} color={theme.success} />
                  </View>
                  <Text style={[styles.actionTileText, { color: theme.text }]}>Lent Out</Text>
                </View>
              </TouchableOpacity>
            </Link>
          </View>
        )}

        {/* Budget Status */}
        {(() => {
          const currentMonthTxs = getCurrentMonthTransactions();
          const categoriesWithSpending = Array.from(new Set(
            currentMonthTxs
              .filter(t => t.type === 'expense' && t.category !== 'Savings')
              .map(t => t.category)
          ));

          const budgetedCategories = budgets.map(b => b.category);
          const unbudgetedWithSpending = categoriesWithSpending.filter(cat => !budgetedCategories.includes(cat));

          const allBudgetItems = [
            ...budgets.map(b => {
              const status = getBudgetStatus(b.category);
              const categoryBills = recurringBills.filter(bill => bill.category === b.category);
              const unpaidBills = categoryBills.filter(bill => !isBillPaid(bill.id, currentMonthKey));
              const totalUnpaidBills = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);
              const projectedTotal = status.spent + totalUnpaidBills;
              return { ...b, status, projectedTotal, isUnbudgeted: false };
            }),
            ...unbudgetedWithSpending.map(cat => {
              const spent = currentMonthTxs
                .filter(t => t.type === 'expense' && t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0);
              return {
                category: cat,
                limit: 0,
                type: 'flexible' as const,
                status: { spent, limit: 0, percentage: 0, type: 'flexible' as const, velocityStatus: 'good' as const },
                projectedTotal: spent,
                isUnbudgeted: true
              };
            })
          ];

          if (allBudgetItems.length === 0) return null;

          return (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TouchableOpacity onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  toggleBudgetsPrivacy();
                }}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Budgets</Text>
                </TouchableOpacity>
              </View>

              {allBudgetItems
                .sort((a, b) => {
                  const getPriority = (item: typeof a) => {
                    if (item.isUnbudgeted) return 2; // Unbudgeted/Untracked
                    const status = item.status.velocityStatus;
                    if (status === 'over') return 0;
                    if (status === 'danger') return 1;
                    if (status === 'warning') return 3;
                    return 4; // good
                  };

                  const diff = getPriority(a) - getPriority(b);
                  if (diff !== 0) return diff;
                  return b.status.spent - a.status.spent;
                })
                .map((item) => {
                  const { status, isUnbudgeted } = item;
                  const budgetColor = isUnbudgeted ? theme.textMuted : getBudgetColor(status);
                  const iconColor = isUnbudgeted ? theme.textMuted : theme.tint;

                  return (
                    <TouchableOpacity
                      key={item.category}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCategory(item.category);
                      }}
                      disabled={!!isHistorical}
                    >
                      <View style={[
                        styles.budgetCard,
                        { backgroundColor: theme.card },
                        isUnbudgeted && styles.budgetCardDashed,
                      ]}>
                        <View style={styles.budgetCardRow}>
                          <View style={[styles.catIconCircle, { backgroundColor: iconColor + '18' }]}>
                            <IconSymbol name={getCategoryIcon(item.category) as any} size={18} color={iconColor} />
                          </View>
                          <View style={styles.budgetInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.budgetCategory, { color: theme.text }]}>{item.category}</Text>
                              {isUnbudgeted && (
                                <View style={[styles.unbudgetedPill, { backgroundColor: theme.backgroundSecondary }]}>
                                  <Text style={[styles.unbudgetedPillText, { color: theme.textMuted }]}>Untracked</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.budgetSub, { color: theme.textMuted }]}>
                              {isUnbudgeted
                                ? `${formatCurrency(status.spent, 'budgets')} spent`
                                : `${formatCurrency(status.spent, 'budgets')} of ${formatCurrency(status.limit, 'budgets')}`}
                            </Text>
                          </View>
                          <Text style={[styles.budgetPct, { color: isHistorical ? theme.textMuted : (isUnbudgeted ? theme.textSecondary : theme.tint) }]}>
                            {isUnbudgeted ? formatCurrency(status.spent, 'budgets') : `${status.percentage.toFixed(0)}%`}
                          </Text>
                        </View>

                        {!isUnbudgeted && (
                          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSecondary }]}>
                            {(() => {
                              const categoryBills = recurringBills.filter(b => b.category === item.category);
                              const unpaidBills = categoryBills.filter(b => !isBillPaid(b.id, currentMonthKey));
                              const totalUnpaidBills = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
                              const projectedSpent = status.spent + totalUnpaidBills;
                              const projectedPercentage = Math.min((projectedSpent / status.limit) * 100, 100);
                              return (
                                <>
                                  {totalUnpaidBills > 0 && (
                                    <View style={[styles.progressFill, { width: `${projectedPercentage}%`, backgroundColor: budgetColor + '35' }]} />
                                  )}
                                  <View style={[styles.progressFill, { width: `${status.percentage}%`, backgroundColor: isHistorical ? theme.borderLight : budgetColor }]} />
                                </>
                              );
                            })()}
                          </View>
                        )}

                        {!isUnbudgeted && !isHistorical && (() => {
                          const d = new Date();
                          const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                          const daysLeft = daysInMonth - d.getDate() + 1;
                          const monthProgressPct = (d.getDate() / daysInMonth) * 100;
                          const spentPct = status.percentage;

                          if (spentPct - monthProgressPct > 15 && spentPct < 100) {
                            const overAmount = ((spentPct - monthProgressPct) / 100) * status.limit;
                            const dailyRate = status.limit / daysInMonth;
                            const daysToRecover = Math.ceil(overAmount / dailyRate);
                            const overBy = formatCurrency(overAmount);
                            return (
                              <View style={styles.velocityRow}>
                                <View style={[styles.velocityDot, { backgroundColor: theme.warning }]} />
                                <Text style={[styles.velocityText, { color: theme.warning, flex: 1 }]}>
                                  {overBy} ahead · recover in {daysToRecover}d
                                </Text>
                                <TouchableOpacity
                                  style={[styles.healBtn, { backgroundColor: theme.warningSoft }]}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setRebalanceTarget({ category: item.category, amount: overAmount });
                                    setShowRebalanceModal(true);
                                  }}
                                >
                                  <Text style={[styles.healBtnText, { color: theme.warning }]}>Heal</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          } else if (spentPct > 100) {
                            const overAmount = status.spent - status.limit;
                            return (
                              <View style={styles.velocityRow}>
                                <View style={[styles.velocityDot, { backgroundColor: theme.danger }]} />
                                <Text style={[styles.velocityText, { color: theme.danger, flex: 1 }]}>
                                  Over budget by {formatCurrency(overAmount)}
                                </Text>
                                <TouchableOpacity
                                  style={[styles.healBtn, { backgroundColor: theme.danger + '18' }]}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setRebalanceTarget({ category: item.category, amount: overAmount });
                                    setShowRebalanceModal(true);
                                  }}
                                >
                                  <Text style={[styles.healBtnText, { color: theme.danger }]}>Rebalance</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          } else {
                            const remaining = status.limit - status.spent;
                            const perDay = remaining / daysLeft;
                            return (
                              <View style={styles.velocityRow}>
                                <View style={[styles.velocityDot, { backgroundColor: theme.success }]} />
                                <Text style={[styles.velocityText, { color: theme.success }]}>
                                  {formatCurrency(perDay, 'budgets')} / day left
                                </Text>
                              </View>
                            );
                          }
                        })()}

                        {!isUnbudgeted && (() => {
                          const categoryBills = recurringBills.filter(b => b.category === item.category);
                          const unpaidBills = categoryBills.filter(b => !isBillPaid(b.id, currentMonthKey));
                          if (unpaidBills.length === 0) return null;
                          const totalUnpaidBills = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
                          return (
                            <View style={[styles.billsBreakdown, { borderTopColor: theme.borderLight }]}>
                              <View style={styles.billsHeader}>
                                <Text style={[styles.billsTitle, { color: theme.textMuted }]}>Unpaid bills</Text>
                                <Text style={[styles.billsTotal, { color: theme.danger }]}>
                                  {formatCurrency(totalUnpaidBills, 'history')}
                                </Text>
                              </View>
                              {unpaidBills.map(bill => (
                                <View key={bill.id} style={styles.billRow}>
                                  <Text style={[styles.billName, { color: theme.text }]}>{bill.name}</Text>
                                  <Text style={[styles.billAmount, { color: theme.textSecondary }]}>
                                    {formatCurrency(bill.amount, 'history')}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          );
                        })()}
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })()}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleHistoryPrivacy();
              }}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAllTransactions(true);
              }}
            >
              <Text style={[styles.seeAllText, { color: theme.tint }]}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.txCard, { backgroundColor: theme.card }]}>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t, idx) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditingTransaction(t);
                    setShowTransactionModal(true);
                  }}
                >
                  <View style={[
                    styles.txRow,
                    idx < recentTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight }
                  ]}>
                    <View style={[styles.txIconCircle, { backgroundColor: (t.type === 'income' ? theme.success : theme.danger) + '15' }]}>
                      <IconSymbol
                        name={getCategoryIcon(t.category, t.type) as any}
                        size={18}
                        color={t.type === 'income' ? theme.success : theme.danger}
                      />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={[styles.txCategory, { color: theme.text }]}>{t.category}</Text>
                      <Text style={[styles.txSub, { color: theme.textMuted }]}>
                        {new Date(t.date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                        {t.note ? ` · ${t.note}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, { color: t.type === 'income' ? theme.success : theme.danger }]}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, 'history')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={32} color={theme.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No transactions yet</Text>
                <Text style={[styles.emptySub, { color: theme.textMuted }]}>Tap + below to add your first one</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Category Transactions Modal */}
      <Modal visible={selectedCategory !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.background, paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedCategory}</Text>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}
              style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {(() => {
              const filtered = getCurrentMonthTransactions()
                .filter(t => t.category === selectedCategory)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              if (filtered.length === 0) {
                return (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>No transactions for this category yet.</Text>
                  </View>
                );
              }
              return groupTransactionsByDate(filtered).map(group => (
                <View key={group.label}>
                  <Text style={[styles.dateGroupLabel, { color: theme.textMuted }]}>{group.label}</Text>
                  <View style={[styles.txCard, { backgroundColor: theme.card }]}>
                    {group.data.map((t, idx) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditingTransaction(t);
                          setShowTransactionModal(true);
                        }}
                      >
                        <View style={[
                          styles.txRow,
                          idx < group.data.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight }
                        ]}>
                          <View style={[styles.txIconCircle, { backgroundColor: (t.type === 'income' ? theme.success : theme.danger) + '15' }]}>
                            <IconSymbol name={getCategoryIcon(t.category, t.type) as any} size={18} color={t.type === 'income' ? theme.success : theme.danger} />
                          </View>
                          <View style={styles.txInfo}>
                            <Text style={[styles.txCategory, { color: theme.text }]}>{t.note ? t.note : t.category}</Text>
                            <Text style={[styles.txSub, { color: theme.textMuted }]}>
                              {new Date(t.date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                          <Text style={[styles.txAmount, { color: t.type === 'income' ? theme.success : theme.danger }]}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, 'history')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ));
            })()}
          </ScrollView>
        </View>
      </Modal>

      {/* All Transactions Modal */}
      <Modal visible={showAllTransactions} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.background, paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>All History</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={handleExportCSV}
                style={[styles.exportBtn, { backgroundColor: theme.primarySoft }]}
              >
                <Ionicons name="share-outline" size={16} color={theme.tint} />
                <Text style={[styles.exportBtnText, { color: theme.tint }]}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAllTransactions(false);
                  setHistorySearch('');
                  setHistoryCategoryFilter(null);
                }}
                style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <Ionicons name="close" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {getCurrentMonthTransactions().length >= 20 && (
            <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={16} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={`Search ${getCurrentMonthTransactions().length} transactions...`}
                placeholderTextColor={theme.textMuted}
                value={historySearch}
                onChangeText={setHistorySearch}
                autoCorrect={false}
              />
              {historySearch.length > 0 && (
                <TouchableOpacity onPress={() => setHistorySearch('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {(() => {
              const sorted = getCurrentMonthTransactions()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const filtered = sorted.filter(t => {
                const matchesSearch = historySearch.trim() === '' ||
                  t.category.toLowerCase().includes(historySearch.toLowerCase()) ||
                  (t.note?.toLowerCase().includes(historySearch.toLowerCase()) ?? false);
                const matchesCategory = historyCategoryFilter === null || t.category === historyCategoryFilter;
                return matchesSearch && matchesCategory;
              });
              if (filtered.length === 0) {
                return (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={28} color={theme.textMuted} style={{ marginBottom: 8 }} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
                    <Text style={[styles.emptySub, { color: theme.textMuted }]}>Try a different search</Text>
                  </View>
                );
              }
              return groupTransactionsByDate(filtered).map(group => {
                const dayNet = group.data.reduce((acc, t) => {
                  if (t.type === 'income') return acc + t.amount;
                  if (t.type === 'expense' || t.type === 'debt') return acc - t.amount;
                  return acc;
                }, 0);
                return (
                  <View key={group.label}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.dateGroupLabel, { color: theme.textMuted }]}>{group.label}</Text>
                      <Text style={[styles.dateGroupLabel, { color: dayNet >= 0 ? theme.success : theme.danger, fontWeight: '600' }]}>
                        {dayNet >= 0 ? '+' : ''}{formatCurrency(dayNet, 'history')}
                      </Text>
                    </View>
                    <View style={[styles.txCard, { backgroundColor: theme.card }]}>
                      {group.data.map((t, idx) => (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setEditingTransaction(t);
                            setShowTransactionModal(true);
                          }}
                        >
                          <View style={[
                            styles.txRow,
                            idx < group.data.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight }
                          ]}>
                            <View style={[styles.txIconCircle, { backgroundColor: (t.type === 'income' ? theme.success : theme.danger) + '15' }]}>
                              <IconSymbol name={getCategoryIcon(t.category, t.type) as any} size={18} color={t.type === 'income' ? theme.success : theme.danger} />
                            </View>
                            <View style={styles.txInfo}>
                              <Text style={[styles.txCategory, { color: theme.text }]}>{t.category}</Text>
                              {t.note ? <Text style={[styles.txSub, { color: theme.textMuted }]}>{t.note}</Text> : null}
                            </View>
                            <Text style={[styles.txAmount, { color: t.type === 'income' ? theme.success : theme.danger }]}>
                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, 'history')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              });
            })()}
          </ScrollView>
        </View>
      </Modal>

      <TransactionModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        editingTransaction={editingTransaction}
      />

      <SavingsModal
        visible={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
        currentBalance={savingsBalance}
        currentGoal={monthlySavingsGoal}
        transactions={savingsTransactions}
        budgetTransactions={transactions}
        onAddTransaction={(amount, type, note, affectBudget) => addSavingsTransaction(amount, type, note, affectBudget)}
        onUpdateTransaction={(transaction, affectBudget) => updateSavingsTransaction(transaction, affectBudget)}
        onDeleteTransaction={(id) => deleteSavingsTransaction(id)}
        onUpdateGoal={(amount) => updateMonthlySavingsGoal(amount)}
      />

      {/* Period Modal */}
      <Modal visible={showPeriodModal} animationType="fade" transparent={true}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeriodModal(false)}
        >
          <View style={[styles.periodCard, { backgroundColor: theme.card }, SharedStyles.softShadowMd]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowPeriodModal(false)}
                style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}>
                <Ionicons name="close" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {getAllPeriods().map((period) => (
                <TouchableOpacity
                  key={period.month}
                  style={[
                    styles.periodItem,
                    { borderBottomColor: theme.borderLight },
                    selectedPeriod?.month === period.month && { backgroundColor: theme.primarySoft }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedPeriod(period);
                    setShowPeriodModal(false);
                  }}
                >
                  <Text style={[
                    styles.periodItemText,
                    { color: theme.text },
                    selectedPeriod?.month === period.month && { color: theme.tint, fontWeight: '700' }
                  ]}>
                    {getMonthName(period)}
                  </Text>
                  {selectedPeriod?.month === period.month && (
                    <Ionicons name="checkmark-circle" size={18} color={theme.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <SecurityModal
        visible={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        onSuccess={() => setShowSavingsModal(true)}
        storedPin={userPin}
        onSetPin={(pin) => updateUserPin(pin)}
      />

      <InputModal
        visible={showInitialBalanceModal}
        title="Adjust Total Balance"
        value={tempInitialBalance}
        onChangeText={setTempInitialBalance}
        onConfirm={async () => {
          await reconcileBalance(Number(tempInitialBalance) || 0);
          setShowInitialBalanceModal(false);
        }}
        onCancel={() => setShowInitialBalanceModal(false)}
        keyboardType="numeric"
        prefix="₦"
      >
        <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: -8, marginBottom: 16, lineHeight: 20 }}>
          Enter your current actual bank balance. The app will calibrate itself to match.
        </Text>
      </InputModal>

      {!isHistorical && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.tint }, SharedStyles.softShadowMd]}
          onPress={() => {
            setEditingTransaction(null);
            setShowTransactionModal(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}
      {rebalanceTarget && (
        <RebalanceModal
          visible={showRebalanceModal}
          onClose={() => setShowRebalanceModal(false)}
          overspentCategory={rebalanceTarget.category}
          overspentAmount={rebalanceTarget.amount}
          budgets={budgets}
          getBudgetStatus={getBudgetStatus}
          onRebalance={(from: string, amt: number) => rebalanceBudgets(from, rebalanceTarget.category, amt)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerGreeting: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Hero Card
  heroCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  heroCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
    marginTop: 6,
  },
  heroPerDay: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 8,
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  heroStatSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    fontWeight: '500',
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
  },

  // Historical
  histBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  histBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historicalGrid: {
    gap: 16,
  },
  historicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  histStat: {
    flex: 1,
    alignItems: 'center',
  },
  histStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  histStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  histDivider: {
    width: 1,
    height: 28,
  },
  histRowDivider: {
    height: 1,
    marginHorizontal: -4,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  actionTile: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0', // theme.border
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTileText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Section
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Budget Cards
  budgetCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0', // theme.border
  },
  budgetCardDashed: {
    borderWidth: 1,
    borderStyle: 'dotted',
  },
  budgetCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  catIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 15,
    fontWeight: '600',
  },
  budgetSub: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  budgetPct: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  unbudgetedPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  unbudgetedPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  velocityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  velocityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  velocityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  healBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  healBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  billsBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  billsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  billsTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billsTotal: {
    fontSize: 13,
    fontWeight: '600',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  billName: {
    fontSize: 13,
    fontWeight: '400',
  },
  billAmount: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Transactions
  txCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0', // theme.border
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txCategory: {
    fontSize: 15,
    fontWeight: '600',
  },
  txSub: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },

  // Date label
  dateGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 2,
    letterSpacing: 0.3,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // Modals
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  periodCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
  },
  periodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 2,
  },
  periodItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});