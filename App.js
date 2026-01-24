import React, { useContext, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import * as Linking from 'expo-linking';
import { supabase } from './src/supabaseClient';

// 1. Import the Auth Context and Provider
import { AuthProvider, AuthContext } from './src/context/AuthContext';

// Import all the screens
import AuthScreen from './src/screens/AuthScreen';
import SubjectScreen from './src/screens/SubjectScreen';
import ChapterScreen from './src/screens/ChapterScreen';
import QuizScreen from './src/screens/QuizScreen';
import AdminScreen from './src/screens/AdminScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import LoadingScreen from './src/screens/loadingScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
// Helper to extract values from the URL hash (#access_token=...)
/*
const getParameterByName = (name, url) => {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[#&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
*/

// 2. Custom Drawer Content to handle Logout and Conditional Admin Link
const CustomDrawerContent = (props) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 20, marginBottom: 20, backgroundColor: '#f0f7ff' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
          {user?.full_name || 'Loading Name...'}
        </Text>
        <Text style={{ color: '#007AFF', fontSize: 12 }}>
          Logged in as: {user?.role?.toUpperCase()}
        </Text>
      </View>

      {/* Renders the default links (Subjects, Profile) */}
      <DrawerItemList {...props} />

      {/* Show Admin Panel link only if user is admin */}
      {user?.role === 'admin' && (
        <DrawerItem
          label="Admin Panel"
          onPress={() => props.navigation.navigate('Admin')}
        />
      )}

      {/* Logout Button */}
      <DrawerItem
        label="Logout"
        onPress={async () => {
          await logout();
        }}
        labelStyle={{ color: '#FF3B30', fontWeight: 'bold' }}
      />
    </DrawerContentScrollView>
  );
};

// 3. The Drawer Navigator
const MainDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
      }}
    >
      <Drawer.Screen name="Subjects" component={SubjectScreen} options={{ title: 'All Subjects' }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'My Progress',
          drawerLabel: 'Dashboard'
        }}
      />

    </Drawer.Navigator>
  );
};

// 4. The Root Navigator switches between Login and the App
const RootNavigator = () => {
  const { user, loading } = useContext(AuthContext);
  /*
  useEffect(() => {
    const handleUrl = async (url) => {
      console.log("RootNavigator: Processing URL for tokens...");

      const accessToken = getParameterByName('access_token', url);
      const refreshToken = getParameterByName('refresh_token', url);

      if (accessToken && refreshToken) {
        console.log("RootNavigator: Tokens found! Setting session...");
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) console.error("RootNavigator: SetSession Error:", error.message);
      }
    };
    

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));

    // Check if the app was opened via a link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => subscription.remove();
  }, []);
  */

  if (loading)
    return <LoadingScreen />;
  ;

  return (
    <Stack.Navigator>
      {user ? (
        <>
          {/* Main App entry is now the Drawer */}
          <Stack.Screen name="HomeDrawer" component={MainDrawer} options={{ headerShown: false }} />

          {/* Screens that shouldn't have a side menu (like the Quiz) stay in the Stack */}
          <Stack.Screen name="Chapters" component={ChapterScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />

        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={AuthScreen} options={{ headerShown: false }} />
        </>
      )}
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ title: 'Reset Your Password' }}
      />
    </Stack.Navigator>
  );
};

export default function App() {
  const navigationRef = useRef(); // Create a ref for the navigation container

  useEffect(() => {
    // This handles the app being opened via a link while it's already running
    const handleDeepLink = (event) => {
      let data = Linking.parse(event.url);
      if (data.path === 'reset-password') {
        navigationRef.current?.navigate('ResetPassword');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // This handles the app being opened via a link from a "closed" state
    Linking.getInitialURL().then((url) => {
      if (url) {
        let data = Linking.parse(url);
        if (data.path === 'reset-password') {
          navigationRef.current?.navigate('ResetPassword');
        }
      }
    });

    return () => subscription.remove();
  }, []);
  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}