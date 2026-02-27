import { IconSymbol } from '@/components/ui/icon-symbol';
import { NeoCard } from '@/components/ui/NeobrutalistComponents';
import { Colors } from '@/constants/Colors';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

interface IconPickerProps {
    selectedIcon: string;
    onSelect: (icon: string) => void;
}

const ICONS = [
    'banknote.fill', 'creditcard.fill', 'briefcase.fill', 'building.2.fill',
    'house.fill', 'lightbulb.fill', 'wifi',
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
                                onPress={() => onSelect(iconName)}
                            >
                                <NeoCard
                                    style={[
                                        styles.iconButton,
                                    ]}
                                    backgroundColor={isSelected ? theme.tint : '#fff'}
                                >
                                    <IconSymbol
                                        name={iconName as any}
                                        size={24}
                                        color={isSelected ? '#fff' : '#000'}
                                    />
                                </NeoCard>
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
        width: 54,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
