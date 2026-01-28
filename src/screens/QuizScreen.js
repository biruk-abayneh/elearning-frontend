import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Alert, Dimensions, Image,
  TouchableOpacity, FlatList, ScrollView, ActivityIndicator,
  Platform, BackHandler, Vibration, StatusBar
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getQuestions, submitAttempt } from '../api/contentService';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- BRANDING ASSETS & THEME ---
// Based on your logo and brand document
const THEME = {
  // Extracted from your Logo
  primaryBlue: '#2B65EC',
  cyan: '#00FFFF',
  magenta: '#FF00FF',

  // Neutral & High Contrast [cite: 27, 30]
  background: '#FFFFFF',
  surface: '#F7FAFC',
  textMain: '#1A202C',
  textSub: '#718096',

  // Fonts 
  fontHeader: 'PlusJakartaSans-Bold', // Ensure these are linked in your project
  fontBody: 'Poppins-Regular',
  fontBodyBold: 'Poppins-Bold',
};

// --- 1. MEMOIZED QUESTION ITEM (Styled) ---
const QuestionItem = memo(({ item, index, currentIndex, isReviewMode, selectedOption, onSelect, showFeedback, isCorrect }) => {
  const isVisible = Math.abs(currentIndex - index) <= 1;

  if (!isVisible) {
    return <View style={{ width: SCREEN_WIDTH, height: 400 }} />; // Empty placeholder for performance
  }

  return (
    <View style={{ width: SCREEN_WIDTH }}>
      {/* "NO" Logo Watermark - subtle background branding */}
      <View style={styles.watermarkContainer}>
        <Image
          source={require('../../assets/no_icon.svg')}
          style={styles.watermark}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Question Text - Plus Jakarta Sans [cite: 34] */}
        <Text style={styles.questionText}>{item.question_text}</Text>

        {item.options.map((option, optIndex) => {
          const isSelected = selectedOption === option;

          // Dynamic Styles based on State
          let containerStyle = [styles.optionButton];
          let textStyle = [styles.optionText];

          if (isReviewMode) {
            if (option === item.correct_option) {
              containerStyle.push(styles.correctState);
            } else if (isSelected) {
              containerStyle.push(styles.wrongState);
            }
          } else if (showFeedback && isSelected) {
            containerStyle.push(isCorrect ? styles.correctState : styles.wrongState);
          } else if (isSelected) {
            containerStyle.push(styles.selectedState);
          }

          return (
            <TouchableOpacity
              key={optIndex}
              disabled={isReviewMode || showFeedback}
              style={containerStyle}
              onPress={() => onSelect(option)}
              activeOpacity={0.8}
            >
              <Text style={textStyle}>{option}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Explanation Block (Only visible in review/feedback) */}
        {(showFeedback || isReviewMode) && item.explanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>The Nerd Breakdown:</Text>
            <Text style={styles.explanationText}>{item.explanation}</Text>
          </View>
        )}

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

  // Logic remains identical to preserve functionality
  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

  const triggerFinishResults = useCallback(() => {
    setTimerStarted(false);
    // Tone: Direct, no fluff [cite: 15]
    Alert.alert("Wrap it up?", `You scored ${sessionScore}/${questions.length}.`, [
      { text: "Review", onPress: () => setIsReviewMode(true) },
      { text: "I'm Done", style: "destructive", onPress: () => navigation.popToTop() }
    ]);
  }, [sessionScore, questions.length, navigation]);

  const handleFinishEarly = () => {
    Alert.alert("Bail Out?", "Submitting now will finalize your score.", [
      { text: "Keep Going", style: "cancel" },
      { text: "Submit", style: "destructive", onPress: triggerFinishResults }
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!isReviewMode) {
          Alert.alert("Hold up!", "You'll lose your progress.", [
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

  if (questions.length === 0) return <ActivityIndicator size="large" color={THEME.cyan} style={{ flex: 1 }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: THEME.background }}>
      <StatusBar barStyle="dark-content" />

      {/* 1. BRANDED HEADER */}
      <View style={styles.header}>
        {/* Left Side: Logo or Back */}
        <View style={{ width: 80 }}>
          {!isReviewMode && (
            <TouchableOpacity onPress={handleFinishEarly} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Finish</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center: Main Logo */}
        <Image
          source={require('../../assets/nerd_logo_text.svg')}
          style={styles.headerLogo}
          resizeMode="contain"
        />

        {/* Right Side: Timer */}
        <View style={{ width: 80, alignItems: 'flex-end' }}>
          {!isReviewMode && (
            <View style={[styles.timerBadge, timeLeft < 60 && styles.timerUrgent]}>
              <Text style={[styles.timerText, timeLeft < 60 && { color: '#FFF' }]}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. HIGH CONTRAST PROGRESS BAR  */}
      <View style={styles.progressBarContainer}>
        {/* Cyan fill matches the logo's highlight */}
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

      {/* 3. ACTION BAR */}
      <View style={styles.bottomBar}>
        {!showFeedback && !isReviewMode ? (
          <TouchableOpacity
            // Energetic: Blue button, high contrast [cite: 12, 30]
            style={[styles.mainBtn, !selectedOption && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={!selectedOption}
          >
            <Text style={styles.mainBtnText}>LOCK IT IN</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: isReviewMode ? THEME.primaryBlue : (isCorrect ? THEME.primaryBlue : THEME.magenta) }]}
            onPress={handleNext}
          >
            <Text style={styles.mainBtnText}>
              {currentIndex < questions.length - 1 ? "NEXT UP" : "SEE RESULTS"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: THEME.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ed0b0b',
    borderRadius: 8,
    alignItems: 'center',
  },
  smallBtnText: {
    fontFamily: THEME.fontBodyBold,
    fontWeight: '800',
    fontSize: 15,
    color: '#1A202C'
  },
  timerBadge: {
    backgroundColor: THEME.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  timerUrgent: {
    backgroundColor: THEME.magenta, // Urgent logic uses branding
    borderColor: THEME.magenta
  },
  timerText: {
    fontFamily: THEME.fontHeader,
    fontSize: 14,
    color: THEME.textMain
  },

  // PROGRESS
  progressBarContainer: { height: 4, width: '100%', backgroundColor: '#E2E8F0' },
  progressBarFill: { height: '100%', backgroundColor: THEME.cyan }, // Bright accent 

  // CONTENT
  scrollContent: { padding: 24, paddingBottom: 100 },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.03, // Very subtle background logo
    zIndex: -1,
  },
  watermark: {
    width: 300,
    height: 300,
    transform: [{ rotate: '-15deg' }]
  },
  questionText: {
    fontFamily: THEME.fontHeader, // Plus Jakarta Sans [cite: 34]
    fontSize: 22,
    marginBottom: 30,
    lineHeight: 32,
    color: THEME.textMain
  },

  // OPTIONS - Rounded & High Contrast 
  optionButton: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    backgroundColor: '#FFF',
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  optionText: {
    fontFamily: THEME.fontBody, // Poppins [cite: 35]
    fontSize: 16,
    color: THEME.textMain
  },

  // STATES
  selectedState: {
    borderColor: THEME.primaryBlue,
    backgroundColor: '#F0F7FF'
  },
  correctState: {
    borderColor: '#10B981', // Success Green
    backgroundColor: '#D1FAE5'
  },
  wrongState: {
    borderColor: THEME.magenta, // Brand error color
    backgroundColor: '#FFF5F5'
  },

  // EXPLANATION
  explanationBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: THEME.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: THEME.cyan
  },
  explanationTitle: {
    fontFamily: THEME.fontHeader,
    fontSize: 14,
    marginBottom: 5
  },
  explanationText: {
    fontFamily: THEME.fontBody,
    color: THEME.textSub
  },

  // BOTTOM BAR
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20
  },
  mainBtn: {
    backgroundColor: THEME.primaryBlue,
    padding: 18,
    borderRadius: 16, // Rounded components [cite: 29]
    alignItems: 'center',
    shadowColor: THEME.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  disabledBtn: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0
  },
  mainBtnText: {
    color: '#FFF',
    fontFamily: THEME.fontHeader,
    fontSize: 16,
    letterSpacing: 1
  }
});

export default QuizScreen;