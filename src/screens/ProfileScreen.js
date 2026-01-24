import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { getUserProgress } from '../api/contentService';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const ProfileScreen = () => {
    const [stats, setStats] = useState({ total: 0, correct: 0, accuracy: 0 });
    const [loading, setLoading] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

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

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long.");
            return;
        }

        setIsUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            Alert.alert("Success", "Password updated successfully!");
            setNewPassword(''); // Clear input
        } catch (error) {
            Alert.alert("Update Failed", error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert("Error logging out", error.message);
    };

    const getInitials = (email) => {
        return email ? email.substring(0, 2).toUpperCase() : "??";
    };

    if (loading) return <ActivityIndicator size="large" color="#2196f3" style={{ flex: 1 }} />;

    return (
        <ScrollView style={styles.container}>
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

            {/* --- NEW: Change Password Section --- */}
            <View style={styles.passwordSection}>
                <Text style={styles.sectionTitle}>Security</Text>
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#2196f3' }]}
                    onPress={handleUpdatePassword}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.actionBtnText}>Update Password</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Actions Section */}
            <View style={styles.footerActions}>
                <TouchableOpacity style={styles.refreshBtn} onPress={loadStats}>
                    <Text style={styles.btnText}>Refresh Stats</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.refreshBtn, { borderColor: '#f44336', marginTop: 15 }]}
                    onPress={handleLogout}
                >
                    <Text style={[styles.btnText, { color: '#f44336' }]}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    statBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', width: '31%', elevation: 2 },
    statNumber: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 11, color: '#888', marginTop: 5 },

    // Password Section Styles
    passwordSection: { marginTop: 30, backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 1 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    input: { borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 10, marginBottom: 15, color: '#333' },
    actionBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontWeight: 'bold' },

    footerActions: { marginBottom: 40 },
    refreshBtn: { marginTop: 20, backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#2196f3' },
    btnText: { color: '#2196f3', textAlign: 'center', fontWeight: 'bold' }
});

export default ProfileScreen;