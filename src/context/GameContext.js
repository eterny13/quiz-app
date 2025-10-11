import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState('waiting'); // waiting, instructions, sampleQuiz, preparation, mainQuiz, finished
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [instructionsTimeLeft, setInstructionsTimeLeft] = useState(15);
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(10);
  const [isMainQuiz, setIsMainQuiz] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionResult, setCurrentQuestionResult] = useState(null);
  const [allAnswers, setAllAnswers] = useState([]);
  const [serverTimeOffset, setServerTimeOffset] = useState(0); // ms: serverTime - localTime
  const [currentQuestionData, setCurrentQuestionData] = useState(null); // サーバーから受信した問題データ

  const wsRef = useRef(null);
  const timerRef = useRef(null);

  const getServerNow = () => Date.now() + serverTimeOffset;

  // タイマーをクリアする関数
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('⏹️ タイマークリア');
    }
  };

  // WebSocket接続の初期化
  const connectToRoom = (roomCode, userName, asHost = false) => {
    // 環境変数または自動検出でWebSocketサーバーのURLを決定
    let wsHost, wsProtocol;

    if (process.env.EXPO_PUBLIC_WS_HOST) {
      // 環境変数が設定されている場合
      wsHost = process.env.EXPO_PUBLIC_WS_HOST;
      wsProtocol = process.env.EXPO_PUBLIC_WS_PROTOCOL || 'ws';
    } else if (typeof window !== 'undefined' && window.location) {
      // ブラウザ環境: 現在のホストを使用
      wsHost = window.location.hostname === 'localhost'
        ? 'localhost:3001'
        : window.location.host;
      wsProtocol = window.location.protocol === 'https' ? 'wss' : 'ws';
    } else {
      // フォールバック: ローカル開発
      wsHost = 'localhost:3001';
      wsProtocol = 'ws';
    }

    const wsUrl = `${wsProtocol}://${wsHost}/room/${roomCode}`;
    console.log('WebSocket接続先:', wsUrl);

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket接続成功', wsUrl);
        // 楽観的に自分をプレイヤー一覧に追加しておく（サーバーからの playerJoined で上書きされる）
        const tempId = `local-${Date.now().toString(36)}`;
        setPlayers(prev => {
          // すでに同名のプレイヤーがいる場合は追加しない
          if (prev.find(p => p.name === userName)) return prev;
          return [...prev, {
            id: tempId,
            name: userName,
            isHost: asHost,
            isReady: false,
            score: 0
          }];
        });

        // time sync: サーバー時刻を取得して差分を計算する
        sendMessage({
          type: 'timeSync',
          clientTime: Date.now(),
          timestamp: Date.now()
        });

        // 参加メッセージを送信
        sendMessage({
          type: 'join',
          userName,
          isHost: asHost,
          timestamp: Date.now()
        });
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket接続終了');
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket エラー:', error);
      };

      setRoomId(roomCode);
      setIsHost(asHost);

    } catch (error) {
      console.error('WebSocket接続エラー:', error);
      // フォールバック: ローカル待機室を作成して自分を参加者として追加
      console.log('フォールバック: ローカル待機室を作成します', roomCode, userName, asHost);
      const localPlayerId = Date.now().toString() + Math.random().toString(36).substring(2);
      setRoomId(roomCode);
      setIsHost(asHost);
      setPlayers([{
        id: localPlayerId,
        name: userName,
        isHost: asHost,
        isReady: false,
        score: 0
      }]);
      setGameState('waiting');
    }
  };

  // WebSocketメッセージの処理
  const handleWebSocketMessage = (message) => {
    console.log('受信メッセージ:', message);

    switch (message.type) {
      case 'timeSync':
        // サーバー時刻との差を計算して保持
        if (message.serverTime) {
          const offset = message.serverTime - Date.now();
          setServerTimeOffset(offset);
          console.log('timeSync 受信. serverTime:', message.serverTime, 'offset(ms):', offset);
        }
        break;

      case 'playerJoined':
        setPlayers(message.players);
        break;

      case 'gameStart':
        console.log('🎮 ゲーム開始メッセージ受信 - 説明画面へ遷移');
        console.log('  startTime:', message.startTime);
        console.log('  現在のgameState:', gameState);
        setGameState('instructions');
        setGameStartTime(message.startTime);
        // instructionsTimeLeft をサーバー startTime 基準で同期してスタート
        setInstructionsTimeLeft(15);
        startInstructionsTimer(message.startTime);
        console.log('  新しいgameState: instructions');
        break;

      case 'instructionsEnd':
        console.log('説明終了 - サンプルクイズ開始');
        setGameState('sampleQuiz');
        setCurrentQuestion(0);
        setIsMainQuiz(false);
        setShowResults(false);
        setCurrentQuestionResult(null);
        // サーバーが questionStart を送る実装により、start は questionStart で受け取る
        break;

      case 'sampleQuizEnd':
        console.log('サンプルクイズ終了 - 本番準備画面へ');
        setGameState('preparation');
        setPreparationTimeLeft(10);
        startPreparationTimer(message.startTime);
        break;

      case 'preparationEnd':
        console.log('本番準備終了 - 本番クイズ開始');
        setGameState('mainQuiz');
        setCurrentQuestion(0);
        setIsMainQuiz(true);
        setShowResults(false);
        setCurrentQuestionResult(null);
        // 本番最初の問題は questionStart で受け取る
        break;

      case 'questionStart':
        console.log('次の問題開始:', message.questionIndex, 'メインクイズ:', message.isMainQuiz);
        setCurrentQuestion(message.questionIndex);
        setQuestionStartTime(message.startTime);
        setIsMainQuiz(message.isMainQuiz);
        setShowResults(false);
        setCurrentQuestionResult(null);
        setCurrentQuestionData(message.questionData); // サーバーから受信した問題データを保存
        // duration をサーバー送信に合わせる（サンプル10s / 本番20s）
        const duration = message.isMainQuiz ? 20 : 10;
        // サーバー startTime を利用して残り時間を同期して開始
        startQuestionTimer(message.startTime, duration);
        break;

      case 'questionEnd':
        console.log('問題終了 - 結果表示:', message.result);
        setShowResults(true);
        setCurrentQuestionResult(message.result);
        clearTimer();
        break;

      case 'gameEnd':
        console.log('ゲーム終了 - プレイヤー情報:', message.players);
        setGameState('finished');
        setPlayers(message.players); // プレイヤー情報を更新（スコアと回答時間を含む）
        setAllAnswers(message.allAnswers);
        clearTimer();
        break;

      case 'playerReady':
        setPlayers(message.players);
        break;

      default:
        console.log('未知のメッセージタイプ:', message.type);
    }
  };

  // メッセージ送信
  const sendMessage = (message) => {
    console.log('📤 sendMessage呼び出し:', message.type, 'WebSocket状態:', wsRef.current?.readyState);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('  ✅ メッセージ送信:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('  ❌ WebSocket未接続 - メッセージ破棄:', message);
      console.error('  wsRef.current:', wsRef.current);
      console.error('  readyState:', wsRef.current?.readyState);
    }
  };

  // プレイヤーの準備完了状態をサーバーに送信する関数
  // 注意: この関数は GameProvider の return より前に定義しておく必要があります
  const setPlayerReady = (isReady = true) => {
    try {
      console.log('送信: playerReady isReady=', isReady);
      sendMessage({
        type: 'playerReady',
        isReady,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('setPlayerReady エラー:', err);
    }
  };

  // 回答送信（サーバーへ）
  // answerIndex: 選択肢のインデックス
  // answerTime: 回答にかかった時間（ミリ秒）
  const submitAnswer = (answerIndex, answerTime = null) => {
    try {
      const time = answerTime !== null ? answerTime : (Date.now() - (questionStartTime || Date.now()));
      console.log('送信: submitAnswer', { questionIndex: currentQuestion, answerIndex, answerTime: time });
      sendMessage({
        type: 'submitAnswer',
        questionIndex: currentQuestion,
        answerIndex,
        answerTime: time,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('submitAnswer エラー:', err);
    }
  };

  // ゲーム開始（ホストのみ）
  const startGame = () => {
    console.log('🎮 startGame関数呼び出し');
    console.log('  isHost:', isHost);
    console.log('  wsRef.current:', wsRef.current);
    console.log('  readyState:', wsRef.current?.readyState);

    if (!isHost) {
      console.log('  ❌ ホストではないため実行をスキップ');
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('  ❌ WebSocket未接続');
      console.error('  wsRef.current:', wsRef.current);
      console.error('  readyState:', wsRef.current?.readyState);
      throw new Error('WebSocket接続が確立されていません');
    }

    console.log('  ✅ サーバーにゲーム開始メッセージを送信');
    try {
      sendMessage({
        type: 'startGame',
        timestamp: Date.now()
      });
      console.log('  ✅ メッセージ送信完了');
    } catch (error) {
      console.error('  ❌ メッセージ送信エラー:', error);
      throw error;
    }

    // サーバーからのgameStartメッセージを待つ（ローカル状態は更新しない）
  };

  // 説明タイマー開始（startTime はサーバー時刻）
  const startInstructionsTimer = (startTime = null) => {
    clearTimer();
    const total = 15;
    if (startTime) {
      // サーバー時刻基準で残りを計算
      const elapsed = Math.floor((getServerNow() - startTime) / 1000);
      const remaining = Math.max(0, total - elapsed);
      setInstructionsTimeLeft(remaining);
      if (remaining === 0) return;
      timerRef.current = setInterval(() => {
        const rem = Math.max(0, total - Math.floor((getServerNow() - startTime) / 1000));
        setInstructionsTimeLeft(rem);
        if (rem <= 0) {
          clearTimer();
        }
      }, 1000);
      return;
    }

    // フォールバック: ローカルタイマー
    setInstructionsTimeLeft(total);
    timerRef.current = setInterval(() => {
      setInstructionsTimeLeft((prev) => {
        if (prev == 0) {
          clearTimer();
          if (isHost) {
            sendMessage({ type: 'instructionsEnd', timestamp: Date.now() });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 本番準備タイマー開始（startTime optional）
  const startPreparationTimer = (startTime = null) => {
    clearTimer();
    const total = 10;
    if (startTime) {
      const elapsed = Math.floor((getServerNow() - startTime) / 1000);
      const remaining = Math.max(0, total - elapsed);
      setPreparationTimeLeft(remaining);
      if (remaining === 0) return;
      timerRef.current = setInterval(() => {
        const rem = Math.max(0, total - Math.floor((getServerNow() - startTime) / 1000));
        setPreparationTimeLeft(rem);
        if (rem <= 0) {
          clearTimer();
        }
      }, 1000);
      return;
    }

    // フォールバック: ローカルタイマー
    setPreparationTimeLeft(total);
    timerRef.current = setInterval(() => {
      setPreparationTimeLeft((prev) => {
        if (prev == 0) {
          clearTimer();
          if (isHost) {
            sendMessage({ type: 'preparationEnd', timestamp: Date.now() });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 問題タイマー開始（startTime はサーバー時刻、duration 秒）
  const startQuestionTimer = (startTime = null, duration = null) => {
    clearTimer();
    const dur = duration != null ? duration : (isMainQuiz ? 20 : 10);
    if (startTime) {
      const elapsed = Math.floor((getServerNow() - startTime) / 1000);
      const remaining = Math.max(0, dur - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) return;
      timerRef.current = setInterval(() => {
        const rem = Math.max(0, dur - Math.floor((getServerNow() - startTime) / 1000));
        setTimeLeft(rem);
        if (rem <= 0) {
          clearTimer();
        }
      }, 1000);
      return;
    }

    // フォールバック: ローカルタイマー
    setTimeLeft(dur);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == 0) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 次の問題へ（ホストのみ）
  const nextQuestion = () => {
    if (!isHost) return;

    const nextIndex = currentQuestion + 1;

    if (!isMainQuiz) {
      // サンプルクイズ中
      if (nextIndex < 2) {
        sendMessage({
          type: 'nextQuestion',
          questionIndex: nextIndex,
          isMainQuiz: false,
          startTime: Date.now(),
          timestamp: Date.now()
        });
      } else {
        // サンプルクイズ終了
        sendMessage({
          type: 'sampleQuizEnd',
          timestamp: Date.now()
        });
      }
    } else {
      // 本番クイズ中
      if (nextIndex < 5) {
        sendMessage({
          type: 'nextQuestion',
          questionIndex: nextIndex,
          isMainQuiz: true,
          startTime: Date.now(),
          timestamp: Date.now()
        });
      } else {
        // 本番クイズ終了
        sendMessage({
          type: 'endGame',
          timestamp: Date.now()
        });
      }
    }
  };

  // ルーム退出
  const leaveRoom = () => {
    if (wsRef.current) {
      sendMessage({
        type: 'leave',
        timestamp: Date.now()
      });
      wsRef.current.close();
    }

    // 状態リセット
    setGameState('waiting');
    setIsHost(false);
    setRoomId(null);
    setPlayers([]);
    setCurrentQuestion(0);
    setGameStartTime(null);
    setQuestionStartTime(null);
    setTimeLeft(20);
    setShowResults(false);
    setCurrentQuestionResult(null);
    setAllAnswers([]);
    clearTimer();
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      clearTimer();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <GameContext.Provider value={{
      gameState,
      isHost,
      roomId,
      players,
      currentQuestion,
      gameStartTime,
      questionStartTime,
      timeLeft,
      instructionsTimeLeft,
      preparationTimeLeft,
      isMainQuiz,
      showResults,
      currentQuestionResult,
      allAnswers,
      currentQuestionData,
      connectToRoom,
      startGame,
      setPlayerReady,
      submitAnswer,
      nextQuestion,
      leaveRoom,
      sendMessage
    }}>
      {children}
    </GameContext.Provider>
  );
};