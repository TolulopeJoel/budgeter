/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#FF2E63';
const tintColorDark = '#08D9D6';

export const Colors = {
    light: {
        text: '#000000',
        background: '#FDF6E3', // Chic Cream
        tint: tintColorLight,
        icon: '#000000',
        tabIconDefault: '#000000',
        tabIconSelected: tintColorLight,
        card: '#FFFFFF',
        border: '#000000',
        primary: '#FF2E63', // Pink
        success: '#08D9D6', // Cyan
        danger: '#FF2E63',
        warning: '#FFDE7D', // Yellow
    },
    dark: {
        text: '#ECEDEE',
        background: '#151718',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
        card: '#202020',
        border: '#333333',
        primary: '#08D9D6',
        success: '#30D158',
        danger: '#FF453A',
        warning: '#FF9F0A',
    },
};

export const SharedStyles = {
    neoBorder: {
        borderWidth: 2,
        borderColor: '#000000',
    },
    neoShadow: {
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    neoShadowLarge: {
        shadowColor: '#000000',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 6,
    },
};
