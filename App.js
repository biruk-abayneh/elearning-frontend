import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import * as Linking from 'expo-linking';
import { supabase } from './src/supabaseClient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// Import all screens
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
SplashScreen.preventAutoHideAsync();

const CustomDrawerContent = (props) => {
  const { user, logout } = useContext(AuthContext);
  // 2. GET INSETS
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      {/* BRANDED HEADER AREA WITH SAFE AREA FIX */}
      <View style={[
        drawerStyles.header,
        { paddingTop: insets.top + 20 } // Pushes content below notification bar
      ]}>
        {/* 3. USE APP ICON INSTEAD OF TEXT */}
        <Image
          source={require('./assets/no-icon.png')} // Replace with your actual filename
          style={drawerStyles.appIcon}
          resizeMode="contain"
        />
        <Text style={drawerStyles.userName}>
          {user?.full_name || 'Nerd User'}
        </Text>
        <View style={drawerStyles.roleBadge}>
          <Text style={drawerStyles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={drawerStyles.linksContainer}>
        <DrawerItemList
          {...props}
          activeTintColor="#2B65EC"
          labelStyle={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 16 }}
        />

        {user?.role === 'admin' && (
          <DrawerItem
            label="Admin Panel"
            labelStyle={{ fontFamily: 'PlusJakartaSans-Bold', color: '#2B65EC' }}
            icon={() => <Ionicons name="shield-checkmark" size={20} color="#2B65EC" />}
            onPress={() => props.navigation.navigate('Admin')}
          />
        )}
      </View>

      <TouchableOpacity
        style={[drawerStyles.logoutBtn, { marginBottom: insets.bottom + 20 }]}
        onPress={async () => await logout()}
      >
        <Ionicons name="log-out-outline" size={22} color="#FF00FF" />
        <Text style={drawerStyles.logoutText}>DITCH SESSION</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

// ... (MainDrawer and RootNavigator remain the same)
const MainDrawer = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStatusBarHeight: undefined,
          drawerActiveBackgroundColor: 'rgba(0, 255, 255, 0.1)', // Soft Cyan fade [cite: 27]
          drawerActiveTintColor: '#2B65EC', // Your Primary Blue
          drawerInactiveTintColor: '#4A5568', // Subtle gray for inactive links

          drawerLabelStyle: {
            fontFamily: 'PlusJakartaSans-Bold', // Branding alignment [cite: 34]
            fontSize: 15,
            marginLeft: -10, // Pull text closer to icons
          },
          drawerItemStyle: {
            borderRadius: 12, // Rounded UI components [cite: 29]
            marginVertical: 4,
            marginHorizontal: 8,
            paddingHorizontal: 4,
            // Adds a sharp "Active" indicator on the left
            borderLeftWidth: 4,
            borderLeftColor: 'transparent',
          },
        }}
      >
        <Drawer.Screen name="Subjects" component={SubjectScreen} options={{ title: 'All Subjects' }} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'My Progress', drawerLabel: 'Dashboard' }}
        />
      </Drawer.Navigator>
    </>
  );
};

const RootNavigator = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="HomeDrawer" component={MainDrawer} options={{ headerShown: false }} />
          <Stack.Screen name="Chapters" component={ChapterScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={AuthScreen} options={{ headerShown: false }} />
      )}
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
    </Stack.Navigator>
  );
};

export default function App() {
  const navigationRef = useRef();

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        // 2. HIDE SPLASH SCREEN ONCE READY
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, [fontsLoaded]);

  useEffect(() => {
    const handleDeepLink = (event) => {
      let data = Linking.parse(event.url);
      if (data.path === 'reset-password') navigationRef.current?.navigate('ResetPassword');
    };
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null; // The splash screen remains visible here
  }

  return (
    // 4. WRAP EVERYTHING IN SAFEAREAPROVIDER
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const drawerStyles = StyleSheet.create({
  header: {
    backgroundColor: '#0F172A',
    padding: 30,
    marginBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 255, 0.1)',
  },
  // ADDED ICON STYLE
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 22,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  roleText: {
    color: '#00FFFF',
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: 'Poppins-Bold',
  },
  linksContainer: { paddingHorizontal: 12 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  logoutText: {
    marginLeft: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FF00FF',
    fontSize: 14,
    letterSpacing: 1,
  }
});