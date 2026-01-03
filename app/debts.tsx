import TransactionModal from '@/components/TransactionModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { Transaction, useBudget } from '@/context/BudgetContext';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Debts() {
    const router = useRouter();
    const { transactions, getDebts, categories } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const debts = transactions.filter(t => t.type === 'debt');
    const totalDebt = getDebts();

    const getCategoryIcon = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        return category?.icon || 'ellipsis.circle.fill';
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                }}>
                    <IconSymbol name="chevron.left" size={28} color={theme.text} />
                </TouchableOpacity>
                <View style={{ width: 28 }} />
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
                {debts.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>

                        {debts.map(debt => (
                            <TouchableOpacity
                                key={debt.id}
                                style={[styles.debtCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setEditingTransaction(debt);
                                    setShowTransactionModal(true);
                                }}
                            >
                                <View style={styles.debtContent}>
                                    <View style={[styles.iconContainer, { backgroundColor: theme.danger + '10' }]}>
                                        <IconSymbol name={getCategoryIcon(debt.category) as any} size={20} color={theme.danger} />
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
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.debtCard, { backgroundColor: theme.card, borderColor: theme.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditingTransaction(null);
                        setShowTransactionModal(true);
                    }}
                >
                    <Text style={[styles.debtCategory, { color: theme.tint }]}>+ Add New Debt Record</Text>
                </TouchableOpacity>
            </ScrollView>
            <TransactionModal
                visible={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                editingTransaction={editingTransaction}
            />
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
        paddingBottom: 20,
    },
    title: {
        fontSize: 24,
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
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 12,
    },
    debtContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    debtInfo: {
        flex: 1,
    },
    debtCategory: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    debtDate: {
        fontSize: 12,
        fontWeight: '500',
    },
    debtAmount: {
        fontSize: 16,
        fontWeight: '700',
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
