import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Import the Auth Context and Provider
import { AuthProvider, AuthContext } from './src/context/AuthContext';

// Import all the screens
import AuthScreen from './src/screens/AuthScreen';
import SubjectScreen from './src/screens/SubjectScreen';
import ChapterScreen from './src/screens/ChapterScreen';
import QuizScreen from './src/screens/QuizScreen';
import AdminScreen from './src/screens/AdminScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// 2. Custom Drawer Content to handle Logout and Conditional Admin Link
const CustomDrawerContent = (props) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 20, backgroundColor: '#f0f7ff' }}>
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
    </Drawer.Navigator>
  );
};

// 4. The Root Navigator switches between Login and the App
const RootNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

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
        <Stack.Screen name="Login" component={AuthScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}