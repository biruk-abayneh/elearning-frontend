import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { getChapters } from '../api/contentService'; // We will add this function to our service

const ChapterScreen = ({ route, navigation }) => {
  // 1. Get the subjectId passed from the previous screen
  const { subjectId } = route.params; 
  
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    const fetchChapters = async () => {
      // 2. Fetch chapters specifically for this subject [cite: 43]
      const data = await getChapters(subjectId);
      setChapters(data);
    };
    fetchChapters();
  }, [subjectId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Chapter</Text>
      
      <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.button}
            
            // 3. When clicked, go to Quiz screen with the chapterId
            onPress={() => navigation.navigate('Quiz', { chapterId: item.id })}
          >
            <Text style={styles.buttonText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  button: { padding: 15, backgroundColor: '#34C759', borderRadius: 8, marginBottom: 10 },
  buttonText: { color: '#fff', fontSize: 18, textAlign: 'center' }
});

export default ChapterScreen;