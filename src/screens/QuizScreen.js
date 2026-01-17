import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { getQuestions, submitAttempt } from '../api/contentService';

const QuizScreen = ({ route, navigation }) => {
  const { chapterId } = route.params;
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [sessionScore, setSessionScore] = useState(0); // Tracks correct answers in this run
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(!isReviewMode);

  useEffect(() => {
    const fetchQuestions = async () => {
      const data = await getQuestions(chapterId);
      setQuestions(data);
    };
    fetchQuestions();
  }, [chapterId]);


  useEffect(() => {
    if (questions && questions.length > 0 && !timerStarted && !isReviewMode) {
      setTimeLeft(questions.length * 90);
      setTimerStarted(true);
    }
  }, [questions]);

  // 3. Only run the countdown if timerStarted is true
  useEffect(() => {
    let timer;
    if (timerStarted && timeLeft > 0 && !isReviewMode) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerStarted && timeLeft === 0 && !isReviewMode) {
      handleFinishQuiz();
    }
    return () => clearInterval(timer);
  }, [timerStarted, timeLeft, isReviewMode]);

  // Helper to format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFinishQuiz = () => {
    setIsTimerActive(false);
    // Trigger your existing logic for finishing the quiz/showing final results
    Alert.alert("Quiz Finished", "Time is up or you have chose to finish.");
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowFeedback(false);
      setSelectedOption(null);
      setShowExplanation(false); // Reset explanation toggle for next question
    } else {
      const totalQuestions = questions.length;
      const percentage = Math.round((sessionScore / totalQuestions) * 100);

      Alert.alert(
        "Exam Finished! 🏆",
        `Your Score: ${sessionScore} / ${totalQuestions}\nAccuracy: ${percentage}%`,
        [
          {
            text: "Review Answers",
            onPress: () => {
              setIsReviewMode(true);
              setCurrentIndex(0); // Go back to start of quiz for review
            }
          },
          {
            text: "Finish",
            onPress: () => navigation.navigate('Subjects')
          }
        ]
      );
    }
  };


  const handleSubmit = async () => {
    const currentQuestion = questions[currentIndex];

    // Call our backend to check the answer
    const result = await submitAttempt({
      questionId: currentQuestion.id,
      selectedOption: selectedOption,
      chapterId: chapterId
    });

    if (result.correct) {
      setSessionScore(prev => prev + 1); // Only increment if the backend says it's right
    }

    setIsCorrect(result.correct);
    setExplanation(result.explanation);
    setShowFeedback(true);
  };

  if (questions.length === 0) return <Text>Loading...</Text>;

  const currentQuestion = questions[currentIndex];

  return (
    <ScrollView style={styles.container}>
      {/* 1. Timer and Finish Now Header - Keep this! */}
      {!isReviewMode && timerStarted && (
        <View style={styles.timerHeader}>
          <Text style={[styles.timerText, timeLeft < 60 && { color: 'red' }]}>
            Time Remaining: {formatTime(timeLeft)}
          </Text>
          <TouchableOpacity
            style={styles.finishNowBtn}
            onPress={() => {
              Alert.alert(
                "Finish Quiz",
                "Are you sure you want to end the quiz now?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Finish",
                    onPress: () => navigation.goBack() // Or your finish logic
                  }
                ]
              );
            }}
          >
            <Text style={styles.finishNowText}>Finish Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Main Question Content - Only one copy! */}
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreText}>
          {isReviewMode ? "Reviewing Results" : `Current Score: ${sessionScore}`}
        </Text>
        <Text style={styles.progressText}>Question: {currentIndex + 1}/{questions.length}</Text>
      </View>

      <Text style={styles.questionText}>{currentQuestion.question_text}</Text>

      {currentQuestion.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selectedOption === option && styles.selectedOption,
            isReviewMode && option === currentQuestion.correct_option && { borderColor: 'green', borderWidth: 2 }
          ]}
          onPress={() => !showFeedback && !isReviewMode && setSelectedOption(option)}
        >
          <Text>{option}</Text>
        </TouchableOpacity>
      ))}

      {/* --- REVIEW MODE LOGIC --- */}
      {isReviewMode ? (
        <View style={styles.reviewContainer}>
          <TouchableOpacity
            style={styles.explanationBtn}
            onPress={() => setShowExplanation(!showExplanation)}
          >
            <Text style={styles.btnText}>
              {showExplanation ? "Hide Explanation" : "Show Explanation"}
            </Text>
          </TouchableOpacity>

          {showExplanation && (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.btnText}>
              {currentIndex < questions.length - 1 ? "Next Reviewed Question" : "Exit Review"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* --- REGULAR EXAM MODE --- */
        !showFeedback ? (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.btnText}>Submit Answer</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.feedbackBox}>
            <Text style={isCorrect ? styles.correctText : styles.wrongText}>
              {isCorrect ? "Correct!" : "Incorrect"}
            </Text>
            <Text style={styles.explanationText}>{explanation}</Text>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.btnText}>
                {currentIndex < questions.length - 1 ? "Next Question" : "Finish Chapter"}
              </Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  questionText: { fontSize: 18, marginBottom: 20, fontWeight: '600' },
  optionButton: { padding: 15, borderWidth: 1, borderColor: '#ccc', marginBottom: 10, borderRadius: 5 },
  selectedOption: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' },
  submitBtn: { backgroundColor: '#2196f3', padding: 15, borderRadius: 5, marginTop: 20 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  feedbackBox: { marginTop: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 5 },
  correctText: { color: 'green', fontWeight: 'bold', fontSize: 18 },
  wrongText: { color: 'red', fontWeight: 'bold', fontSize: 18 },
  explanationText: { marginTop: 10, fontStyle: 'italic' },
  nextBtn: { backgroundColor: '#4caf50', padding: 15, borderRadius: 5, marginTop: 10 },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 15,
  },
  scoreText: {
    fontWeight: 'bold',
    color: '#2196f3',
  },
  progressText: {
    color: '#666',
  },
  explanationBtn: {
    backgroundColor: '#607d8b',
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
  },
  explanationBox: {
    padding: 15,
    backgroundColor: '#eceff1',
    borderRadius: 5,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#607d8b',
  },
  reviewContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  finishNowBtn: {
    backgroundColor: '#ff5252',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  finishNowText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default QuizScreen;