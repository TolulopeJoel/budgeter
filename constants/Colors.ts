/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
    light: {
        text: '#11181C',
        background: '#fff',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
        card: '#f9f9f9',
        border: '#e0e0e0',
        primary: '#007AFF',
        success: '#34C759',
        danger: '#FF3B30',
        warning: '#FF9500',
    },
    dark: {
        text: '#ECEDEE',
        background: '#151718',
        tint: '#0A84FF',
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
        card: '#202020',
        border: '#333333',
        primary: '#0A84FF',
        success: '#30D158',
        danger: '#FF453A',
        warning: '#FF9F0A',
    },
};
