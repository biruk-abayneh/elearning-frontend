import React, { useLayoutEffect, useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, StatusBar } from 'react-native';
// 1. IMPORT THESE TWO
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSubjects } from '../api/contentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const THEME = {
  primaryBlue: '#2B65EC',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  background: '#FFFFFF',
  surface: '#F7FAFC',
  textMain: '#1A202C',
  textSub: '#718096',
  fontHeader: 'PlusJakartaSans-Bold',
  fontBody: 'Poppins-Regular',
};

const SubjectScreen = ({ navigation }) => {
  const [subjects, setSubjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const { logout } = useContext(AuthContext);

  // 2. GET INSETS
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('user');
        if (jsonValue != null) setCurrentUser(JSON.parse(jsonValue));
      } catch (e) { console.error(e); }
    };
    loadUser();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadSubjects = async () => {
    const data = await getSubjects();
    setSubjects(data);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadSubjects);
    return unsubscribe;
  }, [navigation]);

  return (
    // 3. APPLY INSET TOP PADDING HERE
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()} // THIS OPENS THE SIDE MENU
          style={styles.menuBtn}
        >
          <Ionicons name="menu-outline" size={30} color={THEME.textMain} />
        </TouchableOpacity>
        <View>
          <Text style={styles.welcomeText}>Hey, Nerd.</Text>
          <Text style={styles.subWelcome}>Choose your weapon:</Text>
        </View>
        <View style={styles.headerIcons}>
          {currentUser?.role === 'admin' && (
            <TouchableOpacity onPress={() => navigation.navigate('Admin')} style={styles.iconBtn}>
              <MaterialCommunityIcons name="shield-check" size={24} color={THEME.primaryBlue} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => logout()} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={24} color={THEME.magenta} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={subjects}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 } // 4. USE INSET BOTTOM HERE
        ]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.subjectCard,
              { borderColor: index % 2 === 0 ? THEME.primaryBlue : THEME.cyan }
            ]}
            onPress={() => navigation.navigate('Chapters', { subjectId: item.id, subjectName: item.name })}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.subjectTitle}>{item.name}</Text>
              <Text style={styles.subjectMeta}>Tap to explore chapters</Text>
            </View>
            <View style={[
              styles.arrowCircle,
              { backgroundColor: index % 2 === 0 ? THEME.primaryBlue : THEME.cyan }
            ]}>
              <Ionicons name="chevron-forward" size={20} color={index % 2 === 0 ? "#FFF" : THEME.textMain} />
            </View>
          </TouchableOpacity>
        )}
      />

      <Image
        source={require('../../assets/no_icon.svg')}
        style={styles.bgWatermark}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  welcomeText: { fontFamily: THEME.fontHeader, fontSize: 28, color: THEME.textMain },
  subWelcome: { fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSub, marginTop: -4 },
  headerIcons: { flexDirection: 'row' },
  iconBtn: {
    width: 45, height: 45, backgroundColor: THEME.surface,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    marginLeft: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  listContent: { paddingHorizontal: 24 },
  subjectCard: {
    backgroundColor: '#FFF', borderRadius: 20, borderWidth: 2,
    padding: 20, marginBottom: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  subjectTitle: { fontFamily: THEME.fontHeader, fontSize: 20, color: THEME.textMain },
  subjectMeta: { fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSub },
  arrowCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  bgWatermark: {
    position: 'absolute', bottom: -50, right: -50,
    width: 250, height: 250, opacity: 0.03, zIndex: -1,
    transform: [{ rotate: '-15deg' }]
  },
  menuBtn: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1, // Pushes title to fill space
  },
});

export default SubjectScreen;