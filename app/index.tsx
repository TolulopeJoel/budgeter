import MonthConfirmModal from '@/components/MonthConfirmModal';
import SavingsModal from '@/components/SavingsModal';
import SecurityModal from '@/components/SecurityModal';
import TransactionModal from '@/components/TransactionModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { Transaction, useBudget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
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
  } = useBudget();

  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [isTotalSavingsVisible, setIsTotalSavingsVisible] = useState(false);
  const [securityAction, setSecurityAction] = useState<'reveal_balance' | 'manage_savings'>('manage_savings');

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

  const formatCurrency = (amount: number) => {
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

  // Get current month key for bill status checks
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

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
          <Image
            source={colorScheme === 'dark' ? require('@/assets/images/iconDark.png') : require('@/assets/images/iconLight.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Main Card - Safe to Spend */}
        <View style={[styles.mainCard, { backgroundColor: theme.tint }]}>
          <View style={styles.mainCardHeader}>
            <Text style={styles.mainCardLabel}>Safe to Spend</Text>
            <TouchableOpacity
              style={styles.periodSelector}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPeriodModal(true);
              }}
            >
              <Text style={styles.mainCardMonth}>{getMonthName()}</Text>
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
          <Text style={styles.mainCardAmount}>{formatCurrency(safeToSpend)}</Text>
          <View style={styles.mainCardFooter}>
            <TouchableOpacity
              style={styles.mainCardStat}
              onPress={() => {
                if (isTotalSavingsVisible) {
                  setIsTotalSavingsVisible(false);
                } else {
                  setSecurityAction('reveal_balance');
                  setShowSecurityModal(true);
                }
              }}
            >
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={styles.statValue}>
                {isTotalSavingsVisible ? formatCurrency(savingsBalance) : '••••••'}
              </Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.mainCardStat}>
              <Text style={styles.statLabel}>Spent</Text>
              <Text style={styles.statValue}>{formatCurrency(currentSpent)}</Text>
            </View>
          </View>
        </View>

        {/* Savings Card */}
        <TouchableOpacity
          style={[styles.savingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSecurityAction('manage_savings');
            setShowSecurityModal(true);
          }}
        >
          <View style={styles.savingsHeader}>
            <View style={[styles.savingsIconContainer, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="wallet" size={24} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.savingsLabel, { color: theme.icon }]}>Need To Save</Text>
              <Text style={[styles.savingsAmount, { color: theme.text }]}>
                {formatCurrency(getRemainingSavingsGoal())}
              </Text>
            </View>
          </View>
          <View style={styles.savingsFooter}>
            <Text style={[styles.savingsDeduction, { color: theme.icon }]}>
              {monthlySavingsGoal > 0
                ? `Deducting ${formatCurrency(monthlySavingsGoal)}/mo`
                : 'No monthly deduction set'}
            </Text>
            <Ionicons name="lock-closed" size={18} color={theme.icon} style={{ marginLeft: 8 }} />
            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Link href="/budgets" asChild style={[styles.actionLink, { backgroundColor: theme.tint + '10', borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="pie-chart" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Budgets</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/bills" asChild style={[styles.actionLink, { backgroundColor: theme.tint + '10', borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="receipt" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Bills</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/debts" asChild style={[styles.actionLink, { backgroundColor: theme.tint + '10', borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="cash" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Lent Out</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Summary Section removed as it's now in the main card */}

        {/* Budget Status */}
        {budgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Status</Text>
            </View>

            {budgets
              .map(b => {
                const status = getBudgetStatus(b.category);
                const categoryBills = recurringBills.filter(bill => bill.category === b.category);
                const unpaidBills = categoryBills.filter(bill => !isBillPaid(bill.id, currentMonthKey));
                const totalUnpaidBills = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);
                const projectedTotal = status.spent + totalUnpaidBills;

                return {
                  ...b,
                  status,
                  projectedTotal
                };
              })
              .sort((a, b) => {
                const aUrgent = a.status.percentage >= 50;
                const bUrgent = b.status.percentage >= 50;

                // 1. Urgent categories come first
                if (aUrgent && !bUrgent) return -1;
                if (!aUrgent && bUrgent) return 1;

                // 2. If both are Urgent (>50%), sort by Projected Total (Highest Bills/Spend first)
                if (aUrgent && bUrgent) {
                  return b.projectedTotal - a.projectedTotal;
                }

                // 3. If both are Safe (<50%), sort by Percentage (Highest % first)
                // This ensures that a category with 40% spent comes before one with 10% spent (even if 10% has huge bills)
                const percentDiff = b.status.percentage - a.status.percentage;
                if (percentDiff !== 0) return percentDiff;

                // 4. Tie-breaker for Safe categories: Projected Total
                return b.projectedTotal - a.projectedTotal;
              })
              .map((budget) => {
                const { status } = budget;
                const budgetColor = getBudgetColor(status.percentage);

                return (
                  <TouchableOpacity
                    key={budget.category}
                    style={[styles.budgetItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(budget.category);
                    }}
                  >
                    <View style={styles.budgetHeader}>
                      <View style={[styles.categoryIconContainer, { backgroundColor: theme.tint + '10' }]}>
                        <IconSymbol name={getCategoryIcon(budget.category) as any} size={20} color={theme.tint} />
                      </View>
                      <View style={styles.budgetInfo}>
                        <Text style={[styles.budgetCategory, { color: theme.text }]}>
                          {budget.category}
                        </Text>
                        <Text style={[styles.budgetAmount, { color: theme.icon }]}>
                          {formatCurrency(status.spent)} of {formatCurrency(status.limit)}
                        </Text>
                      </View>
                      <View style={styles.budgetRight}>
                        <Text style={[styles.budgetPercentage, { color: budgetColor }]}>
                          {status.percentage.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBarContainer}>
                      {(() => {
                        // Calculate what spending would be if unpaid bills were paid
                        const categoryBills = recurringBills.filter(b => b.category === budget.category);
                        const unpaidBills = categoryBills.filter(b => !isBillPaid(b.id, currentMonthKey));
                        const totalUnpaidBills = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
                        const projectedSpent = status.spent + totalUnpaidBills;
                        const projectedPercentage = Math.min((projectedSpent / status.limit) * 100, 100);

                        return (
                          <>
                            {/* Projected spending bar (if bills were paid) */}
                            {totalUnpaidBills > 0 && (
                              <View
                                style={[
                                  styles.progressBar,
                                  styles.projectedProgressBar,
                                  { width: `${projectedPercentage}%`, backgroundColor: budgetColor + '40' }
                                ]}
                              />
                            )}
                            {/* Current actual spending bar */}
                            <View
                              style={[
                                styles.progressBar,
                                { width: `${status.percentage}%`, backgroundColor: budgetColor }
                              ]}
                            />
                          </>
                        );
                      })()}
                    </View>

                    {/* Bills Breakdown */}
                    {(() => {
                      const categoryBills = recurringBills.filter(b => b.category === budget.category);
                      const unpaidBills = categoryBills.filter(b => !isBillPaid(b.id, currentMonthKey));

                      if (unpaidBills.length === 0) return null;

                      const totalUnpaidBills = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

                      return (
                        <View style={[styles.billsBreakdown, { borderTopColor: theme.border }]}>
                          <View style={styles.billsHeader}>
                            <Text style={[styles.billsTitle, { color: theme.icon }]}>Unpaid bills:</Text>
                            <Text style={[styles.billsTotal, { color: theme.danger + '80' }]}>
                              {formatCurrency(totalUnpaidBills)}
                            </Text>
                          </View>
                          {unpaidBills.map(bill => (
                            <View key={bill.id} style={styles.billRow}>
                              <Text style={[styles.billName, { color: theme.text }]}>• {bill.name}</Text>
                              <Text style={[styles.billAmount, { color: theme.icon }]}>
                                {formatCurrency(bill.amount)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      );
                    })()}
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAllTransactions(true);
            }}>
              <Text style={[styles.seeAllText, { color: theme.tint }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.transactionItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingTransaction(t);
                  setShowTransactionModal(true);
                }}
              >
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
                      {new Date(t.date).toLocaleDateString('en-NG', {
                        month: 'short',
                        day: 'numeric'
                      })}
                      {t.note && ` • ${t.note}`}
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
                  {formatCurrency(t.amount)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyStateText, { color: theme.icon }]}>
                No transactions yet. Tap + to add one!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Category Transactions Modal */}
      <Modal visible={selectedCategory !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.background, paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedCategory} Activity</Text>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text style={[styles.modalCloseButton, { color: theme.tint }]}>Done</Text>
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

              return filtered.map((t, index, arr) => (
                <TouchableOpacity
                  key={t.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                    borderBottomColor: theme.border + '40',
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditingTransaction(t);
                    setShowTransactionModal(true);
                  }}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIconContainer, { backgroundColor: (t.type === 'income' ? theme.success : theme.danger) + '10' }]}>
                      <IconSymbol
                        name={getCategoryIcon(t.category, t.type) as any}
                        size={20}
                        color={theme.tint}
                      />
                    </View>
                    <View>
                      <Text style={[styles.transactionCategory, { color: theme.text, fontSize: 16 }]}>
                        {t.note ? t.note : t.category}
                      </Text>
                      <Text style={[styles.transactionDate, { color: theme.icon, marginTop: 2 }]}>
                        {new Date(t.date).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' • '}
                        {new Date(t.date).toLocaleTimeString('en-NG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
                    {formatCurrency(t.amount)}
                  </Text>
                </TouchableOpacity>
              ));
            })()}
          </ScrollView>
        </View>
      </Modal>

      {/* All Transactions Modal */}
      <Modal visible={showAllTransactions} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.background, paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleExportCSV} style={styles.exportButton}>
              <Ionicons name="share-outline" size={20} color={theme.tint} />
              <Text style={[styles.exportButtonText, { color: theme.tint }]}>CSV</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>All Transactions</Text>
            <TouchableOpacity onPress={() => setShowAllTransactions(false)}>
              <Text style={[styles.modalCloseButton, { color: theme.tint }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {(() => {
              const filtered = getCurrentMonthTransactions()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              if (filtered.length === 0) {
                return (
                  <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                    <Text style={[styles.emptyStateText, { color: theme.icon }]}>
                      No transactions yet. Tap + to add one!
                    </Text>
                  </View>
                );
              }

              return filtered.map((t, index, arr) => (
                <TouchableOpacity
                  key={t.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                    borderBottomColor: theme.border + '40',
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditingTransaction(t);
                    setShowTransactionModal(true);
                  }}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIconContainer, { backgroundColor: (t.type === 'income' ? theme.success : theme.danger) + '10' }]}>
                      <IconSymbol
                        name={getCategoryIcon(t.category, t.type) as any}
                        size={20}
                        color={theme.tint}
                      />
                    </View>
                    <View>
                      <Text style={[styles.transactionCategory, { color: theme.text, fontSize: 16 }]}>
                        {t.category}
                      </Text>
                      <Text style={[styles.transactionDate, { color: theme.icon, marginTop: 2 }]}>
                        {new Date(t.date).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        {t.note && ` • ${t.note}`}
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
                    {formatCurrency(t.amount)}
                  </Text>
                </TouchableOpacity>
              ));
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
          <View style={[styles.periodModalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.periodModalTitle, { color: theme.text }]}>Select Month</Text>
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
          </View>
        </TouchableOpacity>
      </Modal>

      <SecurityModal
        visible={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        onSuccess={() => {
          if (securityAction === 'reveal_balance') {
            setIsTotalSavingsVisible(true);
          } else {
            setShowSavingsModal(true);
          }
        }}
        storedPin={userPin}
        onSetPin={(pin) => updateUserPin(pin)}
      />

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
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 18, // This creates the squircle effect
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  mainCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  mainCardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainCardMonth: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainCardAmount: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  mainCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  mainCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 8,
  },
  actionLink: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 20,
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
    fontWeight: '600',
    letterSpacing: -0.2,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  budgetItem: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIconContainer: {
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  budgetAmount: {
    fontSize: 13,
    fontWeight: '500',
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  projectedProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  budgetPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionCategory: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
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
    fontWeight: 'bold',
  },
  modalCloseButton: {
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '600',
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
    maxHeight: '60%',
    borderRadius: 24,
    padding: 20,
  },
  periodModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
    borderRadius: 12,
    marginBottom: 4,
  },
  periodItemText: {
    fontSize: 18,
  },
  savingsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  savingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savingsAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  savingsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsDeduction: {
    fontSize: 12,
    fontWeight: '500',
    display: 'none', // Hide on small screens or if layout is tight, actually let's just show the arrow or make it simpler
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