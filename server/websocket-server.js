const WebSocket = require('ws');
const http = require('http');

// HTTPサーバーを作成
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// ルーム管理
const rooms = new Map();

class Room {
  constructor(id, hostId) {
    this.id = id;
    this.hostId = hostId;
    this.players = new Map();
    this.gameState = 'waiting'; // waiting, instructions, sampleQuiz, preparation, mainQuiz, finished
    this.currentQuestion = 0;
    this.questionStartTime = null;
    this.isMainQuiz = false;
    this.answers = new Map(); // questionIndex -> Map(playerId -> answer)
  }

  addPlayer(playerId, playerName, ws, isHost = false) {
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      ws: ws,
      isHost: isHost,
      isReady: false,
      score: 0,
      totalAnswerTime: 0
    });
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayersArray() {
    return Array.from(this.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      isReady: player.isReady,
      score: player.score,
      totalAnswerTime: player.totalAnswerTime || 0
    }));
  }

  broadcast(message, excludePlayerId = null) {
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }

  setPlayerReady(playerId, isReady) {
    const player = this.players.get(playerId);
    if (player) {
      player.isReady = isReady;
      this.broadcast({
        type: 'playerReady',
        players: this.getPlayersArray(),
        timestamp: Date.now()
      });
    }
  }

  startGame() {
    if (this.gameState !== 'waiting') {
      console.log('⚠️ ゲーム開始失敗: 既にゲーム中です (state:', this.gameState, ')');
      return;
    }
    
    console.log('🎮 ゲーム開始 - 説明フェーズへ');
    console.log('  プレイヤー数:', this.players.size);
    this.gameState = 'instructions';
    
    const startTime = Date.now();
    console.log('  gameStartメッセージをブロードキャスト - startTime:', startTime);
    this.broadcast({
      type: 'gameStart',
      startTime: startTime,
      timestamp: Date.now()
    });

    // 15秒後に説明終了、サンプルクイズ開始
    setTimeout(() => {
      this.startSampleQuiz();
    }, 15000);
  }

  startSampleQuiz() {
    console.log('サンプルクイズ開始');
    this.gameState = 'sampleQuiz';
    this.currentQuestion = 0;
    this.isMainQuiz = false;
    this.questionStartTime = Date.now();
    
    this.broadcast({
      type: 'instructionsEnd',
      timestamp: Date.now()
    });

    // 初回問題開始を全員に通知（タイムスタンプ同期用）
    this.broadcast({
      type: 'questionStart',
      questionIndex: this.currentQuestion,
      isMainQuiz: false,
      startTime: this.questionStartTime,
      timestamp: Date.now()
    });

    // 10秒後に結果表示
    setTimeout(() => {
      this.showQuestionResults();
    }, 10000);
  }

  startPreparation() {
    console.log('本番準備フェーズ開始');
    this.gameState = 'preparation';
    
    this.broadcast({
      type: 'sampleQuizEnd',
      timestamp: Date.now()
    });

    // 10秒後に本番クイズ開始
    setTimeout(() => {
      this.startMainQuiz();
    }, 10000);
  }

  startMainQuiz() {
    console.log('本番クイズ開始');
    this.gameState = 'mainQuiz';
    this.currentQuestion = 0;
    this.isMainQuiz = true;
    this.questionStartTime = Date.now();
    
    this.broadcast({
      type: 'preparationEnd',
      timestamp: Date.now()
    });

    // 初回問題開始を全員に通知（タイムスタンプ同期用）
    this.broadcast({
      type: 'questionStart',
      questionIndex: this.currentQuestion,
      isMainQuiz: true,
      startTime: this.questionStartTime,
      timestamp: Date.now()
    });

    // 20秒後に結果表示
    setTimeout(() => {
      this.showQuestionResults();
    }, 20000);
  }

  submitAnswer(playerId, questionIndex, answerIndex, answerTime) {
    if (!this.answers.has(questionIndex)) {
      this.answers.set(questionIndex, new Map());
    }
    
    // 回答時間を記録（ミリ秒）
    this.answers.get(questionIndex).set(playerId, {
      answerIndex,
      answerTime: answerTime || 0,
      timestamp: Date.now()
    });

    console.log(`Player ${playerId} answered question ${questionIndex}: ${answerIndex}, time: ${answerTime}ms`);
  }

  showQuestionResults() {
    let correctAnswer, correctOption;
    
    if (!this.isMainQuiz) {
      // サンプルクイズの正解データ
      const sampleQuizAnswers = [0, 1]; // 問題1: 東京(0), 問題2: 2(1)
      const sampleQuizOptions = [
        ['東京', '大阪', '京都', '名古屋'],
        ['1', '2', '3', '4']
      ];
      
      correctAnswer = sampleQuizAnswers[this.currentQuestion];
      correctOption = sampleQuizOptions[this.currentQuestion][correctAnswer];
    } else {
      // 本番クイズの正解データ
      const mainQuizAnswers = [1, 2, 1, 0, 1]; // quizData.js の正解に対応
      const mainQuizOptions = [
        ['大阪', '東京', '京都', '名古屋'],
        ['大西洋', 'インド洋', '太平洋', '北極海'],
        ['364日', '365日', '366日', '367日'],
        ['3,776m', '3,677m', '3,767m', '3,876m'],
        ['利根川', '信濃川', '石狩川', '北上川']
      ];
      
      correctAnswer = mainQuizAnswers[this.currentQuestion];
      correctOption = mainQuizOptions[this.currentQuestion][correctAnswer];
    }
    
    // 正解者数を計算
    let correctCount = 0;
    const questionAnswers = this.answers.get(this.currentQuestion);
    if (questionAnswers) {
      questionAnswers.forEach((answer) => {
        if (answer.answerIndex === correctAnswer) {
          correctCount++;
        }
      });
    }
    
    console.log('結果表示:', this.currentQuestion, '正解:', correctAnswer, '正解者数:', correctCount);
    
    this.broadcast({
      type: 'questionEnd',
      result: {
        correctAnswer: correctAnswer,
        correctOption: correctOption,
        questionIndex: this.currentQuestion,
        isMainQuiz: this.isMainQuiz,
        correctCount: correctCount,
        totalPlayers: this.players.size
      },
      timestamp: Date.now()
    });

    // 3秒後に次の問題または終了
    setTimeout(() => {
      this.nextQuestion();
    }, 10000);
  }

  nextQuestion() {
    this.currentQuestion++;
    
    if (!this.isMainQuiz) {
      // サンプルクイズ中
      if (this.currentQuestion >= 2) {
        console.log('サンプルクイズ終了 - 本番準備へ');
        this.startPreparation();
      } else {
        console.log('サンプルクイズ次の問題:', this.currentQuestion);
        this.questionStartTime = Date.now();
        
        this.broadcast({
          type: 'questionStart',
          questionIndex: this.currentQuestion,
          isMainQuiz: false,
          startTime: this.questionStartTime,
          timestamp: Date.now()
        });

        // 10秒後に結果表示
        setTimeout(() => {
          this.showQuestionResults();
        }, 10000);
      }
    } else {
      // 本番クイズ中
      if (this.currentQuestion >= 5) {
        console.log('本番クイズ終了');
        this.endGame();
      } else {
        console.log('本番クイズ次の問題:', this.currentQuestion);
        this.questionStartTime = Date.now();
        
        this.broadcast({
          type: 'questionStart',
          questionIndex: this.currentQuestion,
          isMainQuiz: true,
          startTime: this.questionStartTime,
          timestamp: Date.now()
        });

        // 20秒後に結果表示
        setTimeout(() => {
          this.showQuestionResults();
        }, 20000);
      }
    }
  }

  endGame() {
    this.gameState = 'finished';
    
    // 正解データ
    const sampleCorrectAnswers = [0, 1]; // サンプルクイズの正解
    const mainCorrectAnswers = [1, 2, 1, 0, 1]; // 本番クイズの正解（quizData.jsに対応）
    
    // スコアと回答時間を計算
    this.players.forEach((player, playerId) => {
      let score = 0;
      let totalAnswerTime = 0; // 合計回答時間（ミリ秒）
      
      // 本番クイズのみをカウント（問題インデックス0-4）
      for (let questionIndex = 0; questionIndex < 5; questionIndex++) {
        const questionAnswers = this.answers.get(questionIndex);
        const playerAnswer = questionAnswers ? questionAnswers.get(playerId) : null;
        
        if (playerAnswer && playerAnswer.answerIndex === mainCorrectAnswers[questionIndex]) {
          // 正解の場合
          score++;
          totalAnswerTime += playerAnswer.answerTime || 0;
        } else {
          // 不正解または未回答の場合は20秒（20000ms）を加算
          totalAnswerTime += 20000;
        }
      }
      
      player.score = score;
      player.totalAnswerTime = totalAnswerTime;
      
      console.log(`Player ${player.name}: score=${score}, totalAnswerTime=${totalAnswerTime}ms`);
    });

    this.broadcast({
      type: 'gameEnd',
      players: this.getPlayersArray(),
      allAnswers: Array.from(this.answers.entries()),
      timestamp: Date.now()
    });
  }
}

wss.on('connection', (ws, req) => {
  console.log('新しいWebSocket接続');
  
  let playerId = null;
  let roomId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('受信メッセージ:', message);

      switch (message.type) {
        case 'join':
          // ルーム参加
          roomId = extractRoomIdFromUrl(req.url);
          playerId = Date.now().toString() + Math.random().toString(36).substring(2);
          
          if (!rooms.has(roomId)) {
            // 新しいルーム作成
            rooms.set(roomId, new Room(roomId, playerId));
          }
          
          const room = rooms.get(roomId);
          room.addPlayer(playerId, message.userName, ws, message.isHost);
          
          // 参加通知
          room.broadcast({
            type: 'playerJoined',
            players: room.getPlayersArray(),
            timestamp: Date.now()
          });
          
          console.log(`Player ${message.userName} joined room ${roomId}`);
          break;

        case 'timeSync':
          // クライアントの時刻同期リクエストにサーバー時刻で応答
          try {
            ws.send(JSON.stringify({
              type: 'timeSync',
              serverTime: Date.now(),
              timestamp: Date.now()
            }));
            console.log('timeSync へ応答:', Date.now());
          } catch (e) {
            console.error('timeSync 応答エラー:', e);
          }
          break;

        case 'playerReady':
          if (roomId && rooms.has(roomId)) {
            const isReady = message.hasOwnProperty('isReady') ? Boolean(message.isReady) : true;
            console.log(`受信: playerReady from ${playerId} isReady=${isReady}`);
            rooms.get(roomId).setPlayerReady(playerId, isReady);
          }
          break;

        case 'startGame':
          console.log('📨 startGameメッセージ受信 - roomId:', roomId);
          if (roomId && rooms.has(roomId)) {
            console.log('  ルームが存在します。startGame()を呼び出します');
            rooms.get(roomId).startGame();
          } else {
            console.log('  ⚠️ ルームが見つかりません');
          }
          break;

        case 'submitAnswer':
          if (roomId && rooms.has(roomId)) {
            rooms.get(roomId).submitAnswer(
              playerId,
              message.questionIndex,
              message.answerIndex,
              message.answerTime
            );
          }
          break;

        case 'endGame':
          console.log('📨 endGameメッセージ受信 - roomId:', roomId);
          if (roomId && rooms.has(roomId)) {
            console.log('  ゲーム終了処理を実行');
            rooms.get(roomId).endGame();
          }
          break;

        case 'leave':
          if (roomId && rooms.has(roomId)) {
            const room = rooms.get(roomId);
            room.removePlayer(playerId);
            
            if (room.players.size === 0) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} deleted`);
            } else {
              room.broadcast({
                type: 'playerLeft',
                players: room.getPlayersArray(),
                timestamp: Date.now()
              });
            }
          }
          break;

        default:
          console.log('未知のメッセージタイプ:', message.type);
      }
    } catch (error) {
      console.error('メッセージ処理エラー:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket接続終了');
    
    if (roomId && rooms.has(roomId) && playerId) {
      const room = rooms.get(roomId);
      room.removePlayer(playerId);
      
      if (room.players.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted`);
      } else {
        room.broadcast({
          type: 'playerLeft',
          players: room.getPlayersArray(),
          timestamp: Date.now()
        });
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocketエラー:', error);
  });
});

function extractRoomIdFromUrl(url) {
  const match = url.match(/\/room\/([^?]+)/);
  return match ? match[1] : 'default';
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocketサーバーがポート${PORT}で起動しました`);
});

// 定期的にルーム状態をログ出力
setInterval(() => {
  console.log(`アクティブなルーム数: ${rooms.size}`);
  rooms.forEach((room, roomId) => {
    console.log(`Room ${roomId}: ${room.players.size} players, state: ${room.gameState}`);
  });
}, 30000);