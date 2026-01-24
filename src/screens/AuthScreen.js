import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Checkbox } from 'expo-checkbox';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState(''); // NEW: State for the user's name
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { setUser } = useContext(AuthContext);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const loadSavedEmail = async () => {
            const savedEmail = await AsyncStorage.getItem('rememberedEmail');
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
            }
        };
        loadSavedEmail();
    }, []);
    const handleGoogleLogin = async () => {
        try {
            const redirectUrl = Linking.createURL('home');
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                },
            });

            if (error) throw error;

            // This opens the Google login page in the phone's browser
            if (data?.url) {
                // 1. Assign the return value to 'result'
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                // 2. Now 'result' exists and you can check its type
                if (result.type === 'success') {
                    // This forces a refresh of the session after the browser closes
                    // supabase-js will now read the URL and set the session
                }
            }
        } catch (error) {
            Alert.alert("Google login error:", error.message);
        }
    };

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
            } else {
                // SUCCESS: Handle "Remember Me" logic
                if (rememberMe) {
                    await AsyncStorage.setItem('rememberedEmail', email);
                } else {
                    await AsyncStorage.removeItem('rememberedEmail');
                }
            }
            // Note: onAuthStateChange in AuthContext will handle setUser automatically
        }
        setLoading(false);
    };
    // Inside your LoginScreen.js
    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email address first.");
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // This URL must be registered in your Supabase Dashboard
            redirectTo: 'elearning://reset-password',
        });

        if (error) {
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Check your email", "A password reset link has been sent.");
        }
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
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.inputStyle}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword} // Toggle based on state
                />
                <TouchableOpacity
                    style={styles.icon}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={24}
                        color="#666"
                    />
                </TouchableOpacity>

            </View>

            <View style={styles.rememberMeContainer}>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setRememberMe(!rememberMe)}
                >
                    <Ionicons
                        name={rememberMe ? "checkbox" : "square-outline"}
                        size={20}
                        color="#2196f3"
                    />
                    <Text style={styles.rememberMeText}>Remember Email</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isSignUp ? "Sign Up" : "Login"}</Text>}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
            >
                <View style={styles.googleIconWrapper}>
                    <AntDesign name="google" size={20} color="#EA4335" />
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggle}>
                <Text style={styles.toggleText}>
                    {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotContainer}
            >
                <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#2196f3' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16, backgroundColor: '#fff' },
    button: { backgroundColor: '#2196f3', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    toggle: { marginTop: 20, alignItems: 'center' },
    toggleText: { color: '#2196f3' },
    forgotContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    forgotText: {
        color: '#2196f3',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    inputStyle: {
        flex: 1,
        padding: 15, // Match the padding of your 'input' style exactly
        fontSize: 16,
        color: '#000',
    },
    icon: {
        padding: 10,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        borderRadius: 8,
        marginTop: 15,
        // Add a slight shadow for a "card" look (iOS)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        // Shadow for Android
        elevation: 2,
    },
    googleIconWrapper: {
        marginRight: 10,
    },
    googleButtonText: {
        color: '#555',
        fontWeight: '600',
        fontSize: 16,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#eee',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#999',
        fontSize: 12,
        fontWeight: 'bold',
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        justifyContent: 'flex-start',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rememberMeText: {
        marginLeft: 8,
        color: '#666',
        fontSize: 14,
    },
});

export default AuthScreen;