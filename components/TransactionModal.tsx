import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { Transaction, TransactionType, useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface TransactionModalProps {
    visible: boolean;
    onClose: () => void;
    editingTransaction?: Transaction | null;
}

export default function TransactionModal({ visible, onClose, editingTransaction }: TransactionModalProps) {
    const { addTransaction, updateTransaction, deleteTransaction, categories } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const [amountError, setAmountError] = useState(false);
    const [categoryError, setCategoryError] = useState(false);

    useEffect(() => {
        setAmountError(false);
        setCategoryError(false);
    }, [visible]);


    useEffect(() => {
        if (editingTransaction) {
            setType(editingTransaction.type);
            setAmount(editingTransaction.amount.toString());
            setCategory(editingTransaction.category);
            setNote(editingTransaction.note || '');
        } else {
            // Reset for new transaction
            setType('expense');
            setAmount('');
            setCategory('');
            setNote('');
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

        if (hasError) return;

        const transactionData = {
            type,
            amount: parseFloat(amount),
            category: type === 'expense' ? category : (type === 'income' ? 'Income' : 'Debt'),
            note,
            date: editingTransaction ? editingTransaction.date : new Date().toISOString(),
        };

        if (editingTransaction) {
            await updateTransaction({ ...transactionData, id: editingTransaction.id });
        } else {
            await addTransaction(transactionData);
        }

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
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={[styles.modalContent, { backgroundColor: theme.card }]}
                        >
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: theme.text }]}>
                                    {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                                </Text>
                                <TouchableOpacity onPress={onClose}>
                                    <IconSymbol name="xmark.circle.fill" size={28} color={theme.icon} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={[styles.typeSelector]}>
                                    {(['expense', 'income', 'debt'] as TransactionType[]).map((t) => (
                                        <TouchableOpacity
                                            key={t}
                                            disabled={!!editingTransaction}
                                            style={[
                                                styles.typeButton,
                                                type === t && { backgroundColor: theme.tint },
                                                { borderColor: theme.border },
                                                editingTransaction && type !== t && { opacity: 0.04 }
                                            ]}
                                            onPress={() => setType(t)}
                                        >
                                            <Text style={[
                                                styles.typeText,
                                                type === t ? { color: '#fff' } : { color: theme.text }
                                            ]}>
                                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
                                    <View style={styles.amountInputContainer}>
                                        <Text style={[styles.currencySymbol, { color: theme.text }]}>₦</Text>
                                        <TextInput
                                            style={[
                                                styles.amountInput,
                                                {
                                                    color: theme.text,
                                                    borderBottomColor: amountError ? theme.danger : theme.border,
                                                },
                                            ]}
                                            placeholder="0"
                                            placeholderTextColor={theme.icon}
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
                                        <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.dropdownTrigger,
                                                {
                                                    borderColor: categoryError ? theme.danger : theme.border,
                                                    backgroundColor: categoryError
                                                        ? theme.danger + '10'
                                                        : theme.background,
                                                },
                                            ]}
                                            onPress={() => setShowCategoryPicker(true)}
                                        >
                                            <Text style={[
                                                styles.dropdownText,
                                                { color: category ? theme.text : theme.icon }
                                            ]}>
                                                {category || 'Odogwu 😏'}
                                            </Text>
                                            <IconSymbol name="chevron.down" size={20} color={theme.icon} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Note (Optional)</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="What was this for?"
                                        placeholderTextColor={theme.icon}
                                        value={note}
                                        onChangeText={setNote}
                                        multiline
                                    />
                                </View>

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={[styles.saveButton, { backgroundColor: theme.tint }]}
                                        onPress={handleSave}
                                    >
                                        <Text style={styles.saveButtonText}>
                                            {editingTransaction ? 'Update' : 'Save'}
                                        </Text>
                                    </TouchableOpacity>

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
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>

            {/* Category Picker Modal */}
            <Modal visible={showCategoryPicker} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={() => setShowCategoryPicker(false)}>
                    <View style={styles.innerModalOverlay}>
                        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                            <View style={[styles.innerModalContent, { backgroundColor: theme.card }]}>
                                <View style={styles.innerModalHeader}>
                                    <Text style={[styles.innerModalTitle, { color: theme.text }]}>Select Category</Text>
                                    <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                                        <IconSymbol name="xmark.circle.fill" size={24} color={theme.icon} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.categoryPickerList} showsVerticalScrollIndicator={false}>
                                    {categories.map((c) => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[
                                                styles.categoryOption,
                                                category === c && { backgroundColor: theme.tint + '15' }
                                            ]}
                                            onPress={() => {
                                                setCategory(c);
                                                setCategoryError(false);
                                                setShowCategoryPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.categoryOptionText,
                                                { color: theme.text },
                                                category === c && { color: theme.tint, fontWeight: 'bold' }
                                            ]}>
                                                {c}
                                            </Text>
                                            {category === c && (
                                                <IconSymbol name="checkmark" size={20} color={theme.tint} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 8,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    typeText: {
        fontWeight: '600',
        fontSize: 14,
    },
    disabledTypeSelector: {
        opacity: 0.8,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.7,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: 'bold',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        borderBottomWidth: 1,
        paddingVertical: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
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
    categoryPickerList: {
        maxHeight: 400,
    },
    innerModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    categoryOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    categoryOptionText: {
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
        fontWeight: '600',
    },
    innerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    innerModalContent: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
    },
    innerModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    innerModalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    innerModalButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
});
