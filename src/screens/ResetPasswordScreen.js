import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { supabase } from '../supabaseClient';

const ResetPasswordScreen = ({ navigation }) => {
    const [password, setPassword] = useState('');

    const handleReset = async () => {
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Success", "Your password has been reset. Please login.");
            navigation.navigate('Login');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create New Password</Text>
            <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleReset}>
                <Text style={styles.buttonText}>Set New Password</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { borderBottomWidth: 1, marginBottom: 20, padding: 10 },
    button: { backgroundColor: '#2196f3', padding: 15, borderRadius: 5 },
    buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});

export default ResetPasswordScreen;