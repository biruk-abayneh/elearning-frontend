import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../supabaseClient';
import { AuthContext } from '../context/AuthContext';

const AuthScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState(''); // NEW: State for the user's name
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const { setUser } = useContext(AuthContext);

    const handleAuth = async () => {
        // Validation check for Name if signing up
        if (!email || !password || (isSignUp && !fullName)) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        if (isSignUp) {
            // REGISTER with Metadata
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName, // This triggers the SQL to save to your profiles table
                    }
                }
            });

            if (error) Alert.alert("Sign Up Error", error.message);
            else Alert.alert("Success", "Check your email for confirmation!");
        } else {
            // LOGIN
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                Alert.alert("Login Error", error.message);
            }
            // Note: onAuthStateChange in AuthContext will handle setUser automatically
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</Text>

            {/* NEW: Full Name Input only visible during Sign Up */}
            {isSignUp && (
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                />
            )}

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isSignUp ? "Sign Up" : "Login"}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggle}>
                <Text style={styles.toggleText}>
                    {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#2196f3' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15 },
    button: { backgroundColor: '#2196f3', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    toggle: { marginTop: 20, alignItems: 'center' },
    toggleText: { color: '#2196f3' }
});

export default AuthScreen;