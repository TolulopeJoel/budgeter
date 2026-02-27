import { NeoButton, NeoCard, NeoSegmentedToggle } from '@/components/ui/NeobrutalistComponents';
import { Colors, SharedStyles } from '@/constants/Colors';
import { SavingsTransaction, Transaction } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    const theme = Colors.light;
    const styles = createStyles(theme, SharedStyles);
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

                <NeoCard backgroundColor={theme.card} style={styles.balanceCard}>
                    <Text style={[styles.balanceLabel, { color: theme.text }]}>Total Savings</Text>
                    <Text style={[styles.balanceAmount, { color: theme.text }]}>{formatCurrency(currentBalance)}</Text>
                    <View style={[styles.goalContainer, SharedStyles.neoBorder, { backgroundColor: theme.tint }]}>
                        <Text style={[styles.goalText, { color: '#fff' }]}>
                            Monthly Deduction: {formatCurrency(currentGoal)}
                        </Text>
                        <TouchableOpacity
                            style={styles.editGoalButton}
                            onPress={() => setView('settings')}
                        >
                            <Ionicons name="pencil" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </NeoCard>

                <NeoSegmentedToggle
                    options={[
                        { label: 'History', value: 'history', activeColor: theme.tint },
                        { label: 'Add Entry', value: 'add', activeColor: theme.tint },
                    ]}
                    value={view === 'settings' ? 'history' : view as any}
                    onValueChange={(val) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setView(val as any);
                    }}
                    style={styles.tabContainer}
                />

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
                                <NeoSegmentedToggle
                                    options={[
                                        { label: 'Deposit', value: 'deposit', activeColor: theme.success },
                                        { label: 'Withdraw', value: 'withdrawal', activeColor: theme.danger },
                                    ]}
                                    value={type}
                                    onValueChange={(val) => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setType(val);
                                    }}
                                    style={styles.typeSelector}
                                />

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
                                        <View style={[styles.checkbox, SharedStyles.neoBorder, { backgroundColor: isInitialBalance ? theme.tint : '#fff' }]}>
                                            {isInitialBalance && <Ionicons name="checkmark" size={16} color="#fff" />}
                                        </View>
                                        <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                                            Initial Balance (Don&apos;t affect budget)
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <View style={styles.buttons}>
                                    <NeoButton
                                        title="Cancel"
                                        onPress={() => {
                                            setEditingTransaction(null);
                                            setAmount('');
                                            setNote('');
                                            setView('history');
                                        }}
                                        backgroundColor={theme.card}
                                        style={{ flex: 1 }}
                                    />
                                    <NeoButton
                                        title={editingTransaction ? 'Update' : (type === 'deposit' ? 'Add' : 'Withdraw')}
                                        onPress={handleAddTransaction}
                                        backgroundColor={theme.tint}
                                        style={{ flex: 1 }}
                                    />
                                </View>

                                {editingTransaction && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={handleDeleteTransaction}
                                    >
                                        <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Delete Entry</Text>
                                    </TouchableOpacity>
                                )}
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

                                <View style={styles.buttons}>
                                    <NeoButton
                                        title="Cancel"
                                        onPress={() => setView('history')}
                                        backgroundColor={theme.card}
                                        style={{ flex: 1 }}
                                    />
                                    <NeoButton
                                        title="Update Goal"
                                        onPress={handleUpdateGoal}
                                        backgroundColor={theme.tint}
                                        style={{ flex: 1 }}
                                    />
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const createStyles = (theme: any, neoStyles: any) => StyleSheet.create({
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
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    balanceAmount: {
        fontSize: 48,
        fontWeight: '900',
        marginBottom: 16,
    },
    goalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        width: '100%',
        justifyContent: 'center',
        ...neoStyles.neoBorder,
    },
    goalText: {
        fontSize: 14,
        fontWeight: '900',
        marginRight: 8,
        textTransform: 'uppercase',
    },
    editGoalButton: {
        padding: 4,
    },
    tabContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
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
        marginBottom: 24,
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
        ...neoStyles.neoBorder,
    },
    actionButton: {
        padding: 16,
        borderRadius: 0,
        alignItems: 'center',
        marginTop: 8,
        ...neoStyles.neoBorder,
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
        borderRadius: 0,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...neoStyles.neoBorder,
    },
    checkboxLabel: {
        fontSize: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
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
        marginTop: 4,
    },
    deleteButtonText: {
        fontSize: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
        textDecorationLine: 'underline',
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
});
