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
    useColorScheme
} from 'react-native';

interface NeoCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    backgroundColor?: string;
}

export const NeoCard = ({ children, style, backgroundColor }: NeoCardProps) => {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme as 'light' | 'dark'];
    const bg = backgroundColor || theme.card;

    return (
        <View style={[
            styles.card,
            { backgroundColor: bg },
            SharedStyles.neoBorder,
            SharedStyles.neoShadow,
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
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme as 'light' | 'dark'];
    const bg = backgroundColor || theme.primary;

    const animatedValue = React.useRef(new Animated.Value(0)).current;

    const onPressIn = () => {
        Animated.spring(animatedValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 7
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7
        }).start();
    };

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 2],
    });

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 2],
    });

    return (
        <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={disabled}
            style={[
                styles.buttonContainer,
                style
            ]}
        >
            <Animated.View style={[
                styles.buttonShadow,
                { opacity: disabled ? 0.5 : 1 }
            ]} />
            <Animated.View style={[
                styles.buttonContent,
                {
                    backgroundColor: bg,
                    transform: [{ translateX }, { translateY }],
                    opacity: disabled ? 0.7 : 1
                },
                SharedStyles.neoBorder,
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
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme as 'light' | 'dark'];

    return (
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.icon}
            secureTextEntry={secureTextEntry}
            style={[
                styles.input,
                SharedStyles.neoBorder,
                { backgroundColor: theme.card },
                style as any
            ]}
        />
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 0,
        marginVertical: 8,
    },
    buttonContainer: {
        height: 54,
        position: 'relative',
        marginVertical: 8,
    },
    buttonShadow: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: -4,
        bottom: -4,
        backgroundColor: '#000000',
    },
    buttonContent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: '900',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
        marginVertical: 8,
    },
});
