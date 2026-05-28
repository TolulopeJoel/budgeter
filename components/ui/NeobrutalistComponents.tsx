import { Colors, SharedStyles } from '@/constants/Colors';
import React from 'react';
import {
    Animated,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

interface NeoCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    backgroundColor?: string;
}

export const NeoCard = ({ children, style, backgroundColor }: NeoCardProps) => {
    const theme = Colors.light;
    const bg = backgroundColor || theme.card;

    return (
        <View style={[
            styles.card,
            { backgroundColor: bg, borderWidth: 1, borderColor: Colors.light.border },
            SharedStyles.softShadow,
            style
        ]}>
            {children}
        </View>
    );
};

interface NeoButtonProps {
    title: string;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    backgroundColor?: string;
    disabled?: boolean;
}

export const NeoButton = ({
    title,
    onPress,
    style,
    textStyle,
    backgroundColor,
    disabled
}: NeoButtonProps) => {
    const theme = Colors.light;
    const bg = backgroundColor || theme.primary;

    const animatedValue = React.useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(animatedValue, {
            toValue: 0.97,
            useNativeDriver: true,
            tension: 60,
            friction: 8
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(animatedValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 60,
            friction: 8
        }).start();
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={disabled}
            style={[styles.buttonContainer, style]}
        >
            <Animated.View style={[
                styles.buttonContent,
                {
                    backgroundColor: bg,
                    transform: [{ scale: animatedValue }],
                    opacity: disabled ? 0.5 : 1,
                },
                SharedStyles.softShadow,
            ]}>
                <Text style={[styles.buttonText, textStyle]}>{title}</Text>
            </Animated.View>
        </Pressable>
    );
};

interface NeoInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    style?: StyleProp<ViewStyle>;
}

export const NeoInput = ({
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    style
}: NeoInputProps) => {
    const theme = Colors.light;

    return (
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.textMuted}
            secureTextEntry={secureTextEntry}
            style={[
                styles.input,
                { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
                style as any
            ]}
        />
    );
};

interface NeoSegmentedToggleProps<T extends string> {
    options: { label: string; value: T; activeColor?: string }[];
    value: T;
    onValueChange: (value: T) => void;
    style?: StyleProp<ViewStyle>;
}

export function NeoSegmentedToggle<T extends string>({
    options,
    value,
    onValueChange,
    style
}: NeoSegmentedToggleProps<T>) {
    const theme = Colors.light;
    return (
        <View style={[styles.toggleContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }, style]}>
            {options.map((option) => {
                const isActive = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        style={styles.toggleButton}
                        onPress={() => onValueChange(option.value)}
                    >
                        {isActive && (
                            <View
                                style={[
                                    styles.activeToggle,
                                    { backgroundColor: option.activeColor || theme.primary },
                                    SharedStyles.softShadow,
                                ]}
                            />
                        )}
                        <Text style={[styles.toggleText, { color: isActive ? '#fff' : theme.textSecondary }]}>
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        marginVertical: 0,
    },
    buttonContainer: {
        height: 54,
        width: '100%',
        marginVertical: 8,
    },
    buttonContent: {
        flex: 1,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: '700',
        fontSize: 16,
        color: '#fff',
        letterSpacing: 0.3,
    },
    input: {
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '500',
        marginVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    toggleContainer: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        marginVertical: 12,
        padding: 4,
        borderWidth: 1,
    },
    toggleButton: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeToggle: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        borderRadius: 10,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        zIndex: 20,
    },
});
