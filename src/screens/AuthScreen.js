import React, { useState, useContext, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { supabase } from '../supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// --- BRAND CONSTANTS ---
const THEME = {
    primaryBlue: '#2B65EC',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    background: '#FFFFFF',
    textMain: '#1A202C',
    textSub: '#718096',
    fontHeader: 'PlusJakartaSans-Bold', // Ensure linked 
    fontBody: 'Poppins-Regular',       // Ensure linked 
    fontBodyBold: 'Poppins-Bold',
};

const AuthScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
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
                options: { redirectTo: redirectUrl },
            });
            if (error) throw error;
            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                if (result.type === 'success') { /* Session handled by AuthContext */ }
            }
        } catch (error) {
            Alert.alert("Google login error:", error.message);
        }
    };

    const handleAuth = async () => {
        if (!email || !password || (isSignUp && !fullName)) {
            Alert.alert("Error", "Fill in everything. Don't be lazy."); // Brand tone [cite: 19]
            return;
        }

        setLoading(true);
        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } }
            });
            if (error) Alert.alert("Sign Up Error", error.message);
            else Alert.alert("Success", "Check your email. Fast."); // Brand tone 
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                Alert.alert("Login Error", error.message);
            } else {
                if (rememberMe) await AsyncStorage.setItem('rememberedEmail', email);
                else await AsyncStorage.removeItem('rememberedEmail');
            }
        }
        setLoading(false);
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert("Error", "We need an email to help you out.");
            return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'elearning://reset-password',
        });
        if (error) Alert.alert("Error", error.message);
        else Alert.alert("Email Sent", "Go check your inbox.");
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* BRAND LOGO */}
                <Image
                    source={require('../../assets/nerd_logo_text.svg')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.title}>
                    {isSignUp ? "Join the nerds.🤓" : "Welcome back."} {/*  */}
                </Text>

                <View style={styles.form}>
                    {isSignUp && (
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="What do people call you?"
                                placeholderTextColor="#A0AEC0"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>
                    )}

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="nerd@example.com"
                            placeholderTextColor="#A0AEC0"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.inputStyle}
                                placeholder="Keep it secret"
                                placeholderTextColor="#A0AEC0"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.icon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={22}
                                    color={THEME.textSub}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setRememberMe(!rememberMe)}
                        >
                            <Ionicons
                                name={rememberMe ? "checkbox" : "square-outline"}
                                size={20}
                                color={THEME.primaryBlue}
                            />
                            <Text style={styles.rememberMeText}>Remember me</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleForgotPassword}>
                            <Text style={styles.forgotText}>Forgot your password?</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.mainButton} onPress={handleAuth} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isSignUp ? "GET STARTED" : "LOG IN"}</Text>}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                        <AntDesign name="google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggle}>
                        <Text style={styles.toggleText}>
                            {isSignUp ? "Already a nerd? " : "New here? "}
                            <Text style={{ color: THEME.primaryBlue, fontFamily: THEME.fontBodyBold }}>
                                {isSignUp ? "Login" : "Sign Up"}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    scrollContainer: { padding: 24, justifyContent: 'center', flexGrow: 1 },
    logo: { width: 160, height: 60, alignSelf: 'center', marginBottom: 10 },
    title: {
        fontFamily: THEME.fontHeader,
        fontSize: 26,
        textAlign: 'center',
        color: THEME.textMain,
        marginBottom: 40
    },
    form: { width: '100%' },
    inputWrapper: { marginBottom: 20 },
    label: {
        fontFamily: THEME.fontHeader,
        fontSize: 14,
        color: THEME.textMain,
        marginBottom: 8,
        marginLeft: 4
    },
    input: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        padding: 16,
        borderRadius: 16,
        fontSize: 16,
        fontFamily: THEME.fontBody,
        backgroundColor: '#FFF',
        color: THEME.textMain
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        backgroundColor: '#FFF',
    },
    inputStyle: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        fontFamily: THEME.fontBody,
        color: THEME.textMain,
    },
    icon: { paddingRight: 15 },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    checkboxRow: { flexDirection: 'row', alignItems: 'center' },
    rememberMeText: {
        marginLeft: 8,
        color: THEME.textSub,
        fontFamily: THEME.fontBody,
        fontSize: 14
    },
    forgotText: {
        color: THEME.magenta,
        fontFamily: THEME.fontBodyBold,
        fontSize: 14
    },
    mainButton: {
        backgroundColor: THEME.primaryBlue,
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: THEME.primaryBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    buttonText: {
        color: '#fff',
        fontFamily: THEME.fontHeader,
        fontSize: 16,
        letterSpacing: 1
    },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    dividerText: { marginHorizontal: 15, color: '#A0AEC0', fontSize: 12, fontFamily: THEME.fontHeader },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        padding: 16,
        borderRadius: 16,
    },
    googleButtonText: {
        color: THEME.textMain,
        fontFamily: THEME.fontBodyBold,
        fontSize: 15
    },
    toggle: { marginTop: 30, alignItems: 'center' },
    toggleText: { color: THEME.textSub, fontFamily: THEME.fontBody, fontSize: 14 },
});

export default AuthScreen;