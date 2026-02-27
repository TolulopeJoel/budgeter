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
    billId?: string;
    isCarryOver?: boolean;
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
    isBillPaid: (billId: string, monthKey: string) => boolean;
    markBillAsPaid: (billId: string) => Promise<void>;
    unmarkBillAsPaid: (billId: string) => Promise<void>;

    // Monthly Period
    currentPeriod: MonthlyPeriod | null;
    selectedPeriod: MonthlyPeriod | null;
    setSelectedPeriod: (period: MonthlyPeriod | null) => void;
    getAllPeriods: () => MonthlyPeriod[];
    confirmNewMonth: (carryOverIncome?: Transaction[]) => Promise<void>;
    needsMonthConfirmation: () => boolean;
    getLastMonthIncomeTransactions: () => Transaction[];

    // Calculations
    getBalance: () => number;
    getAccountBalance: () => number;
    getCurrentMonthIncome: () => number;
    getCurrentMonthExpenses: () => number;
    getSafeToSpend: () => number;
    getRemainingSavingsGoal: () => number;
    getDebts: () => number;
    getCurrentMonthTransactions: () => Transaction[];

    // Account Balance
    initialBalance: number;
    updateInitialBalance: (amount: number) => Promise<void>;
    reconcileBalance: (targetAmount: number) => Promise<void>;

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
    const [budgetsByMonth, setBudgetsByMonth] = useState<Record<string, Budget[]>>({});
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [recurringBillsByMonth, setRecurringBillsByMonth] = useState<Record<string, RecurringBill[]>>({});
    const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
    const [currentPeriod, setCurrentPeriod] = useState<MonthlyPeriod | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<MonthlyPeriod | null>(null);
    const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
    const [savingsGoalsByMonth, setSavingsGoalsByMonth] = useState<Record<string, number>>({});
    const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(0);
    const [initialBalance, setInitialBalance] = useState(0);
    const [userPin, setUserPin] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Sync state when selectedPeriod changes
    useEffect(() => {
        const period = selectedPeriod || currentPeriod;
        if (!period) return;

        // Sync budgets
        if (budgetsByMonth[period.month]) {
            setBudgets(budgetsByMonth[period.month]);
        } else {
            setBudgets([]);
        }

        // Sync savings goal
        if (savingsGoalsByMonth[period.month] !== undefined) {
            setMonthlySavingsGoal(savingsGoalsByMonth[period.month]);
        } else {
            setMonthlySavingsGoal(0);
        }

        // Sync recurring bills
        if (recurringBillsByMonth[period.month]) {
            setRecurringBills(recurringBillsByMonth[period.month]);
        } else {
            setRecurringBills([]);
        }
    }, [selectedPeriod, currentPeriod, budgetsByMonth, savingsGoalsByMonth, recurringBillsByMonth]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [
                storedTransactions,
                storedCategories,
                storedBudgets,
                storedBudgetsByMonth,
                storedBills,
                storedBillsByMonth,
                storedPeriod,
                storedSavingsTransactions,
                storedMonthlySavingsGoal,
                storedSavingsGoalsByMonth,
                storedInitialBalance,
                storedUserPin
            ] = await Promise.all([
                AsyncStorage.getItem('@budgeter_transactions'),
                AsyncStorage.getItem('@budgeter_categories'),
                AsyncStorage.getItem('@budgeter_budgets'),
                AsyncStorage.getItem('@budgeter_budgets_by_month'),
                AsyncStorage.getItem('@budgeter_recurring_bills'),
                AsyncStorage.getItem('@budgeter_recurring_bills_by_month'),
                AsyncStorage.getItem('@budgeter_current_period'),
                AsyncStorage.getItem('@budgeter_savings_transactions'),
                AsyncStorage.getItem('@budgeter_monthly_savings_goal'),
                AsyncStorage.getItem('@budgeter_savings_goals_by_month'),
                AsyncStorage.getItem('@budgeter_initial_balance'),
                AsyncStorage.getItem('@budgeter_user_pin'),
            ]);

            if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
            if (storedCategories) {
                const parsed = JSON.parse(storedCategories);
                setCategories(parsed);
            }
            if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
            if (storedBudgetsByMonth) setBudgetsByMonth(JSON.parse(storedBudgetsByMonth));
            if (storedBills) setRecurringBills(JSON.parse(storedBills));
            if (storedBillsByMonth) setRecurringBillsByMonth(JSON.parse(storedBillsByMonth));

            let activePeriod: MonthlyPeriod | null = null;
            if (storedPeriod) {
                activePeriod = JSON.parse(storedPeriod);
                setCurrentPeriod(activePeriod);
                setSelectedPeriod(activePeriod);
            }
            else {
                // Initialize first period
                const now = new Date();
                const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                activePeriod = {
                    month: monthKey,
                    startDate: now.toISOString(),
                    confirmed: false,
                };
                setCurrentPeriod(activePeriod);
                await AsyncStorage.setItem('@budgeter_current_period', JSON.stringify(activePeriod));
            }

            if (storedSavingsTransactions) setSavingsTransactions(JSON.parse(storedSavingsTransactions));
            if (storedMonthlySavingsGoal) {
                const parsedGoal = Number(storedMonthlySavingsGoal);
                setMonthlySavingsGoal(isNaN(parsedGoal) ? 0 : parsedGoal);
            }
            if (storedSavingsGoalsByMonth) setSavingsGoalsByMonth(JSON.parse(storedSavingsGoalsByMonth));

            // Sync budgets, savings goal, and bills for the loaded period
            if (activePeriod) {
                const month = activePeriod.month;
                if (storedBudgetsByMonth) {
                    const bbm = JSON.parse(storedBudgetsByMonth);
                    if (bbm[month]) setBudgets(bbm[month]);
                }
                if (storedSavingsGoalsByMonth) {
                    const sgbm = JSON.parse(storedSavingsGoalsByMonth);
                    if (sgbm[month] !== undefined) setMonthlySavingsGoal(sgbm[month]);
                }
                if (storedBillsByMonth) {
                    const rbbm = JSON.parse(storedBillsByMonth);
                    if (rbbm[month]) setRecurringBills(rbbm[month]);
                }
            }

            if (storedInitialBalance) setInitialBalance(Number(storedInitialBalance) || 0);
            if (storedUserPin) setUserPin(storedUserPin);

            // Check for auto-pay bills after loading all data
            if (storedTransactions && storedBills) {
                const txs = JSON.parse(storedTransactions);
                const bills = JSON.parse(storedBills);
                await checkAutoPayBills(txs, bills);
            }

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
        setBudgets(newBudgets);
        await AsyncStorage.setItem('@budgeter_budgets', JSON.stringify(newBudgets));

        // Also update current period in budgetsByMonth
        const period = selectedPeriod || currentPeriod;
        if (period) {
            const updatedBBM = { ...budgetsByMonth, [period.month]: newBudgets };
            setBudgetsByMonth(updatedBBM);
            await AsyncStorage.setItem('@budgeter_budgets_by_month', JSON.stringify(updatedBBM));
        }
    };

    const saveBills = async (newBills: RecurringBill[]) => {
        setRecurringBills(newBills);
        await AsyncStorage.setItem('@budgeter_recurring_bills', JSON.stringify(newBills));

        // Also update current period in recurringBillsByMonth
        const period = selectedPeriod || currentPeriod;
        if (period) {
            const updatedRBBM = { ...recurringBillsByMonth, [period.month]: newBills };
            setRecurringBillsByMonth(updatedRBBM);
            await AsyncStorage.setItem('@budgeter_recurring_bills_by_month', JSON.stringify(updatedRBBM));
        }
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

    const isBillPaid = (billId: string, monthKey: string) => {
        return transactions.some(t => {
            if (!t.billId || t.billId !== billId) return false;
            const date = new Date(t.date);
            const tMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return tMonthKey === monthKey;
        });
    };

    const markBillAsPaid = async (billId: string) => {
        const bill = recurringBills.find(b => b.id === billId);
        if (!bill) return;

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        if (isBillPaid(billId, monthKey)) return;

        await addTransaction({
            type: 'expense',
            category: bill.category,
            amount: bill.amount,
            date: now.toISOString(),
            note: bill.name,
            billId: bill.id
        });
    };

    const unmarkBillAsPaid = async (billId: string) => {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const transactionToDelete = transactions.find(t => {
            if (!t.billId || t.billId !== billId) return false;
            const date = new Date(t.date);
            const tMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return tMonthKey === monthKey;
        });

        if (transactionToDelete) {
            await deleteTransaction(transactionToDelete.id);
        }
    };

    const checkAutoPayBills = async (currentTxs: Transaction[], currentBills: RecurringBill[]) => {
        const now = new Date();
        const today = now.getDate();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        let updatedTxs = [...currentTxs];
        let changed = false;

        for (const bill of currentBills) {
            // If today is past the due day
            if (today > bill.dueDay) {
                // Check if already paid this month
                const alreadyPaid = updatedTxs.some(t => {
                    if (!t.billId || t.billId !== bill.id) return false;
                    const date = new Date(t.date);
                    const tMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    return tMonthKey === monthKey;
                });

                if (!alreadyPaid) {
                    // Auto-pay: Create transaction for the due day
                    const payDate = new Date(now.getFullYear(), now.getMonth(), bill.dueDay);
                    const newTx: Transaction = {
                        id: Math.random().toString(36).substr(2, 9),
                        type: 'expense',
                        category: bill.category,
                        amount: bill.amount,
                        date: payDate.toISOString(),
                        note: `Auto-Paid: ${bill.name}`,
                        billId: bill.id
                    };
                    updatedTxs = [newTx, ...updatedTxs];
                    changed = true;
                }
            }
        }

        if (changed) {
            setTransactions(updatedTxs);
            await saveTransactions(updatedTxs);
        }
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
            isCarryOver: true,
        }));

        if (newTransactions.length > 0) {
            setTransactions(prev => {
                const updated = [...newTransactions, ...prev];
                saveTransactions(updated);
                return updated;
            });
        }

        const newPeriod: MonthlyPeriod = {
            month: monthKey,
            startDate: now.toISOString(),
            confirmed: true,
        };

        // Snapshot current budgets, savings goal, and bills to the new month
        const updatedBBM = { ...budgetsByMonth, [monthKey]: budgets };
        const updatedSGBM = { ...savingsGoalsByMonth, [monthKey]: monthlySavingsGoal };
        const updatedRBBM = { ...recurringBillsByMonth, [monthKey]: recurringBills };

        setBudgetsByMonth(updatedBBM);
        setSavingsGoalsByMonth(updatedSGBM);
        setRecurringBillsByMonth(updatedRBBM);

        await AsyncStorage.setItem('@budgeter_budgets_by_month', JSON.stringify(updatedBBM));
        await AsyncStorage.setItem('@budgeter_savings_goals_by_month', JSON.stringify(updatedSGBM));
        await AsyncStorage.setItem('@budgeter_recurring_bills_by_month', JSON.stringify(updatedRBBM));

        setCurrentPeriod(newPeriod);
        setSelectedPeriod(newPeriod);
        await savePeriod(newPeriod);
    };

    const getAllPeriods = () => {
        const periods: MonthlyPeriod[] = [];
        const seenMonths = new Set<string>();

        // Add current period if it exists
        if (currentPeriod) {
            periods.push(currentPeriod);
            seenMonths.add(currentPeriod.month);
        }

        // Find all other months from transactions
        transactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!seenMonths.has(monthKey)) {
                seenMonths.add(monthKey);
                // For historical months, we don't have a specific start date, 
                // so we use the first of the month
                periods.push({
                    month: monthKey,
                    startDate: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
                    confirmed: true
                });
            }
        });

        // Sort periods by month descending (newest first)
        return periods.sort((a, b) => b.month.localeCompare(a.month));
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

        // Also update current period in savingsGoalsByMonth
        const period = selectedPeriod || currentPeriod;
        if (period) {
            const updatedSGBM = { ...savingsGoalsByMonth, [period.month]: amount };
            setSavingsGoalsByMonth(updatedSGBM);
            await AsyncStorage.setItem('@budgeter_savings_goals_by_month', JSON.stringify(updatedSGBM));
        }
    };

    const updateInitialBalance = async (amount: number) => {
        setInitialBalance(amount);
        await AsyncStorage.setItem('@budgeter_initial_balance', amount.toString());
    };

    const reconcileBalance = async (targetAmount: number) => {
        // target = initial + currentNet
        // initial = target - currentNet
        const currentNet = getBalance();
        const newInitial = targetAmount - currentNet;
        await updateInitialBalance(newInitial);
    };

    const updateUserPin = async (pin: string) => {
        setUserPin(pin);
        await AsyncStorage.setItem('@budgeter_user_pin', pin);
    };

    // Helper: Get current month transactions
    const getCurrentMonthTransactions = () => {
        const period = selectedPeriod || currentPeriod;
        if (!period) return [];

        // Filter by the month key (YYYY-MM) for all periods
        const [year, month] = period.month.split('-');
        return transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate.getFullYear().toString() === year &&
                (transDate.getMonth() + 1).toString().padStart(2, '0') === month;
        });
    };

    // Calculation functions
    const getBalance = () => {
        return transactions.reduce((acc, t) => {
            if (t.isCarryOver === true) return acc; // Strictly skip carry-overs
            const amount = Number(t.amount) || 0;
            if (t.type === 'income') return acc + amount;
            if (t.type === 'expense' || t.type === 'debt') return acc - amount;
            return acc;
        }, 0);
    };

    const getAccountBalance = () => {
        const period = selectedPeriod || currentPeriod;
        if (!period) return initialBalance + getBalance();

        // Calculate balance up to the end of the selected month
        const [year, month] = period.month.split('-');
        const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

        const periodNet = transactions.reduce((acc, t) => {
            if (t.isCarryOver === true) return acc; // Strictly skip carry-overs
            if (new Date(t.date) <= endOfMonth) {
                const amount = Number(t.amount) || 0;
                if (t.type === 'income') return acc + amount;
                if (t.type === 'expense' || t.type === 'debt') return acc - amount;
            }
            return acc;
        }, 0);

        return initialBalance + periodNet;
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
                isBillPaid,
                markBillAsPaid,
                unmarkBillAsPaid,

                currentPeriod,
                selectedPeriod,
                setSelectedPeriod,
                getAllPeriods,
                confirmNewMonth,
                needsMonthConfirmation,
                getLastMonthIncomeTransactions,

                getBalance,
                getAccountBalance,
                getCurrentMonthIncome,
                getCurrentMonthExpenses,
                getSafeToSpend,
                getRemainingSavingsGoal,
                getDebts,
                getCurrentMonthTransactions,

                loading,

                initialBalance,
                updateInitialBalance,
                reconcileBalance,

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
