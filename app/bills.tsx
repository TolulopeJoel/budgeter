import CategoryPicker from '@/components/CategoryPicker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NeoCard } from '@/components/ui/NeobrutalistComponents';
import { Colors, SharedStyles } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
        isBillPaid,
        markBillAsPaid,
        unmarkBillAsPaid,
    } = useBudget();
    const theme = Colors.light;
    const insets = useSafeAreaInsets();

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

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
                    onPress: () => {
                        deleteRecurringBill(billId);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    },
                },
            ]
        );
    };

    const handleUnmarkPaid = (billId: string) => {
        const bill = recurringBills.find(b => b.id === billId);
        Alert.alert(
            'Unmark as Paid',
            `Are you sure you want to mark "${bill?.name}" as unpaid? This will delete the associated transaction.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unmark',
                    style: 'destructive',
                    onPress: async () => {
                        await unmarkBillAsPaid(billId);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    },
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

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
            {/* ... (Header and Content remain same) ... */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                }}>
                    <IconSymbol name="chevron.left" size={28} color={theme.text} />
                </TouchableOpacity>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Total Summary */}
                <NeoCard style={styles.summaryCard} backgroundColor={theme.card}>
                    <View style={styles.summaryHeader}>
                        <Text style={[styles.summaryLabel, { color: '#000' }]}>Total Monthly Bills</Text>
                        <View style={[SharedStyles.neoBorder, { backgroundColor: theme.danger, paddingHorizontal: 10, paddingVertical: 4 }]}>
                            <Text style={[styles.badgeText, { color: '#000' }]}>
                                {recurringBills.length} {recurringBills.length === 1 ? 'bill' : 'bills'}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.summaryAmount, { color: theme.danger }]}>
                        {formatCurrency(totalBills)}
                    </Text>
                </NeoCard>

                {/* Bills List */}
                {sortedBills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Bills</Text>

                        {sortedBills.map(bill => (
                            <TouchableOpacity
                                key={bill.id}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    handleOpenEdit(bill.id);
                                }}
                            >
                                <NeoCard style={styles.billCard}>
                                    <View style={styles.billContent}>
                                        <View
                                            style={[
                                                styles.iconContainer,
                                                SharedStyles.neoBorder,
                                                { backgroundColor: '#fff' },
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
                                                    • Day {bill.dueDay}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.billRight}>
                                            <Text style={[styles.billAmount, { color: theme.danger }]}>
                                                {formatCurrency(bill.amount)}
                                            </Text>
                                            <View style={styles.billActions}>
                                                {isBillPaid(bill.id, currentMonthKey) ? (
                                                    <TouchableOpacity
                                                        style={[styles.paidBadge, SharedStyles.neoBorder, { backgroundColor: theme.success }]}
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            handleUnmarkPaid(bill.id);
                                                        }}
                                                    >
                                                        <IconSymbol name="checkmark.circle.fill" size={14} color="#000" />
                                                        <Text style={[styles.paidText, { color: '#000' }]}>Paid</Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, SharedStyles.neoBorder, { backgroundColor: theme.success }]}
                                                        onPress={(e) => {
                                                            e.stopPropagation();
                                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                                            markBillAsPaid(bill.id);
                                                        }}
                                                    >
                                                        <IconSymbol name="checkmark" size={16} color="#000" />
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    style={[styles.actionButton, SharedStyles.neoBorder, { backgroundColor: theme.danger }]}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(bill.id);
                                                    }}
                                                >
                                                    <IconSymbol name="trash" size={16} color="#000" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </NeoCard>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleOpenAdd();
                    }}
                >
                    <NeoCard style={[styles.billCard, { borderStyle: 'dashed' } as any]}>
                        <Text style={[styles.billName, { color: theme.tint }]}>+ Add New Bill</Text>
                    </NeoCard>
                </TouchableOpacity>
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={isAdding || editingBill !== null} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <NeoCard style={[styles.modalContent, { backgroundColor: theme.card, paddingBottom: insets.bottom + 24 }]}>
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
                                <Text style={{ fontSize: 24, fontWeight: '900' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Bill Name</Text>
                                <TextInput
                                    style={[styles.input, SharedStyles.neoBorder, { color: '#000', backgroundColor: '#fff' }]}
                                    placeholder="e.g., Rent, Netflix, Insurance"
                                    placeholderTextColor="#999"
                                    value={formData.name}
                                    onChangeText={(value) => setFormData({ ...formData, name: value })}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
                                    <TextInput
                                        style={[styles.input, SharedStyles.neoBorder, { color: '#000', backgroundColor: '#fff' }]}
                                        placeholder="0"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        value={formData.amount}
                                        onChangeText={(value) => setFormData({ ...formData, amount: value })}
                                    />
                                </View>

                                <View style={styles.halfInput}>
                                    <Text style={[styles.label, { color: theme.text }]}>Due Day</Text>
                                    <TextInput
                                        style={[styles.input, SharedStyles.neoBorder, { color: '#000', backgroundColor: '#fff' }]}
                                        placeholder="1-31"
                                        placeholderTextColor="#999"
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
                            onPress={handleSave}
                        >
                            <NeoCard
                                backgroundColor={theme.tint}
                                style={styles.saveButton}
                            >
                                <Text style={styles.saveButtonText}>
                                    {editingBill ? 'Update Bill' : 'Add Bill'}
                                </Text>
                            </NeoCard>
                        </TouchableOpacity>
                    </NeoCard>
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
        paddingBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    summaryCard: {
        padding: 20,
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
        fontSize: 20,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    billCard: {
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
        fontWeight: '900',
        textTransform: 'uppercase',
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
    billActions: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    paidText: {
        fontSize: 12,
        fontWeight: '700',
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
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    input: {
        padding: 12,
        fontSize: 16,
        fontWeight: '900',
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
        alignItems: 'center',
        marginTop: 24,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
});