import React, { useLayoutEffect, useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getSubjects } from '../api/contentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext'; // Adjust path if needed

const SubjectScreen = ({ route, navigation }) => {
  const [subjects, setSubjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const { logout } = useContext(AuthContext);
  // 1. Load user data from storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('user');
        if (jsonValue != null) {
          setCurrentUser(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error("Error loading user", e);
      }
    };
    loadUser();
  }, []);

  // 2. COMBINED Header Logic
  useLayoutEffect(() => {
    navigation.setOptions({
      // LEFT SIDE: Profile and Logout
      /*
      headerLeft: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 15 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: 15 }}>
            <Text style={{ color: '#007AFF' }}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={{ color: '#FF3B30' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      ),
      */
      // RIGHT SIDE: Admin button (if applicable)
      headerRight: () =>
        currentUser?.role === 'admin' ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('Admin')}
            style={{ marginRight: 15 }}
          >
            <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Admin</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, currentUser]); // Important dependencies

  const handleLogout = async () => {
    try {
      await logout();
      // DO NOT use navigation.replace here. 
      // The RootNavigator in App.js will see the user is gone and show Login.
    } catch (e) {
      console.error("Logout failed", e);
    }
  };
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSubjects();
    });
    return unsubscribe;
  }, [navigation]);

  const loadSubjects = async () => {
    const data = await getSubjects();
    setSubjects(data);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Chapters', { subjectId: item.id, subjectName: item.name })}
          >
            <Text style={styles.title}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  item: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 18, fontWeight: '500' }
});

export default SubjectScreen;