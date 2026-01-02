import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { TransactionType, useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddTransaction() {
    const router = useRouter();
    const { addTransaction } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');

    const handleSave = async () => {
        if (!amount || !category) return;

        await addTransaction({
            type,
            amount: parseFloat(amount),
            category,
            note,
            date: new Date().toISOString(),
        });

        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>New Transaction</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <IconSymbol name="xmark.circle.fill" size={30} color={theme.icon} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
                <View style={styles.typeSelector}>
                    {(['income', 'expense', 'debt'] as TransactionType[]).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[
                                styles.typeButton,
                                type === t && { backgroundColor: theme.tint },
                                { borderColor: theme.border }
                            ]}
                            onPress={() => setType(t)}
                        >
                            <Text style={[
                                styles.typeText,
                                type === t ? { color: '#fff' } : { color: theme.text }
                            ]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        placeholder="0.00"
                        placeholderTextColor={theme.icon}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        placeholder="e.g., Food, Salary"
                        placeholderTextColor={theme.icon}
                        value={category}
                        onChangeText={setCategory}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Note (Optional)</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        placeholder="Details..."
                        placeholderTextColor={theme.icon}
                        value={note}
                        onChangeText={setNote}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>Save Transaction</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: Platform.OS === 'ios' ? 0 : 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    form: {
        flex: 1,
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 10,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    typeText: {
        fontWeight: '600',
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
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
