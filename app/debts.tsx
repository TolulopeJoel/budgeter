import TransactionModal from '@/components/TransactionModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, SharedStyles } from '@/constants/Colors';
import { Transaction, useBudget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Debts() {
    const router = useRouter();
    const { transactions, getDebts, categories, isHistoryPrivacyEnabled } = useBudget();
    const theme = Colors.light;
    const insets = useSafeAreaInsets();
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const debts = transactions.filter(t => t.type === 'debt');
    const totalDebt = getDebts();

    const getCategoryIcon = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        return category?.icon || 'ellipsis.circle.fill';
    };

    const formatCurrency = (amount: number, forceShow: boolean = false) => {
        if (isHistoryPrivacyEnabled && !forceShow) return '₦ ••••••';
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: theme.card }, SharedStyles.softShadow]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Lent Out</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: theme.hero }, SharedStyles.softShadowMd]}>
                    <Text style={styles.summaryLabel}>Total to Collect</Text>
                    <Text style={styles.summaryAmount}>{formatCurrency(totalDebt, true)}</Text>
                    <Text style={styles.summarySub}>{debts.length} {debts.length === 1 ? 'record' : 'records'}</Text>
                </View>

                {/* Debts List */}
                {debts.length > 0 && (
                    <View style={[styles.listCard, { backgroundColor: theme.card }, SharedStyles.softShadow]}>
                        {debts.map((debt, idx) => (
                            <TouchableOpacity
                                key={debt.id}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setEditingTransaction(debt);
                                    setShowTransactionModal(true);
                                }}
                            >
                                <View style={[
                                    styles.debtRow,
                                    idx < debts.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight }
                                ]}>
                                    <View style={[styles.iconCircle, { backgroundColor: theme.dangerSoft }]}>
                                        <IconSymbol name={getCategoryIcon(debt.category) as any} size={18} color={theme.danger} />
                                    </View>
                                    <View style={styles.debtInfo}>
                                        <Text style={[styles.debtNote, { color: theme.text }]}>
                                            {isHistoryPrivacyEnabled ? '— redacted —' : (debt.note || debt.category)}
                                        </Text>
                                        <Text style={[styles.debtDate, { color: theme.textMuted }]}>
                                            {new Date(debt.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
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

                {debts.length === 0 && (
                    <View style={[styles.emptyState, { backgroundColor: theme.card }, SharedStyles.softShadow]}>
                        <Ionicons name="cash-outline" size={36} color={theme.textMuted} style={{ marginBottom: 12 }} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>No debts recorded</Text>
                        <Text style={[styles.emptySub, { color: theme.textMuted }]}>Tap below to add a debt record</Text>
                    </View>
                )}

                {/* Add Button */}
                <TouchableOpacity
                    style={[styles.addBtn, { borderColor: theme.border }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditingTransaction(null);
                        setShowTransactionModal(true);
                    }}
                >
                    <Ionicons name="add-circle-outline" size={18} color={theme.tint} />
                    <Text style={[styles.addBtnText, { color: theme.tint }]}>Add Debt Record</Text>
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
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
    content: { flex: 1, paddingHorizontal: 20 },
    summaryCard: {
        borderRadius: 20,
        padding: 22,
        marginBottom: 16,
    },
    summaryLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
    summaryAmount: { fontSize: 34, fontWeight: '700', color: '#fff', letterSpacing: -1 },
    summarySub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: '500' },
    listCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    debtRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    debtInfo: { flex: 1 },
    debtNote: { fontSize: 15, fontWeight: '600' },
    debtDate: { fontSize: 12, fontWeight: '400', marginTop: 2 },
    debtAmount: { fontSize: 15, fontWeight: '700' },
    emptyState: {
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    emptySub: { fontSize: 13, textAlign: 'center' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 4,
    },
    addBtnText: { fontSize: 15, fontWeight: '600' },
});
