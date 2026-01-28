import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserProgress } from '../api/contentService';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

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

const ProfileScreen = () => {
    const [stats, setStats] = useState({ total: 0, correct: 0, accuracy: 0 });
    const [loading, setLoading] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await getUserProgress(user.id);
            const total = data.length;
            const correct = data.filter(item => item.is_correct).length;
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
            setStats({ total, correct, accuracy });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) {
            Alert.alert("Too Short", "Make it at least 6 characters. Be safe.");
            return;
        }
        setIsUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            Alert.alert("Done", "Password updated. Don't forget it.");
            setNewPassword('');
        } catch (error) {
            Alert.alert("Failed", error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert("Error", "You're stuck here: " + error.message);
    };

    const getInitials = (email) => {
        return email ? email.substring(0, 2).toUpperCase() : "??";
    };

    if (loading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.primaryBlue} />
            <Text style={styles.loadingText}>Fetching your data...</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>

                {/* 1. DOSSIER HEADER */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials(user?.email)}</Text>
                        </View>
                        <View style={styles.statusDot} />
                    </View>
                    <Text style={styles.userName}>{user?.full_name || 'Nerd User'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* 2. STATS GRID (High Contrast) */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { borderColor: THEME.textMain }]}>
                        <Text style={styles.statNumber}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Attempts</Text>
                    </View>
                    <View style={[styles.statCard, { borderColor: THEME.cyan, backgroundColor: THEME.surface }]}>
                        <Text style={[styles.statNumber, { color: THEME.primaryBlue }]}>{stats.accuracy}%</Text>
                        <Text style={styles.statLabel}>Score</Text>
                    </View>
                    <View style={[styles.statCard, { borderColor: THEME.magenta }]}>
                        <Text style={[styles.statNumber, { color: THEME.magenta }]}>{stats.correct}</Text>
                        <Text style={styles.statLabel}>Correct</Text>
                    </View>
                </View>

                {/* 3. SECURITY SECTION */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield-checkmark-sharp" size={20} color={THEME.primaryBlue} />
                        <Text style={styles.sectionTitle}>Security Protocol</Text>
                    </View>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            placeholderTextColor="#A0AEC0"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity
                            style={styles.updateBtn}
                            onPress={handleUpdatePassword}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Ionicons name="arrow-forward-sharp" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 4. ACTIONS */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.refreshBtn} onPress={loadStats}>
                        <MaterialCommunityIcons name="refresh" size={20} color={THEME.textSub} />
                        <Text style={styles.refreshBtnText}>SYNC DATA</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutBtnText}>TERMINATE SESSION</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Background Mark */}
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
    loadingText: { marginTop: 10, fontFamily: THEME.fontBody, color: THEME.textSub },
    scrollContent: { padding: 24 },

    header: { alignItems: 'center', marginBottom: 40 },
    avatarContainer: { position: 'relative' },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: THEME.textMain,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '-3deg' }],
        borderWidth: 3,
        borderColor: THEME.cyan
    },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#4ade80',
        borderWidth: 3,
        borderColor: THEME.background
    },
    avatarText: { color: THEME.cyan, fontSize: 36, fontFamily: THEME.fontHeader },
    userName: { fontSize: 28, fontFamily: THEME.fontHeader, marginTop: 15, color: THEME.textMain },
    userEmail: { fontFamily: THEME.fontBody, color: THEME.textSub, marginTop: -4 },

    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    statCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        width: '31%',
        borderWidth: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    statNumber: { fontSize: 22, fontFamily: THEME.fontHeader, color: THEME.textMain },
    statLabel: { fontSize: 10, fontFamily: THEME.fontBodyBold, color: THEME.textSub, textTransform: 'uppercase', marginTop: 2 },

    section: { marginBottom: 40 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontFamily: THEME.fontHeader, marginLeft: 8, color: THEME.textMain },
    inputWrapper: { flexDirection: 'row', alignItems: 'center' },
    input: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        padding: 16,
        borderRadius: 16,
        fontFamily: THEME.fontBody,
        color: THEME.textMain,
        backgroundColor: THEME.surface
    },
    updateBtn: {
        width: 56,
        height: 56,
        backgroundColor: THEME.primaryBlue,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12
    },

    footer: { marginTop: 10 },
    refreshBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0'
    },
    refreshBtnText: { color: THEME.textSub, fontFamily: THEME.fontHeader, fontSize: 13, marginLeft: 8, letterSpacing: 1 },

    logoutBtn: {
        marginTop: 15,
        padding: 18,
        borderRadius: 16,
        backgroundColor: THEME.background,
        borderWidth: 2,
        borderColor: THEME.magenta,
        alignItems: 'center'
    },
    logoutBtnText: { color: THEME.magenta, fontFamily: THEME.fontHeader, fontSize: 14, letterSpacing: 1 },

    bgWatermark: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 200,
        height: 200,
        opacity: 0.03,
        zIndex: -1,
        transform: [{ rotate: '15deg' }]
    }
});

export default ProfileScreen;