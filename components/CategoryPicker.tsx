import { NeoCard } from '@/components/ui/NeobrutalistComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, SharedStyles } from '@/constants/Colors';
import { Category } from '@/context/BudgetContext';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

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
    const theme = Colors.light;
    const styles = createStyles(theme, SharedStyles);
    const [showPicker, setShowPicker] = useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}

            <TouchableOpacity
                style={[
                    styles.dropdownTrigger,
                    SharedStyles.neoBorder,
                    {
                        backgroundColor: error ? theme.danger + '10' : '#fff',
                        borderColor: error ? theme.danger : '#000',
                    },
                ]}
                onPress={() => setShowPicker(true)}
            >
                <Text style={[
                    styles.dropdownText,
                    { color: value ? '#000' : '#999' }
                ]}>
                    {value || placeholder}
                </Text>
                <IconSymbol name="chevron.down" size={20} color="#000" />
            </TouchableOpacity>

            <Modal visible={showPicker} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                            <NeoCard style={[styles.modalContent, { backgroundColor: theme.card }]}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
                                    <TouchableOpacity onPress={() => setShowPicker(false)}>
                                        <Text style={{ fontSize: 24 }}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                                    {categories.map((c) => (
                                        <TouchableOpacity
                                            key={c.name}
                                            onPress={() => {
                                                onSelect(c.name);
                                                setShowPicker(false);
                                            }}
                                        >
                                            <NeoCard
                                                style={[
                                                    styles.option,
                                                ]}
                                                backgroundColor={value === c.name ? theme.tint : '#fff'}
                                            >
                                                <View style={styles.optionLeft}>
                                                    <View style={[styles.iconContainer, SharedStyles.neoBorder, { backgroundColor: '#fff' }]}>
                                                        <IconSymbol name={c.icon as any} size={20} color="#000" />
                                                    </View>
                                                    <Text style={[
                                                        styles.optionText,
                                                        { color: '#000' },
                                                        value === c.name && { fontWeight: '900' }
                                                    ]}>
                                                        {c.name}
                                                    </Text>
                                                </View>
                                                {value === c.name && (
                                                    <IconSymbol name="checkmark" size={20} color="#000" />
                                                )}
                                            </NeoCard>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </NeoCard>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const createStyles = (theme: any, neoStyles: any) => StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: '700',
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
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        textTransform: 'uppercase',
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
        marginBottom: 12,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 0,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...neoStyles.neoBorder,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '800',
    },
});
