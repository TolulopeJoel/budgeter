import { IconPicker } from '@/components/IconPicker';
import InputModal from '@/components/InputModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NeoSegmentedToggle } from '@/components/ui/NeobrutalistComponents';
import { Colors, SharedStyles } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Budgets() {
    const router = useRouter();
    const {
        categories,
        budgets,
        setBudgetLimit,
        getBudgetStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        deleteBudget,
        isBudgetsPrivacyEnabled
    } = useBudget();
    const theme = Colors.light;
    const insets = useSafeAreaInsets();

    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editType, setEditType] = useState<'flexible' | 'fixed'>('flexible');
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('ellipsis.circle.fill');

    const [showManageCategories, setShowManageCategories] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
    const [renameInput, setRenameInput] = useState('');
    const [renameIcon, setRenameIcon] = useState('ellipsis.circle.fill');
    const [showIconPicker, setShowIconPicker] = useState(false);

    const handleEditBudget = (category: string) => {
        const budget = budgets.find(b => b.category === category);
        setEditAmount(budget?.limit.toString() || '');
        setEditType(budget?.type || 'flexible');
        setEditingCategory(category);
    };

    const handleAddCategory = async () => {
        if (newCategoryName.trim()) {
            await addCategory(newCategoryName.trim(), newCategoryIcon);
            setNewCategoryName('');
            setNewCategoryIcon('ellipsis.circle.fill');
            setShowNewCategoryModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleEditBudget(newCategoryName.trim());
        }
    };

    const handleSaveBudget = async () => {
        if (editingCategory && editAmount) {
            await setBudgetLimit(editingCategory, parseFloat(editAmount), editType);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEditingCategory(null);
            setEditAmount('');
            setEditType('flexible');
        }
    };

    const handleRemoveBudget = async (category: string) => {
        Alert.alert(
            'Remove Budget Limit',
            `Remove the budget limit for ${category}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: async () => { await deleteBudget(category); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } }
            ]
        );
    };

    const handleRenameCategory = async () => {
        if (renamingCategory && renameInput.trim()) {
            await updateCategory(renamingCategory, renameInput.trim(), renameIcon);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setRenamingCategory(null);
            setRenameInput('');
            setRenameIcon('ellipsis.circle.fill');
            setShowRenameModal(false);
        }
    };

    const handleDeleteCategory = (category: string) => {
        Alert.alert(
            'Delete Category',
            `Delete "${category}"? Transactions will be moved to "Others".`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCategory(category); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } }
            ]
        );
    };

    const formatCurrency = (amount: number) => {
        if (isBudgetsPrivacyEnabled) return '₦ ••••••';
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getBudgetColor = (percentage: number) => {
        if (percentage >= 90) return theme.danger;
        if (percentage >= 80) return theme.warning;
        return theme.tint;
    };

    const getCategoryIcon = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        return category?.icon || 'ellipsis.circle.fill';
    };

    const allCategories = categories
        .filter(cat => cat.name !== 'Salary')
        .map(cat => {
            const budget = budgets.find(b => b.category === cat.name);
            const status = getBudgetStatus(cat.name);
            return {
                name: cat.name,
                icon: cat.icon,
                limit: budget?.limit || 0,
                type: budget?.type || 'flexible',
                spent: status.spent,
                percentage: status.percentage,
                hasBudget: !!budget && budget.limit > 0
            };
        })
        .sort((a, b) => {
            if (a.hasBudget && !b.hasBudget) return -1;
            if (!a.hasBudget && b.hasBudget) return 1;
            return b.spent - a.spent;
        });

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: theme.card }, SharedStyles.softShadow]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Budget Limits</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {allCategories.map(item => {
                    const budgetColor = getBudgetColor(item.percentage);
                    return (
                        <TouchableOpacity
                            key={item.name}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleEditBudget(item.name); }}
                        >
                            <View style={[styles.categoryCard, { backgroundColor: theme.card }, SharedStyles.softShadow]}>
                                <View style={[styles.catIconCircle, { backgroundColor: (item.hasBudget ? budgetColor : theme.textMuted) + '15' }]}>
                                    <IconSymbol name={item.icon as any} size={18} color={item.hasBudget ? budgetColor : theme.textMuted} />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
                                        {item.hasBudget && item.type === 'fixed' && (
                                            <View style={[styles.fixedPill, { backgroundColor: theme.primarySoft }]}>
                                                <Text style={[styles.fixedPillText, { color: theme.tint }]}>Fixed</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.categorySub, { color: theme.textMuted }]}>
                                        {item.hasBudget
                                            ? `${formatCurrency(Math.max(0, item.limit - item.spent))} left · Limit ${formatCurrency(item.limit)}`
                                            : (item.spent > 0 ? `${formatCurrency(item.spent)} spent` : 'No spending')}
                                    </Text>
                                    {item.hasBudget && (
                                        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSecondary, marginTop: 8 }]}>
                                            <View style={[styles.progressFill, { width: `${item.percentage}%`, backgroundColor: budgetColor }]} />
                                        </View>
                                    )}
                                </View>
                                {item.hasBudget ? (
                                    <TouchableOpacity
                                        style={[styles.trashBtn, { backgroundColor: theme.dangerSoft }]}
                                        onPress={() => handleRemoveBudget(item.name)}
                                    >
                                        <Ionicons name="trash-outline" size={16} color={theme.danger} />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.addCircle, { backgroundColor: theme.primarySoft }]}>
                                        <Ionicons name="add" size={18} color={theme.tint} />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <View style={{ gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                        style={[styles.outlineBtn, { borderColor: theme.border }]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNewCategoryModal(true); }}
                    >
                        <Ionicons name="add-circle-outline" size={18} color={theme.tint} />
                        <Text style={[styles.outlineBtnText, { color: theme.tint }]}>Create New Category</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.outlineBtn, { borderColor: theme.border }]}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowManageCategories(true); }}
                    >
                        <Ionicons name="settings-outline" size={18} color={theme.textSecondary} />
                        <Text style={[styles.outlineBtnText, { color: theme.textSecondary }]}>Manage Categories</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Budget Modal */}
            <InputModal
                visible={editingCategory !== null}
                title={`Budget for ${editingCategory}`}
                value={editAmount}
                onChangeText={setEditAmount}
                onConfirm={handleSaveBudget}
                onCancel={() => { setEditingCategory(null); setEditAmount(''); }}
                placeholder="0"
                keyboardType="numeric"
                prefix="₦"
                confirmText="Save Budget"
                disabled={!editAmount}
            >
                <NeoSegmentedToggle
                    options={[
                        { label: 'Flexible', value: 'flexible', activeColor: theme.primary },
                        { label: 'Fixed', value: 'fixed', activeColor: theme.primary },
                    ]}
                    value={editType}
                    onValueChange={(val) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditType(val); }}
                    style={{ marginBottom: 16 }}
                />
                <Text style={[styles.helperText, { color: theme.textMuted }]}>
                    {editType === 'fixed'
                        ? "Fixed budgets are reserved from 'Safe to Spend' immediately, even if not yet spent."
                        : "Flexible budgets only deduct from 'Safe to Spend' as you actually spend money."}
                </Text>
            </InputModal>

            {/* New Category Modal */}
            <InputModal
                visible={showNewCategoryModal}
                title=""
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                onConfirm={handleAddCategory}
                onCancel={() => { setShowNewCategoryModal(false); setShowIconPicker(false); }}
                placeholder="Category Name"
                confirmText="Create"
                leftElement={
                    <TouchableOpacity
                        style={[styles.iconPickerBtn, { backgroundColor: theme.primarySoft }]}
                        onPress={() => setShowIconPicker(!showIconPicker)}
                    >
                        <IconSymbol name={newCategoryIcon as any} size={24} color={theme.tint} />
                    </TouchableOpacity>
                }
            >
                {showIconPicker && (
                    <View style={{ marginTop: 16, maxHeight: 250 }}>
                        <IconPicker
                            selectedIcon={newCategoryIcon}
                            onSelect={(icon) => { setNewCategoryIcon(icon); setShowIconPicker(false); }}
                        />
                    </View>
                )}
            </InputModal>

            {/* Rename Modal */}
            <InputModal
                visible={showRenameModal}
                title=""
                value={renameInput}
                onChangeText={setRenameInput}
                onConfirm={handleRenameCategory}
                onCancel={() => { setShowRenameModal(false); setRenamingCategory(null); setRenameInput(''); setShowIconPicker(false); }}
                placeholder="Category Name"
                confirmText="Rename"
                leftElement={
                    <TouchableOpacity
                        style={[styles.iconPickerBtn, { backgroundColor: theme.backgroundSecondary }]}
                        onPress={() => setShowIconPicker(!showIconPicker)}
                    >
                        <IconSymbol name={renameIcon as any} size={24} color={theme.tint} />
                    </TouchableOpacity>
                }
            >
                {showIconPicker && (
                    <View style={{ marginTop: 16, maxHeight: 250 }}>
                        <IconPicker
                            selectedIcon={renameIcon}
                            onSelect={(icon) => { setRenameIcon(icon); setShowIconPicker(false); }}
                        />
                    </View>
                )}
            </InputModal>

            {/* Manage Categories Modal */}
            <Modal visible={showManageCategories} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
                    <View style={styles.header}>
                        <View style={{ width: 40 }} />
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Manage Categories</Text>
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: theme.backgroundSecondary }]}
                            onPress={() => setShowManageCategories(false)}
                        >
                            <Ionicons name="close" size={18} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {categories.map(category => (
                            <TouchableOpacity
                                key={category.name}
                                onPress={() => {
                                    setRenamingCategory(category.name);
                                    setRenameInput(category.name);
                                    setRenameIcon(category.icon);
                                    setShowRenameModal(true);
                                }}
                            >
                                <View style={[styles.categoryCard, { backgroundColor: theme.card }, SharedStyles.softShadow]}>
                                    <View style={[styles.catIconCircle, { backgroundColor: theme.primarySoft }]}>
                                        <IconSymbol name={category.icon as any} size={18} color={theme.tint} />
                                    </View>
                                    <Text style={[styles.categoryName, { color: theme.text, flex: 1 }]}>{category.name}</Text>
                                    <TouchableOpacity
                                        style={[styles.trashBtn, { backgroundColor: theme.dangerSoft }]}
                                        onPress={() => handleDeleteCategory(category.name)}
                                    >
                                        <Ionicons name="trash-outline" size={16} color={theme.danger} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
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
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    content: { flex: 1, paddingHorizontal: 20 },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
    },
    catIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    categoryInfo: { flex: 1 },
    categoryName: { fontSize: 15, fontWeight: '600' },
    categorySub: { fontSize: 12, fontWeight: '400', marginTop: 2 },
    progressTrack: { height: 5, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 5, position: 'absolute', left: 0, top: 0 },
    fixedPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
    },
    fixedPillText: { fontSize: 11, fontWeight: '600' },
    trashBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addCircle: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outlineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    outlineBtnText: { fontSize: 15, fontWeight: '600' },
    helperText: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
    iconPickerBtn: {
        width: 56,
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
});