import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getUserProgress } from '../api/contentService';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const ProfileScreen = () => {
    const [stats, setStats] = useState({ total: 0, correct: 0, accuracy: 0 });
    const [loading, setLoading] = useState(true);

    const { user } = useContext(AuthContext);

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

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert("Error logging out", error.message);
    };

    // Helper to get initials from email (e.g., test@example.com -> TE)
    const getInitials = (email) => {
        return email ? email.substring(0, 2).toUpperCase() : "??";
    };

    if (loading) return <ActivityIndicator size="large" color="#2196f3" style={{ flex: 1 }} />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(user?.email)}</Text>
                </View>
                <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Answered</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: '#4caf50' }]}>{stats.accuracy}%</Text>
                    <Text style={styles.statLabel}>Accuracy</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.correct}</Text>
                    <Text style={styles.statLabel}>Correct</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={loadStats}>
                <Text style={styles.btnText}>Refresh Stats</Text>
            </TouchableOpacity>

            {/* 7. Added Logout Button */}
            <TouchableOpacity
                style={[styles.refreshBtn, { borderColor: '#f44336', marginTop: 15 }]}
                onPress={handleLogout}
            >
                <Text style={[styles.btnText, { color: '#f44336' }]}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
    header: { alignItems: 'center', marginVertical: 30 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2196f3', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
    userName: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
    userEmail: { color: '#666' },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    statBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12, alignItems: 'center', width: '30%', elevation: 2 },
    statNumber: { fontSize: 20, fontWeight: 'bold' },
    statLabel: { fontSize: 12, color: '#888', marginTop: 5 },
    refreshBtn: { marginTop: 40, backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#2196f3' },
    btnText: { color: '#2196f3', textAlign: 'center', fontWeight: 'bold' }
});

export default ProfileScreen;