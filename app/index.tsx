import InputModal from '@/components/InputModal';
import MonthConfirmModal from '@/components/MonthConfirmModal';
import SavingsModal from '@/components/SavingsModal';
import SecurityModal from '@/components/SecurityModal';
import TransactionModal from '@/components/TransactionModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NeoCard } from '@/components/ui/NeobrutalistComponents';
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
  } = useBudget();

  const insets = useSafeAreaInsets();

  const theme = Colors.light;

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

  // Real calculations from context
  const safeToSpend = getSafeToSpend();
  const totalRecurringBills = getTotalRecurringBills();
  const currentSpent = getCurrentMonthExpenses();

  // Get month name
  const getMonthName = (period = selectedPeriod || currentPeriod) => {
    if (!period) return 'This Month';
    const [year, month] = period.month.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount: number, privacyType?: 'dashboard' | 'budgets' | 'history') => {
    if (privacyType === 'dashboard' && isMainCardPrivacyEnabled) return '₦ █████';
    if (privacyType === 'budgets' && isBudgetsPrivacyEnabled) return '₦ █████';
    if (privacyType === 'history' && isHistoryPrivacyEnabled) return '₦ █████';
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getBudgetColor = (percentage: number) => {
    if (percentage >= 100) return theme.danger;
    if (percentage >= 80) return theme.warning;
    return theme.tint;
  };

  const getCategoryIcon = (categoryName: string, type?: string) => {
    if (type === 'income' || categoryName === 'Income') return 'arrow.down.circle.fill';
    if (type === 'debt' || categoryName === 'Debt') return 'arrow.up.circle.fill';
    const category = categories.find(c => c.name === categoryName);
    return category?.icon || (type === 'expense' ? 'arrow.up.circle.fill' : 'ellipsis.circle.fill');
  };

  // Filter current month transactions
  const recentTransactions = getCurrentMonthTransactions()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Group transactions by date label
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

  // Historical check
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isHistorical = selectedPeriod && selectedPeriod.month !== currentMonthKey;

  // Data for historical view
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

      // Header
      let csvContent = 'Date,Description,Category,Amount,Type\n';

      // Rows
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

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: 'utf8' as any,
      });

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
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Akíkanjú Ọkùnrin, {new Date().getDate()}</Text>
        </View>

        {/* Main Card Section */}
        {isHistorical ? (
          <NeoCard
            style={styles.mainCard}
          >
            <View style={styles.mainCardHeader}>
              <View>
                <View style={[styles.historicalBadge, { backgroundColor: theme.icon + '10' }]}>
                  <Text style={[styles.historicalBadgeText, { color: theme.icon }]}>PAST MONTH</Text>
                </View>
                <Text style={styles.mainCardLabel}>Summary</Text>
              </View>
              <TouchableOpacity
                style={styles.periodSelector}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPeriodModal(true);
                }}
              >
                <Text style={styles.mainCardMonth}>{getMonthName()}</Text>
                <Ionicons name="chevron-down" size={12} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.historicalGridContainer}>
              <View style={styles.historicalGrid}>
                {/* Row 1: Balances */}
                <View style={styles.historicalRow}>
                  <View style={styles.historicalStatItem}>
                    <Text style={styles.historicalStatLabel}>Opening</Text>
                    <Text style={styles.historicalStatValue}>
                      {formatCurrency(openingBalance, 'dashboard')}
                    </Text>
                  </View>
                  <View style={styles.historicalDivider} />
                  <View style={styles.historicalStatItem}>
                    <Text style={styles.historicalStatLabel}>Closing</Text>
                    <Text style={styles.historicalStatValue}>
                      {formatCurrency(closingBalance, 'dashboard')}
                    </Text>
                  </View>
                </View>

                <View style={styles.historicalRowDivider} />

                {/* Row 2: Performance */}
                <View style={styles.historicalRow}>
                  <View style={styles.historicalStatItem}>
                    <Text style={styles.historicalStatLabel}>Spent</Text>
                    <Text style={styles.historicalStatValue}>
                      {formatCurrency(coreSpent, 'dashboard')}
                    </Text>
                  </View>
                  <View style={styles.historicalDivider} />
                  <View style={styles.historicalStatItem}>
                    <Text style={styles.historicalStatLabel}>Saved</Text>
                    <Text style={styles.historicalStatValue}>
                      {formatCurrency(monthlySavingsDeposits, 'dashboard')}
                    </Text>
                  </View>
                  <View style={styles.historicalDivider} />
                  <View style={styles.historicalStatItem}>
                    <Text style={styles.historicalStatLabel}>Unused</Text>
                    <Text style={[styles.historicalStatValue, { color: monthlyUnused >= 0 ? theme.success : theme.danger }]}>
                      {formatCurrency(monthlyUnused, 'dashboard')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </NeoCard>
        ) : (
          <NeoCard
            backgroundColor={theme.primary}
            style={styles.mainCard}
          >
            <View style={styles.mainCardHeader}>
              <View>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleMainCardPrivacy();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mainCardLabel}>Safe to Spend</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.periodSelector}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPeriodModal(true);
                }}
              >
                <Text style={styles.mainCardMonth}>{getMonthName()}</Text>
                <Ionicons name="chevron-down" size={12} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.mainCardBody}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={styles.mainCardAmount}>
                  {formatCurrency(safeToSpend, 'dashboard')}
                </Text>
                {!isMainCardPrivacyEnabled && safeToSpend > 0 && (() => {
                  const today = new Date();
                  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                  const daysLeft = daysInMonth - today.getDate() + 1;
                  const perDay = safeToSpend / daysLeft;
                  return (
                    <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontWeight: '700', marginTop: 6, marginLeft: 6 }}>
                      {formatCurrency(perDay)}{'\n'}/day
                    </Text>
                  );
                })()}
              </View>
            </View>

            <View style={styles.mainCardFooter}>
              <TouchableOpacity
                style={styles.mainCardStat}
                onPress={() => {
                  if (isMainCardPrivacyEnabled) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTempInitialBalance(getAccountBalance().toString());
                  setShowInitialBalanceModal(true);
                }}
                activeOpacity={isMainCardPrivacyEnabled ? 1 : 0.7}
              >
                <Text style={[styles.statLabel, { color: '#000' }]}>Balance</Text>
                <Text style={[styles.statValue, { color: '#000' }]}>{formatCurrency(getAccountBalance(), 'dashboard')}</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
              <View style={styles.mainCardStat}>
                <Text style={[styles.statLabel, { color: '#000' }]}>Spent</Text>
                <Text style={[styles.statValue, { color: '#000' }]}>{formatCurrency(totalExpenses, 'dashboard')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
              <TouchableOpacity
                style={styles.mainCardStat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSecurityAction('manage_savings');
                  setShowSecurityModal(true);
                }}
              >
                <Text style={[styles.statLabel, { color: '#000' }]}>Saved</Text>
                <Text style={[styles.statValue, { color: '#000' }]}>
                  {formatCurrency(savingsBalance, 'dashboard')}
                </Text>
                {!isMainCardPrivacyEnabled && getRemainingSavingsGoal() > 0 && (
                  <Text style={{ fontSize: 9, color: 'rgba(0,0,0,0.5)', fontWeight: '700', marginTop: 2 }}>
                    {formatCurrency(getRemainingSavingsGoal())} LEFT
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </NeoCard>
        )}

        {/* Quick Actions - Hidden for historical periods */}
        {!isHistorical && (
          <View style={styles.quickActions}>
            <Link href="/budgets" asChild style={{ flex: 1 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <NeoCard style={styles.actionLink} backgroundColor={theme.success}>
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="pie-chart" size={24} color="#000" />
                  </View>
                  <Text style={styles.actionText}>Budgets</Text>
                </NeoCard>
              </TouchableOpacity>
            </Link>
            <Link href="/bills" asChild style={{ flex: 1 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <NeoCard style={styles.actionLink} backgroundColor={theme.warning}>
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="receipt" size={24} color="#000" />
                  </View>
                  <Text style={styles.actionText}>Bills</Text>
                </NeoCard>
              </TouchableOpacity>
            </Link>
            <Link href="/debts" asChild style={{ flex: 1 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <NeoCard style={styles.actionLink} backgroundColor={theme.primary}>
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="cash" size={24} color="#000" />
                  </View>
                  <Text style={styles.actionText}>Lent Out</Text>
                </NeoCard>
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
                status: { spent, limit: 0, percentage: 0, type: 'flexible' as const },
                projectedTotal: spent,
                isUnbudgeted: true
              };
            })
          ];

          if (allBudgetItems.length === 0) return null;

          return (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleBudgetsPrivacy();
                  }}
                >
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionAccent} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Status</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {allBudgetItems
                .sort((a, b) => {
                  // 0. Unbudgeted always go to bottom
                  if (a.isUnbudgeted && !b.isUnbudgeted) return 1;
                  if (!a.isUnbudgeted && b.isUnbudgeted) return -1;

                  if (a.isUnbudgeted && b.isUnbudgeted) {
                    return b.status.spent - a.status.spent;
                  }

                  // Sorting for budgeted items
                  const aUrgent = a.status.percentage >= 50;
                  const bUrgent = b.status.percentage >= 50;

                  if (aUrgent && !bUrgent) return -1;
                  if (!aUrgent && bUrgent) return 1;

                  if (aUrgent && bUrgent) {
                    return b.projectedTotal - a.projectedTotal;
                  }

                  const percentDiff = b.status.percentage - a.status.percentage;
                  if (percentDiff !== 0) return percentDiff;

                  return b.projectedTotal - a.projectedTotal;
                })
                .map((item) => {
                  const { status, isUnbudgeted } = item;
                  const budgetColor = isUnbudgeted ? theme.icon + '40' : getBudgetColor(status.percentage);

                  return (
                    <TouchableOpacity
                      key={item.category}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCategory(item.category);
                      }}
                      disabled={!!isHistorical}
                    >
                      <NeoCard style={[
                        styles.budgetItem,
                        isUnbudgeted && { borderStyle: 'dashed' },
                        isHistorical && { backgroundColor: theme.card + '80' }
                      ]}>
                        <View style={styles.budgetHeader}>
                          <View style={[styles.categoryIconContainer, { backgroundColor: (isUnbudgeted ? theme.icon : theme.tint) + '10' }]}>
                            <IconSymbol name={getCategoryIcon(item.category) as any} size={20} color={isUnbudgeted ? theme.icon : theme.tint} />
                          </View>
                          <View style={styles.budgetInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.budgetCategory, { color: theme.text }]}>
                                {item.category}
                              </Text>
                              {isUnbudgeted && (
                                <View style={styles.unbudgetedBadge}>
                                  <Text style={styles.unbudgetedBadgeText}>UNTRACKED</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.budgetAmount, { color: theme.icon, opacity: 0.7 }]}>
                              {isUnbudgeted ? 'Total Spent' : `${formatCurrency(status.spent, 'budgets')} spent of ${formatCurrency(status.limit, 'budgets')}`}
                            </Text>
                          </View>
                          <View style={styles.budgetRight}>
                            {isUnbudgeted ? (
                              <Text style={[styles.budgetPercentage, { color: theme.icon }]}>
                                {formatCurrency(status.spent, 'budgets')}
                              </Text>
                            ) : (
                              <Text style={[styles.budgetPercentage, { color: isHistorical ? 'rgba(0,0,0,0.4)' : budgetColor }]}>
                                {status.percentage.toFixed(0)}%
                              </Text>
                            )}
                          </View>
                        </View>

                        {!isUnbudgeted && (
                          <View style={styles.progressBarContainer}>
                            {(() => {
                              const categoryBills = recurringBills.filter(b => b.category === item.category);
                              const unpaidBills = categoryBills.filter(b => !isBillPaid(b.id, currentMonthKey));
                              const totalUnpaidBills = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
                              const projectedSpent = status.spent + totalUnpaidBills;
                              const projectedPercentage = Math.min((projectedSpent / status.limit) * 100, 100);

                              return (
                                <>
                                  {totalUnpaidBills > 0 && (
                                    <View
                                      style={[
                                        styles.progressBar,
                                        styles.projectedProgressBar,
                                        { width: `${projectedPercentage}%`, backgroundColor: budgetColor + '40' }
                                      ]}
                                    />
                                  )}
                                  <View
                                    style={[
                                      styles.progressBar,
                                      { width: `${status.percentage}%`, backgroundColor: isHistorical ? 'rgba(0,0,0,0.2)' : budgetColor }
                                    ]}
                                  />
                                </>
                              );
                            })()}
                          </View>
                        )}

                        {/* Velocity Indicator */}
                        {!isUnbudgeted && !isHistorical && (() => {
                          const today = new Date();
                          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                          const daysLeft = daysInMonth - today.getDate() + 1;
                          const monthProgressPct = (today.getDate() / daysInMonth) * 100;
                          const spentPct = status.percentage;

                          if (spentPct - monthProgressPct > 15 && spentPct < 100) {
                            const overAmount = ((spentPct - monthProgressPct) / 100) * status.limit;
                            const dailyRate = status.limit / daysInMonth;
                            const daysToRecover = Math.ceil(overAmount / dailyRate);
                            const overBy = formatCurrency(overAmount);
                            return (
                              <View style={styles.velocityRow}>
                                <View style={[styles.velocityDot, { backgroundColor: theme.warning }]} />
                                <Text style={[styles.velocityText, { color: theme.warning }]}>
                                  {overBy} ahead · recover in {daysToRecover}d
                                </Text>
                              </View>
                            );
                          } else if (spentPct < 100) {
                            const remaining = status.limit - status.spent;
                            const perDay = remaining / daysLeft;
                            return (
                              <View style={styles.velocityRow}>
                                <View style={[styles.velocityDot, { backgroundColor: theme.success }]} />
                                <Text style={[styles.velocityText, { color: theme.success }]}>
                                  {formatCurrency(perDay, 'budgets')} / day left to spend
                                </Text>
                              </View>
                            );
                          }
                        })()}


                        {/* Bills Breakdown */}
                        {!isUnbudgeted && (() => {
                          const categoryBills = recurringBills.filter(b => b.category === item.category);
                          const unpaidBills = categoryBills.filter(b => !isBillPaid(b.id, currentMonthKey));

                          if (unpaidBills.length === 0) return null;

                          const totalUnpaidBills = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

                          return (
                            <View style={[styles.billsBreakdown, { borderTopColor: 'rgba(0,0,0,0.05)' }]}>
                              <View style={styles.billsHeader}>
                                <Text style={[styles.billsTitle, { color: theme.icon }]}>Unpaid bills:</Text>
                                <Text style={[styles.billsTotal, { color: theme.danger + '80' }]}>
                                  {formatCurrency(totalUnpaidBills, 'history')}
                                </Text>
                              </View>
                              {unpaidBills.map(bill => (
                                <View key={bill.id} style={styles.billRow}>
                                  <Text style={[styles.billName, { color: theme.text }]}>• {bill.name}</Text>
                                  <Text style={[styles.billAmount, { color: theme.icon }]}>
                                    {formatCurrency(bill.amount, 'history')}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          );
                        })()}
                      </NeoCard>
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
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAllTransactions(true);
              }}
            >
              <Text style={[styles.seeAllText, { color: theme.tint }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            groupTransactionsByDate(recentTransactions).map(group => (
              <View key={group.label}>
                <Text style={[styles.dateGroupLabel, { color: theme.icon }]}>{group.label}</Text>
                {group.data.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEditingTransaction(t);
                      setShowTransactionModal(true);
                    }}
                  >
                    <NeoCard style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIconContainer, { backgroundColor: (t.type === 'income' ? theme.success : theme.danger) + '10' }]}>
                          <IconSymbol
                            name={getCategoryIcon(t.category, t.type) as any}
                            size={20}
                            color={t.type === 'income' ? theme.success : theme.danger}
                          />
                        </View>
                        <View>
                          <Text style={[styles.transactionCategory, { color: theme.text }]}>
                            {t.category}
                          </Text>
                          <Text style={[styles.transactionDate, { color: theme.icon }]}>
                            {new Date(t.date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                            {t.note ? ` • ${t.note}` : ''}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: t.type === 'income' ? theme.success : theme.danger }
                        ]}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount, 'history')}
                      </Text>
                    </NeoCard>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <Ionicons name="receipt-outline" size={32} color={theme.icon} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Text style={[styles.emptyStateText, { color: theme.text, fontWeight: '800' }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptyStateSubText, { color: theme.icon }]}>
                Tap + below to add your first one
              </Text>
            </View>
          )}
        </View>
      </ScrollView >

      {/* Category Transactions Modal */}
      <Modal visible={selectedCategory !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.background, paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedCategory} Activity</Text>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {(() => {
              const filtered = getCurrentMonthTransactions()
                .filter(t => t.category === selectedCategory)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              if (filtered.length === 0) {
                return (
                  <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                    <Text style={[styles.emptyStateText, { color: theme.icon }]}>
                      No transactions for this category yet.
                    </Text>
                  </View>
                );
              }

              return groupTransactionsByDate(filtered).map(group => (
                <View key={group.label}>
                  <Text style={[styles.dateGroupLabel, { color: theme.icon }]}>{group.label}</Text>
                  {group.data.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditingTransaction(t);
                        setShowTransactionModal(true);
                      }}
                    >
                      <NeoCard style={styles.transactionItem}>
                        <View style={styles.transactionLeft}>
                          <View style={[styles.transactionIconContainer, { backgroundColor: (t.type === 'income' ? theme.success : theme.danger) + '10' }]}>
                            <IconSymbol
                              name={getCategoryIcon(t.category, t.type) as any}
                              size={20}
                              color={t.type === 'income' ? theme.success : theme.danger}
                            />
                          </View>
                          <View>
                            <Text style={[styles.transactionCategory, { color: theme.text, fontSize: 16 }]}>
                              {t.note ? t.note : t.category}
                            </Text>
                            <Text style={[styles.transactionDate, { color: theme.icon, marginTop: 2 }]}>
                              {new Date(t.date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.transactionAmount,
                            { color: t.type === 'income' ? theme.success : theme.danger }
                          ]}
                        >
                          {t.type === 'income' ? '+' : '-'}
                          {formatCurrency(t.amount, 'history')}
                        </Text>
                      </NeoCard>
                    </TouchableOpacity>
                  ))}
                </View>
              ));
            })()}
          </ScrollView>
        </View>
      </Modal >

      {/* All Transactions Modal */}
      <Modal visible={showAllTransactions} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.background, paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleExportCSV} style={[styles.exportButton, SharedStyles.neoBorder, { backgroundColor: theme.card, padding: 8 }]}>
              <Ionicons name="share-outline" size={18} color={theme.tint} />
              <Text style={[styles.exportButtonText, { color: theme.tint }]}>CSV</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>All History</Text>
            <TouchableOpacity onPress={() => {
              setShowAllTransactions(false);
              setHistorySearch('');
              setHistoryCategoryFilter(null);
            }}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar — only shown when there are enough transactions */}
          {getCurrentMonthTransactions().length >= 20 && (
            <View style={[styles.searchBar, SharedStyles.neoBorder, { backgroundColor: theme.card }]}>
              <Ionicons name="search-outline" size={16} color={theme.icon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={`Search ${getCurrentMonthTransactions().length} transactions...`}
                placeholderTextColor={theme.icon}
                value={historySearch}
                onChangeText={setHistorySearch}
                autoCorrect={false}
              />
              {historySearch.length > 0 && (
                <TouchableOpacity onPress={() => setHistorySearch('')}>
                  <Ionicons name="close-circle" size={16} color={theme.icon} />
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
                  <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                    <Ionicons name="search-outline" size={28} color={theme.icon} style={{ opacity: 0.4, marginBottom: 8 }} />
                    <Text style={[styles.emptyStateText, { color: theme.text, fontWeight: '800' }]}>
                      No results found
                    </Text>
                    <Text style={[styles.emptyStateSubText, { color: theme.icon }]}>
                      Try a different search or category
                    </Text>
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
                      <Text style={[styles.dateGroupLabel, { color: theme.icon }]}>{group.label}</Text>
                      <Text style={[styles.dateGroupLabel, { color: dayNet >= 0 ? theme.success : theme.danger, fontWeight: '700' }]}>
                        {dayNet >= 0 ? '+' : ''}{formatCurrency(dayNet, 'history')}
                      </Text>
                    </View>
                    {group.data.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditingTransaction(t);
                          setShowTransactionModal(true);
                        }}
                      >
                        <NeoCard style={styles.transactionItem}>
                          <View style={styles.transactionLeft}>
                            <View style={[styles.transactionIconContainer, { backgroundColor: (t.type === 'income' ? theme.success : theme.danger) + '10' }]}>
                              <IconSymbol
                                name={getCategoryIcon(t.category, t.type) as any}
                                size={20}
                                color={t.type === 'income' ? theme.success : theme.danger}
                              />
                            </View>
                            <View>
                              <Text style={[styles.transactionCategory, { color: theme.text, fontSize: 16 }]}>
                                {t.category}
                              </Text>
                              {t.note ? (
                                <Text style={[styles.transactionDate, { color: theme.icon, marginTop: 2 }]}>{t.note}</Text>
                              ) : null}
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.transactionAmount,
                              { color: t.type === 'income' ? theme.success : theme.danger }
                            ]}
                          >
                            {t.type === 'income' ? '+' : '-'}
                            {formatCurrency(t.amount, 'history')}
                          </Text>
                        </NeoCard>
                      </TouchableOpacity>
                    ))}
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
        onAddTransaction={(amount, type, note, affectBudget) => {
          addSavingsTransaction(amount, type, note, affectBudget);
        }}
        onUpdateTransaction={(transaction, affectBudget) => {
          updateSavingsTransaction(transaction, affectBudget);
        }}
        onDeleteTransaction={(id) => {
          deleteSavingsTransaction(id);
        }}
        onUpdateGoal={(amount) => updateMonthlySavingsGoal(amount)}
      />

      {/* Period Selection Modal */}
      <Modal visible={showPeriodModal} animationType="fade" transparent={true}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeriodModal(false)}
        >
          <NeoCard style={[styles.periodModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.periodModalTitle, { color: theme.text }]}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowPeriodModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.periodList}>
              {getAllPeriods().map((period) => (
                <TouchableOpacity
                  key={period.month}
                  style={[
                    styles.periodItem,
                    selectedPeriod?.month === period.month && { backgroundColor: theme.tint + '20' }
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
                    selectedPeriod?.month === period.month && { color: theme.tint, fontWeight: 'bold' }
                  ]}>
                    {getMonthName(period)}
                  </Text>
                  {selectedPeriod?.month === period.month && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </NeoCard>
        </TouchableOpacity>
      </Modal>

      <SecurityModal
        visible={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        onSuccess={() => {
          setShowSavingsModal(true);
        }}
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
        <Text style={{ fontSize: 12, color: theme.icon, marginTop: -8, marginBottom: 16 }}>
          Enter your current actual bank balance. The app will calibrate itself to match.
        </Text>
      </InputModal>

      {!isHistorical && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: theme.tint }]}
          onPress={() => {
            setEditingTransaction(null);
            setShowTransactionModal(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={{ height: insets.bottom }} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    height: 25,
    width: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    ...SharedStyles.neoBorder,
    ...SharedStyles.neoShadowLarge,
    zIndex: 1000,
  },
  mainCard: {
    marginBottom: 24,
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 0,
    ...SharedStyles.neoBorder,
    gap: 4,
  },
  historicalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  historicalBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 40,
  },
  mainCardBody: {
    minHeight: 0,
  },
  mainCardLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  mainCardSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: -2,
  },
  mainCardMonth: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  mainCardAmount: {
    color: '#000',
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 12,
  },
  mainCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 0,
    padding: 12,
    marginTop: 8,
    ...SharedStyles.neoBorder,
  },
  mainCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  statDivider: {
    width: 2,
    height: 24,
    backgroundColor: '#000',
  },
  historicalGridContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 12,
    paddingTop: 16,
  },
  historicalGrid: {
    gap: 20,
  },
  historicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historicalStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  historicalStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  historicalStatValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  historicalDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  historicalRowDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: -16,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 8,
  },
  actionLink: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#000',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllButton: {
    borderBottomWidth: 1.5,
    borderBottomColor: 'currentColor',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  budgetItem: {
    marginBottom: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
    ...SharedStyles.neoBorder,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '800',
  },
  budgetAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 0,
    overflow: 'hidden',
    ...SharedStyles.neoBorder,
  },
  progressBar: {
    height: '100%',
    borderRadius: 0,
  },
  projectedProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  budgetPercentage: {
    fontSize: 16,
    fontWeight: '900',
  },
  unbudgetedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#000',
  },
  unbudgetedBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  velocityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  velocityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  velocityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
    ...SharedStyles.neoBorder,
  },
  transactionCategory: {
    fontSize: 15,
    fontWeight: '800',
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  emptyState: {
    padding: 32,
    borderRadius: 0,
    alignItems: 'center',
    ...SharedStyles.neoBorder,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyStateSubText: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.6,
  },
  dateGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  periodModalContent: {
    width: '100%',
    maxHeight: '80%',
    padding: 24,
  },
  periodModalTitle: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  periodList: {
    width: '100%',
  },
  periodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    ...SharedStyles.neoBorder,
  },
  periodItemText: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
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
    marginBottom: 8,
  },
  billsTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billsTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  billRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  billName: {
    fontSize: 13,
    fontWeight: '500',
  },
  billAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  paidBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unpaidBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unpaidBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});