import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface IconPickerProps {
    selectedIcon: string;
    onSelect: (icon: string) => void;
}

const ICONS = [
    'cash', 'cart', 'house', 'car', 'gamecontroller', 'bolt', 'bag', 'heart',
    'book', 'airplane', 'fitness', 'medical', 'restaurant', 'cafe', 'bus',
    'train', 'bicycle', 'gift', 'shirt', 'paw', 'construct', 'hammer',
    'school', 'library', 'briefcase', 'wallet', 'card', 'pie-chart',
    'trending-up', 'trending-down', 'analytics', 'bar-chart', 'globe',
    'map', 'location', 'navigate', 'call', 'mail', 'chatbubble', 'notifications',
    'settings', 'person', 'people', 'star', 'sunny', 'moon', 'cloudy', 'rainy',
    'snow', 'flash', 'water', 'leaf', 'flower', 'flame', 'ice-cream', 'pizza',
    'beer', 'wine', 'fast-food', 'barbell', 'basketball', 'football', 'tennisball'
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
                    {ICONS.map((icon) => {
                        const isSelected = selectedIcon === `${icon}.fill` || selectedIcon === icon;
                        const iconName = `${icon}.fill`;

                        return (
                            <TouchableOpacity
                                key={icon}
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
