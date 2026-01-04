import { IconPicker } from '@/components/IconPicker';
import InputModal from '@/components/InputModal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
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
        deleteBudget
    } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editType, setEditType] = useState<'flexible' | 'fixed'>('flexible');
    const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('ellipsis.circle.fill');

    // Manage Categories State
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
            // Immediately open budget editor for new category
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
            `Are you sure you want to remove the budget limit for ${category}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteBudget(category);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
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
            `Are you sure you want to delete "${category}"? This will update all associated transactions to "Others"`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteCategory(category);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
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

    const getCategoryIcon = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        return category?.icon || 'ellipsis.circle.fill';
    };

    // Unified categories list for management
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
                hasBudget: !!budget && budget.limit > 0
            };
        })
        .sort((a, b) => {
            // Active budgets first
            if (a.hasBudget && !b.hasBudget) return -1;
            if (!a.hasBudget && b.hasBudget) return 1;
            // Then by spent amount
            return b.spent - a.spent;
        });

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 10 }]}>
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
                {/* Budget Limits */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Limits</Text>

                    {allCategories.map(item => (
                        <TouchableOpacity
                            key={item.name}
                            style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleEditBudget(item.name);
                            }}
                        >
                            <View style={[styles.categoryIconContainer, { backgroundColor: theme.tint + '10' }]}>
                                <IconSymbol name={item.icon as any} size={20} color={theme.tint} />
                            </View>
                            <View style={styles.categoryInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                    <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
                                    {(item.hasBudget && item.type === 'fixed') && (
                                        <View style={{ backgroundColor: theme.tint + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 10, color: theme.tint, fontWeight: '600' }}>
                                                {item.type.toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.categorySubtext, { color: theme.icon }]}>
                                    {item.hasBudget
                                        ? `${formatCurrency(Math.max(0, item.limit - item.spent))} left`
                                        : (item.spent > 0 ? `${formatCurrency(item.spent)} spent` : 'No spending')
                                    }
                                    {item.hasBudget && ` • Limit: ${formatCurrency(item.limit)}`}
                                </Text>
                            </View>
                            {item.hasBudget ? (
                                <TouchableOpacity
                                    style={[styles.iconButton, { backgroundColor: theme.danger + '10' }]}
                                    onPress={() => handleRemoveBudget(item.name)}
                                >
                                    <IconSymbol name="trash" size={16} color={theme.danger} />
                                </TouchableOpacity>
                            ) : (
                                <IconSymbol name="plus.circle" size={24} color={theme.tint} />
                            )}
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border, borderStyle: 'dashed' }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowNewCategoryModal(true);
                        }}
                    >
                        <Text style={[styles.categoryName, { color: theme.tint }]}>+ Create New Category</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border, borderStyle: 'dashed', marginTop: 12 }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowManageCategories(true);
                        }}
                    >
                        <Text style={[styles.categoryName, { color: theme.text }]}>Manage Categories</Text>
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
                title=""
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                onConfirm={handleAddCategory}
                onCancel={() => {
                    setShowNewCategoryModal(false);
                    setShowIconPicker(false);
                }}
                placeholder="Category Name"
                confirmText="Create"
                leftElement={
                    <TouchableOpacity
                        style={[styles.sketchIconPlaceholder, { backgroundColor: theme.tint + '10' }]}
                        onPress={() => setShowIconPicker(!showIconPicker)}
                    >
                        <IconSymbol name={newCategoryIcon as any} size={28} color={theme.tint} />
                    </TouchableOpacity>
                }
            >
                {showIconPicker && (
                    <View style={styles.sketchIconPickerContainer}>
                        <IconPicker
                            selectedIcon={newCategoryIcon}
                            onSelect={(icon) => {
                                setNewCategoryIcon(icon);
                                setShowIconPicker(false);
                            }}
                        />
                    </View>
                )}
            </InputModal>

            {/* Rename Category Modal */}
            <InputModal
                visible={showRenameModal}
                title=""
                value={renameInput}
                onChangeText={setRenameInput}
                onConfirm={handleRenameCategory}
                onCancel={() => {
                    setShowRenameModal(false);
                    setRenamingCategory(null);
                    setRenameInput('');
                    setShowIconPicker(false);
                }}
                placeholder="Category Name"
                confirmText="Rename"
                leftElement={
                    <TouchableOpacity
                        style={[styles.sketchIconPlaceholder, { backgroundColor: theme.card, borderColor: theme.border }]}
                        onPress={() => setShowIconPicker(!showIconPicker)}
                    >
                        <IconSymbol name={renameIcon as any} size={28} color={theme.tint} />
                    </TouchableOpacity>
                }
            >
                {showIconPicker && (
                    <View style={styles.sketchIconPickerContainer}>
                        <IconPicker
                            selectedIcon={renameIcon}
                            onSelect={(icon) => {
                                setRenameIcon(icon);
                                setShowIconPicker(false);
                            }}
                        />
                    </View>
                )}
            </InputModal>

            {/* Manage Categories Modal */}
            <Modal visible={showManageCategories} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.fullScreenModal, { backgroundColor: theme.background, paddingTop: insets.top }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Manage Categories</Text>
                        <TouchableOpacity onPress={() => setShowManageCategories(false)}>
                            <IconSymbol name="xmark.circle.fill" size={28} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {categories.map(category => (
                            <TouchableOpacity
                                key={category.name}
                                style={[styles.categoryRow, { borderBottomColor: theme.border }]}
                                onPress={() => {
                                    setRenamingCategory(category.name);
                                    setRenameInput(category.name);
                                    setRenameIcon(category.icon);
                                    setShowRenameModal(true);
                                }}
                            >
                                <View style={styles.categoryRowLeft}>
                                    <View style={[styles.categoryIconContainer, { backgroundColor: theme.tint + '10', marginRight: 12 }]}>
                                        <IconSymbol name={category.icon as any} size={20} color={theme.tint} />
                                    </View>
                                    <Text style={[styles.categoryRowText, { color: theme.text }]}>{category.name}</Text>
                                </View>
                                <View style={styles.categoryActions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.iconButton,
                                            { backgroundColor: theme.card }
                                        ]}
                                        onPress={() => handleDeleteCategory(category.name)}
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
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
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
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 8,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '500',
    },
    categorySpent: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    categorySubtext: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
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
    categoryRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
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
    sketchIconPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    sketchIconPickerContainer: {
        marginTop: 16,
        maxHeight: 250,
    },
});