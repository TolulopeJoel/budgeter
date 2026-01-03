import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

interface IconPickerProps {
    selectedIcon: string;
    onSelect: (icon: string) => void;
}

const ICONS = [
    'banknote.fill', 'creditcard.fill', 'briefcase.fill',
    'house.fill', 'lightbulb.fill', 'drop.fill', 'wifi',
    'cart.fill', 'fork.knife', 'cup.and.saucer.fill',
    'car.fill', 'bus.fill',
    'stethoscope', 'pills.fill', 'dumbbell.fill',
    'scissors', 'bag.fill',
    'gamecontroller.fill',
    'gift.fill', 'heart.fill', 'graduationcap.fill'
];

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.grid}>
                    {ICONS.map((iconName) => {
                        const isSelected = selectedIcon === iconName;

                        return (
                            <TouchableOpacity
                                key={iconName}
                                style={[
                                    styles.iconButton,
                                    { backgroundColor: theme.card },
                                    isSelected && { borderColor: theme.tint, borderWidth: 2 }
                                ]}
                                onPress={() => onSelect(iconName)}
                            >
                                <IconSymbol
                                    name={iconName as any}
                                    size={24}
                                    color={isSelected ? theme.tint : theme.icon}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    scrollContent: {
        paddingHorizontal: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
});
