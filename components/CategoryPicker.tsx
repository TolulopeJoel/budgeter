import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { Category } from '@/context/BudgetContext';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from 'react-native';

interface CategoryPickerProps {
    value: string;
    onSelect: (category: string) => void;
    categories: Category[];
    error?: boolean;
    placeholder?: string;
    label?: string;
}

export default function CategoryPicker({
    value,
    onSelect,
    categories,
    error = false,
    placeholder = 'Select Category',
    label,
}: CategoryPickerProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [showPicker, setShowPicker] = useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}

            <TouchableOpacity
                style={[
                    styles.dropdownTrigger,
                    {
                        borderColor: error ? theme.danger : theme.border,
                        backgroundColor: error ? theme.danger + '10' : theme.background,
                    },
                ]}
                onPress={() => setShowPicker(true)}
            >
                <Text style={[
                    styles.dropdownText,
                    { color: value ? theme.text : theme.icon }
                ]}>
                    {value || placeholder}
                </Text>
                <IconSymbol name="chevron.down" size={20} color={theme.icon} />
            </TouchableOpacity>

            <Modal visible={showPicker} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
                                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                                        <IconSymbol name="xmark.circle.fill" size={24} color={theme.icon} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                                    {categories.map((c) => (
                                        <TouchableOpacity
                                            key={c.name}
                                            style={[
                                                styles.option,
                                                value === c.name && { backgroundColor: theme.tint + '15' }
                                            ]}
                                            onPress={() => {
                                                onSelect(c.name);
                                                setShowPicker(false);
                                            }}
                                        >
                                            <View style={styles.optionLeft}>
                                                <View style={[styles.iconContainer, { backgroundColor: theme.tint + '10' }]}>
                                                    <IconSymbol name={c.icon as any} size={20} color={theme.tint} />
                                                </View>
                                                <Text style={[
                                                    styles.optionText,
                                                    { color: theme.text },
                                                    value === c.name && { color: theme.tint, fontWeight: 'bold' }
                                                ]}>
                                                    {c.name}
                                                </Text>
                                            </View>
                                            {value === c.name && (
                                                <IconSymbol name="checkmark" size={20} color={theme.tint} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.7,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
    },
    dropdownText: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        padding: 24,
        borderRadius: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    list: {
        maxHeight: 400,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
    },
});
