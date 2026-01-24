import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Alert, Dimensions,
  TouchableOpacity, FlatList, ScrollView, ActivityIndicator,
  Platform, BackHandler, Vibration
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getQuestions, submitAttempt } from '../api/contentService';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- 1. LIGHTWEIGHT QUESTION ITEM ---
const QuestionItem = memo(({ item, index, currentIndex, isReviewMode, selectedOption, onSelect, showFeedback, isCorrect }) => {
  const isVisible = Math.abs(currentIndex - index) <= 1;

  if (!isVisible) {
    return <View style={{ width: SCREEN_WIDTH, height: 400 }} />;
  }

  return (
    <View style={{ width: SCREEN_WIDTH }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.questionText}>{item.question_text}</Text>

        {item.options.map((option, optIndex) => {
          const isSelected = selectedOption === option;

          let dynamicStyle = {};
          if (isReviewMode) {
            if (option === item.correct_option) dynamicStyle = styles.correctBorder;
            else if (isSelected) dynamicStyle = styles.wrongBorder;
          } else if (showFeedback && isSelected) {
            dynamicStyle = isCorrect ? styles.correctBorder : styles.wrongBorder;
          } else if (isSelected) {
            dynamicStyle = styles.selectedOption;
          }

          return (
            <TouchableOpacity
              key={optIndex}
              disabled={isReviewMode || showFeedback}
              style={[styles.optionButton, dynamicStyle]}
              onPress={() => onSelect(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}, (prev, next) => {
  return (
    prev.currentIndex === next.currentIndex &&
    prev.selectedOption === next.selectedOption &&
    prev.showFeedback === next.showFeedback &&
    prev.isReviewMode === next.isReviewMode
  );
});

const QuizScreen = ({ route, navigation }) => {
  const { chapterId } = route.params;
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  const flatListRef = useRef(null);

  // Calculate Progress percentage
  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

  const triggerFinishResults = useCallback(() => {
    setTimerStarted(false);
    Alert.alert("Quiz Finished", `Final Score: ${sessionScore}/${questions.length}`, [
      { text: "Review Answers", onPress: () => setIsReviewMode(true) },
      { text: "Exit", onPress: () => navigation.popToTop() }
    ]);
  }, [sessionScore, questions.length, navigation]);

  const handleFinishEarly = () => {
    Alert.alert("Finish Now?", "Are you sure you want to end the quiz and see your current score?", [
      { text: "Cancel", style: "cancel" },
      { text: "Finish", style: "destructive", onPress: triggerFinishResults }
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!isReviewMode) {
          Alert.alert("Exit?", "Progress will be lost.", [
            { text: "Stay" }, { text: "Exit", onPress: () => navigation.popToTop() }
          ]);
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [isReviewMode, navigation])
  );

  useEffect(() => {
    getQuestions(chapterId).then(data => setQuestions(data.map(q => ({ ...q, id: q.id.toString() }))));
  }, [chapterId]);

  useEffect(() => {
    if (questions.length > 0 && !timerStarted) {
      setTimeLeft(questions.length * 90);
      setTimerStarted(true);
    }
  }, [questions, timerStarted]);

  useEffect(() => {
    let timer;
    if (timerStarted && timeLeft > 0 && !isReviewMode) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && timerStarted && !isReviewMode) {
      triggerFinishResults();
    }
    return () => clearInterval(timer);
  }, [timerStarted, timeLeft, isReviewMode, triggerFinishResults]);

  const onScrollEnd = useCallback((e) => {
    const pageNum = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (pageNum !== currentIndex) {
      setCurrentIndex(pageNum);
      setSelectedOption(questions[pageNum]?.userSelection || null);
      setShowFeedback(questions[pageNum]?.userSelection ? true : false);
    }
  }, [currentIndex, questions]);

  const handleSubmit = async () => {
    const result = await submitAttempt({
      questionId: questions[currentIndex].id,
      selectedOption,
      chapterId
    });

    if (result.correct) {
      setSessionScore(s => s + 1);
    } else {
      Vibration.vibrate(100);
    }

    const updated = [...questions];
    updated[currentIndex] = {
      ...updated[currentIndex],
      userSelection: selectedOption,
      correct_option: result.correct_option,
      explanation: result.explanation
    };

    setQuestions(updated);
    setIsCorrect(result.correct);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      triggerFinishResults();
    }
  };

  if (questions.length === 0) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 1. HEADER WITH FINISH BUTTON AND TIMER */}
      <View style={styles.header}>
        {!isReviewMode ? (
          <TouchableOpacity onPress={handleFinishEarly} style={styles.finishBtn}>
            <Text style={styles.finishBtnText}>Finish Now</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.reviewTitle}>Review Mode</Text>
        )}

        {!isReviewMode && (
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, timeLeft < 60 && { color: '#f44336' }]}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </Text>
          </View>
        )}
      </View>

      {/* 2. PROGRESS BAR */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <FlatList
        ref={flatListRef}
        data={questions}
        horizontal
        pagingEnabled
        scrollEnabled={isReviewMode}
        onMomentumScrollEnd={onScrollEnd}
        keyExtractor={item => item.id}
        getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
        initialNumToRender={1}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item, index }) => (
          <QuestionItem
            item={item} index={index} currentIndex={currentIndex}
            isReviewMode={isReviewMode} selectedOption={selectedOption}
            onSelect={setSelectedOption} showFeedback={showFeedback} isCorrect={isCorrect}
          />
        )}
      />

      <View style={styles.bottomBar}>
        {!showFeedback && !isReviewMode ? (
          <TouchableOpacity
            style={[styles.btn, !selectedOption && { backgroundColor: '#ccc' }]}
            onPress={handleSubmit}
            disabled={!selectedOption}
          >
            <Text style={styles.btnText}>Submit Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: isReviewMode ? '#2196f3' : (isCorrect ? '#4caf50' : '#f44336') }]}
            onPress={handleNext}
          >
            <Text style={styles.btnText}>
              {currentIndex < questions.length - 1 ? "Continue" : "View Final Results"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: '#fff'
  },
  finishBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#feb2b2',
  },
  finishBtnText: { color: '#c53030', fontWeight: 'bold', fontSize: 13 },
  reviewTitle: { fontSize: 18, fontWeight: 'bold', color: '#4a5568' },
  timerText: { fontSize: 17, fontWeight: 'bold', color: '#444', fontVariant: ['tabular-nums'] },
  progressBarContainer: { height: 6, width: '100%', backgroundColor: '#edf2f7' },
  progressBarFill: { height: '100%', backgroundColor: '#3182ce' },
  scrollContent: { padding: 20 },
  questionText: { fontSize: 19, fontWeight: '600', marginBottom: 20, lineHeight: 26, color: '#2d3748', fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'poppins' },
  optionButton: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, backgroundColor: '#fff' },
  optionText: { fontSize: 16, color: '#4a5568' },
  selectedOption: { backgroundColor: '#ebf8ff', borderColor: '#3182ce' },
  correctBorder: { borderColor: '#48bb78', borderWidth: 2, backgroundColor: '#f0fff4' },
  wrongBorder: { borderColor: '#f56565', borderWidth: 2, backgroundColor: '#fff5f5' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#edf2f7',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20
  },
  btn: { backgroundColor: '#3182ce', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default QuizScreen;