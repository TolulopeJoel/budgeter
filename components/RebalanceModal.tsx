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
    const [borrowAmount, setBorrowAmount] = useState(overspentAmount.toString());

    const lenders = budgets
        .filter(b => b.category !== overspentCategory && b.limit > 0)
        .map(b => {
            const status = getBudgetStatus(b.category);

            // Calculate "Safe to Lend"
            const d = new Date();
            const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const timePct = (d.getDate() / daysInMonth) * 100;

            // 1. Velocity Safety: Limit that keeps us under "Danger" (timePct + 15)
            const safeThreshold = timePct + 15;
            const minLimitForVelocity = (status.spent * 100) / safeThreshold;
            const velocitySafeLend = Math.max(0, b.limit - minLimitForVelocity);

            // 2. Budget Safety: Actual money not yet spent
            const actualRemaining = Math.max(0, b.limit - status.spent);

            // The absolute safe amount is the tighter of the two
            const safeToLend = Math.min(velocitySafeLend, actualRemaining);

            return {
                category: b.category,
                remaining: actualRemaining,
                safeToLend,
                limit: b.limit,
                spent: status.spent
            };
        })
        .filter(l => l.safeToLend > 10) // Only show if they can lend at least 10
        .sort((a, b) => b.safeToLend - a.safeToLend);

    const handleConfirm = () => {
        const amt = parseFloat(borrowAmount);
        const selectedLender = lenders.find(l => l.category === selectedCategory);

        if (selectedCategory && selectedLender && !isNaN(amt) && amt > 0) {
            // Cap at safeToLend or show alert? Let's cap it or warn.
            if (amt > selectedLender.safeToLend) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                alert(`That's too much! ${selectedCategory} can only safely lend ${formatCurrency(selectedLender.safeToLend)} without falling into danger itself.`);
                return;
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRebalance(selectedCategory, amt);
            onClose();
        }
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
                        You are over in <Text style={{ fontWeight: '700', color: theme.danger }}>{overspentCategory}</Text> by {formatCurrency(overspentAmount)}.
                    </Text>

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
                                <TouchableOpacity
                                    key={l.category}
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
                                    }}
                                >
                                    <View style={styles.lenderInfo}>
                                        <Text style={[styles.lenderName, { color: theme.text }]}>{l.category}</Text>
                                        <Text style={[styles.lenderSub, { color: theme.textMuted }]}>
                                            {formatCurrency(l.safeToLend)} safe to lend
                                        </Text>
                                    </View>
                                    {selectedCategory === l.category && (
                                        <Ionicons name="checkmark-circle" size={24} color={theme.tint} />
                                    )}
                                </TouchableOpacity>
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
                            title={selectedCategory ? `Borrow ${formatCurrency(parseFloat(borrowAmount) || 0)}` : 'Select a Budget'}
                            onPress={handleConfirm}
                            backgroundColor={theme.tint}
                            disabled={!selectedCategory}
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
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeBtn: {
        padding: 4,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
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
    lenderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
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
