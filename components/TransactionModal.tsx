import CategoryPicker from '@/components/CategoryPicker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NeoButton, NeoCard } from '@/components/ui/NeobrutalistComponents';
import { Colors, SharedStyles } from '@/constants/Colors';
import { Transaction, TransactionType, useBudget } from '@/context/BudgetContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback, useColorScheme, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TransactionModalProps {
    visible: boolean;
    onClose: () => void;
    editingTransaction?: Transaction | null;
}

export default function TransactionModal({ visible, onClose, editingTransaction }: TransactionModalProps) {
    const { addTransaction, updateTransaction, deleteTransaction, categories } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [amountError, setAmountError] = useState(false);
    const [categoryError, setCategoryError] = useState(false);
    const [noteError, setNoteError] = useState(false);

    useEffect(() => {
        setAmountError(false);
        setCategoryError(false);
        setNoteError(false);
    }, [visible]);


    useEffect(() => {
        if (editingTransaction) {
            setType(editingTransaction.type);
            setAmount(editingTransaction.amount.toString());
            setCategory(editingTransaction.category);
            setNote(editingTransaction.note || '');
            setDate(new Date(editingTransaction.date));
        } else {
            // Reset for new transaction
            setType('expense');
            setAmount('');
            setCategory('');
            setNote('');
            setDate(new Date());
        }
    }, [editingTransaction, visible]);

    const handleSave = async () => {
        let hasError = false;

        if (!amount) {
            setAmountError(true);
            hasError = true;
        } else {
            const parsedAmount = parseFloat(amount);
            if ((type === 'income' || type === 'expense') && parsedAmount <= 0) {
                setAmountError(true);
                hasError = true;
                Alert.alert('Invalid Amount', 'Income and Expense amounts cannot be negative.');
            }
        }

        if (type === 'expense' && !category) {
            setCategoryError(true);
            hasError = true;
        }

        if ((type === 'income' || type === 'debt') && !note.trim()) {
            setNoteError(true);
            hasError = true;
        }

        if (hasError) return;

        const transactionData = {
            type,
            amount: parseFloat(amount),
            category: type === 'expense' ? category : (type === 'income' ? 'Income' : 'Debt'),
            note,
            date: date.toISOString(),
        };

        if (editingTransaction) {
            await updateTransaction({ ...transactionData, id: editingTransaction.id });
        } else {
            await addTransaction(transactionData);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (editingTransaction) {
                            await deleteTransaction(editingTransaction.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            onClose();
                        }
                    }
                }
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                            <NeoCard style={[styles.modalContent, { backgroundColor: theme.card, paddingBottom: insets.bottom + 24 }]}>
                                <View style={styles.header}>
                                    <Text style={[styles.title, { color: theme.text }]}>
                                        {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                                    </Text>
                                    <TouchableOpacity onPress={onClose}>
                                        <Text style={{ fontSize: 24, padding: 4 }}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <View style={[styles.typeSelector]}>
                                        {(['expense', 'income', 'debt'] as TransactionType[]).map((t) => (
                                            <TouchableOpacity
                                                key={t}
                                                disabled={!!editingTransaction}
                                                onPress={() => setType(t)}
                                                style={{ flex: 1 }}
                                            >
                                                <NeoCard
                                                    style={[
                                                        styles.typeButton,
                                                        editingTransaction && type !== t && { opacity: 0.1 }
                                                    ]}
                                                    backgroundColor={type === t ? (t === 'expense' ? theme.danger : (t === 'income' ? theme.success : theme.primary)) : '#fff'}
                                                >
                                                    <Text style={[
                                                        styles.typeText,
                                                    ]}>
                                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                                    </Text>
                                                </NeoCard>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
                                        <View style={[styles.amountInputContainer, SharedStyles.neoBorder, { backgroundColor: '#fff', padding: 12 }]}>
                                            <Text style={[styles.currencySymbol, { color: '#000' }]}>₦</Text>
                                            <TextInput
                                                style={[
                                                    styles.amountInput,
                                                    {
                                                        color: '#000',
                                                    },
                                                ]}
                                                placeholder="0"
                                                placeholderTextColor="#999"
                                                keyboardType="numeric"
                                                value={amount}
                                                onChangeText={(value) => {
                                                    setAmount(value);
                                                    if (value) setAmountError(false);
                                                }}
                                            />
                                        </View>
                                    </View>

                                    {type === 'expense' && (
                                        <View style={styles.inputGroup}>
                                            <CategoryPicker
                                                label="Category"
                                                value={category}
                                                onSelect={(c) => {
                                                    setCategory(c);
                                                    setCategoryError(false);
                                                }}
                                                categories={categories}
                                                error={categoryError}
                                                placeholder="Odogwu 😏"
                                            />
                                        </View>
                                    )}

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: theme.text }]}>
                                            {type === 'expense' ? 'Note (Optional)' : 'Note'}
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                SharedStyles.neoBorder,
                                                {
                                                    color: '#000',
                                                    backgroundColor: '#fff',
                                                    borderColor: noteError ? theme.danger : '#000',
                                                }
                                            ]}
                                            placeholder={type === 'income' ? "Where did this income come from?" : (type === 'debt' ? "Who did you lend this to?" : "What was this for?")}
                                            placeholderTextColor="#999"
                                            value={note}
                                            onChangeText={(value) => {
                                                setNote(value);
                                                if (value) setNoteError(false);
                                            }}
                                            multiline
                                        />
                                    </View>

                                    {editingTransaction && (
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { color: theme.text }]}>Date & Time</Text>
                                            <View style={styles.dateTimeRow}>
                                                <TouchableOpacity
                                                    style={[styles.dateTimeButton, SharedStyles.neoBorder, { backgroundColor: '#fff' }]}
                                                    onPress={() => setShowDatePicker(true)}
                                                >
                                                    <IconSymbol name="calendar" size={20} color="#000" />
                                                    <Text style={[styles.dateTimeText, { color: '#000' }]}>
                                                        {date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.dateTimeButton, SharedStyles.neoBorder, { backgroundColor: '#fff' }]}
                                                    onPress={() => setShowTimePicker(true)}
                                                >
                                                    <IconSymbol name="clock" size={20} color="#000" />
                                                    <Text style={[styles.dateTimeText, { color: '#000' }]}>
                                                        {date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>

                                            {showDatePicker && (
                                                <DateTimePicker
                                                    value={date}
                                                    mode="date"
                                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                                                        setShowDatePicker(Platform.OS === 'ios');
                                                        if (selectedDate) {
                                                            const newDate = new Date(date);
                                                            newDate.setFullYear(selectedDate.getFullYear());
                                                            newDate.setMonth(selectedDate.getMonth());
                                                            newDate.setDate(selectedDate.getDate());
                                                            setDate(newDate);
                                                        }
                                                    }}
                                                />
                                            )}

                                            {showTimePicker && (
                                                <DateTimePicker
                                                    value={date}
                                                    mode="time"
                                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                    onChange={(event: DateTimePickerEvent, selectedTime?: Date) => {
                                                        setShowTimePicker(Platform.OS === 'ios');
                                                        if (selectedTime) {
                                                            const newDate = new Date(date);
                                                            newDate.setHours(selectedTime.getHours());
                                                            newDate.setMinutes(selectedTime.getMinutes());
                                                            setDate(newDate);
                                                        }
                                                    }}
                                                />
                                            )}
                                        </View>
                                    )}

                                    <View style={styles.buttonContainer}>
                                        <NeoButton
                                            title={editingTransaction ? 'Update' : 'Save'}
                                            onPress={handleSave}
                                            backgroundColor={theme.tint}
                                        />

                                        {editingTransaction && (
                                            <TouchableOpacity
                                                style={[styles.deleteButton]}
                                                onPress={handleDelete}
                                            >
                                                <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Delete Transaction</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </ScrollView>
                            </NeoCard>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 8,
    },
    typeButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    typeText: {
        fontWeight: '900',
        fontSize: 13,
        textTransform: 'uppercase',
        color: '#000',
    },
    disabledTypeSelector: {
        opacity: 0.8,
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
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '900',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: '900',
        paddingVertical: 4,
    },
    input: {
        padding: 12,
        fontSize: 16,
        fontWeight: '700',
        minHeight: 50,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
    },
    dropdownText: {
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 8,
        gap: 12,
    },
    saveButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: 12,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    innerModalButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 0,
        gap: 8,
    },
    dateTimeText: {
        fontSize: 15,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
});
