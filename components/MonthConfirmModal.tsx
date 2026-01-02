import { Colors } from '@/constants/Colors';
import { useBudget } from '@/context/BudgetContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function MonthConfirmModal() {
    const { needsMonthConfirmation, confirmNewMonth, setMonthlyIncome, currentPeriod } = useBudget();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [visible, setVisible] = useState(false);
    const [income, setIncome] = useState('');

    useEffect(() => {
        const shouldShow = needsMonthConfirmation();
        setVisible(shouldShow);
        if (shouldShow && currentPeriod) {
            setIncome(currentPeriod.income.toString());
        }
    }, [needsMonthConfirmation, currentPeriod]);

    const handleConfirm = async () => {
        if (income) {
            await setMonthlyIncome(parseFloat(income));
        }
        await confirmNewMonth();
        setVisible(false);
    };

    const getMonthName = () => {
        const now = new Date();
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.card }]}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>📅</Text>
                    </View>

                    <Text style={[styles.title, { color: theme.text }]}>
                        Welcome to {getMonthName()}!
                    </Text>

                    <Text style={[styles.subtitle, { color: theme.icon }]}>
                        A new month has started. Please confirm your income for this month.
                    </Text>

                    <View style={styles.incomeSection}>
                        <Text style={[styles.label, { color: theme.text }]}>Monthly Income</Text>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.currencySymbol, { color: theme.text }]}>₦</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="0"
                                placeholderTextColor={theme.icon}
                                keyboardType="numeric"
                                value={income}
                                onChangeText={setIncome}
                                autoFocus
                            />
                        </View>
                    </View>

                    {currentPeriod && currentPeriod.income > 0 && (
                        <View style={[styles.infoCard, { backgroundColor: theme.background }]}>
                            <Text style={[styles.infoText, { color: theme.icon }]}>
                                💡 Last month's income: {formatCurrency(currentPeriod.income)}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.tint }]}
                        onPress={handleConfirm}
                        disabled={!income}
                    >
                        <Text style={styles.buttonText}>Start New Month</Text>
                    </TouchableOpacity>

                    <Text style={[styles.footer, { color: theme.icon }]}>
                        Your recurring bills will continue automatically
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    incomeSection: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: 'bold',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        borderBottomWidth: 2,
        paddingVertical: 8,
    },
    infoCard: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoText: {
        fontSize: 14,
        textAlign: 'center',
    },
    button: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        fontSize: 12,
        textAlign: 'center',
    },
});