const tintColorLight = '#FF2E63';
const chicCream = '#FDF6E3';
const ink = '#0F172A'; // Deep "Ink" for borders and grounding

export const Colors = {
    light: {
        text: ink,
        background: chicCream,
        tint: tintColorLight,
        icon: ink,
        tabIconDefault: ink,
        tabIconSelected: tintColorLight,
        card: '#FFFFFF',
        border: ink,
        primary: tintColorLight, // Pink
        success: '#08D9D6', // Cyan
        danger: '#E84545', // Semantic Red
        warning: '#FFDE7D', // Yellow
        ink: ink,
    },
};

export const SharedStyles = {
    neoBorder: {
        borderWidth: 2,
        borderColor: ink,
    },
    neoShadow: {
        shadowColor: ink,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
    },
    neoShadowLarge: {
        shadowColor: ink,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 6,
    },
};
