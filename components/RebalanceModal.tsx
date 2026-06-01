import { NeoButton, NeoCard } from '@/components/ui/NeobrutalistComponents';
import { Colors } from '@/constants/Colors';
import { Budget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RebalanceModalProps {
    visible: boolean;
    onClose: () => void;
    overspentCategory: string;
    overspentAmount: number;
    budgets: Budget[];
    getBudgetStatus: (category: string) => { spent: number; limit: number; percentage: number };
    onRebalance: (fromCategory: string, amount: number) => void;
}

export default function RebalanceModal({
    visible,
    onClose,
    overspentCategory,
    overspentAmount,
    budgets,
    getBudgetStatus,
    onRebalance,
}: RebalanceModalProps) {
    const theme = Colors.light;
    const insets = useSafeAreaInsets();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [borrowAmount, setBorrowAmount] = useState(Math.round(overspentAmount).toString());

    const lenders = budgets
        .filter(b => b.category !== overspentCategory && b.limit > 0)
        .map(b => {
            const status = getBudgetStatus(b.category);

            const d = new Date();
            const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const currentDay = d.getDate();
            const daysRemaining = daysInMonth - currentDay || 1;

            const daily = b.limit / daysInMonth;
            const remaining = Math.max(0, b.limit - status.spent);

            const balancedAmt = Math.max(0, remaining - (daily * 0.5 * daysRemaining));
            const aggressiveAmt = Math.max(0, remaining - (daily * 0.1 * daysRemaining));

            const getNewDaily = (borrowAmt: number) => Math.max(0, (remaining - borrowAmt) / daysRemaining);

            return {
                category: b.category,
                remaining,
                daily,
                daysRemaining,
                getNewDaily,
                presets: {
                    balanced: balancedAmt,
                    aggressive: aggressiveAmt
                },
                limit: b.limit,
                spent: status.spent
            };
        })
        .filter(l => l.presets.aggressive > 10)
        .sort((a, b) => b.presets.balanced - a.presets.balanced);

    const selectedLender = lenders.find(l => l.category === selectedCategory);
    const parsedBorrowAmount = parseFloat(borrowAmount) || 0;

    // Disable if no category is picked, amount is 0/empty, or exceeds lender availability
    const isOverLimit = selectedLender ? parsedBorrowAmount > selectedLender.remaining : false;
    const isButtonDisabled = !selectedCategory || parsedBorrowAmount <= 0 || isOverLimit;

    const handleConfirm = () => {
        if (selectedCategory && !isButtonDisabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRebalance(selectedCategory, parsedBorrowAmount);
            onClose();
        }
    };

    const formatCurrency = (amount: number) => {
        return `₦${Math.round(amount).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <NeoCard style={[styles.content, { backgroundColor: theme.card, paddingBottom: insets.bottom + 24 }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Heal thy Budget</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={theme.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        You are over in <Text style={{ fontWeight: '800', color: theme.text }}>{overspentCategory}</Text> by <Text style={{ fontWeight: '800', color: theme.text }}>{formatCurrency(overspentAmount)}</Text>.
                    </Text>

                    {(() => {
                        const targetStatus = getBudgetStatus(overspentCategory);
                        const d = new Date();
                        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                        const currentDay = d.getDate();
                        const daysRemaining = daysInMonth - currentDay || 1;
                        const newLimit = targetStatus.limit + parsedBorrowAmount;
                        const newDaily = Math.max(0, (newLimit - targetStatus.spent) / daysRemaining);

                        return (
                            <View style={[styles.targetImpact, { borderLeftColor: theme.tint }]}>
                                <Text style={[styles.targetImpactText, { color: theme.textSecondary }]}>
                                    New daily allowance will be <Text style={{ fontWeight: '800', color: theme.text }}>{formatCurrency(newDaily)}/day</Text> for the remaining {daysRemaining} days.
                                </Text>
                            </View>
                        );
                    })()}

                    <View style={[styles.amountContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                        <Text style={[styles.amountPrefix, { color: theme.text }]}>₦</Text>
                        <TextInput
                            style={[styles.amountInput, { color: theme.text }]}
                            value={borrowAmount}
                            onChangeText={setBorrowAmount}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={theme.textMuted}
                        />
                    </View>

                    <Text style={[styles.listHeader, { color: theme.textMuted }]}>
                        Pick a budget to borrow from:
                    </Text>

                    <ScrollView style={styles.lenderList} showsVerticalScrollIndicator={false}>
                        {lenders.length > 0 ? (
                            lenders.map(l => (
                                <View key={l.category} style={styles.lenderContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.lenderItem,
                                            {
                                                backgroundColor: selectedCategory === l.category ? theme.primarySoft : theme.backgroundSecondary,
                                                borderColor: selectedCategory === l.category ? theme.tint : theme.border
                                            }
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedCategory(l.category);
                                            setBorrowAmount(Math.round(Math.min(l.presets.balanced, overspentAmount)).toString());
                                        }}
                                    >
                                        <View style={styles.lenderInfo}>
                                            <Text style={[styles.lenderName, { color: theme.text }]}>{l.category}</Text>
                                            <Text style={[styles.lenderSub, { color: theme.textMuted }]}>
                                                {formatCurrency(l.remaining)} available
                                            </Text>
                                        </View>
                                        {selectedCategory === l.category && (
                                            <Ionicons name="checkmark-circle" size={24} color={theme.tint} />
                                        )}
                                    </TouchableOpacity>

                                    {selectedCategory === l.category && (
                                        <View style={styles.presetContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.presetChip,
                                                    {
                                                        borderColor: Math.round(l.presets.balanced) === Math.round(parsedBorrowAmount) ? theme.tint : theme.border,
                                                        backgroundColor: Math.round(l.presets.balanced) === Math.round(parsedBorrowAmount) ? theme.backgroundSecondary : '#fff'
                                                    }
                                                ]}
                                                onPress={() => setBorrowAmount(Math.round(l.presets.balanced).toString())}
                                            >
                                                <Text style={[styles.presetLabel, { color: theme.textMuted }]}>BALANCE</Text>
                                                <Text style={[styles.presetAllowance, { color: theme.text }]}>
                                                    {formatCurrency(l.getNewDaily(l.presets.balanced))}/d
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[
                                                    styles.presetChip,
                                                    {
                                                        borderColor: Math.round(l.presets.aggressive) === Math.round(parsedBorrowAmount) ? theme.tint : theme.border,
                                                        backgroundColor: Math.round(l.presets.aggressive) === Math.round(parsedBorrowAmount) ? theme.backgroundSecondary : '#fff'
                                                    }
                                                ]}
                                                onPress={() => setBorrowAmount(Math.round(l.presets.aggressive).toString())}
                                            >
                                                <Text style={[styles.presetLabel, { color: theme.textMuted }]}>PUSH IT</Text>
                                                <Text style={[styles.presetAllowance, { color: theme.text }]}>
                                                    {formatCurrency(l.getNewDaily(l.presets.aggressive))}/d
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: theme.textMuted }]}>No other budgets have remaining funds to lend.</Text>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <NeoButton
                            title="Cancel"
                            onPress={onClose}
                            backgroundColor={theme.backgroundSecondary}
                            style={{ flex: 1 }}
                        />
                        <NeoButton
                            title={
                                !selectedCategory
                                    ? 'Select a Budget'
                                    : isOverLimit
                                        ? 'Insufficient Funds'
                                        : `Borrow ${formatCurrency(parsedBorrowAmount)}`
                            }
                            onPress={handleConfirm}
                            backgroundColor={theme.tint}
                            disabled={isButtonDisabled}
                            style={{ flex: 2 }}
                        />
                    </View>
                </NeoCard>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    closeBtn: {
        padding: 4,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '500',
    },
    targetImpact: {
        borderLeftWidth: 4,
        paddingLeft: 12,
        marginTop: 8,
        marginBottom: 24,
    },
    targetImpactText: {
        fontSize: 14,
        lineHeight: 20,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 2,
    },
    amountPrefix: {
        fontSize: 24,
        fontWeight: '800',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '800',
        paddingVertical: 0,
    },
    listHeader: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    lenderList: {
        marginBottom: 24,
    },
    lenderContainer: {
        marginBottom: 12,
    },
    lenderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
    },
    lenderInfo: {
        flex: 1,
    },
    lenderName: {
        fontSize: 16,
        fontWeight: '700',
    },
    lenderSub: {
        fontSize: 13,
        marginTop: 2,
    },
    presetContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    presetChip: {
        flex: 1,
        padding: 10,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    presetLabel: {
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    presetAllowance: {
        fontSize: 11,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 14,
    },
});