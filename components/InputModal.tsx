import { NeoButton, NeoCard } from '@/components/ui/NeobrutalistComponents';
import { Colors, SharedStyles } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
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
    const theme = Colors.light;
    const styles = createStyles(theme, SharedStyles);
    const insets = useSafeAreaInsets();

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <NeoCard style={[styles.content, { backgroundColor: theme.card, paddingBottom: insets.bottom + 24 }]}>
                    {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}

                    <View style={[styles.inputContainer, SharedStyles.neoBorder, SharedStyles.neoShadow, { backgroundColor: '#fff', padding: 12 }]}>
                        {leftElement}
                        {prefix && (
                            <Text style={[styles.prefix, { color: '#000' }]}>{prefix}</Text>
                        )}
                        <TextInput
                            style={[styles.input, { color: '#000' }]}
                            placeholder={placeholder}
                            placeholderTextColor="#999"
                            keyboardType={keyboardType}
                            value={value}
                            onChangeText={onChangeText}
                            autoFocus
                        />
                    </View>

                    {children}

                    <View style={styles.buttons}>
                        <NeoButton
                            title={cancelText}
                            onPress={onCancel}
                            backgroundColor={theme.card}
                            style={{ flex: 1 }}
                        />
                        <NeoButton
                            title={confirmText}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onConfirm();
                            }}
                            backgroundColor={theme.tint}
                            disabled={disabled}
                            style={{ flex: 1 }}
                        />
                    </View>
                </NeoCard>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const createStyles = (theme: any, neoStyles: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        ...neoStyles.neoBorder,
        ...neoStyles.neoShadow,
    },
    prefix: {
        fontSize: 32,
        fontWeight: '900',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 32,
        fontWeight: '900',
        paddingVertical: 4,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
});
