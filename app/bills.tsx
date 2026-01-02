import CategoryPicker from '@/components/CategoryPicker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RecurringBills() {
    const router = useRouter();
    const {
        recurringBills,
        addRecurringBill,
        updateRecurringBill,
        deleteRecurringBill,
        getTotalRecurringBills,
        categories,
        addCategory,
    } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [isAdding, setIsAdding] = useState(false);
    const [editingBill, setEditingBill] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        category: categories[0]?.name || 'Food',
        dueDay: '1',
    });

    const handleOpenAdd = () => {
        setFormData({
            name: '',
            amount: '',
            category: categories[0]?.name || 'Utilities',
            dueDay: '1'
        });
        setIsAdding(true);
    };

    const handleOpenEdit = (billId: string) => {
        const bill = recurringBills.find(b => b.id === billId);
        if (bill) {
            setFormData({
                name: bill.name,
                amount: bill.amount.toString(),
                category: bill.category,
                dueDay: bill.dueDay.toString(),
            });
            setEditingBill(billId);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.amount) {
            Alert.alert('Missing Information', 'Please fill in all required fields');
            return;
        }

        const billData = {
            name: formData.name,
            amount: parseFloat(formData.amount),
            category: formData.category,
            dueDay: parseInt(formData.dueDay) || 1,
        };

        if (editingBill) {
            await updateRecurringBill({ ...billData, id: editingBill });
            setEditingBill(null);
        } else {
            await addRecurringBill(billData);
            setIsAdding(false);
        }

        setFormData({ name: '', amount: '', category: categories[0]?.name || 'Food', dueDay: '1' });
    };

    const handleDelete = (billId: string) => {
        Alert.alert(
            'Delete Bill',
            'Are you sure you want to delete this recurring bill?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteRecurringBill(billId),
                },
            ]
        );
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getCategoryIcon = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        return category?.icon || 'ellipsis.circle.fill';
    };

    const sortedBills = [...recurringBills].sort((a, b) => a.dueDay - b.dueDay);
    const totalBills = getTotalRecurringBills();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* ... (Header and Content remain same) ... */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Recurring Bills</Text>
                <TouchableOpacity
                    onPress={handleOpenAdd}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: theme.card,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <IconSymbol name="plus" size={20} color={theme.tint} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Total Summary */}
                <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.summaryHeader}>
                        <Text style={[styles.summaryLabel, { color: theme.icon }]}>Total Monthly Bills</Text>
                        <View style={[styles.badge, { backgroundColor: theme.danger + '20' }]}>
                            <Text style={[styles.badgeText, { color: theme.danger }]}>
                                {recurringBills.length} {recurringBills.length === 1 ? 'bill' : 'bills'}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.summaryAmount, { color: theme.danger }]}>
                        {formatCurrency(totalBills)}
                    </Text>
                </View>

                {/* Bills List */}
                {sortedBills.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Bills</Text>

                        {sortedBills.map(bill => (
                            <TouchableOpacity
                                key={bill.id}
                                style={[styles.billCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                                onPress={() => handleOpenEdit(bill.id)}
                            >
                                <View style={styles.billContent}>
                                    <View
                                        style={[
                                            styles.iconContainer,
                                            { backgroundColor: theme.tint + '10' },
                                        ]}
                                    >
                                        <IconSymbol name={getCategoryIcon(bill.category) as any} size={20} color={theme.tint} />
                                    </View>

                                    <View style={styles.billInfo}>
                                        <Text style={[styles.billName, { color: theme.text }]}>{bill.name}</Text>
                                        <View style={styles.billMeta}>
                                            <Text style={[styles.billCategory, { color: theme.icon }]}>
                                                {bill.category}
                                            </Text>
                                            <Text style={[styles.billDue, { color: theme.icon }]}>
                                                • Due on day {bill.dueDay}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.billRight}>
                                        <Text style={[styles.billAmount, { color: theme.danger }]}>
                                            {formatCurrency(bill.amount)}
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: theme.danger + '10' }]}
                                            onPress={() => handleDelete(bill.id)}
                                        >
                                            <IconSymbol name="trash" size={16} color={theme.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                        <IconSymbol name="calendar.badge.exclamationmark" size={48} color={theme.icon} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>No recurring bills yet</Text>
                        <Text style={[styles.emptyText, { color: theme.icon }]}>
                            Add your monthly bills to track them automatically
                        </Text>
                        <TouchableOpacity
                            style={[styles.emptyButton, { backgroundColor: theme.tint }]}
                            onPress={handleOpenAdd}
                        >
                            <Text style={styles.emptyButtonText}>Add Your First Bill</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={isAdding || editingBill !== null} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {editingBill ? 'Edit Bill' : 'Add Recurring Bill'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsAdding(false);
                                    setEditingBill(null);
                                }}
                            >
                                <IconSymbol name="xmark.circle.fill" size={28} color={theme.icon} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Bill Name</Text>
                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="e.g., Rent, Netflix, Insurance"
                                    placeholderTextColor={theme.icon}
                                    value={formData.name}
                                    onChangeText={(value) => setFormData({ ...formData, name: value })}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="0"
                                        placeholderTextColor={theme.icon}
                                        keyboardType="numeric"
                                        value={formData.amount}
                                        onChangeText={(value) => setFormData({ ...formData, amount: value })}
                                    />
                                </View>

                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>Due Day</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="1-31"
                                        placeholderTextColor={theme.icon}
                                        keyboardType="numeric"
                                        value={formData.dueDay}
                                        onChangeText={(value) => setFormData({ ...formData, dueDay: value })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <CategoryPicker
                                    label="Category"
                                    value={formData.category}
                                    onSelect={(cat) => setFormData({ ...formData, category: cat })}
                                    categories={categories}
                                    placeholder="Odogwu 😏"
                                />
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.tint }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>
                                {editingBill ? 'Update Bill' : 'Add Bill'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    summaryCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    summaryAmount: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    billCard: {
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 12,
    },
    billContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    billInfo: {
        flex: 1,
    },
    billName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    billMeta: {
        flexDirection: 'row',
    },
    billCategory: {
        fontSize: 12,
        fontWeight: '500',
    },
    billDue: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    billRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    billAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
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
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    halfInput: {
        flex: 1,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addNewText: {
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});