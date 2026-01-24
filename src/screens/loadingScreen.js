import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';

const LoadingScreen = () => {
    return (
        <View style={styles.container}>
            {/* You can add your app logo here */}
            <ActivityIndicator size="large" color="#2196f3" />
            <Text style={styles.text}>Synchronizing Session...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
    }
});

export default LoadingScreen;