import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useGame } from '../context/GameContext';

export default function SyncQuizScreen({ user, onFinish }) {
  const {
    isHost,
    currentQuestion,
    timeLeft,
    showResults,
    currentQuestionResult,
    players,
    isMainQuiz,
    gameState,
    submitAnswer,
    nextQuestion,
    currentQuestionData,
    countdown,
    endExplanation
  } = useGame();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  // 問題が変わったときの初期化
  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    setQuestionStartTime(Date.now());
    console.log('問題変更:', currentQuestion, 'isMainQuiz:', isMainQuiz);
  }, [currentQuestion, isMainQuiz]);

  // ゲーム終了時の処理
  useEffect(() => {
    if (gameState === 'finished') {
      setTimeout(() => {
        onFinish();
      }, 3000);
    }
  }, [gameState, onFinish]);

  // 自動進行は削除（ホストが解説終了ボタンを押すまで待機）

  const handleAnswer = (answerIndex) => {
    if (hasAnswered || timeLeft <= 0) return;

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    // 回答時間を計算（ミリ秒）
    const answerTime = questionStartTime ? Date.now() - questionStartTime : 0;
    
    // サーバーに回答を送信
    submitAnswer(answerIndex, answerTime);
    
    console.log('回答送信:', answerIndex, '問題:', currentQuestion, '回答時間:', answerTime, 'ms');
  };

  const getAnswerButtonStyle = (optionIndex) => {
    // 結果表示時
    if (showResults && currentQuestionResult) {
      const correctAnswer = currentQuestionResult.correctAnswer;

      if (optionIndex === correctAnswer) {
        return [styles.optionButton, styles.correctAnswer];
      }
      if (optionIndex === selectedAnswer && selectedAnswer !== correctAnswer) {
        return [styles.optionButton, styles.wrongAnswer];
      }
      return [styles.optionButton, styles.disabledOption];
    }

    // 回答済みだが結果表示前
    if (hasAnswered && optionIndex === selectedAnswer) {
      return [styles.optionButton, styles.selectedAnswer];
    }

    // 回答済みだが選択していない選択肢
    if (hasAnswered) {
      return [styles.optionButton, styles.disabledOption];
    }

    // 未回答
    return styles.optionButton;
  };

  const getAnswerButtonTextStyle = (optionIndex) => {
    if (showResults && currentQuestionResult) {
      const correctAnswer = currentQuestionResult.correctAnswer;

      if (optionIndex === correctAnswer || 
          (optionIndex === selectedAnswer && selectedAnswer !== correctAnswer)) {
        return styles.selectedOptionText;
      }
    }

    if (hasAnswered && optionIndex === selectedAnswer) {
      return styles.selectedOptionText;
    }

    return styles.optionText;
  };

  if (gameState === 'finished') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>ゲーム終了！</Text>
        <Text style={styles.subtitle}>
          お疲れさまでした！{'\n'}
          結果画面に移動します...
        </Text>
      </View>
    );
  }

  // サーバーから受信した問題データを使用
  if (!currentQuestionData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>問題を読み込み中...</Text>
      </View>
    );
  }

  const question = currentQuestionData;
  const totalQuestions = isMainQuiz ? 10 : 5;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          {isMainQuiz ? '本番' : 'サンプル'}問題 {currentQuestion + 1} / {totalQuestions}
        </Text>
        <View style={styles.timerContainer}>
          <View style={[
            styles.timerCircle,
            (isMainQuiz ? timeLeft <= 5 : timeLeft <= 3) && styles.timerCircleWarning
          ]}>
            <Text style={[
              styles.timer,
              (isMainQuiz ? timeLeft <= 5 : timeLeft <= 3) && styles.timerWarning
            ]}>
              {timeLeft}
            </Text>
          </View>
        </View>
        <Text style={styles.playersCount}>
          {players.length}人参加中
        </Text>
      </View>

      <Text style={styles.question}>{question.question}</Text>

      {showResults && currentQuestionResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            {selectedAnswer === currentQuestionResult.correctAnswer ? '✅ 正解！' : selectedAnswer !== null ? '❌ 不正解' : '⏰ 時間切れ'}
          </Text>
          <Text style={styles.correctAnswerText}>
            正解: {currentQuestionResult.correctOption}
          </Text>
          {currentQuestionResult.correctCount !== undefined && (
            <Text style={styles.correctCountText}>
              🎯 正解者: {currentQuestionResult.correctCount} / {currentQuestionResult.totalPlayers}人
            </Text>
          )}
          {currentQuestionResult.explanation && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationTitle}>📖 解説</Text>
              <Text style={styles.explanationText}>
                {currentQuestionResult.explanation}
              </Text>
            </View>
          )}
          {isHost && isMainQuiz && countdown === null && (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={endExplanation}
            >
              <Text style={styles.nextButtonText}>
                解説終了 - 次へ進む
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={getAnswerButtonStyle(index)}
            onPress={() => handleAnswer(index)}
            disabled={hasAnswered || timeLeft <= 0}
          >
            <Text style={getAnswerButtonTextStyle(index)}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasAnswered && !showResults && (
        <View style={styles.answeredContainer}>
          <Text style={styles.answeredText}>
            回答完了！
          </Text>
        </View>
      )}

      {countdown !== null && countdown > 0 && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>
            次の問題まで
          </Text>
          <Text style={styles.countdownNumber}>
            {countdown}
          </Text>
        </View>
      )}

      {timeLeft === 0 && !hasAnswered && !showResults && (
        <View style={styles.timeUpContainer}>
          <Text style={styles.timeUpText}>時間切れ！</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  questionNumber: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2e7d32',
  },
  timerCircleWarning: {
    backgroundColor: '#f44336',
    borderColor: '#c62828',
  },
  timer: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  timerWarning: {
    color: 'white',
    fontSize: 22,
  },
  playersCount: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  question: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  optionsContainer: {
    width: '100%',
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
  selectedAnswer: {
    backgroundColor: '#2196f3',
    borderColor: '#1976d2',
    borderWidth: 2,
  },
  correctAnswer: {
    backgroundColor: '#4caf50',
    borderColor: '#2e7d32',
    borderWidth: 2,
  },
  wrongAnswer: {
    backgroundColor: '#f44336',
    borderColor: '#c62828',
    borderWidth: 2,
  },
  disabledOption: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 10,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  correctCountText: {
    fontSize: 16,
    color: '#2196f3',
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  answerTimeText: {
    fontSize: 14,
    color: '#666',
  },
  answeredContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  answeredText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  waitingNextContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  waitingNextText: {
    fontSize: 16,
    color: '#f57c00',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeUpContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  timeUpText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: 'bold',
  },
  explanationContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  nextButton: {
    marginTop: 15,
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  countdownContainer: {
    backgroundColor: '#fff3e0',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  countdownText: {
    fontSize: 18,
    color: '#f57c00',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff9800',
  },
});