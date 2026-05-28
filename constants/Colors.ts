export const Colors = {
    light: {
        // Core
        text: '#0F172A',
        textSecondary: '#64748B',
        textMuted: '#94A3B8',
        background: '#FFFFFF',
        backgroundSecondary: '#F7F8FA',
        card: '#FFFFFF',

        // Brand
        tint: '#6366F1',         // Indigo — primary accent
        primary: '#6366F1',
        primarySoft: '#EEF2FF', // Soft indigo background

        // Hero card
        hero: '#0B1437',         // Deep navy

        // Semantic
        success: '#10B981',      // Emerald
        successSoft: '#ECFDF5',
        danger: '#F43F5E',       // Rose
        dangerSoft: '#FFF1F2',
        warning: '#F59E0B',      // Amber
        warningSoft: '#FFFBEB',

        // UI
        border: '#E2E8F0',
        borderLight: '#F1F5F9',
        icon: '#64748B',
        tabIconDefault: '#94A3B8',
        tabIconSelected: '#6366F1',
    },
};

export const SharedStyles = {
    // Soft shadow (replaces neobrutalist hard shadow)
    softShadow: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    softShadowMd: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
    },
    // Card base
    card: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
    },
};
