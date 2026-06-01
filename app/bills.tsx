import CategoryPicker from '@/components/CategoryPicker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, SharedStyles } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
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
        isBudgetsPrivacyEnabled,
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
        setFormData({ name: '', amount: '', category: categories[0]?.name || 'Utilities', dueDay: '1' });
        setIsAdding(true);
    };

    const handleOpenEdit = (billId: string) => {
        const bill = recurringBills.find(b => b.id === billId);
        if (bill) {
            setFormData({ name: bill.name, amount: bill.amount.toString(), category: bill.category, dueDay: bill.dueDay.toString() });
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
        Alert.alert('Delete Bill', 'Are you sure you want to delete this recurring bill?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { deleteRecurringBill(billId); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
        ]);
    };

    const handleUnmarkPaid = (billId: string) => {
        const bill = recurringBills.find(b => b.id === billId);
        Alert.alert('Unmark as Paid', `Mark "${bill?.name}" as unpaid? This will delete the associated transaction.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unmark', style: 'destructive', onPress: async () => { await unmarkBillAsPaid(billId); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
        ]);
    };

    const formatCurrency = (amount: number) => {
        if (isBudgetsPrivacyEnabled) return '₦ ••••••';
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
    const paidCount = sortedBills.filter(b => isBillPaid(b.id, currentMonthKey)).length;

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: theme.card }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Recurring Bills</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: theme.hero }, SharedStyles.softShadowMd]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={styles.summaryLabel}>Total Monthly Bills</Text>
                            <Text style={styles.summaryAmount}>{formatCurrency(totalBills)}</Text>
                        </View>
                        <View style={[styles.countBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                            <Text style={styles.countBadgeText}>{paidCount}/{sortedBills.length} paid</Text>
                        </View>
                    </View>

                    {/* Mini progress */}
                    {sortedBills.length > 0 && (
                        <View style={[styles.miniTrack, { backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 16 }]}>
                            <View style={[styles.miniFill, { width: `${(paidCount / sortedBills.length) * 100}%`, backgroundColor: theme.success }]} />
                        </View>
                    )}
                </View>

                {/* Bills List */}
                {sortedBills.length > 0 && (
                    <View style={[styles.listCard, { backgroundColor: theme.card }]}>
                        {sortedBills.map((bill, idx) => {
                            const paid = isBillPaid(bill.id, currentMonthKey);
                            return (
                                <TouchableOpacity
                                    key={bill.id}
                                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleOpenEdit(bill.id); }}
                                >
                                    <View style={[
                                        styles.billRow,
                                        idx < sortedBills.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight }
                                    ]}>
                                        <View style={[styles.billIconCircle, { backgroundColor: (paid ? theme.success : theme.tint) + '15' }]}>
                                            <IconSymbol name={getCategoryIcon(bill.category) as any} size={18} color={paid ? theme.success : theme.tint} />
                                        </View>
                                        <View style={styles.billInfo}>
                                            <Text style={[styles.billName, { color: paid ? theme.textMuted : theme.text }]}>{bill.name}</Text>
                                            <Text style={[styles.billMeta, { color: theme.textMuted }]}>
                                                {bill.category} · Day {bill.dueDay}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                            <Text style={[styles.billAmount, { color: paid ? theme.textMuted : theme.danger }]}>
                                                {formatCurrency(bill.amount)}
                                            </Text>
                                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                                {paid ? (
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, { backgroundColor: theme.successSoft }]}
                                                        onPress={(e) => { e.stopPropagation(); handleUnmarkPaid(bill.id); }}
                                                    >
                                                        <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                                                        <Text style={[styles.actionBtnText, { color: theme.success }]}>Paid</Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TouchableOpacity
                                                        style={[styles.iconActionBtn, { backgroundColor: theme.successSoft }]}
                                                        onPress={(e) => { e.stopPropagation(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); markBillAsPaid(bill.id); }}
                                                    >
                                                        <Ionicons name="checkmark" size={16} color={theme.success} />
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    style={[styles.iconActionBtn, { backgroundColor: theme.dangerSoft }]}
                                                    onPress={(e) => { e.stopPropagation(); handleDelete(bill.id); }}
                                                >
                                                    <Ionicons name="trash-outline" size={16} color={theme.danger} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {sortedBills.length === 0 && (
                    <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                        <Ionicons name="thumbs-up-outline" size={32} color={theme.textMuted} style={{ marginBottom: 8 }} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Everything is paid up.</Text>
                        <Text style={[styles.emptySub, { color: theme.textMuted }]}>No pending bills waiting to haunt you. Absolute flex.</Text>
                    </View>
                )}

                {/* Add Bill Button */}
                <TouchableOpacity
                    style={[styles.addBtn, { borderColor: theme.border }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleOpenAdd(); }}
                >
                    <Ionicons name="add-circle-outline" size={18} color={theme.tint} />
                    <Text style={[styles.addBtnText, { color: theme.tint }]}>Add New Bill</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={isAdding || editingBill !== null} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: theme.card, paddingBottom: insets.bottom + 24 }]}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {editingBill ? 'Edit Bill' : 'Add Recurring Bill'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.closeBtn, { backgroundColor: theme.backgroundSecondary }]}
                                onPress={() => { setIsAdding(false); setEditingBill(null); }}
                            >
                                <Ionicons name="close" size={18} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Bill Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                                    placeholder="e.g., Rent, Netflix, Insurance"
                                    placeholderTextColor={theme.textMuted}
                                    value={formData.name}
                                    onChangeText={(value) => setFormData({ ...formData, name: value })}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Amount (₦)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                                        placeholder="0"
                                        placeholderTextColor={theme.textMuted}
                                        keyboardType="numeric"
                                        value={formData.amount}
                                        onChangeText={(value) => setFormData({ ...formData, amount: value })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Due Day</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                                        placeholder="1–31"
                                        placeholderTextColor={theme.textMuted}
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
                                    placeholder="Select category"
                                />
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: theme.tint }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveBtnText}>{editingBill ? 'Update Bill' : 'Add Bill'}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
    content: { flex: 1, paddingHorizontal: 20 },
    summaryCard: {
        borderRadius: 20,
        padding: 22,
        marginBottom: 16,
    },
    summaryLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
    summaryAmount: { fontSize: 34, fontWeight: '700', color: '#fff', letterSpacing: -1 },
    countBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    countBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    miniTrack: { height: 5, borderRadius: 5, overflow: 'hidden' },
    miniFill: { height: '100%', borderRadius: 5 },
    listCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    billRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    billIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    billInfo: { flex: 1 },
    billName: { fontSize: 15, fontWeight: '600' },
    billMeta: { fontSize: 12, fontWeight: '400', marginTop: 2 },
    billAmount: { fontSize: 15, fontWeight: '700' },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    actionBtnText: { fontSize: 12, fontWeight: '600' },
    iconActionBtn: {
        width: 30,
        height: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        marginTop: 4,
    },
    addBtnText: { fontSize: 15, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
    input: {
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 12,
        fontSize: 16,
        fontWeight: '500',
        borderWidth: 1,
    },
    saveBtn: {
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    emptyState: {
        borderRadius: 16,
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, letterSpacing: -0.2 },
    emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});