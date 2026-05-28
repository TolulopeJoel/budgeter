import { NeoButton, NeoCard } from '@/components/ui/NeobrutalistComponents';
import { Colors, SharedStyles } from '@/constants/Colors';
import { Transaction, useBudget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MonthConfirmModal() {
    const { needsMonthConfirmation, confirmNewMonth, getLastMonthIncomeTransactions, transactions, addTransaction, currentPeriod } = useBudget();
    const theme = Colors.light;
    const styles = createStyles(theme, SharedStyles);
    const insets = useSafeAreaInsets();

    const [visible, setVisible] = useState(false);
    const [lastMonthIncome, setLastMonthIncome] = useState<Transaction[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Manual entry state
    const [showManual, setShowManual] = useState(false);
    const [manualAmount, setManualAmount] = useState('');
    const [manualNote, setManualNote] = useState('');

    useEffect(() => {
        const shouldShow = needsMonthConfirmation();
        setVisible(shouldShow);
        if (shouldShow) {
            const income = getLastMonthIncomeTransactions();
            setLastMonthIncome(income);
            // Default select all
            setSelectedIds(new Set(income.map(t => t.id)));

            // If no income found, show manual entry by default
            if (income.length === 0) {
                setShowManual(true);
            } else {
                setShowManual(false);
            }
        }
    }, [currentPeriod, transactions]);

    const toggleIncome = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleConfirm = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // 1. Get selected carry-over transactions
        const carryOver = lastMonthIncome.filter(t => selectedIds.has(t.id));

        // 2. Add manual income if provided
        const finalCarryOver = [...carryOver];
        if (showManual && manualAmount && parseFloat(manualAmount) > 0) {
            // We'll pass this as a "virtual" transaction to confirmNewMonth
            // confirmNewMonth will handle creating the actual transaction
            finalCarryOver.push({
                id: 'manual-' + Date.now(),
                type: 'income',
                category: 'Salary', // Default category
                amount: parseFloat(manualAmount),
                date: new Date().toISOString(),
                note: manualNote || 'Monthly Income'
            });
        }

        await confirmNewMonth(finalCarryOver);
        setVisible(false);
        setShowManual(false);
        setManualAmount('');
        setManualNote('');
    };

    const getMonthName = () => {
        const now = new Date();
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} `;
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <NeoCard style={[styles.container, { backgroundColor: theme.card, paddingBottom: insets.bottom + 24 }]}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft, borderRadius: 20 }]}>
                        <Text style={styles.icon}>📅</Text>
                    </View>

                    <Text style={[styles.title, { color: theme.text }]}>
                        Welcome to {getMonthName()}!
                    </Text>

                    <Text style={[styles.subtitle, { color: theme.icon }]}>
                        {lastMonthIncome.length > 0
                            ? "Select which income sources to carry over or add a new one."
                            : "A new month has started. Please enter your income for this month."}
                    </Text>

                    <View style={styles.contentSection}>
                        <ScrollView
                            style={styles.scrollArea}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {lastMonthIncome.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={[styles.label, { color: theme.text }]}>Carry Over</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                if (selectedIds.size === lastMonthIncome.length) {
                                                    setSelectedIds(new Set());
                                                } else {
                                                    setSelectedIds(new Set(lastMonthIncome.map(t => t.id)));
                                                }
                                            }}
                                            style={[
                                                styles.checkAllBtn,
                                                {
                                                    backgroundColor: selectedIds.size === lastMonthIncome.length
                                                        ? theme.tint
                                                        : theme.backgroundSecondary,
                                                    borderRadius: 20,
                                                }
                                            ]}
                                        >
                                            <Ionicons
                                                name={selectedIds.size === lastMonthIncome.length ? "checkmark" : "add"}
                                                size={14}
                                                color={selectedIds.size === lastMonthIncome.length ? '#fff' : theme.tint}
                                            />
                                            <Text style={[styles.checkAllText, {
                                                color: selectedIds.size === lastMonthIncome.length ? '#fff' : theme.tint
                                            }]}>
                                                {selectedIds.size === lastMonthIncome.length ? "Deselect All" : "Select All"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    {lastMonthIncome.map((t) => (
                                        <TouchableOpacity
                                            key={t.id}
                                            onPress={() => toggleIncome(t.id)}
                                        >
                                            <NeoCard
                                                style={[
                                                    styles.incomeItem,
                                                ]}
                                                backgroundColor={selectedIds.has(t.id) ? theme.tint : '#fff'}
                                            >
                                                <View style={styles.incomeInfo}>
                                                    <Text style={[styles.incomeNote, { color: '#000' }]}>
                                                        {t.note || 'Income'}
                                                    </Text>
                                                    <Text style={[styles.incomeAmount, { color: '#000' }]}>
                                                        {formatCurrency(t.amount)}
                                                    </Text>
                                                </View>
                                                <View style={[
                                                    styles.checkbox,
                                                    { borderColor: theme.border, borderRadius: 6 },
                                                    selectedIds.has(t.id) && { backgroundColor: theme.tint, borderColor: theme.tint }
                                                ]}>
                                                    {selectedIds.has(t.id) && (
                                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                                    )}
                                                </View>
                                            </NeoCard>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {showManual ? (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={[styles.label, { color: theme.text }]}>New Income</Text>
                                        {lastMonthIncome.length > 0 && (
                                            <TouchableOpacity onPress={() => setShowManual(false)}>
                                                <Text style={{ color: theme.tint, fontWeight: '600' }}>Cancel</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View style={[styles.manualInput, { backgroundColor: theme.backgroundSecondary, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 4 }]}>
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder="Amount"
                                            placeholderTextColor={theme.textMuted}
                                            keyboardType="numeric"
                                            value={manualAmount}
                                            onChangeText={setManualAmount}
                                        />
                                        <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            placeholder="Note (e.g. Salary)"
                                            placeholderTextColor={theme.textMuted}
                                            value={manualNote}
                                            onChangeText={setManualNote}
                                        />
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.addManualBtn, { borderColor: theme.tint }]}
                                    onPress={() => setShowManual(true)}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color={theme.tint} />
                                    <Text style={[styles.addManualText, { color: theme.tint }]}>Add Other Income</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>

                    <NeoButton
                        title="Start New Month"
                        onPress={handleConfirm}
                        backgroundColor={theme.tint}
                    />

                    <Text style={[styles.footer, { color: theme.icon }]}>
                        Your recurring bills will continue automatically
                    </Text>
                </NeoCard>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const createStyles = (theme: any, neoStyles: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
        padding: 24,
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: 24,
    },
    iconContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: { fontSize: 32 },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    contentSection: {
        width: '100%',
        height: 300,
        marginBottom: 20,
    },
    scrollArea: { width: '100%', maxHeight: 400 },
    scrollContent: { paddingBottom: 10 },
    section: { width: '100%', marginBottom: 20 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    checkAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    checkAllText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    incomeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        marginBottom: 8,
        borderRadius: 12,
    },
    incomeInfo: { flex: 1 },
    incomeNote: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    incomeAmount: { fontSize: 13, fontWeight: '500' },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    addManualBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 4,
    },
    addManualText: { fontSize: 15, fontWeight: '600', marginLeft: 8 },
    manualInput: {},
    input: { padding: 12, fontSize: 16, fontWeight: '500' },
    divider: { height: 1, marginHorizontal: 12 },
    footer: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.6,
        marginTop: 16,
    },
});