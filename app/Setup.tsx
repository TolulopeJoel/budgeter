import { Colors } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Setup() {
    const router = useRouter();
    const { setMonthlyIncome, addRecurringBill, currentPeriod } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [step, setStep] = useState(1);
    const [income, setIncome] = useState('');
    const [bills, setBills] = useState<Array<{ name: string; amount: string; category: string; dueDay: string }>>([
        { name: '', amount: '', category: 'Utilities', dueDay: '1' }
    ]);

    const billCategories = ['Rent', 'Utilities', 'Insurance', 'Subscriptions', 'Loan Payment', 'Other'];

    const handleAddBill = () => {
        setBills([...bills, { name: '', amount: '', category: 'Utilities', dueDay: '1' }]);
    };

    const handleRemoveBill = (index: number) => {
        setBills(bills.filter((_, i) => i !== index));
    };

    const handleBillChange = (index: number, field: string, value: string) => {
        const updated = [...bills];
        updated[index] = { ...updated[index], [field]: value };
        setBills(updated);
    };

    const handleNext = async () => {
        if (step === 1) {
            if (!income) return;
            await setMonthlyIncome(parseFloat(income));
            setStep(2);
        } else if (step === 2) {
            // Save all bills
            for (const bill of bills) {
                if (bill.name && bill.amount) {
                    await addRecurringBill({
                        name: bill.name,
                        amount: parseFloat(bill.amount),
                        category: bill.category,
                        dueDay: parseInt(bill.dueDay) || 1,
                    });
                }
            }
            router.replace('/');
        }
    };

    const handleSkip = () => {
        if (step === 1) {
            setStep(2);
        } else {
            router.replace('/');
        }
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressDot, step >= 1 && { backgroundColor: theme.tint }]} />
                    <View style={[styles.progressLine, step >= 2 && { backgroundColor: theme.tint }]} />
                    <View style={[styles.progressDot, step >= 2 && { backgroundColor: theme.tint }]} />
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {step === 1 ? (
                    <>
                        <Text style={[styles.title, { color: theme.text }]}>What's your monthly income?</Text>
                        <Text style={[styles.subtitle, { color: theme.icon }]}>
                            This helps us calculate how much you can safely spend each month
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.currencySymbol, { color: theme.text }]}>₦</Text>
                            <TextInput
                                style={[styles.largeInput, { color: theme.text }]}
                                placeholder="0"
                                placeholderTextColor={theme.icon}
                                keyboardType="numeric"
                                value={income}
                                onChangeText={setIncome}
                                autoFocus
                            />
                        </View>

                        {income && (
                            <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Text style={[styles.previewLabel, { color: theme.icon }]}>Monthly Income</Text>
                                <Text style={[styles.previewAmount, { color: theme.success }]}>
                                    {formatCurrency(parseFloat(income))}
                                </Text>
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={[styles.title, { color: theme.text }]}>Add your recurring bills</Text>
                        <Text style={[styles.subtitle, { color: theme.icon }]}>
                            These are automatically deducted from your safe-to-spend calculation
                        </Text>

                        {bills.map((bill, index) => (
                            <View key={index} style={[styles.billCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <View style={styles.billHeader}>
                                    <Text style={[styles.billNumber, { color: theme.icon }]}>Bill #{index + 1}</Text>
                                    {bills.length > 1 && (
                                        <TouchableOpacity onPress={() => handleRemoveBill(index)}>
                                            <Text style={{ color: theme.danger }}>Remove</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Bill name (e.g., Rent, Netflix)"
                                    placeholderTextColor={theme.icon}
                                    value={bill.name}
                                    onChangeText={(value) => handleBillChange(index, 'name', value)}
                                />

                                <View style={styles.row}>
                                    <View style={styles.halfInput}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Amount</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                            placeholder="0"
                                            placeholderTextColor={theme.icon}
                                            keyboardType="numeric"
                                            value={bill.amount}
                                            onChangeText={(value) => handleBillChange(index, 'amount', value)}
                                        />
                                    </View>

                                    <View style={styles.halfInput}>
                                        <Text style={[styles.inputLabel, { color: theme.text }]}>Due Day</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                            placeholder="1"
                                            placeholderTextColor={theme.icon}
                                            keyboardType="numeric"
                                            value={bill.dueDay}
                                            onChangeText={(value) => handleBillChange(index, 'dueDay', value)}
                                        />
                                    </View>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                    {billCategories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.categoryChip,
                                                bill.category === cat && { backgroundColor: theme.tint },
                                                { borderColor: theme.border }
                                            ]}
                                            onPress={() => handleBillChange(index, 'category', cat)}
                                        >
                                            <Text style={[
                                                styles.categoryText,
                                                bill.category === cat ? { color: '#fff' } : { color: theme.text }
                                            ]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={[styles.addBillButton, { borderColor: theme.tint }]}
                            onPress={handleAddBill}
                        >
                            <Text style={{ color: theme.tint, fontWeight: '600' }}>+ Add Another Bill</Text>
                        </TouchableOpacity>

                        {bills.some(b => b.amount) && (
                            <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Text style={[styles.summaryLabel, { color: theme.icon }]}>Total Monthly Bills</Text>
                                <Text style={[styles.summaryAmount, { color: theme.danger }]}>
                                    -{formatCurrency(bills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0))}
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.skipButton]}
                    onPress={handleSkip}
                >
                    <Text style={[styles.skipText, { color: theme.icon }]}>
                        {step === 1 ? 'Skip for now' : 'Skip bills'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        { backgroundColor: theme.tint },
                        (step === 1 && !income) && styles.disabledButton
                    ]}
                    onPress={handleNext}
                    disabled={step === 1 && !income}
                >
                    <Text style={styles.nextText}>
                        {step === 1 ? 'Next' : 'Finish Setup'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E0E0E0',
    },
    progressLine: {
        width: 60,
        height: 2,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    currencySymbol: {
        fontSize: 48,
        fontWeight: 'bold',
        marginRight: 8,
    },
    largeInput: {
        flex: 1,
        fontSize: 48,
        fontWeight: 'bold',
    },
    previewCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    previewAmount: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    billCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    billHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    billNumber: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 14,
        marginBottom: 6,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    categoryScroll: {
        flexDirection: 'row',
        marginTop: 4,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 8,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '500',
    },
    addBillButton: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    summaryAmount: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    skipButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flex: 2,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
});