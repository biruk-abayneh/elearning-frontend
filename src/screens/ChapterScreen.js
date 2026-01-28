import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getChapters } from '../api/contentService';

// --- BRAND CONSTANTS ---
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
  fontBodyBold: 'Poppins-Bold',
};

const ChapterScreen = ({ route, navigation }) => {
  const { subjectId, subjectName } = route.params;
  const [chapters, setChapters] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchChapters = async () => {
      const data = await getChapters(subjectId);
      setChapters(data);
    };
    fetchChapters();
  }, [subjectId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* 1. BRANDED HEADER WITH BACK BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back-sharp" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.subjectLabel}>{subjectName || 'SUBJECT'}</Text>
          <Text style={styles.title}>Pick a topic.</Text>
        </View>
      </View>

      {/* 2. CHAPTER LIST */}
      <FlatList
        data={chapters}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.chapterCard,
              { borderColor: index % 2 === 0 ? THEME.magenta : THEME.primaryBlue }
            ]}
            onPress={() => navigation.navigate('Quiz', { chapterId: item.id })}
          >
            <View style={styles.cardMain}>
              <View style={styles.indexCircle}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <Text style={styles.chapterName}>{item.name}</Text>
            </View>
            <Ionicons name="flash-sharp" size={20} color={THEME.cyan} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.loadingText}>Scouring the database...</Text>
        }
      />

      {/* Background Watermark */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backBtn: {
    width: 45,
    height: 45,
    backgroundColor: THEME.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitleContainer: { flex: 1 },
  subjectLabel: {
    fontFamily: THEME.fontBodyBold,
    fontSize: 12,
    color: THEME.primaryBlue,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: THEME.fontHeader,
    fontSize: 28,
    color: THEME.textMain,
    marginTop: -2,
  },
  listContent: { paddingHorizontal: 24, paddingTop: 10 },
  chapterCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // High-energy shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  indexCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  indexText: {
    fontFamily: THEME.fontHeader,
    fontSize: 12,
    color: THEME.textSub,
  },
  chapterName: {
    fontFamily: THEME.fontHeader,
    fontSize: 18,
    color: THEME.textMain,
    flex: 1,
  },
  loadingText: {
    fontFamily: THEME.fontBody,
    color: THEME.textSub,
    textAlign: 'center',
    marginTop: 50,
  },
  bgWatermark: {
    position: 'absolute',
    top: '40%',
    left: -60,
    width: 300,
    height: 300,
    opacity: 0.02,
    zIndex: -1,
    transform: [{ rotate: '45deg' }]
  },
});

export default ChapterScreen;