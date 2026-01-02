import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { TransactionType, useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddTransaction() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addTransaction, updateTransaction, transactions, categories, addCategory } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const isEditing = !!params.id;

    useEffect(() => {
        if (isEditing) {
            const transaction = transactions.find(t => t.id === params.id);
            if (transaction) {
                setType(transaction.type);
                setAmount(transaction.amount.toString());
                setCategory(transaction.category);
                setNote(transaction.note || '');
            }
        } else if (params.initialType) {
            setType(params.initialType as TransactionType);
        }
    }, [params.id, params.initialType, transactions]);

    const handleSave = async () => {
        if (!amount || !category) return;

        const transactionData = {
            type,
            amount: parseFloat(amount),
            category,
            note,
            date: isEditing ? transactions.find(t => t.id === params.id)!.date : new Date().toISOString(),
        };

        if (isEditing) {
            await updateTransaction({ ...transactionData, id: params.id as string });
        } else {
            await addTransaction(transactionData);
        }

        router.back();
    };

    const handleAddCategory = async () => {
        if (newCategory) {
            await addCategory(newCategory);
            setCategory(newCategory);
            setNewCategory('');
            setIsAddingCategory(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>{isEditing ? 'Edit Transaction' : 'New Transaction'}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="xmark.circle.fill" size={30} color={theme.icon} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
                <View style={styles.typeSelector}>
                    {(['income', 'expense', 'debt'] as TransactionType[]).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.typeButton,
                                type === t && { backgroundColor: theme.tint },
                                { borderColor: theme.border }
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
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        placeholder="0.00"
                        placeholderTextColor={theme.icon}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                        {categories.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[
                                    styles.categoryChip,
                                    category === c && { backgroundColor: theme.tint },
                                    { borderColor: theme.border }
                                ]}
                                onPress={() => setCategory(c)}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    category === c ? { color: '#fff' } : { color: theme.text }
                                ]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.categoryChip, { borderColor: theme.tint, borderStyle: 'dashed' }]}
                            onPress={() => setIsAddingCategory(true)}
                        >
                            <Text style={{ color: theme.tint }}>+ New</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Note (Optional)</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        placeholder="Details..."
                        placeholderTextColor={theme.icon}
                        value={note}
                        onChangeText={setNote}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>{isEditing ? 'Update Transaction' : 'Save Transaction'}</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={isAddingCategory} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>New Category</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border, marginBottom: 16 }]}
                            placeholder="Category Name"
                            placeholderTextColor={theme.icon}
                            value={newCategory}
                            onChangeText={setNewCategory}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setIsAddingCategory(false)} style={styles.modalButton}>
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddCategory} style={[styles.modalButton, { backgroundColor: theme.tint }]}>
                                <Text style={{ color: '#fff' }}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: Platform.OS === 'ios' ? 0 : 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    form: {
        flex: 1,
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 10,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    typeText: {
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    categoryList: {
        flexDirection: 'row',
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    categoryText: {
        fontWeight: '500',
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        borderRadius: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
});
