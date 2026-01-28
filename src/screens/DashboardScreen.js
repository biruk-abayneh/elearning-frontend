import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getDashboardData } from '../api/contentService';

// --- BRAND CONSTANTS ---
const THEME = {
    primaryBlue: '#2B65EC',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    background: '#FFFFFF',
    surface: '#F7FAFC',
    textMain: '#1A202C',
    textSub: '#718096',
    fontHeader: 'PlusJakartaSans-Bold',
    fontBody: 'Poppins-Regular',
    fontBodyBold: 'Poppins-Bold',
};

const DashboardScreen = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        getDashboardData().then(response => {
            setData(response);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.magenta} />
            <Text style={styles.loadingText}>Loading the leaderboard...</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* 1. NERD STATUS (Rank Header) */}
            <View style={styles.headerSection}>
                <View style={styles.rankCard}>
                    <View style={styles.rankInfo}>
                        <Text style={styles.rankLabel}>WORLD STANDING</Text>
                        <Text style={styles.rankNumber}>#{data?.rank?.rank || '???'}</Text>
                        <View style={styles.pointsBadge}>
                            <Text style={styles.pointsText}>{data?.rank?.total_score || 0} XP COLLECTED</Text>
                        </View>
                    </View>
                    <View style={styles.rankIconContainer}>
                        <MaterialCommunityIcons name="trophy-variant" size={60} color={THEME.cyan} />
                    </View>
                </View>
            </View>

            {/* 2. ACTIVITY LOG */}
            <View style={styles.logHeader}>
                <Text style={styles.title}>BATTLE LOG</Text>
                <TouchableOpacity onPress={() => {/* Refresh logic */ }}>
                    <Ionicons name="refresh-sharp" size={20} color={THEME.primaryBlue} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={data?.attempts || []}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={[
                        styles.attemptCard,
                        { borderColor: index % 2 === 0 ? THEME.primaryBlue : THEME.magenta }
                    ]}>
                        <View style={styles.attemptMain}>
                            <Text style={styles.subjectLabel}>{item.chapters?.subjects?.name?.toUpperCase()}</Text>
                            <Text style={styles.chapterTitle}>{item.chapters?.title}</Text>
                        </View>

                        <View style={styles.scoreContainer}>
                            <View style={[
                                styles.scoreBadge,
                                { backgroundColor: item.percentage >= 70 ? THEME.cyan : '#f0f0f0' }
                            ]}>
                                <Text style={styles.scoreText}>{item.score}/{item.total_questions}</Text>
                            </View>
                            <Text style={[
                                styles.percentText,
                                { color: item.percentage >= 70 ? '#2D3748' : THEME.magenta }
                            ]}>
                                {Math.round(item.percentage)}%
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No battles fought yet. Get in there.</Text>
                    </View>
                }
            />

            {/* Background Branding */}
            <Image
                source={require('../../assets/no_icon.svg')}
                style={styles.bgWatermark}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontFamily: THEME.fontBody, color: THEME.textSub },

    headerSection: { padding: 24, paddingBottom: 10 },
    rankCard: {
        backgroundColor: THEME.textMain,
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Slight tilt for "Controlled Chaos" vibe
        transform: [{ rotate: '-1deg' }],
        borderWidth: 2,
        borderColor: THEME.primaryBlue
    },
    rankLabel: {
        color: THEME.cyan,
        fontFamily: THEME.fontBodyBold,
        fontSize: 12,
        letterSpacing: 2
    },
    rankNumber: {
        color: '#FFF',
        fontSize: 56,
        fontFamily: THEME.fontHeader,
        lineHeight: 60,
        marginVertical: 4
    },
    pointsBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start'
    },
    pointsText: { color: '#FFF', fontSize: 10, fontFamily: THEME.fontBodyBold },
    rankIconContainer: { opacity: 0.8 },

    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 15
    },
    title: { fontFamily: THEME.fontHeader, fontSize: 22, color: THEME.textMain },

    listContent: { paddingHorizontal: 24 },
    attemptCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        borderWidth: 2,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    attemptMain: { flex: 1 },
    subjectLabel: {
        fontFamily: THEME.fontBodyBold,
        fontSize: 10,
        color: THEME.textSub,
        letterSpacing: 1
    },
    chapterTitle: {
        fontFamily: THEME.fontHeader,
        fontSize: 16,
        color: THEME.textMain,
        marginTop: 2
    },
    scoreContainer: { alignItems: 'flex-end', marginLeft: 10 },
    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 4
    },
    scoreText: { fontFamily: THEME.fontHeader, fontSize: 14, color: '#1A202C' },
    percentText: { fontFamily: THEME.fontBodyBold, fontSize: 12 },

    emptyState: { marginTop: 60, alignItems: 'center' },
    emptyText: { fontFamily: THEME.fontBody, color: THEME.textSub },

    bgWatermark: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 250,
        height: 250,
        opacity: 0.03,
        zIndex: -1,
        transform: [{ rotate: '25deg' }]
    }
});

export default DashboardScreen;