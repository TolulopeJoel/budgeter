import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Types
export type TransactionType = 'income' | 'expense' | 'debt';

export interface Transaction {
    id: string;
    type: TransactionType;
    category: string; // e.g., 'Salary', 'Food', 'Rent'
    amount: number;
    date: string;
    note?: string;
}

export interface BudgetContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    getBalance: () => number;
    getIncome: () => number;
    getExpenses: () => number;
    getDebts: () => number;
    loading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            const stored = await AsyncStorage.getItem('@budgeter_transactions');
            if (stored) {
                setTransactions(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load transactions', e);
        } finally {
            setLoading(false);
        }
    };

    const saveTransactions = async (newTransactions: Transaction[]) => {
        try {
            await AsyncStorage.setItem('@budgeter_transactions', JSON.stringify(newTransactions));
        } catch (e) {
            console.error('Failed to save transactions', e);
        }
    };

    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = { ...transaction, id: Math.random().toString(36).substr(2, 9) };
        const updated = [newTransaction, ...transactions];
        setTransactions(updated);
        await saveTransactions(updated);
    };

    const deleteTransaction = async (id: string) => {
        const updated = transactions.filter((t) => t.id !== id);
        setTransactions(updated);
        await saveTransactions(updated);
    };

    const getBalance = () => {
        return transactions.reduce((acc, t) => {
            if (t.type === 'income') return acc + t.amount;
            if (t.type === 'expense') return acc - t.amount;
            return acc;
        }, 0);
    };

    const getIncome = () => {
        return transactions
            .filter((t) => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
    };

    const getExpenses = () => {
        return transactions
            .filter((t) => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
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
                deleteTransaction,
                getBalance,
                getIncome,
                getExpenses,
                getDebts,
                loading,
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
