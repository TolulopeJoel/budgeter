import MonthConfirmModal from '@/components/MonthConfirmModal';
import TransactionModal from '@/components/TransactionModal';
import { Colors } from '@/constants/Colors';
import { Transaction, useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const monthlyIncome = currentPeriod?.income || 0;
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
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Main Card - Safe to Spend */}
        <View style={[styles.mainCard, { backgroundColor: theme.tint }]}>
          <Text style={styles.mainCardLabel}>Safe to Spend</Text>
          <Text style={styles.mainCardAmount}>{formatCurrency(safeToSpend)}</Text>
          <Text style={styles.mainCardSubtext}>After all bills & spending</Text>
        </View>

        {/* Setup Warning - Show if not configured */}
        {monthlyIncome === 0 && (
          <Link href="/setup" asChild>
            <TouchableOpacity
              style={[styles.warningCard, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}
            >
              <Text style={[styles.warningText, { color: theme.warning }]}>
                ⚠️ Set up your monthly income and recurring bills to get started
              </Text>
              <View style={[styles.warningButton, { backgroundColor: theme.warning }]}>
                <Text style={styles.warningButtonText}>Set Up Now</Text>
              </View>
            </TouchableOpacity>
          </Link>
        )}

        {/* Quick Actions */}
        {monthlyIncome > 0 && (
          <View style={styles.quickActions}>
            <Link href="/budgets" asChild>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={[styles.actionText, { color: theme.text }]}>Budgets</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/bills" asChild>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={[styles.actionText, { color: theme.text }]}>Bills</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/debts" asChild>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={styles.actionIcon}>💸</Text>
                <Text style={[styles.actionText, { color: theme.text }]}>Debts</Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}

        {/* This Month Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{getMonthName()}</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.text }]}>Recurring Bills</Text>
              <Text style={[styles.summaryValue, { color: theme.danger }]}>
                -{formatCurrency(recurringBills)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.text }]}>Spent So Far</Text>
              <Text style={[styles.summaryValue, { color: theme.warning }]}>
                -{formatCurrency(currentSpent)}
              </Text>
            </View>
          </View>
        </View>

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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  mainCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  mainCardLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  mainCardAmount: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mainCardSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  warningCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  warningButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
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