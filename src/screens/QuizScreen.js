import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { quizQuestions } from '../data/quizData';
import { useAuth } from '../context/AuthContext';

export default function QuizScreen({ navigation }) {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  useEffect(() => {
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
  }, []);

  const handleAnswer = (selectedAnswer) => {
    const questionTime = Date.now() - questionStartTime;
    const isCorrect = selectedAnswer === quizQuestions[currentQuestion].correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setQuestionStartTime(Date.now());
    } else {
      // クイズ終了
      const finalTime = Date.now() - startTime;
      setTotalTime(finalTime);
      finishQuiz(finalTime);
    }
  };

  const finishQuiz = (time) => {
    const result = {
      user: user.name,
      score: score,
      time: time,
      timestamp: Date.now()
    };
    
    // ランキングに結果を保存（実際のアプリではサーバーに送信）
    saveResult(result);
    
    Alert.alert(
      'クイズ完了！',
      `スコア: ${score}/${quizQuestions.length}\n時間: ${Math.round(time/1000)}秒`,
      [
        { text: 'ランキングを見る', onPress: () => navigation.navigate('Ranking') }
      ]
    );
  };

  const saveResult = (result) => {
    // 実際のアプリではサーバーAPIを呼び出し
    console.log('Result saved:', result);
  };

  const question = quizQuestions[currentQuestion];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          問題 {currentQuestion + 1} / {quizQuestions.length}
        </Text>
        <Text style={styles.score}>スコア: {score}</Text>
      </View>

      <Text style={styles.question}>{question.question}</Text>

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleAnswer(index)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  questionNumber: {
    fontSize: 16,
    color: '#666',
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});