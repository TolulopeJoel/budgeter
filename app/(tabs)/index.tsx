import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Dashboard() {
  const { getBalance, getIncome, getExpenses, getDebts, transactions } = useBudget();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const balance = getBalance();
  const income = getIncome();
  const expenses = getExpenses();
  const debts = getDebts();
  const canSurvive = balance - expenses; // Simple logic for now

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Budgeter</Text>
        <Link href="/add" asChild>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.tint }]}>
            <IconSymbol name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Current Balance</Text>
            <Text style={[styles.value, { color: theme.text }]}>{formatCurrency(balance)}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Can I Survive?</Text>
            <Text style={[styles.value, { color: theme.success }]}>{formatCurrency(balance)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Income</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.text }]}>Total Income</Text>
            <Text style={[styles.value, { color: theme.text }]}>{formatCurrency(income)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
        {transactions.slice(0, 5).map((t) => (
          <View key={t.id} style={[styles.transactionItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View>
              <Text style={[styles.transactionCategory, { color: theme.text }]}>{t.category}</Text>
              <Text style={[styles.transactionDate, { color: theme.icon }]}>{new Date(t.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: t.type === 'income' ? theme.success : t.type === 'expense' ? theme.danger : theme.warning }
            ]}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
    opacity: 0.2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
