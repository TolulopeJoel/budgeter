import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Manage Categories State
    const [showManageCategories, setShowManageCategories] = useState(false);
    const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
    const [renameInput, setRenameInput] = useState('');

    const handleEditBudget = (category: string) => {
        const budget = budgets.find(b => b.category === category);
        setEditAmount(budget?.limit.toString() || '');
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
            await setBudgetLimit(editingCategory, parseFloat(editAmount));
            setEditingCategory(null);
            setEditAmount('');
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
        }
    };

    const handleDeleteCategory = (category: string) => {
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${category}"? This will update all associated transactions to "Uncategorized" or delete them depending on implementation.`,
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
        return theme.success;
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
                                <View
                                    key={category}
                                    style={[styles.budgetCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                                >
                                    <View style={styles.budgetHeader}>
                                        <View>
                                            <Text style={[styles.budgetCategory, { color: theme.text }]}>{category}</Text>
                                            <Text style={[styles.budgetAmount, { color: theme.icon }]}>
                                                {formatCurrency(status.spent)} / {formatCurrency(status.limit)}
                                            </Text>
                                        </View>
                                        <View style={styles.budgetActions}>
                                            <TouchableOpacity
                                                style={[styles.iconButton, { backgroundColor: theme.background }]}
                                                onPress={() => handleEditBudget(category)}
                                            >
                                                <IconSymbol name="pencil" size={18} color={theme.text} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.iconButton, { backgroundColor: theme.background }]}
                                                onPress={() => handleRemoveBudget(category)}
                                            >
                                                <IconSymbol name="trash" size={18} color={theme.danger} />
                                            </TouchableOpacity>
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
                                        <Text style={[styles.budgetPercentage, { color: budgetColor }]}>
                                            {status.percentage.toFixed(0)}% used
                                        </Text>
                                        <Text style={[styles.budgetRemaining, { color: theme.text }]}>
                                            {formatCurrency(Math.max(0, status.limit - status.spent))} left
                                        </Text>
                                    </View>
                                </View>
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
            <Modal visible={editingCategory !== null} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            Set Budget for {editingCategory}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.currencySymbol, { color: theme.text }]}>₦</Text>
                            <TextInput
                                style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                                placeholder="0"
                                placeholderTextColor={theme.icon}
                                keyboardType="numeric"
                                value={editAmount}
                                onChangeText={setEditAmount}
                                autoFocus
                            />
                        </View>

                        <Text style={[styles.helperText, { color: theme.icon }]}>
                            This is the maximum amount you want to spend on {editingCategory} this month
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.background }]}
                                onPress={() => {
                                    setEditingCategory(null);
                                    setEditAmount('');
                                }}
                            >
                                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.tint }]}
                                onPress={handleSaveBudget}
                                disabled={!editAmount}
                            >
                                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save Budget</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* New Category Modal */}
            <Modal visible={showNewCategoryModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>New Category</Text>
                        <TextInput
                            style={[styles.modalInput, { color: theme.text, borderColor: theme.border, marginBottom: 20 }]}
                            placeholder="Category Name"
                            placeholderTextColor={theme.icon}
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.background }]}
                                onPress={() => setShowNewCategoryModal(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.tint }]}
                                onPress={handleAddCategory}
                            >
                                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                            <View key={category} style={[styles.categoryRow, { borderBottomColor: theme.border }]}>
                                {renamingCategory === category ? (
                                    <View style={styles.renameContainer}>
                                        <TextInput
                                            style={[styles.renameInput, { color: theme.text, borderColor: theme.tint }]}
                                            value={renameInput}
                                            onChangeText={setRenameInput}
                                            autoFocus
                                            returnKeyType="done"
                                            onSubmitEditing={handleRenameCategory}
                                        />
                                        <TouchableOpacity onPress={handleRenameCategory}>
                                            <IconSymbol name="checkmark.circle.fill" size={28} color={theme.success} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setRenamingCategory(null)}>
                                            <IconSymbol name="xmark.circle.fill" size={28} color={theme.danger} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
                                        <Text style={[styles.categoryRowText, { color: theme.text }]}>{category}</Text>
                                        <View style={styles.categoryActions}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.iconButton,
                                                    { backgroundColor: theme.card }
                                                ]}
                                                onPress={() => {
                                                    setRenamingCategory(category);
                                                    setRenameInput(category);
                                                }}
                                            >
                                                <IconSymbol name="pencil" size={18} color={theme.text} />
                                            </TouchableOpacity>

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

                                    </>
                                )}
                            </View>
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
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    budgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    budgetCategory: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    budgetAmount: {
        fontSize: 14,
    },
    budgetActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    budgetFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    budgetPercentage: {
        fontSize: 14,
        fontWeight: '600',
    },
    budgetRemaining: {
        fontSize: 14,
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: 'bold',
        marginRight: 8,
    },
    modalInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        borderBottomWidth: 2,
        paddingVertical: 8,
    },
    helperText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
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
});