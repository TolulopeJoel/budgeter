import { Colors } from '@/constants/Colors';
import { SavingsTransaction } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SavingsModalProps {
    visible: boolean;
    onClose: () => void;
    currentBalance: number;
    currentGoal: number;
    transactions: SavingsTransaction[];
    onAddTransaction: (amount: number, type: 'deposit' | 'withdrawal', note?: string, affectBudget?: boolean) => void;
    onUpdateGoal: (amount: number) => void;
}

export default function SavingsModal({
    visible,
    onClose,
    currentBalance,
    currentGoal,
    transactions,
    onAddTransaction,
    onUpdateGoal,
}: SavingsModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [isInitialBalance, setIsInitialBalance] = useState(false);
    const [goal, setGoal] = useState(currentGoal.toString());
    const [view, setView] = useState<'history' | 'add' | 'settings'>('history');

    const formatCurrency = (amount: number) => {
        const value = isNaN(amount) ? 0 : amount;
        return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const handleAddTransaction = () => {
        if (!amount) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // If it's initial balance, we don't affect the budget
        onAddTransaction(Number(amount), type, note, !isInitialBalance);
        setAmount('');
        setNote('');
        setIsInitialBalance(false);
        setView('history');
    };

    const handleUpdateGoal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onUpdateGoal(Number(goal));
        setView('history');
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Savings</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.closeButton, { color: theme.tint }]}>Done</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.balanceCard, { backgroundColor: theme.tint }]}>
                    <Text style={styles.balanceLabel}>Total Savings</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(currentBalance)}</Text>
                    <View style={styles.goalContainer}>
                        <Text style={styles.goalText}>
                            Monthly Deduction: {formatCurrency(currentGoal)}
                        </Text>
                        <TouchableOpacity
                            style={styles.editGoalButton}
                            onPress={() => setView('settings')}
                        >
                            <Ionicons name="pencil" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, view === 'history' && { borderBottomColor: theme.tint, borderBottomWidth: 2 }]}
                        onPress={() => setView('history')}
                    >
                        <Text style={[styles.tabText, { color: view === 'history' ? theme.tint : theme.icon }]}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, view === 'add' && { borderBottomColor: theme.tint, borderBottomWidth: 2 }]}
                        onPress={() => setView('add')}
                    >
                        <Text style={[styles.tabText, { color: view === 'add' ? theme.tint : theme.icon }]}>Add Entry</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {view === 'history' && (
                        <View>
                            {transactions.length > 0 ? (
                                transactions.map((t) => (
                                    <View key={t.id} style={[styles.transactionItem, { borderBottomColor: theme.border }]}>
                                        <View>
                                            <Text style={[styles.transactionNote, { color: theme.text }]}>
                                                {t.note || (t.type === 'deposit' ? 'Deposit' : 'Withdrawal')}
                                            </Text>
                                            <Text style={[styles.transactionDate, { color: theme.icon }]}>
                                                {new Date(t.date).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[
                                                styles.transactionAmount,
                                                { color: t.type === 'deposit' ? theme.success : theme.danger }
                                            ]}
                                        >
                                            {t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={[styles.emptyText, { color: theme.icon }]}>No savings history yet.</Text>
                            )}
                        </View>
                    )}

                    {view === 'add' && (
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                            <View style={styles.typeSelector}>
                                <TouchableOpacity
                                    style={[
                                        styles.typeButton,
                                        type === 'deposit' && { backgroundColor: theme.success + '20', borderColor: theme.success },
                                        { borderColor: theme.border }
                                    ]}
                                    onPress={() => setType('deposit')}
                                >
                                    <Text style={[styles.typeText, { color: type === 'deposit' ? theme.success : theme.icon }]}>Deposit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.typeButton,
                                        type === 'withdrawal' && { backgroundColor: theme.danger + '20', borderColor: theme.danger },
                                        { borderColor: theme.border }
                                    ]}
                                    onPress={() => setType('withdrawal')}
                                >
                                    <Text style={[styles.typeText, { color: type === 'withdrawal' ? theme.danger : theme.icon }]}>Withdraw</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.icon }]}>Amount</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="0"
                                    placeholderTextColor={theme.icon}
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                    autoFocus
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.icon }]}>Note (Optional)</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, fontSize: 16 }]}
                                    placeholder="e.g. Monthly Savings"
                                    placeholderTextColor={theme.icon}
                                    value={note}
                                    onChangeText={setNote}
                                />
                            </View>

                            {type === 'deposit' && (
                                <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    onPress={() => setIsInitialBalance(!isInitialBalance)}
                                >
                                    <View style={[styles.checkbox, { borderColor: theme.tint, backgroundColor: isInitialBalance ? theme.tint : 'transparent' }]}>
                                        {isInitialBalance && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                    <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                                        Initial Balance (Don't affect budget)
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.tint }]}
                                onPress={handleAddTransaction}
                            >
                                <Text style={styles.actionButtonText}>
                                    {type === 'deposit' ? 'Add to Savings' : 'Withdraw from Savings'}
                                </Text>
                            </TouchableOpacity>
                        </KeyboardAvoidingView>
                    )}

                    {view === 'settings' && (
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.icon }]}>Monthly Deduction Goal</Text>
                                <Text style={[styles.helperText, { color: theme.icon }]}>
                                    This amount is deducted from your "Safe to Spend" each month.
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="0"
                                    placeholderTextColor={theme.icon}
                                    keyboardType="numeric"
                                    value={goal}
                                    onChangeText={setGoal}
                                    autoFocus
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.tint }]}
                                onPress={handleUpdateGoal}
                            >
                                <Text style={styles.actionButtonText}>Update Goal</Text>
                            </TouchableOpacity>
                        </KeyboardAvoidingView>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
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
    closeButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    balanceCard: {
        margin: 20,
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    balanceAmount: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 16,
    },
    goalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    goalText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginRight: 8,
    },
    editGoalButton: {
        padding: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tab: {
        marginRight: 24,
        paddingBottom: 8,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    transactionNote: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    helperText: {
        fontSize: 12,
        marginBottom: 12,
        opacity: 0.7,
    },
    input: {
        fontSize: 24,
        fontWeight: 'bold',
        borderBottomWidth: 2,
        paddingVertical: 8,
    },
    actionButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
});
