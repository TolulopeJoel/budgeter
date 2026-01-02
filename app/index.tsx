import MonthConfirmModal from '@/components/MonthConfirmModal';
import TransactionModal from '@/components/TransactionModal';
import { Colors } from '@/constants/Colors';
import { Transaction, useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Dashboard() {
  const {
    getSafeToSpend,
    getCurrentMonthIncome,
    getCurrentMonthExpenses,
    getTotalRecurringBills,
    transactions,
    budgets,
    getBudgetStatus,
    currentPeriod,
  } = useBudget();

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Real calculations from context
  const safeToSpend = getSafeToSpend();
  const recurringBills = getTotalRecurringBills();
  const currentSpent = getCurrentMonthExpenses();

  // Get month name
  const getMonthName = () => {
    if (!currentPeriod) return 'This Month';
    const [year, month] = currentPeriod.month.split('-');
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
    if (percentage >= 90) return theme.danger;
    if (percentage >= 80) return theme.warning;
    return theme.success;
  };

  // Filter current month transactions
  const recentTransactions = transactions
    .filter(t => {
      if (!currentPeriod) return false;
      const transDate = new Date(t.date);
      const periodStart = new Date(currentPeriod.startDate);
      return transDate >= periodStart;
    })
    .slice(0, 5);

  return (
    <>
      <MonthConfirmModal />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Budgeter</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.tint }]}
            onPress={() => {
              setEditingTransaction(null);
              setShowTransactionModal(true);
            }}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Main Card - Safe to Spend */}
        <View style={[styles.mainCard, { backgroundColor: theme.tint }]}>
          <View style={styles.mainCardHeader}>
            <Text style={styles.mainCardLabel}>Safe to Spend</Text>
            <Text style={styles.mainCardMonth}>{getMonthName()}</Text>
          </View>
          <Text style={styles.mainCardAmount}>{formatCurrency(safeToSpend)}</Text>
          <View style={styles.mainCardFooter}>
            <View style={styles.mainCardStat}>
              <Text style={styles.statLabel}>Income</Text>
              {/* <Text style={styles.statValue}>{formatCurrency(getCurrentMonthIncome())}</Text> */}
              <Text style={styles.statValue}>****</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.mainCardStat}>
              <Text style={styles.statLabel}>Spent</Text>
              <Text style={styles.statValue}>{formatCurrency(currentSpent)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Link href="/budgets" asChild style={[styles.actionLink, { backgroundColor: theme.tint + '15', borderColor: theme.border }]}>
            <TouchableOpacity>
              <View style={styles.actionIconContainer}>
                <Ionicons name="pie-chart" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Budgets</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/bills" asChild style={[styles.actionLink, { backgroundColor: theme.tint + '15', borderColor: theme.border }]}>
            <TouchableOpacity>
              <View style={styles.actionIconContainer}>
                <Ionicons name="receipt" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Bills</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/debts" asChild style={[styles.actionLink, { backgroundColor: theme.tint + '15', borderColor: theme.border }]}>
            <TouchableOpacity>
              <View style={styles.actionIconContainer}>
                <Ionicons name="cash" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Debts</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Summary Section removed as it's now in the main card */}

        {/* Budget Status */}
        {budgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Status</Text>
              <Link href="/budgets" asChild>
                <TouchableOpacity>
                  <Text style={[styles.seeAllText, { color: theme.tint }]}>Manage</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {budgets.map((budget) => {
              const status = getBudgetStatus(budget.category);
              const budgetColor = getBudgetColor(status.percentage);

              return (
                <View
                  key={budget.category}
                  style={[styles.budgetItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={styles.budgetHeader}>
                    <Text style={[styles.budgetCategory, { color: theme.text }]}>
                      {budget.category}
                    </Text>
                    <Text style={[styles.budgetAmount, { color: theme.text }]}>
                      {formatCurrency(status.spent)} / {formatCurrency(status.limit)}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${status.percentage}%`, backgroundColor: budgetColor }
                      ]}
                    />
                  </View>
                  <View style={styles.budgetFooter}>
                    <Text style={[styles.budgetPercentage, { color: budgetColor }]}>
                      {status.percentage.toFixed(0)}% used
                    </Text>
                    {status.percentage >= 80 && (
                      <Text style={[styles.budgetWarning, { color: budgetColor }]}>
                        {status.percentage >= 90 ? '⛔ Over budget!' : '⚠️ Running low'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => setShowAllTransactions(true)}>
              <Text style={[styles.seeAllText, { color: theme.tint }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.transactionItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setEditingTransaction(t);
                  setShowTransactionModal(true);
                }}
              >
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

      {/* All Transactions Modal */}
      <Modal visible={showAllTransactions} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>All Transactions</Text>
            <TouchableOpacity onPress={() => setShowAllTransactions(false)}>
              <Text style={[styles.modalCloseButton, { color: theme.tint }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {recentTransactions.length > 0 ? (
              transactions
                .filter(t => {
                  if (!currentPeriod) return false;
                  const transDate = new Date(t.date);
                  const periodStart = new Date(currentPeriod.startDate);
                  return transDate >= periodStart;
                })
                .map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.transactionItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => {
                      setEditingTransaction(t);
                      setShowTransactionModal(true);
                    }}
                  >
                    <View>
                      <Text style={[styles.transactionCategory, { color: theme.text }]}>
                        {t.category}
                      </Text>
                      <Text style={[styles.transactionDate, { color: theme.icon }]}>
                        {new Date(t.date).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        {t.note && ` • ${t.note}`}
                      </Text>
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
          </ScrollView>
        </View>
      </Modal>
      <TransactionModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        editingTransaction={editingTransaction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 16,
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '700',
  },
  budgetAmount: {
    fontSize: 14,
    opacity: 0.7,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetPercentage: {
    fontSize: 13,
    fontWeight: '600',
  },
  budgetWarning: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingTop: 60,
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
});