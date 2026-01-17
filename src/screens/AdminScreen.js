import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { getSubjects, getChapters, createSubject, createChapter, createQuestion, uploadBulkQuestions } from '../api/contentService';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const AdminScreen = () => {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);

  // States for the Question Form
  const [selectedSub, setSelectedSub] = useState('');
  const [selectedChap, setSelectedChap] = useState('');
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '', '']); // For A, B, C, D, E
  const [correctOpt, setCorrectOpt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [newSubjectName, setNewSubjectName] = useState(''); // Added this
  const [newChapterName, setNewChapterName] = useState(''); // Added this
  const [selectedSubForChapter, setSelectedSubForChapter] = useState(''); // Added this
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => { loadSubjects(); }, []);

  // When a subject is selected, fetch its chapters
  useEffect(() => {
    if (selectedSub) {
      getChapters(selectedSub).then(setChapters);
    } else {
      setChapters([]);
    }
  }, [selectedSub]);

  const loadSubjects = async () => {
    const data = await getSubjects();
    setSubjects(data);
  };


  const handleJsonUpload = async () => {
    if (!selectedChap) {
      Alert.alert("Error", "Please select a Chapter first");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });

      if (!result.canceled) {
        setIsUploading(true);
        setUploadProgress(0.2); // Step 1: File selected

        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        setUploadProgress(0.5); // Step 2: File read

        const jsonData = JSON.parse(fileContent);
        setUploadProgress(0.7); // Step 3: Data parsed

        // Send to your backend
        await uploadBulkQuestions(selectedChap, jsonData);

        setUploadProgress(1.0); // Step 4: Complete
        Alert.alert("Success", "Bulk questions uploaded successfully!");
      }
    } catch (error) {
      Alert.alert("Upload Error", error.message);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000); // Hide progress bar after 1 second
    }
  };
  const handleAddQuestion = async () => {
    // If you used index as value, correctOpt is now "0", "1", etc.
    const selectedCorrectText = options[parseInt(correctOpt)];

    if (!selectedChap || !qText || !correctOpt || options.some(opt => opt.trim() === '')) {
      Alert.alert("Error", "Please fill all question fields and options A-E");
      return;
    }

    const questionData = {
      chapter_id: selectedChap,
      question_text: qText,
      options: options,
      correct_answer: selectedCorrectText, // Send the actual text to the DB
      explanation: explanation
    };

    try {
      await createQuestion(questionData);
      Alert.alert("Success", "Question added to database!");
      // Reset Form
      setQText('');
      setOptions(['', '', '', '', '']);
      setExplanation('');
    } catch (err) {
      Alert.alert("Error", "Could not save question");
    }
  };

  const updateOption = (text, index) => {
    setOptions(prevOptions => {
      const newOptions = [...prevOptions]; // Create a copy of the current array
      newOptions[index] = text;           // Update the specific index
      return newOptions;                  // Return the new array to state
    });
  };



  const handleSubjectSubmit = async () => {
    if (!newSubjectName) {
      Alert.alert("Error", "Please enter a subject name");
      return;
    }
    try {
      const response = await createSubject({ name: newSubjectName });
      if (response.error) {
        // This will show you the ACTUAL reason (e.g., "Unauthorized" or "Table not found")
        Alert.alert("Error", response.error);
      } else {
        setNewSubjectName('');
        loadSubjects();
        Alert.alert("Success", "Subject created!");
      }
    } catch (error) {
      Alert.alert("Network Error", "Check your internet or backend status");
    }
  };

  const handleChapterSubmit = async () => {
    if (!newChapterName || !selectedSubForChapter) {
      Alert.alert("Error", "Please select a subject and enter a chapter name");
      return;
    }
    try {
      await createChapter({
        subject_id: selectedSubForChapter,
        name: newChapterName
      });
      setNewChapterName(''); // Clear input
      Alert.alert("Success", "Chapter created!");
    } catch (error) {
      Alert.alert("Error", "Failed to create chapter");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* SECTION 1: ADD SUBJECT */}
      <View style={styles.section}>
        <Text style={styles.label}>1. Create New Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Mathematics"
          value={newSubjectName}
          onChangeText={setNewSubjectName}
        />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubjectSubmit}>
          <Text style={styles.btnText}>Save Subject</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 2: ADD CHAPTER */}
      <View style={styles.section}>
        <Text style={styles.label}>2. Create New Chapter</Text>
        <Picker
          selectedValue={selectedSubForChapter}
          onValueChange={(val) => setSelectedSubForChapter(val)}
        >
          <Picker.Item label="Select Parent Subject..." value="" />
          {subjects.map(s => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
        </Picker>
        <TextInput
          style={styles.input}
          placeholder="e.g., Algebra 101"
          value={newChapterName}
          onChangeText={setNewChapterName}
        />
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#2196f3' }]} onPress={handleChapterSubmit}>
          <Text style={styles.btnText}>Save Chapter</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Admin: Question Creator</Text>

      <View style={styles.section}>
        <Text style={styles.label}>1. Select Location</Text>
        <Picker selectedValue={selectedSub} onValueChange={setSelectedSub}>
          <Picker.Item label="Select Subject..." value="" />
          {subjects.map(s => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
        </Picker>

        <Picker selectedValue={selectedChap} onValueChange={setSelectedChap} enabled={chapters.length > 0}>
          <Picker.Item label="Select Chapter..." value="" />
          {chapters.map(c => <Picker.Item key={c.id} label={c.name} value={c.id} />)}
        </Picker>

        <Text style={styles.label}>2. Question Text</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline value={qText}
          onChangeText={setQText}
          placeholder="Enter the question here..."
        />

        <Text style={styles.label}>3. Options (A-E)</Text>
        {['A', 'B', 'C', 'D', 'E'].map((label, index) => (
          <TextInput
            key={label}
            style={styles.optionInput}
            placeholder={`Option ${label}`}
            value={options[index]}
            onChangeText={(text) => updateOption(text, index)}
          />
        ))}

        <Text style={styles.label}>4. Correct Option</Text>
        <Picker
          selectedValue={correctOpt}
          onValueChange={(val) => setCorrectOpt(val)}
        >
          <Picker.Item label="Select Correct Answer..." value="" />
          {['A', 'B', 'C', 'D', 'E'].map((letter, i) => (
            <Picker.Item
              key={letter}
              label={`${letter}: ${options[i]}`}
              value={i.toString()} // Use the index as a unique string identifier
            />
          ))}
        </Picker>

        <Text style={styles.label}>5. Explanation</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          multiline value={explanation}
          onChangeText={setExplanation}
          placeholder="Why is this the correct answer?"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleAddQuestion}>
          <Text style={styles.btnText}>Save Question to Database</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Bulk Upload (JSON with Answers)</Text>

        {isUploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Uploading... {Math.round(uploadProgress * 100)}%
            </Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${uploadProgress * 100}%` }]} />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: '#673ab7' }]}
          onPress={handleJsonUpload}
          disabled={isUploading}
        >
          <Text style={styles.btnText}>
            {isUploading ? "Processing..." : "Select Nursing Exam JSON"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  section: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 30 },
  label: { fontWeight: 'bold', marginTop: 15, marginBottom: 5, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, backgroundColor: '#fff' },
  optionInput: { borderWidth: 1, borderColor: '#eee', borderRadius: 5, padding: 8, backgroundColor: '#fff', marginBottom: 5 },
  submitBtn: { backgroundColor: '#4caf50', padding: 15, borderRadius: 8, marginTop: 20 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  progressContainer: { marginVertical: 10 },
  progressText: { fontSize: 12, color: '#666', marginBottom: 5, textAlign: 'center' },
  progressBarBackground: { height: 10, backgroundColor: '#eee', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4caf50' },
});

export default AdminScreen;