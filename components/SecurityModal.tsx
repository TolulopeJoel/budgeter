import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface SecurityModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storedPin: string | null;
    onSetPin: (pin: string) => void;
    title?: string;
}

export default function SecurityModal({
    visible,
    onClose,
    onSuccess,
    storedPin,
    onSetPin,
    title,
}: SecurityModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [mode, setMode] = useState<'verify' | 'setup' | 'confirm'>(storedPin ? 'verify' : 'setup');
    const [tempPin, setTempPin] = useState('');

    useEffect(() => {
        if (visible) {
            setPin('');
            setError(false);
            setMode(storedPin ? 'verify' : 'setup');
        }
    }, [visible, storedPin]);

    const handlePress = (num: string) => {
        if (pin.length >= 4) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newPin = pin + num;
        setPin(newPin);

        if (newPin.length === 4) {
            if (mode === 'verify') {
                if (newPin === storedPin) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onSuccess();
                    onClose();
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    setError(true);
                    setTimeout(() => {
                        setPin('');
                        setError(false);
                    }, 500);
                }
            } else if (mode === 'setup') {
                setTempPin(newPin);
                setPin('');
                setMode('confirm');
            } else if (mode === 'confirm') {
                if (newPin === tempPin) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onSetPin(newPin);
                    onSuccess();
                    onClose();
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    setError(true);
                    setTimeout(() => {
                        setPin('');
                        setError(false);
                        setMode('setup');
                    }, 500);
                }
            }
        }
    };

    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPin(pin.slice(0, -1));
    };

    const getTitle = () => {
        if (mode === 'verify') return title || 'Enter PIN';
        if (mode === 'setup') return 'Set a New PIN';
        return 'Confirm Your PIN';
    };

    const getSubtitle = () => {
        if (error) {
            if (mode === 'confirm') return 'PINs do not match. Try again.';
            return 'Incorrect PIN';
        }
        if (mode === 'setup') return 'Choose a 4-digit PIN to secure your savings.';
        if (mode === 'confirm') return 'Enter the PIN again to confirm.';
        return 'Enter your PIN to access savings.';
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>

                    <Text style={[styles.title, { color: theme.text }]}>{getTitle()}</Text>
                    <Text style={[styles.subtitle, { color: error ? theme.danger : theme.icon }]}>
                        {getSubtitle()}
                    </Text>

                    <View style={styles.dotsContainer}>
                        {[1, 2, 3, 4].map((i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    { borderColor: theme.border },
                                    pin.length >= i && { backgroundColor: theme.tint, borderColor: theme.tint },
                                    error && { backgroundColor: theme.danger, borderColor: theme.danger }
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.keypad}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={[styles.key, { backgroundColor: theme.card }]}
                                onPress={() => handlePress(num.toString())}
                            >
                                <Text style={[styles.keyText, { color: theme.text }]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.keyPlaceholder} />
                        <TouchableOpacity
                            style={[styles.key, { backgroundColor: theme.card }]}
                            onPress={() => handlePress('0')}
                        >
                            <Text style={[styles.keyText, { color: theme.text }]}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.key, { backgroundColor: 'transparent' }]}
                            onPress={handleDelete}
                        >
                            <Ionicons name="backspace-outline" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '85%',
        padding: 32,
        borderRadius: 32,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 40,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
        width: '100%',
    },
    key: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyPlaceholder: {
        width: 64,
        height: 64,
    },
    keyText: {
        fontSize: 24,
        fontWeight: '600',
    },
});
