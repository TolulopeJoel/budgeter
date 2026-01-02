import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Debts() {
    const router = useRouter();
    const { transactions, getDebts } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const debts = transactions.filter(t => t.type === 'debt');
    const totalDebt = getDebts();

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Debts</Text>
                <Link href={{ pathname: '/add', params: { initialType: 'debt' } }} asChild>
                    <TouchableOpacity>
                        <IconSymbol name="plus.circle.fill" size={28} color={theme.tint} />
                    </TouchableOpacity>
                </Link>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Total Summary */}
                <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.summaryHeader}>
                        <Text style={[styles.summaryLabel, { color: theme.icon }]}>Total Debt</Text>
                    </View>
                    <Text style={[styles.summaryAmount, { color: theme.danger }]}>
                        {formatCurrency(totalDebt)}
                    </Text>
                </View>

                {/* Debts List */}
                {debts.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>

                        {debts.map(debt => (
                            <Link href={{ pathname: '/add', params: { id: debt.id } }} key={debt.id} asChild>
                                <TouchableOpacity
                                    style={[styles.debtCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                                >
                                    <View style={styles.debtContent}>
                                        <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                                            <IconSymbol name="creditcard.fill" size={24} color={theme.danger} />
                                        </View>

                                        <View style={styles.debtInfo}>
                                            <Text style={[styles.debtCategory, { color: theme.text }]}>{debt.category}</Text>
                                            <Text style={[styles.debtDate, { color: theme.icon }]}>
                                                {new Date(debt.date).toLocaleDateString()}
                                                {debt.note && ` • ${debt.note}`}
                                            </Text>
                                        </View>

                                        <Text style={[styles.debtAmount, { color: theme.danger }]}>
                                            {formatCurrency(debt.amount)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </Link>
                        ))}
                    </View>
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                        <IconSymbol name="checkmark.circle.fill" size={48} color={theme.success} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Debt Free!</Text>
                        <Text style={[styles.emptyText, { color: theme.icon }]}>
                            You don't have any recorded debts.
                        </Text>
                        <Link href={{ pathname: '/add', params: { initialType: 'debt' } }} asChild>
                            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.tint }]}>
                                <Text style={styles.emptyButtonText}>Add Debt Record</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    summaryCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    summaryHeader: {
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    summaryAmount: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    debtCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    debtContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    debtInfo: {
        flex: 1,
    },
    debtCategory: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    debtDate: {
        fontSize: 13,
    },
    debtAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
