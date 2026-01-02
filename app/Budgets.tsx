import InputModal from '@/components/InputModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        deleteBudget
    } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editType, setEditType] = useState<'flexible' | 'fixed'>('flexible');
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Manage Categories State
    const [showManageCategories, setShowManageCategories] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
    const [renameInput, setRenameInput] = useState('');

    const handleEditBudget = (category: string) => {
        const budget = budgets.find(b => b.category === category);
        setEditAmount(budget?.limit.toString() || '');
        setEditType(budget?.type || 'flexible');
        setEditingCategory(category);
    };

    const handleAddCategory = async () => {
        if (newCategoryName.trim()) {
            await addCategory(newCategoryName.trim());
            setNewCategoryName('');
            setShowNewCategoryModal(false);
            // Immediately open budget editor for new category
            handleEditBudget(newCategoryName.trim());
        }
    };

    const handleSaveBudget = async () => {
        if (editingCategory && editAmount) {
            await setBudgetLimit(editingCategory, parseFloat(editAmount), editType);
            setEditingCategory(null);
            setEditAmount('');
            setEditType('flexible');
        }
    };

    const handleRemoveBudget = async (category: string) => {
        Alert.alert(
            'Remove Budget Limit',
            `Are you sure you want to remove the budget limit for ${category}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => await deleteBudget(category)
                }
            ]
        );
    };

    const handleRenameCategory = async () => {
        if (renamingCategory && renameInput.trim() && renameInput.trim() !== renamingCategory) {
            await updateCategory(renamingCategory, renameInput.trim());
            setRenamingCategory(null);
            setRenameInput('');
            setShowRenameModal(false);
        }
    };

    const handleDeleteCategory = (category: string) => {
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${category}"? This will update all associated transactions to "Others"`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => await deleteCategory(category)
                }
            ]
        );
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getBudgetColor = (percentage: number) => {
        if (percentage >= 90) return theme.danger;
        if (percentage >= 80) return theme.warning;
        return theme.tint;
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            'Rent': 'house.fill',
            'Utilities': 'bolt.fill',
            'Insurance': 'shield.fill',
            'Subscriptions': 'play.rectangle.fill',
            'Loan Payment': 'creditcard.fill',
            'Food': 'cart.fill',
            'Transport': 'car.fill',
            'Entertainment': 'gamecontroller.fill',
            'Shopping': 'bag.fill',
            'Health': 'heart.fill',
            'Education': 'book.fill',
            'Salary': 'cash.fill',
            'Income': 'arrow.down.circle.fill',
            'Debt': 'creditcard.fill',
            'Others': 'ellipsis.circle.fill',
        };
        return icons[category] || 'ellipsis.circle.fill';
    };

    // Categories with budgets
    const categoriesWithBudgets = categories.filter(cat => {
        const budget = budgets.find(b => b.category === cat);
        return budget && budget.limit > 0;
    });

    // Categories without budgets (excluding income categories)
    const categoriesWithoutBudgets = categories.filter(cat => {
        const budget = budgets.find(b => b.category === cat);
        return (!budget || budget.limit === 0) && cat !== 'Salary';
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="chevron.left" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Budget Management</Text>
                <TouchableOpacity
                    onPress={() => setShowManageCategories(true)}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: theme.card,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <IconSymbol name="list.bullet" size={20} color={theme.text} />
                </TouchableOpacity>

            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Active Budgets */}
                {categoriesWithBudgets.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Budgets</Text>

                        {categoriesWithBudgets.map(category => {
                            const status = getBudgetStatus(category);
                            const budgetColor = getBudgetColor(status.percentage);

                            return (
                                <TouchableOpacity
                                    key={category}
                                    style={[styles.budgetCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                                    onPress={() => handleEditBudget(category)}
                                >
                                    <View style={styles.budgetHeader}>
                                        <View style={[styles.categoryIconContainer, { backgroundColor: theme.tint + '10' }]}>
                                            <IconSymbol name={getCategoryIcon(category) as any} size={20} color={theme.tint} />
                                        </View>
                                        <View style={styles.budgetInfo}>
                                            <Text style={[styles.budgetCategory, { color: theme.text }]}>
                                                {category}
                                                <Text style={[styles.typeTag, { color: theme.icon }]}>
                                                    {status.type === 'fixed' ? ' • Fixed' : ' • Flexible'}
                                                </Text>
                                            </Text>
                                            <Text style={[styles.budgetAmount, { color: theme.icon }]}>
                                                {formatCurrency(status.spent)} of {formatCurrency(status.limit)}
                                            </Text>
                                        </View>
                                        <View style={styles.budgetRight}>
                                            <Text style={[styles.budgetPercentage, { color: budgetColor }]}>
                                                {status.percentage.toFixed(0)}%
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.progressBarContainer}>
                                        <View
                                            style={[
                                                styles.progressBar,
                                                { width: `${Math.min(status.percentage, 100)}%`, backgroundColor: budgetColor }
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.budgetFooter}>
                                        <Text style={[styles.budgetRemaining, { color: theme.icon }]}>
                                            {formatCurrency(Math.max(0, status.limit - status.spent))} remaining
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.iconButton, { backgroundColor: theme.danger + '10' }]}
                                            onPress={() => handleRemoveBudget(category)}
                                        >
                                            <IconSymbol name="trash" size={16} color={theme.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Available Categories */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Add Budget Limit</Text>

                    {categoriesWithoutBudgets.map(category => (
                        <TouchableOpacity
                            key={category}
                            style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => handleEditBudget(category)}
                        >
                            <Text style={[styles.categoryName, { color: theme.text }]}>{category}</Text>
                            <IconSymbol name="plus.circle" size={24} color={theme.tint} />
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border, borderStyle: 'dashed' }]}
                        onPress={() => setShowNewCategoryModal(true)}
                    >
                        <Text style={[styles.categoryName, { color: theme.tint }]}>+ Create New Category</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Budget Modal */}
            <InputModal
                visible={editingCategory !== null}
                title={`Set Budget for ${editingCategory}`}
                value={editAmount}
                onChangeText={setEditAmount}
                onConfirm={handleSaveBudget}
                onCancel={() => {
                    setEditingCategory(null);
                    setEditAmount('');
                }}
                placeholder="0"
                keyboardType="numeric"
                prefix="₦"
                confirmText="Save Budget"
                disabled={!editAmount}
            >
                <View style={styles.typeToggleContainer}>
                    <TouchableOpacity
                        style={[
                            styles.typeToggleButton,
                            editType === 'flexible' && { backgroundColor: theme.tint + '20', borderColor: theme.tint }
                        ]}
                        onPress={() => setEditType('flexible')}
                    >
                        <Text style={[styles.typeToggleText, { color: editType === 'flexible' ? theme.tint : theme.text }]}>
                            Flexible
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.typeToggleButton,
                            editType === 'fixed' && { backgroundColor: theme.tint + '20', borderColor: theme.tint }
                        ]}
                        onPress={() => setEditType('fixed')}
                    >
                        <Text style={[styles.typeToggleText, { color: editType === 'fixed' ? theme.tint : theme.text }]}>
                            Fixed
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.helperText, { color: theme.icon }]}>
                    {editType === 'fixed'
                        ? "Fixed budgets are reserved from your 'Safe to Spend' immediately, even if not yet spent."
                        : "Flexible budgets only deduct from 'Safe to Spend' as you actually spend money."}
                </Text>
            </InputModal>

            {/* New Category Modal */}
            <InputModal
                visible={showNewCategoryModal}
                title="New Category"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                onConfirm={handleAddCategory}
                onCancel={() => setShowNewCategoryModal(false)}
                placeholder="Category Name"
                confirmText="Create"
            />

            {/* Rename Category Modal */}
            <InputModal
                visible={showRenameModal}
                title="Rename Category"
                value={renameInput}
                onChangeText={setRenameInput}
                onConfirm={handleRenameCategory}
                onCancel={() => {
                    setShowRenameModal(false);
                    setRenamingCategory(null);
                    setRenameInput('');
                }}
                placeholder="Category Name"
                confirmText="Rename"
            />

            {/* Manage Categories Modal */}
            <Modal visible={showManageCategories} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.fullScreenModal, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Manage Categories</Text>
                        <TouchableOpacity onPress={() => setShowManageCategories(false)}>
                            <IconSymbol name="xmark.circle.fill" size={28} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {categories.map(category => (
                            <TouchableOpacity
                                key={category}
                                style={[styles.categoryRow, { borderBottomColor: theme.border }]}
                                onPress={() => {
                                    setRenamingCategory(category);
                                    setRenameInput(category);
                                    setShowRenameModal(true);
                                }}
                            >
                                <Text style={[styles.categoryRowText, { color: theme.text }]}>{category}</Text>
                                <View style={styles.categoryActions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.iconButton,
                                            { backgroundColor: theme.card }
                                        ]}
                                        onPress={() => handleDeleteCategory(category)}
                                    >
                                        <IconSymbol name="trash" size={18} color={theme.danger} />
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
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    budgetCard: {
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 12,
    },
    budgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    budgetInfo: {
        flex: 1,
    },
    budgetCategory: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    budgetAmount: {
        fontSize: 13,
        fontWeight: '500',
    },
    budgetRight: {
        alignItems: 'flex-end',
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    budgetFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    budgetPercentage: {
        fontSize: 14,
        fontWeight: '700',
    },
    budgetRemaining: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '500',
    },
    helperText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    fullScreenModal: {
        flex: 1,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    categoryRowText: {
        fontSize: 16,
        fontWeight: '500',
    },
    categoryActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    renameContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    renameInput: {
        flex: 1,
        fontSize: 16,
        padding: 8,
        borderWidth: 1,
        borderRadius: 8,
    },
    typeTag: {
        fontSize: 12,
        fontWeight: '500',
    },
    typeToggleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    typeToggleButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        alignItems: 'center',
        backgroundColor: 'rgba(150, 150, 150, 0.1)',
    },
    typeToggleText: {
        fontSize: 14,
        fontWeight: '600',
    },
});