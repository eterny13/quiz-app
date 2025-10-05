import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, FlatList, Platform } from 'react-native';
import { GameProvider, useGame } from './src/context/GameContext';
import RoomScreen from './src/screens/RoomScreen';
import WaitingRoomScreen from './src/screens/WaitingRoomScreen';
import SyncQuizScreen from './src/screens/SyncQuizScreen';
import InstructionsScreen from './src/screens/InstructionsScreen';
import PreparationScreen from './src/screens/PreparationScreen';
import RankingScreen from './src/screens/RankingScreen';

// Web対応のストレージ
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    }
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    }
  }
};

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [gameMode, setGameMode] = useState('single'); // 'single' or 'multi'
  const { gameState, roomId } = useGame();
  const [user, setUser] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userName, setUserName] = useState('');
  const [rankings, setRankings] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);
  const [localGameState, setLocalGameState] = useState('waiting'); // waiting, playing, finished
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionResult, setCurrentQuestionResult] = useState(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [currentQuestionAnswer, setCurrentQuestionAnswer] = useState(null);
  const currentQuestionAnswerRef = useRef(null);
  const allAnswersRef = useRef([]);
  const gameStartTimeRef = useRef(null);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const savedRankings = await storage.getItem('quizRankings');
      if (savedRankings) {
        setRankings(JSON.parse(savedRankings));
      }
    } catch (error) {
      console.log('ランキング読み込みエラー:', error);
    }
  };

  const saveRanking = async (newResult) => {
    try {
      const updatedRankings = [...rankings, newResult];
      // スコア順（降順）、同じスコアなら回答時間の合計順（昇順）でソート
      updatedRankings.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // 同じスコアの場合は回答時間の合計で比較
        const aTotalAnswerTime = (a.averageAnswerTime || 0) * quizQuestions.length;
        const bTotalAnswerTime = (b.averageAnswerTime || 0) * quizQuestions.length;
        return aTotalAnswerTime - bTotalAnswerTime;
      });

      // 上位20位まで保持
      const topRankings = updatedRankings.slice(0, 20);

      await storage.setItem('quizRankings', JSON.stringify(topRankings));
      setRankings(topRankings);
    } catch (error) {
      console.log('ランキング保存エラー:', error);
    }
  };

  const handleLogin = (mode = 'single') => {
    if (userName.trim() === '') {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      name: userName.trim(),
      email: `${userName.trim()}@example.com`
    };
    setUser(newUser);
    // 明示的にモードをセットしてから画面遷移
    setGameMode(mode);
    if (mode === 'multi') {
      setCurrentScreen('room');
    } else {
      setCurrentScreen('waiting');
    }
  };

  const startGame = () => {
    console.log('ゲーム開始');
    setCurrentScreen('quiz');
    setLocalGameState('playing');
    setCurrentQuestion(0);
    setQuestionAnswers([]);
    const startTime = Date.now();
    setGameStartTime(startTime);
    gameStartTimeRef.current = startTime;

    // 初回の問題開始
    setTimeout(() => {
      console.log('最初の問題のタイマー開始');
      setTimeLeft(20);
      setQuestionStartTime(Date.now());
      setHasAnswered(false);
      setSelectedAnswer(null);
      setShowResults(false);
      setWaitingForNext(false);
      setCurrentQuestionResult(null);

      const interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            console.log('初回問題時間切れ');
            clearInterval(interval);
            setTimerInterval(null);

            setTimeout(() => {
              showQuestionResultWithCurrentState(0);
            }, 100);

            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      setTimerInterval(interval);
    }, 100);
  };



  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const handleTimeUp = () => {
    console.log('handleTimeUp called - 問題:', currentQuestion);
    clearTimer();

    // 20秒経過後に結果を表示
    showQuestionResult(currentQuestion);
  };

  const handleAnswer = (answerIndex) => {
    if (hasAnswered || timeLeft <= 0) return; // 既に回答済みまたは時間切れの場合は無効

    const answerTime = Date.now() - questionStartTime;
    const isCorrect = answerIndex === quizQuestions[currentQuestion].correctAnswer;

    console.log('回答:', answerIndex, '正解:', quizQuestions[currentQuestion].correctAnswer, '正解判定:', isCorrect);

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);

    // 回答データを記録（間違えた場合は20秒として記録）
    const recordedAnswerTime = isCorrect ? answerTime : 20000;
    const answerData = {
      questionIndex: currentQuestion,
      selectedAnswer: answerIndex,
      isCorrect: isCorrect,
      answerTime: recordedAnswerTime,
      timestamp: Date.now()
    };

    // 現在の問題の回答データを即座に保存
    setCurrentQuestionAnswer(answerData);
    currentQuestionAnswerRef.current = answerData;

    setQuestionAnswers(prev => {
      const newAnswers = [...prev, answerData];
      allAnswersRef.current = newAnswers; // refにも保存
      console.log('回答データ更新:', newAnswers);
      console.log('追加された回答データ:', answerData);
      return newAnswers;
    });

    // 回答後は20秒経過まで待機（結果は表示しない）
  };



  const showQuestionResultWithCurrentState = (questionIndex) => {
    console.log('結果表示（現在状態） - 問題:', questionIndex);
    console.log('currentQuestionAnswer:', currentQuestionAnswer);
    console.log('currentQuestionAnswerRef:', currentQuestionAnswerRef.current);

    // 重複実行を防ぐ
    if (showResults || waitingForNext) {
      console.log('結果表示スキップ - 既に表示中');
      return;
    }

    // 20秒経過後に結果を表示
    const correctAnswer = quizQuestions[questionIndex].correctAnswer;
    const correctOption = quizQuestions[questionIndex].options[correctAnswer];

    // refから回答データを取得（即座にアクセス可能）
    const answerData = currentQuestionAnswerRef.current;

    if (answerData && answerData.questionIndex === questionIndex) {
      // 回答データが存在する場合
      console.log('回答データ発見:', answerData);

      setCurrentQuestionResult({
        correctAnswer: correctAnswer,
        correctOption: correctOption,
        userAnswer: answerData.selectedAnswer,
        isCorrect: answerData.isCorrect,
        answerTime: answerData.answerTime
      });
    } else {
      // 回答データが存在しない場合（未回答）
      console.log('回答データなし - 未回答として処理');

      const answerData = {
        questionIndex: questionIndex,
        selectedAnswer: null,
        isCorrect: false,
        answerTime: 20000, // 20秒（タイムアウト）
        timestamp: Date.now()
      };

      setQuestionAnswers(prev => {
        const newAnswers = [...prev, answerData];
        allAnswersRef.current = newAnswers; // refにも保存
        return newAnswers;
      });

      setCurrentQuestionResult({
        correctAnswer: correctAnswer,
        correctOption: correctOption,
        userAnswer: null,
        isCorrect: false,
        answerTime: 20000
      });
    }

    setShowResults(true);
    setWaitingForNext(true);

    // 3秒後に次の問題または結果画面に移行
    setTimeout(() => {
      moveToNextQuestion(questionIndex);
    }, 3000);
  };

  const showQuestionResult = (questionIndex) => {
    // この関数は初回問題用（後方互換性のため）
    showQuestionResultWithCurrentState(questionIndex);
  };

  const moveToNextQuestion = (currentQuestionIndex) => {
    console.log('moveToNextQuestion called - 現在の問題:', currentQuestionIndex, '/', quizQuestions.length - 1);

    const nextQuestionIndex = currentQuestionIndex + 1;

    if (nextQuestionIndex < quizQuestions.length) {
      console.log('次の問題に進む:', nextQuestionIndex);

      // タイマーをクリア
      clearTimer();

      // 現在の問題の回答データが保存されていることを確認
      console.log('問題', currentQuestionIndex, '完了時の回答データ:', questionAnswers);

      // 状態をリセット
      setCurrentQuestion(nextQuestionIndex);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setShowResults(false);
      setWaitingForNext(false);
      setCurrentQuestionResult(null);
      setCurrentQuestionAnswer(null); // 現在の問題の回答データもリセット
      currentQuestionAnswerRef.current = null;
      setTimeLeft(20);

      // 新しいタイマーを開始
      setTimeout(() => {
        console.log('新しい問題のタイマー開始 - 問題番号:', nextQuestionIndex);
        setQuestionStartTime(Date.now());

        const interval = setInterval(() => {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              console.log('時間切れ - 問題:', nextQuestionIndex);
              clearInterval(interval);
              setTimerInterval(null);

              // 結果表示を直接呼び出し（状態を保持したまま）
              setTimeout(() => {
                showQuestionResultWithCurrentState(nextQuestionIndex);
              }, 100);

              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);

        setTimerInterval(interval);
      }, 500);
    } else {
      // 最後の問題完了
      console.log('クイズ完了 - 全', quizQuestions.length, '問終了');
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    clearTimer();
    setLocalGameState('finished');

    const now = Date.now();
    const totalTime = now - (gameStartTimeRef.current || now);

    console.log('時間計算:', {
      now,
      gameStartTime,
      totalTime,
      totalTimeSeconds: Math.round(totalTime / 1000)
    });

    // allAnswersRefから正解数を計算
    const allAnswers = allAnswersRef.current;
    const correctAnswers = allAnswers.filter(answer => answer.isCorrect).length;
    console.log('クイズ完了 - 正解数:', correctAnswers, '回答データ:', allAnswers);



    // 詳細な結果を計算
    const averageAnswerTime = allAnswers.length > 0
      ? allAnswers.reduce((sum, answer) => sum + answer.answerTime, 0) / allAnswers.length
      : 0;

    // ランキングに結果を保存
    const result = {
      id: Date.now(),
      userName: user.name,
      score: correctAnswers,
      time: totalTime,
      averageAnswerTime: averageAnswerTime,
      answers: allAnswers,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('ja-JP')
    };

    saveRanking(result);

    // 3秒後に自動的にランキング画面に遷移
    setTimeout(() => {
      setCurrentScreen('ranking');
    }, 3000);

    Alert.alert(
      'クイズ完了！',
      `正解数: ${correctAnswers}/${quizQuestions.length}\n総時間: ${Math.round(totalTime / 1000)}秒\n平均回答時間: ${Math.round(averageAnswerTime / 1000)}秒\n\n3秒後にランキング画面に移動します`,
      [{ text: 'すぐにランキングを見る', onPress: () => setCurrentScreen('ranking') }]
    );
  };

  const resetQuiz = () => {
    console.log('クイズリセット');
    clearTimer();
    setCurrentQuestion(0);
    setQuestionAnswers([]);
    allAnswersRef.current = [];
    gameStartTimeRef.current = null;
    setLocalGameState('waiting');
    setHasAnswered(false);
    setSelectedAnswer(null);
    setShowResults(false);
    setCurrentQuestionResult(null);
    setCurrentQuestionAnswer(null);
    setWaitingForNext(false);
    setTimeLeft(20);
    setCurrentScreen('waiting');
  };

  const goToLogin = () => {
    clearTimer();
    setCurrentScreen('login');
    setUser(null);
    setUserName('');
    setCurrentQuestion(0);
    setLocalGameState('waiting');
    setQuestionAnswers([]);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setShowResults(false);
    setGameMode('single');
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [timerInterval]);

  // currentQuestionが変更されたときの処理
  useEffect(() => {
    if (currentScreen === 'quiz' && localGameState === 'playing') {
      console.log('currentQuestion changed to:', currentQuestion);
    }
  }, [currentQuestion, currentScreen, localGameState]);

  // questionAnswersが更新されたときの処理
  useEffect(() => {
    console.log('questionAnswers updated:', questionAnswers);
  }, [questionAnswers]);

  const getAnswerButtonStyle = (optionIndex) => {
    // 20秒経過後の結果表示時
    if (showResults && currentQuestionResult) {
      const correctAnswer = currentQuestionResult.correctAnswer;
      const userAnswer = currentQuestionResult.userAnswer;

      if (optionIndex === correctAnswer) {
        return [styles.optionButton, styles.correctAnswer];
      }
      if (optionIndex === userAnswer && userAnswer !== correctAnswer) {
        return [styles.optionButton, styles.wrongAnswer];
      }
      return [styles.optionButton, styles.disabledOption];
    }

    // 回答済みだが結果表示前（20秒経過前）
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

  // マルチプレイヤーモードの画面制御
  useEffect(() => {
    if (gameMode === 'multi' && roomId) {
      console.log('📺 画面制御 - gameMode:', gameMode, 'roomId:', roomId, 'gameState:', gameState);
      if (gameState === 'waiting') {
        console.log('  → waitingRoom画面へ');
        setCurrentScreen('waitingRoom');
      } else if (gameState === 'instructions') {
        console.log('  → instructions画面へ');
        setCurrentScreen('instructions');
      } else if (gameState === 'sampleQuiz') {
        console.log('  → syncQuiz画面へ (サンプル)');
        setCurrentScreen('syncQuiz');
      } else if (gameState === 'preparation') {
        console.log('  → preparation画面へ');
        setCurrentScreen('preparation');
      } else if (gameState === 'mainQuiz') {
        console.log('  → syncQuiz画面へ (本番)');
        setCurrentScreen('syncQuiz');
      } else if (gameState === 'finished') {
        console.log('  → ranking画面へ');
        setCurrentScreen('ranking');
      }
    }
  }, [gameState, roomId, gameMode]);

  if (currentScreen === 'room') {
    return (
      <RoomScreen
        user={user}
        onBack={() => setCurrentScreen('login')}
      />
    );
  }

  if (currentScreen === 'waitingRoom') {
    return (
      <WaitingRoomScreen
        user={user}
        onBack={() => setCurrentScreen('room')}
      />
    );
  }

  if (currentScreen === 'instructions') {
    return <InstructionsScreen />;
  }

  if (currentScreen === 'preparation') {
    return <PreparationScreen />;
  }

  if (currentScreen === 'syncQuiz') {
    return (
      <SyncQuizScreen
        user={user}
        onFinish={() => setCurrentScreen('ranking')}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>クイズアプリ</Text>
        <Text style={styles.subtitle}>4択クイズで競争しよう！</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>ユーザー名を入力してください</Text>
          <TextInput
            style={styles.textInput}
            value={userName}
            onChangeText={setUserName}
            placeholder="例: 田中太郎"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => handleLogin('single')}
        >
          <Text style={styles.loginButtonText}>
            シングルプレイ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.multiplayerButton}
          onPress={() => handleLogin('multi')}
        >
          <Text style={styles.multiplayerButtonText}>
            マルチプレイヤー
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rankingViewButton}
          onPress={() => setCurrentScreen('ranking')}
        >
          <Text style={styles.rankingViewButtonText}>
            ランキングを見る
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentScreen === 'waiting') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>クイズ待機中</Text>
        <Text style={styles.subtitle}>ようこそ、{user?.name}さん！</Text>

        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>
            カフート形式のクイズゲームです
          </Text>
          <Text style={styles.waitingDescription}>
            • 全{quizQuestions.length}問の4択クイズ{'\n'}
            • 各問題20秒の制限時間{'\n'}
            • 一度回答すると変更不可{'\n'}
            • 時間経過で自動的に次の問題へ{'\n'}
            • 回答速度もスコアに影響
          </Text>
        </View>

        <TouchableOpacity style={styles.startGameButton} onPress={startGame}>
          <Text style={styles.startGameButtonText}>
            ゲーム開始
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={goToLogin}>
          <Text style={styles.backButtonText}>
            ログイン画面に戻る
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentScreen === 'quiz') {
    const question = quizQuestions[currentQuestion];

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.questionNumber}>
            問題 {currentQuestion + 1} / {quizQuestions.length}
          </Text>
          <View style={styles.timerContainer}>
            <View style={[styles.timerCircle, timeLeft <= 5 && styles.timerCircleWarning]}>
              <Text style={[styles.timer, timeLeft <= 5 && styles.timerWarning]}>
                {timeLeft}
              </Text>
            </View>
          </View>

        </View>

        <Text style={styles.question}>{question.question}</Text>

        {/* デバッグ情報 */}
        <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 10 }}>
          Debug: Q{currentQuestion} - {question.id} - {question.question.substring(0, 20)}...
        </Text>

        {showResults && currentQuestionResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>
              {currentQuestionResult.isCorrect ? '正解！' : '不正解'}
            </Text>
            <Text style={styles.correctAnswerText}>
              正解: {currentQuestionResult.correctOption}
            </Text>
            {hasAnswered && currentQuestionResult.answerTime && (
              <Text style={styles.answerTimeText}>
                回答時間: {Math.round(currentQuestionResult.answerTime / 10) / 100}秒
              </Text>
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
              <Text style={[
                styles.optionText,
                hasAnswered && index === selectedAnswer && styles.selectedOptionText,
                showResults && index === quizQuestions[currentQuestion].correctAnswer && styles.correctOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {waitingForNext && (
          <View style={styles.waitingNextContainer}>
            <Text style={styles.waitingNextText}>
              次の問題まで待機中...
            </Text>
          </View>
        )}

        {hasAnswered && !showResults && (
          <View style={styles.answeredContainer}>
            <Text style={styles.answeredText}>
              回答完了！結果発表をお待ちください
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (currentScreen === 'ranking') {
    // マルチプレイヤーモードの場合は専用のRankingScreenを使用
    if (gameMode === 'multi') {
      return (
        <RankingScreen
          user={user}
          onPlayAgain={null}
          onBackToLogin={goToLogin}
        />
      );
    }

    // シングルプレイヤーモードの場合は従来のランキング表示
    const renderRankingItem = ({ item, index }) => {
      const isCurrentUser = user && item.userName === user.name;

      return (
        <View style={[
          styles.rankingItem,
          isCurrentUser && styles.currentUserRankingItem
        ]}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
              {item.userName}
            </Text>
            <Text style={styles.userStats}>
              {item.score}問正解 - 回答時間合計: {item.averageAnswerTime ? Math.round((item.averageAnswerTime * quizQuestions.length) / 1000) : 0}秒
            </Text>
            <Text style={styles.userDate}>{item.date}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{item.score}/{quizQuestions.length}</Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <Text style={styles.title}>ランキング</Text>

        {rankings.length === 0 ? (
          <View style={styles.emptyRanking}>
            <Text style={styles.emptyText}>まだ記録がありません</Text>
            <Text style={styles.emptySubText}>クイズに挑戦してランキングに登録しよう！</Text>
          </View>
        ) : (
          <FlatList
            data={rankings}
            renderItem={renderRankingItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.rankingList}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.buttonContainer}>
          {user ? (
            <TouchableOpacity style={styles.playAgainButton} onPress={resetQuiz}>
              <Text style={styles.playAgainText}>もう一度プレイ</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.backButton} onPress={goToLogin}>
            <Text style={styles.backButtonText}>
              {user ? '別のユーザーでプレイ' : 'ログイン画面に戻る'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  multiplayerButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  multiplayerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankingViewButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4285f4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  rankingViewButtonText: {
    color: '#4285f4',
    fontSize: 16,
    fontWeight: 'bold',
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
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  },
  correctOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  waitingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginVertical: 30,
    width: '100%',
  },
  waitingText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 15,
  },
  waitingDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  startGameButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  startGameButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  answerTimeText: {
    fontSize: 14,
    color: '#666',
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
  },
  rankingList: {
    width: '100%',
    maxHeight: 400,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    width: '100%',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  currentUserRankingItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9800',
    marginRight: 15,
    minWidth: 30,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentUserName: {
    color: '#2196f3',
  },
  userStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  emptyRanking: {
    alignItems: 'center',
    marginVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },
  playAgainButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  playAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}