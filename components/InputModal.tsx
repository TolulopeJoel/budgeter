import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InputModalProps {
    visible: boolean;
    title: string;
    value: string;
    onChangeText: (text: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    prefix?: string;
    leftElement?: React.ReactNode;
    children?: React.ReactNode;
    disabled?: boolean;
}

export default function InputModal({
    visible,
    title,
    value,
    onChangeText,
    onConfirm,
    onCancel,
    placeholder = 'Enter value',
    confirmText = 'Save',
    cancelText = 'Cancel',
    keyboardType = 'default',
    prefix,
    leftElement,
    children,
    disabled = false,
}: InputModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={[styles.content, { backgroundColor: theme.card, paddingBottom: insets.bottom + 24 }]}>
                    {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}

                    <View style={styles.inputContainer}>
                        {leftElement}
                        {prefix && (
                            <Text style={[styles.prefix, { color: theme.text }]}>{prefix}</Text>
                        )}
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                            placeholder={placeholder}
                            placeholderTextColor={theme.icon}
                            keyboardType={keyboardType}
                            value={value}
                            onChangeText={onChangeText}
                            autoFocus
                        />
                    </View>

                    {children}

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.background }]}
                            onPress={onCancel}
                        >
                            <Text style={[styles.buttonText, { color: theme.text }]}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.tint, opacity: disabled ? 0.5 : 1 }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onConfirm();
                            }}
                            disabled={disabled}
                        >
                            <Text style={[styles.buttonText, { color: '#fff' }]}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    prefix: {
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
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
