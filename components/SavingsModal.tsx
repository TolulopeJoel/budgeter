import { NeoButton, NeoCard } from '@/components/ui/NeobrutalistComponents';
import { Colors, SharedStyles } from '@/constants/Colors';
import { SavingsTransaction, Transaction } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SavingsModalProps {
    visible: boolean;
    onClose: () => void;
    currentBalance: number;
    currentGoal: number;
    transactions: SavingsTransaction[];
    budgetTransactions: Transaction[];
    onAddTransaction: (amount: number, type: 'deposit' | 'withdrawal', note?: string, affectBudget?: boolean) => void;
    onUpdateTransaction: (transaction: SavingsTransaction, affectBudget?: boolean) => void;
    onDeleteTransaction: (id: string) => void;
    onUpdateGoal: (amount: number) => void;
}

export default function SavingsModal({
    visible,
    onClose,
    currentBalance,
    currentGoal,
    transactions,
    budgetTransactions,
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction,
    onUpdateGoal,
}: SavingsModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [isInitialBalance, setIsInitialBalance] = useState(false);
    const [goal, setGoal] = useState(currentGoal.toString());
    const [view, setView] = useState<'history' | 'add' | 'settings'>('history');
    const [editingTransaction, setEditingTransaction] = useState<SavingsTransaction | null>(null);

    const formatCurrency = (amount: number) => {
        const value = isNaN(amount) ? 0 : amount;
        return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const handleAddTransaction = () => {
        if (!amount) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (editingTransaction) {
            onUpdateTransaction({
                ...editingTransaction,
                amount: Number(amount),
                type,
                note,
            }, !isInitialBalance);
            setEditingTransaction(null);
        } else {
            onAddTransaction(Number(amount), type, note, !isInitialBalance);
        }

        setAmount('');
        setNote('');
        setIsInitialBalance(false);
        setView('history');
    };

    const handleDeleteTransaction = () => {
        if (!editingTransaction) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onDeleteTransaction(editingTransaction.id);
        setEditingTransaction(null);
        setAmount('');
        setNote('');
        setIsInitialBalance(false);
        setView('history');
    };

    const startEditing = (t: SavingsTransaction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEditingTransaction(t);
        setAmount(t.amount.toString());
        setNote(t.note || '');
        setType(t.type);

        // Check if there's a linked budget transaction
        const isLinked = budgetTransactions.some(bt => bt.savingsId === t.id);
        setIsInitialBalance(!isLinked);

        setView('add');
    };

    const handleUpdateGoal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onUpdateGoal(Number(goal));
        setView('history');
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Savings</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={[styles.closeButton, { color: theme.tint }]}>Done</Text>
                    </TouchableOpacity>
                </View>

                <NeoCard backgroundColor={theme.tint} style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Total Savings</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(currentBalance)}</Text>
                    <View style={[styles.goalContainer, SharedStyles.neoBorder, { backgroundColor: '#fff' }]}>
                        <Text style={[styles.goalText, { color: '#000' }]}>
                            Monthly Deduction: {formatCurrency(currentGoal)}
                        </Text>
                        <TouchableOpacity
                            style={styles.editGoalButton}
                            onPress={() => setView('settings')}
                        >
                            <Ionicons name="pencil" size={16} color="#000" />
                        </TouchableOpacity>
                    </View>
                </NeoCard>

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

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        style={styles.content}
                        keyboardShouldPersistTaps="handled"
                    >
                        {view === 'history' && (
                            <View>
                                {transactions.length > 0 ? (
                                    transactions.map((t) => (
                                        <TouchableOpacity
                                            key={t.id}
                                            onPress={() => startEditing(t)}
                                        >
                                            <NeoCard style={[styles.transactionItem]}>
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
                                            </NeoCard>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={[styles.emptyText, { color: theme.icon }]}>No savings history yet.</Text>
                                )}
                            </View>
                        )}

                        {view === 'add' && (
                            <View>
                                <View style={styles.typeSelector}>
                                    <TouchableOpacity
                                        style={{ flex: 1 }}
                                        onPress={() => setType('deposit')}
                                    >
                                        <NeoCard
                                            style={styles.typeButton}
                                            backgroundColor={type === 'deposit' ? theme.success : '#fff'}
                                        >
                                            <Text style={[styles.typeText, { color: '#000' }]}>Deposit</Text>
                                        </NeoCard>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flex: 1 }}
                                        onPress={() => setType('withdrawal')}
                                    >
                                        <NeoCard
                                            style={styles.typeButton}
                                            backgroundColor={type === 'withdrawal' ? theme.danger : '#fff'}
                                        >
                                            <Text style={[styles.typeText, { color: '#000' }]}>Withdraw</Text>
                                        </NeoCard>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
                                    <TextInput
                                        style={[styles.input, SharedStyles.neoBorder, { color: '#000', backgroundColor: '#fff' }]}
                                        placeholder="0"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={setAmount}
                                        autoFocus
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Note (Optional)</Text>
                                    <TextInput
                                        style={[styles.input, SharedStyles.neoBorder, { color: '#000', backgroundColor: '#fff', fontSize: 16 }]}
                                        placeholder="e.g. Monthly Savings"
                                        placeholderTextColor="#999"
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
                                            Initial Balance (Don&apos;t affect budget)
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <NeoButton
                                    title={editingTransaction ? 'Update Entry' : (type === 'deposit' ? 'Add to Savings' : 'Withdraw from Savings')}
                                    onPress={handleAddTransaction}
                                    backgroundColor={theme.tint}
                                />

                                {editingTransaction && (
                                    <TouchableOpacity
                                        style={[styles.deleteButton, { marginTop: 12 }]}
                                        onPress={handleDeleteTransaction}
                                    >
                                        <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Delete Entry</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.cancelButton, { marginTop: editingTransaction ? 8 : 12 }]}
                                    onPress={() => {
                                        setEditingTransaction(null);
                                        setAmount('');
                                        setNote('');
                                        setView('history');
                                    }}
                                >
                                    <Text style={[styles.cancelButtonText, { color: theme.icon }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {view === 'settings' && (
                            <View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.icon }]}>Monthly Deduction Goal</Text>
                                    <Text style={[styles.helperText, { color: theme.icon }]}>
                                        This amount is deducted from your &quot;Safe to Spend&quot; each month.
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

                                <NeoButton
                                    title="Update Goal"
                                    onPress={handleUpdateGoal}
                                    backgroundColor={theme.tint}
                                />
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
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
        fontWeight: '900',
        textTransform: 'uppercase',
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
        fontWeight: '900',
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
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    transactionNote: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '900',
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
        fontWeight: '900',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    helperText: {
        fontSize: 12,
        marginBottom: 12,
        opacity: 0.7,
    },
    input: {
        fontSize: 18,
        fontWeight: '900',
        padding: 12,
        borderRadius: 0,
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
    cancelButton: {
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    deleteButton: {
        padding: 16,
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.2)',
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
});
