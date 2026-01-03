import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Types
export type TransactionType = 'income' | 'expense' | 'debt';

export interface Category {
    name: string;
    icon: string;
}

export interface Transaction {
    id: string;
    type: TransactionType;
    category: string;
    amount: number;
    date: string;
    note?: string;
    originalCategory?: string;
    savingsId?: string;
}

export type BudgetType = 'flexible' | 'fixed';

export interface Budget {
    category: string;
    limit: number;
    type: BudgetType;
}

export interface RecurringBill {
    id: string;
    name: string;
    amount: number;
    category: string;
    dueDay: number; // Day of month (1-31)
    originalCategory?: string;
}

export interface MonthlyPeriod {
    month: string; // Format: "2025-01" (YYYY-MM)
    startDate: string;
    confirmed: boolean; // User must confirm to start new month
}

export interface SavingsTransaction {
    id: string;
    date: string;
    amount: number;
    type: 'deposit' | 'withdrawal';
    note?: string;
}

export interface BudgetContextType {
    // Transactions
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (transaction: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    // Categories & Budgets
    categories: Category[];
    budgets: Budget[];
    addCategory: (name: string, icon: string) => Promise<void>;
    updateCategory: (oldName: string, newName: string, newIcon: string) => Promise<void>;
    deleteCategory: (name: string) => Promise<void>;
    setBudgetLimit: (category: string, limit: number, type: BudgetType) => Promise<void>;
    deleteBudget: (category: string) => Promise<void>;
    getBudgetStatus: (category: string) => { spent: number; limit: number; percentage: number; type: BudgetType };

    // Recurring Bills
    recurringBills: RecurringBill[];
    addRecurringBill: (bill: Omit<RecurringBill, 'id'>) => Promise<void>;
    updateRecurringBill: (bill: RecurringBill) => Promise<void>;
    deleteRecurringBill: (id: string) => Promise<void>;
    getTotalRecurringBills: () => number;

    // Monthly Period
    currentPeriod: MonthlyPeriod | null;
    confirmNewMonth: (carryOverIncome?: Transaction[]) => Promise<void>;
    needsMonthConfirmation: () => boolean;
    getLastMonthIncomeTransactions: () => Transaction[];

    // Calculations
    getBalance: () => number;
    getCurrentMonthIncome: () => number;
    getCurrentMonthExpenses: () => number;
    getSafeToSpend: () => number;
    getRemainingSavingsGoal: () => number;
    getDebts: () => number;



    // Savings
    savingsTransactions: SavingsTransaction[];
    savingsBalance: number; // Calculated
    monthlySavingsGoal: number;
    addSavingsTransaction: (amount: number, type: 'deposit' | 'withdrawal', note?: string, affectBudget?: boolean) => Promise<void>;
    updateSavingsTransaction: (transaction: SavingsTransaction, affectBudget?: boolean) => Promise<void>;
    deleteSavingsTransaction: (id: string) => Promise<void>;
    updateMonthlySavingsGoal: (amount: number) => Promise<void>;

    // Security
    userPin: string | null;
    updateUserPin: (pin: string) => Promise<void>;

    loading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([
        { name: 'Salary', icon: 'cash.fill' },
        { name: 'Food', icon: 'cart.fill' },
        { name: 'Rent', icon: 'house.fill' },
        { name: 'Transport', icon: 'car.fill' },
        { name: 'Entertainment', icon: 'gamecontroller.fill' },
        { name: 'Utilities', icon: 'bolt.fill' },
        { name: 'Shopping', icon: 'bag.fill' },
        { name: 'Healthcare', icon: 'heart.fill' },
        { name: 'Debt', icon: 'creditcard.fill' },
        { name: 'Others', icon: 'ellipsis.circle.fill' }
    ]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
    const [currentPeriod, setCurrentPeriod] = useState<MonthlyPeriod | null>(null);
    const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
    const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(0);
    const [userPin, setUserPin] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                storedTransactions,
                storedCategories,
                storedBudgets,
                storedBills,
                storedPeriod,
                storedSavingsTransactions,
                storedMonthlySavingsGoal,
                storedUserPin
            ] = await Promise.all([
                AsyncStorage.getItem('@budgeter_transactions'),
                AsyncStorage.getItem('@budgeter_categories'),
                AsyncStorage.getItem('@budgeter_budgets'),
                AsyncStorage.getItem('@budgeter_recurring_bills'),
                AsyncStorage.getItem('@budgeter_current_period'),
                AsyncStorage.getItem('@budgeter_savings_transactions'),
                AsyncStorage.getItem('@budgeter_monthly_savings_goal'),
                AsyncStorage.getItem('@budgeter_user_pin'),
            ]);

            if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
            if (storedCategories) {
                const parsed = JSON.parse(storedCategories);
                setCategories(parsed);
            }
            if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
            if (storedBills) setRecurringBills(JSON.parse(storedBills));
            if (storedPeriod) setCurrentPeriod(JSON.parse(storedPeriod));
            else {
                // Initialize first period
                const now = new Date();
                const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const initialPeriod: MonthlyPeriod = {
                    month: monthKey,
                    startDate: now.toISOString(),
                    confirmed: false,
                };
                setCurrentPeriod(initialPeriod);
                await AsyncStorage.setItem('@budgeter_current_period', JSON.stringify(initialPeriod));
            }

            if (storedSavingsTransactions) setSavingsTransactions(JSON.parse(storedSavingsTransactions));
            if (storedMonthlySavingsGoal) {
                const parsedGoal = Number(storedMonthlySavingsGoal);
                setMonthlySavingsGoal(isNaN(parsedGoal) ? 0 : parsedGoal);
            }
            if (storedUserPin) setUserPin(storedUserPin);
            // Correct logic below

        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoading(false);
        }
    };

    // Save functions
    const saveTransactions = async (newTransactions: Transaction[]) => {
        await AsyncStorage.setItem('@budgeter_transactions', JSON.stringify(newTransactions));
    };

    const saveCategories = async (newCategories: Category[]) => {
        await AsyncStorage.setItem('@budgeter_categories', JSON.stringify(newCategories));
    };

    const saveBudgets = async (newBudgets: Budget[]) => {
        await AsyncStorage.setItem('@budgeter_budgets', JSON.stringify(newBudgets));
    };

    const saveBills = async (newBills: RecurringBill[]) => {
        await AsyncStorage.setItem('@budgeter_recurring_bills', JSON.stringify(newBills));
    };

    const savePeriod = async (period: MonthlyPeriod) => {
        await AsyncStorage.setItem('@budgeter_current_period', JSON.stringify(period));
    };

    // Transaction functions
    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = {
            ...transaction,
            id: Math.random().toString(36).substr(2, 9)
        };
        const updated = [newTransaction, ...transactions];
        setTransactions(updated);
        await saveTransactions(updated);
    };

    const updateTransaction = async (transaction: Transaction) => {
        const updated = transactions.map((t) => {
            if (t.id === transaction.id) {
                // If category is manually changed, clear originalCategory
                const originalCategory = t.category !== transaction.category ? undefined : transaction.originalCategory;
                return { ...transaction, originalCategory };
            }
            return t;
        });
        setTransactions(updated);
        await saveTransactions(updated);
    };

    const deleteTransaction = async (id: string) => {
        const updated = transactions.filter((t) => t.id !== id);
        setTransactions(updated);
        await saveTransactions(updated);
    };

    // Category functions
    const addCategory = async (name: string, icon: string) => {
        if (!categories.find(c => c.name === name)) {
            const updated = [...categories, { name, icon }];
            setCategories(updated);
            await saveCategories(updated);

            // Restore original category for transactions in "Others"
            const updatedTransactions = transactions.map(t =>
                (t.category === 'Others' && t.originalCategory === name)
                    ? { ...t, category: name, originalCategory: undefined }
                    : t
            );
            setTransactions(updatedTransactions);
            await saveTransactions(updatedTransactions);

            // Restore original category for recurring bills in "Others"
            const updatedBills = recurringBills.map(b =>
                (b.category === 'Others' && b.originalCategory === name)
                    ? { ...b, category: name, originalCategory: undefined }
                    : b
            );
            setRecurringBills(updatedBills);
            await saveBills(updatedBills);
        }
    };

    const updateCategory = async (oldName: string, newName: string, newIcon: string) => {
        const nameExists = categories.some(c => c.name === newName && c.name !== oldName);
        if (nameExists) return;

        // Update category list
        const updatedCategories = categories.map(c =>
            c.name === oldName ? { name: newName, icon: newIcon } : c
        );
        setCategories(updatedCategories);
        await saveCategories(updatedCategories);

        // Update related transactions
        const updatedTransactions = transactions.map(t =>
            t.category === oldName ? { ...t, category: newName } : t
        );
        setTransactions(updatedTransactions);
        await saveTransactions(updatedTransactions);

        // Update related budgets
        const updatedBudgets = budgets.map(b =>
            b.category === oldName ? { ...b, category: newName } : b
        );
        setBudgets(updatedBudgets);
        await saveBudgets(updatedBudgets);

        // Update related recurring bills
        const updatedBills = recurringBills.map(b =>
            b.category === oldName ? { ...b, category: newName } : b
        );
        setRecurringBills(updatedBills);
        await saveBills(updatedBills);
    };

    const deleteCategory = async (name: string) => {
        // Reassign all transactions with this category to "Others" and store original
        const updatedTransactions = transactions.map(t =>
            t.category === name ? { ...t, category: 'Others', originalCategory: name } : t
        );
        setTransactions(updatedTransactions);
        await saveTransactions(updatedTransactions);

        // Reassign all recurring bills with this category to "Others" and store original
        const updatedBills = recurringBills.map(b =>
            b.category === name ? { ...b, category: 'Others', originalCategory: name } : b
        );
        setRecurringBills(updatedBills);
        await saveBills(updatedBills);

        // Remove the category from the list
        const updated = categories.filter(c => c.name !== name);
        setCategories(updated);
        await saveCategories(updated);

        // Remove budgets associated with this category
        await deleteBudget(name);
    };

    // Budget functions
    const setBudgetLimit = async (category: string, limit: number, type: BudgetType) => {
        const existing = budgets.find(b => b.category === category);
        let updated: Budget[];

        if (existing) {
            updated = budgets.map(b => b.category === category ? { ...b, limit, type } : b);
        } else {
            updated = [...budgets, { category, limit, type }];
        }

        setBudgets(updated);
        await saveBudgets(updated);
    };

    const deleteBudget = async (category: string) => {
        const updated = budgets.filter(b => b.category !== category);
        setBudgets(updated);
        await saveBudgets(updated);
    };

    const getBudgetStatus = (category: string) => {
        const budget = budgets.find(b => b.category === category);
        const limit = budget?.limit || 0;
        const type = budget?.type || 'flexible';

        // Calculate spent for current month only
        const spent = getCurrentMonthTransactions()
            .filter(t => t.type === 'expense' && t.category === category)
            .reduce((acc, t) => acc + t.amount, 0);

        const percentage = limit > 0 ? (spent / limit) * 100 : 0;

        return { spent, limit, percentage, type };
    };

    // Recurring Bills functions
    const addRecurringBill = async (bill: Omit<RecurringBill, 'id'>) => {
        const newBill = {
            ...bill,
            id: Math.random().toString(36).substr(2, 9)
        };
        const updated = [...recurringBills, newBill];
        setRecurringBills(updated);
        await saveBills(updated);
    };

    const updateRecurringBill = async (bill: RecurringBill) => {
        const updated = recurringBills.map(b => {
            if (b.id === bill.id) {
                // If category is manually changed, clear originalCategory
                const originalCategory = b.category !== bill.category ? undefined : bill.originalCategory;
                return { ...bill, originalCategory };
            }
            return b;
        });
        setRecurringBills(updated);
        await saveBills(updated);
    };

    const deleteRecurringBill = async (id: string) => {
        const updated = recurringBills.filter(b => b.id !== id);
        setRecurringBills(updated);
        await saveBills(updated);
    };

    const getTotalRecurringBills = () => {
        return recurringBills.reduce((acc, bill) => acc + bill.amount, 0);
    };

    // Monthly Period functions
    const needsMonthConfirmation = () => {
        if (!currentPeriod) return false;

        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        return currentPeriod.month !== currentMonthKey || !currentPeriod.confirmed;
    };

    const confirmNewMonth = async (carryOverIncome: Transaction[] = []) => {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Create new transactions for carried over income
        const newTransactions: Transaction[] = carryOverIncome.map(t => ({
            ...t,
            id: Math.random().toString(36).substr(2, 9),
            date: now.toISOString(),
        }));

        if (newTransactions.length > 0) {
            const updatedTransactions = [...newTransactions, ...transactions];
            setTransactions(updatedTransactions);
            await saveTransactions(updatedTransactions);
        }

        const newPeriod: MonthlyPeriod = {
            month: monthKey,
            startDate: now.toISOString(),
            confirmed: true,
        };

        setCurrentPeriod(newPeriod);
        await savePeriod(newPeriod);
    };

    const getLastMonthIncomeTransactions = () => {
        if (!currentPeriod) return [];

        // 1. Try to find income for the month stored in currentPeriod (usually the transition month)
        const [year, month] = currentPeriod.month.split('-');
        const monthIncome = transactions.filter(t => {
            const transDate = new Date(t.date);
            const tYear = transDate.getFullYear().toString();
            const tMonth = (transDate.getMonth() + 1).toString().padStart(2, '0');
            return t.type === 'income' && tYear === year && tMonth === month;
        });

        if (monthIncome.length > 0) {
            return monthIncome.sort((a, b) => b.amount - a.amount);
        }

        // 2. Fallback: Get all income transactions, sorted by date
        const allIncome = transactions
            .filter(t => t.type === 'income')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (allIncome.length === 0) return [];

        // 3. Get the most recent month that has income
        const mostRecentDate = new Date(allIncome[0].date);
        const rYear = mostRecentDate.getFullYear().toString();
        const rMonth = (mostRecentDate.getMonth() + 1).toString().padStart(2, '0');

        const recentMonthIncome = allIncome.filter(t => {
            const transDate = new Date(t.date);
            return transDate.getFullYear().toString() === rYear &&
                (transDate.getMonth() + 1).toString().padStart(2, '0') === rMonth;
        });

        // 4. Return unique items from that month (limit to 10) and sort by amount
        const uniqueIncome: Transaction[] = [];
        const seen = new Set();

        for (const t of recentMonthIncome) {
            const key = `${t.note}-${t.amount}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueIncome.push(t);
            }
            if (uniqueIncome.length >= 10) break;
        }

        return uniqueIncome.sort((a, b) => b.amount - a.amount);
    };



    // Savings functions
    // Savings functions
    const addSavingsTransaction = async (amount: number, type: 'deposit' | 'withdrawal', note?: string, affectBudget: boolean = true) => {
        const savingsId = Math.random().toString(36).substr(2, 9);
        const newSavingsTx: SavingsTransaction = {
            id: savingsId,
            date: new Date().toISOString(),
            amount,
            type,
            note
        };

        const updatedSavings = [newSavingsTx, ...savingsTransactions];
        setSavingsTransactions(updatedSavings);
        await AsyncStorage.setItem('@budgeter_savings_transactions', JSON.stringify(updatedSavings));

        // Auto-integrate with main budget ONLY if affectBudget is true
        if (affectBudget) {
            if (type === 'deposit') {
                // Deposit to savings = Expense from budget
                await addTransaction({
                    type: 'expense',
                    category: 'Savings',
                    amount: amount,
                    date: new Date().toISOString(),
                    note: note ? `Savings Deposit: ${note}` : 'Savings Deposit',
                    savingsId: savingsId
                });
            } else {
                // Withdrawal from savings = Income to budget
                await addTransaction({
                    type: 'income',
                    category: 'Savings',
                    amount: amount,
                    date: new Date().toISOString(),
                    note: note ? `Savings Withdrawal: ${note}` : 'Savings Withdrawal',
                    savingsId: savingsId
                });
            }
        }
    };

    const updateSavingsTransaction = async (transaction: SavingsTransaction, affectBudget: boolean = true) => {
        const updatedSavings = savingsTransactions.map(t => t.id === transaction.id ? transaction : t);
        setSavingsTransactions(updatedSavings);
        await AsyncStorage.setItem('@budgeter_savings_transactions', JSON.stringify(updatedSavings));

        // Update linked budget transaction if it exists
        const linkedTx = transactions.find(t => t.savingsId === transaction.id);
        if (linkedTx) {
            await updateTransaction({
                ...linkedTx,
                amount: transaction.amount,
                type: transaction.type === 'deposit' ? 'expense' : 'income',
                note: transaction.note ? `Savings ${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}: ${transaction.note}` : `Savings ${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}`
            });
        } else if (affectBudget) {
            // If it didn't have a linked transaction but now should
            if (transaction.type === 'deposit') {
                await addTransaction({
                    type: 'expense',
                    category: 'Savings',
                    amount: transaction.amount,
                    date: transaction.date,
                    note: transaction.note ? `Savings Deposit: ${transaction.note}` : 'Savings Deposit',
                    savingsId: transaction.id
                });
            } else {
                await addTransaction({
                    type: 'income',
                    category: 'Savings',
                    amount: transaction.amount,
                    date: transaction.date,
                    note: transaction.note ? `Savings Withdrawal: ${transaction.note}` : 'Savings Withdrawal',
                    savingsId: transaction.id
                });
            }
        }
    };

    const deleteSavingsTransaction = async (id: string) => {
        const updatedSavings = savingsTransactions.filter(t => t.id !== id);
        setSavingsTransactions(updatedSavings);
        await AsyncStorage.setItem('@budgeter_savings_transactions', JSON.stringify(updatedSavings));

        // Delete linked budget transaction if it exists
        const linkedTx = transactions.find(t => t.savingsId === id);
        if (linkedTx) {
            await deleteTransaction(linkedTx.id);
        }
    };

    const updateMonthlySavingsGoal = async (amount: number) => {
        setMonthlySavingsGoal(amount);
        await AsyncStorage.setItem('@budgeter_monthly_savings_goal', amount.toString());
    };

    const updateUserPin = async (pin: string) => {
        setUserPin(pin);
        await AsyncStorage.setItem('@budgeter_user_pin', pin);
    };

    // Helper: Get current month transactions
    const getCurrentMonthTransactions = () => {
        if (!currentPeriod) return [];

        const periodStart = new Date(currentPeriod.startDate);

        return transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate >= periodStart;
        });
    };

    // Calculation functions
    const getBalance = () => {
        return transactions.reduce((acc, t) => {
            if (t.type === 'income') return acc + t.amount;
            if (t.type === 'expense') return acc - t.amount;
            return acc;
        }, 0);
    };

    const getCurrentMonthIncome = () => {
        return getCurrentMonthTransactions()
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
    };

    const getCurrentMonthExpenses = () => {
        return getCurrentMonthTransactions()
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
    };

    const getSafeToSpend = () => {
        const income = getCurrentMonthIncome();
        const currentMonthTransactions = getCurrentMonthTransactions();

        // 1. Calculate deductions from budgets
        const budgetDeductions = budgets.reduce((acc, budget) => {
            const status = getBudgetStatus(budget.category);
            const billsInCategory = recurringBills
                .filter(b => b.category === budget.category)
                .reduce((sum, b) => sum + b.amount, 0);

            if (budget.type === 'fixed') {
                // For fixed budgets, reserve the highest of: limit, actual spent, or upcoming bills
                return acc + Math.max(budget.limit, status.spent, billsInCategory);
            } else {
                // For flexible budgets, reserve the highest of: actual spent or upcoming bills
                return acc + Math.max(status.spent, billsInCategory);
            }
        }, 0);

        // 2. Calculate deductions for non-budgeted categories that have bills or spending
        const nonBudgetedCategories = new Set([
            ...currentMonthTransactions.filter(t => t.type === 'expense').map(t => t.category),
            ...recurringBills.map(b => b.category)
        ]);

        const nonBudgetDeductions = Array.from(nonBudgetedCategories)
            .filter(cat => !budgets.some(b => b.category === cat))
            .reduce((acc, cat) => {
                const spent = currentMonthTransactions
                    .filter(t => t.type === 'expense' && t.category === cat)
                    .reduce((sum, t) => sum + t.amount, 0);
                const bills = recurringBills
                    .filter(b => b.category === cat)
                    .reduce((sum, b) => sum + b.amount, 0);
                return acc + Math.max(spent, bills);
            }, 0);

        // 3. Subtract debts (money lent out) for the current month
        const currentMonthDebts = currentMonthTransactions
            .filter(t => t.type === 'debt')
            .reduce((acc, t) => acc + t.amount, 0);

        // 4. Subtract Remaining Savings Goal
        // We subtract what's left to save this month.
        // This prevents double-counting if the user has already saved some money.

        return income - budgetDeductions - nonBudgetDeductions - currentMonthDebts - getRemainingSavingsGoal();
    };

    const getRemainingSavingsGoal = () => {
        const currentMonthTransactions = getCurrentMonthTransactions();
        const currentMonthSavings = currentMonthTransactions
            .filter(t => t.type === 'expense' && t.category === 'Savings')
            .reduce((acc, t) => acc + t.amount, 0);

        return Math.max(0, monthlySavingsGoal - currentMonthSavings);
    };

    const getDebts = () => {
        return transactions
            .filter((t) => t.type === 'debt')
            .reduce((acc, t) => acc + t.amount, 0);
    };

    return (
        <BudgetContext.Provider
            value={{
                transactions,
                addTransaction,
                updateTransaction,
                deleteTransaction,

                categories,
                budgets,
                addCategory,
                updateCategory,
                deleteCategory,
                setBudgetLimit,
                deleteBudget,
                getBudgetStatus,

                recurringBills,
                addRecurringBill,
                updateRecurringBill,
                deleteRecurringBill,
                getTotalRecurringBills,

                currentPeriod,
                confirmNewMonth,
                needsMonthConfirmation,
                getLastMonthIncomeTransactions,

                getBalance,
                getCurrentMonthIncome,
                getCurrentMonthExpenses,
                getSafeToSpend,
                getRemainingSavingsGoal,
                getDebts,

                loading,

                savingsTransactions,
                savingsBalance: savingsTransactions.reduce((acc, t) => t.type === 'deposit' ? acc + t.amount : acc - t.amount, 0),
                monthlySavingsGoal,
                addSavingsTransaction,
                updateSavingsTransaction,
                deleteSavingsTransaction,
                updateMonthlySavingsGoal,

                userPin,
                updateUserPin,
            }}
        >
            {children}
        </BudgetContext.Provider>
    );
};

export const useBudget = () => {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error('useBudget must be used within a BudgetProvider');
    }
    return context;
};
