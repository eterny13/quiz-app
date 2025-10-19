const WebSocket = require('ws');
const http = require('http');

// HTTPサーバーを作成
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// クイズデータ
const sampleQuizQuestions = [
  {
    id: 'sample1',
    question: "地球で最も大きな海洋は？",
    options: ["大西洋", "インド洋", "太平洋", "北極海"],
    correctAnswer: 2
  },
  {
    id: 'sample2',
    question: "「源氏物語」を書いたのは誰ですか？",
    options: ["紀貫之", "清少納言", "紫式部", "菅原道真"],
    correctAnswer: 2
  },
  {
    id: 'sample3',
    question: "神奈川の県鳥は？",
    options: ["ハト", "メジロ", "カモメ", "ヒバリ"],
    correctAnswer: 2
  },
  {
    id: 'sample4',
    question: "ノーベル平和賞を日本人として初めて受賞したのは誰ですか？",
    options: ["佐藤栄作", "湯川秀樹", "大江健三郎", "本庶佑"],
    correctAnswer: 0
  },
  {
    id: 'sample5',
    question: "100を「半分」で割って、１を足した。いくつ？",
    options: ["51", "45", "22", "3"],
    correctAnswer: 3
  }
];

const mainQuizQuestions = [
  {
    "id": 1,
    "question": "日本では、まだ食べられるのに捨てられてしまう「食品ロス」が問題になっています。日本人一人が1日に捨てている食品ロスの量は、次のうちどれに例えられているでしょう？",
    "options": [
      "角砂糖1個",
      "おにぎり1個",
      "食パン1枚",
      "バナナ1本"
    ],
    "correctAnswer": 1,
    "explanation": "日本では年間約523万トンの食品ロスが発生しており、これは国民一人当たり毎日おにぎり約1個分（約113グラム）に相当します。"
  },
  {
    "id": 2,
    "question": "私たちが普段飲んでいる500mlのペットボトル。これ1本を「作る」ためには中に入れる飲み水とは別にどのくらいの水が必要でしょうか？",
    "options": [
      "ほぼ同じ量の0.5リットル",
      "2倍の1リットル",
      "6倍の3リットル",
      "10倍の5リットル"
    ],
    "correctAnswer": 2,
    "explanation": "ペットボトル1本の製造には、中身の飲料とは別に約3リットルの水が必要です。プラスチックの原料採掘から製造まで多くの水が使われています。"
  },
  {
    "id": 3,
    "question": "世界全体で見たとき、女性が無報酬で行う家事や育児などのケア労働時間は、男性に比べておよそ何倍でしょうか？",
    "options": [
      "ほぼ同じ",
      "約1.5倍",
      "約3倍",
      "約5倍"
    ],
    "correctAnswer": 2,
    "explanation": "世界的に見て、女性は男性の約3倍の時間を無報酬のケア労働に費やしています。これはジェンダー平等の大きな課題の一つです。"
  },
  {
    "id": 4,
    "question": "ある検索エンジンを使って検索すると収益の約80%が植樹活動に寄付されるサービスがあります。この検索エンジンは何でしょう？",
    "options": [
      "Greennie (グリーニー)",
      "Forestia (フォレスティア)",
      "Ecosia (エコシア)",
      "Planterra (プランテラ)"
    ],
    "correctAnswer": 2,
    "explanation": "Ecosia（エコシア）は検索広告収益の約80%を世界中の植樹プロジェクトに寄付しているドイツ発の検索エンジンです。"
  },
  {
    "id": 5,
    "question": "Tシャツ1枚を作るのに必要とされる水の量はおよそどのくらいでしょう？",
    "options": [
      "お風呂一杯分（約200リットル）",
      "ドラム缶5本分（約1,000リットル）",
      "人が2年半で飲む水の量（約2,700リットル）",
      "小学校のプール半分（約150,000リットル）"
    ],
    "correctAnswer": 2,
    "explanation": "Tシャツ1枚の製造には約2,700リットルの水が必要です。これは綿花の栽培から製品化までの全工程で使用される水の量です。"
  },
  {
    "id": 6,
    "question": "海に流れ出るプラスチックごみは、2050年に何より多くなると予測されているでしょう？",
    "options": [
      "海に浮かぶ全ての船の総重量",
      "海にいる全ての魚の総重量",
      "世界中のサンゴ礁の総重量",
      "世界中の海岸にある砂浜の総重量"
    ],
    "correctAnswer": 1,
    "explanation": "現在のペースが続くと、2050年には海洋プラスチックごみの総重量が魚の総重量を上回ると予測されています。"
  },
  {
    "id": 7,
    "question": "SDGs目標13「気候変動に具体的な対策を」に関連して、国連のパリ協定では、2℃未満の目標達成を目指していますが、これに加えてより野心的に目標とされている気温上昇の上限はどれでしょう？",
    "options": [
      "1.5°C",
      "2.5°C",
      "3°C",
      "4°C"
    ],
    "correctAnswer": 0,
    "explanation": "パリ協定では産業革命前からの気温上昇を2℃未満に抑えることを目標とし、さらに1.5℃に抑える努力を追求することが合意されています。"
  },
  {
    "id": 8,
    "question": "SDGsの目標12「つくる責任 つかう責任」において、Circular Economy（循環型経済）の概念が重要視されています。以下のうち循環型経済の特徴として最も適切なものはどれでしょう？",
    "options": [
      "資源の採掘を最大化し続ける",
      "大量生産・大量消費を促進する",
      "使い捨て製品の普及を奨励する",
      "製品の寿命を延ばし廃棄物を削減する"
    ],
    "correctAnswer": 3,
    "explanation": "循環型経済は、製品の寿命を延ばし、再利用・リサイクルを促進することで廃棄物を最小限に抑え、資源を循環させる経済モデルです。"
  },
  {
    "id": 9,
    "question": "ギグ・ワーカー（単発仕事を請け負う人）がSDGs目標8の課題となる主な理由は何でしょう？",
    "options": [
      "働く時間が不規則で生活リズムが崩れる",
      "専門的スキルが身につきにくい",
      "雇用契約がないため病気や失業時の社会保障が不十分",
      "デジタル機器依存度が高まる"
    ],
    "correctAnswer": 2,
    "explanation": "ギグワーカーは雇用契約がないため、健康保険や失業保険などの社会保障が不十分で、「ディーセント・ワーク（働きがいのある人間らしい仕事）」の課題となっています。"
  },
  {
    "id": 10,
    "question": "地球温暖化の強力な温室効果ガスの1つ「メタン」が多く発生する食生活の要因は？",
    "options": [
      "食品輸送の排気ガス",
      "大量の化学肥料を使ったトウモロコシ畑",
      "牛のゲップやおなら",
      "食品工場で燃やす燃料"
    ],
    "correctAnswer": 2,
    "explanation": "牛などの反芻動物は消化の過程で大量のメタンガスを発生させます。メタンは二酸化炭素の約25倍の温室効果があります。"
  }
];

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

    this.broadcast({
      type: 'instructionsEnd',
      timestamp: Date.now()
    });

    // 少し遅延してから問題開始（メッセージ送信の時間を確保）
    setTimeout(() => {
      this.questionStartTime = Date.now();

      const questionData = sampleQuizQuestions[this.currentQuestion];
      this.broadcast({
        type: 'questionStart',
        questionIndex: this.currentQuestion,
        isMainQuiz: false,
        startTime: this.questionStartTime,
        questionData: {
          question: questionData.question,
          options: questionData.options
        },
        timestamp: Date.now()
      });

      // 20秒後に結果表示
      setTimeout(() => {
        this.showQuestionResults();
      }, 20000);
    }, 100); // 100ms遅延
  }

  startPreparation() {
    console.log('サンプルクイズ終了 - ランキング計算');

    // サンプルクイズのランキングを計算
    const rankings = this.calculateRanking('sample');

    this.gameState = 'sampleRanking';

    const rankingStartTime = Date.now();
    this.broadcast({
      type: 'sampleQuizEnd',
      rankings: rankings,
      quizType: 'sample',
      totalQuestions: 5,
      startTime: rankingStartTime,
      duration: 10,
      timestamp: Date.now()
    });

    // 10秒後に本番準備フェーズへ
    setTimeout(() => {
      console.log('本番準備フェーズ開始');
      this.gameState = 'preparation';

      const prepStartTime = Date.now();
      this.broadcast({
        type: 'preparationStart',
        startTime: prepStartTime,
        timestamp: Date.now()
      });

      // さらに10秒後に本番クイズ開始
      setTimeout(() => {
        this.startMainQuiz();
      }, 10000);
    }, 10000);
  }

  startMainQuiz() {
    console.log('本番クイズ開始');
    this.gameState = 'mainQuiz';
    this.currentQuestion = 0;
    this.isMainQuiz = true;

    this.broadcast({
      type: 'preparationEnd',
      timestamp: Date.now()
    });

    // 少し遅延してから問題開始（メッセージ送信の時間を確保）
    setTimeout(() => {
      this.questionStartTime = Date.now();

      const questionData = mainQuizQuestions[this.currentQuestion];
      this.broadcast({
        type: 'questionStart',
        questionIndex: this.currentQuestion,
        isMainQuiz: true,
        startTime: this.questionStartTime,
        questionData: {
          question: questionData.question,
          options: questionData.options
        },
        timestamp: Date.now()
      });

      // 60秒後に結果表示
      setTimeout(() => {
        this.showQuestionResults();
      }, 60000);
    }, 100); // 100ms遅延
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
    const questions = this.isMainQuiz ? mainQuizQuestions : sampleQuizQuestions;
    const currentQuestionData = questions[this.currentQuestion];
    const correctAnswer = currentQuestionData.correctAnswer;
    const correctOption = currentQuestionData.options[correctAnswer];
    const explanation = currentQuestionData.explanation || '';

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
        explanation: explanation,
        questionIndex: this.currentQuestion,
        isMainQuiz: this.isMainQuiz,
        correctCount: correctCount,
        totalPlayers: this.players.size
      },
      timestamp: Date.now()
    });

    // サンプル問題の場合は3秒後に自動進行
    if (!this.isMainQuiz) {
      setTimeout(() => {
        this.startCountdown();
      }, 3000);
    }
    // 本番問題の場合はホストが解説終了ボタンを押すまで待機
  }

  startCountdown() {
    console.log('カウントダウン開始');

    this.broadcast({
      type: 'countdownStart',
      timestamp: Date.now()
    });

    // 3秒後に次の問題または終了
    setTimeout(() => {
      this.nextQuestion();
    }, 3000);
  }

  nextQuestion() {
    this.currentQuestion++;

    if (!this.isMainQuiz) {
      // サンプルクイズ中
      if (this.currentQuestion >= 5) {
        console.log('サンプルクイズ終了 - 本番準備へ');
        this.startPreparation();
      } else {
        console.log('サンプルクイズ次の問題:', this.currentQuestion);

        // 少し遅延してから問題開始
        setTimeout(() => {
          this.questionStartTime = Date.now();

          const questionData = sampleQuizQuestions[this.currentQuestion];
          this.broadcast({
            type: 'questionStart',
            questionIndex: this.currentQuestion,
            isMainQuiz: false,
            startTime: this.questionStartTime,
            questionData: {
              question: questionData.question,
              options: questionData.options
            },
            timestamp: Date.now()
          });

          // 20秒後に結果表示
          setTimeout(() => {
            this.showQuestionResults();
          }, 20000);
        }, 1000); // 100ms遅延
      }
    } else {
      // 本番クイズ中
      if (this.currentQuestion >= 10) {
        console.log('本番クイズ終了');
        this.endGame();
      } else {
        console.log('本番クイズ次の問題:', this.currentQuestion);

        // 少し遅延してから問題開始
        setTimeout(() => {
          this.questionStartTime = Date.now();

          const questionData = mainQuizQuestions[this.currentQuestion];
          this.broadcast({
            type: 'questionStart',
            questionIndex: this.currentQuestion,
            isMainQuiz: true,
            startTime: this.questionStartTime,
            questionData: {
              question: questionData.question,
              options: questionData.options
            },
            timestamp: Date.now()
          });

          // 60秒後に結果表示
          setTimeout(() => {
            this.showQuestionResults();
          }, 60000);
        }, 100); // 100ms遅延
      }
    }
  }

  calculateRanking(quizType) {
    const rankings = [];
    const questions = quizType === 'sample' ? sampleQuizQuestions : mainQuizQuestions;
    const startIndex = quizType === 'sample' ? 0 : 0;
    const endIndex = quizType === 'sample' ? 5 : 10;
    const timeoutPenalty = quizType === 'sample' ? 20000 : 60000;

    this.players.forEach((player, playerId) => {
      let score = 0;
      let totalAnswerTime = 0;

      for (let i = startIndex; i < endIndex; i++) {
        const questionAnswers = this.answers.get(i);
        const playerAnswer = questionAnswers ? questionAnswers.get(playerId) : null;
        const correctAnswer = questions[i].correctAnswer;

        if (playerAnswer && playerAnswer.answerIndex === correctAnswer) {
          score++;
          totalAnswerTime += playerAnswer.answerTime || 0;
        } else {
          totalAnswerTime += timeoutPenalty;
        }
      }

      rankings.push({
        playerId,
        playerName: player.name,
        score,
        totalAnswerTime
      });
    });

    // ソート: 正解数降順 → 回答時間昇順 → プレイヤーID昇順
    rankings.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.totalAnswerTime !== b.totalAnswerTime)
        return a.totalAnswerTime - b.totalAnswerTime;
      return a.playerId.localeCompare(b.playerId);
    });

    // 順位を付与
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });

    console.log(`${quizType}クイズのランキング計算完了:`, rankings);
    return rankings;
  }

  endGame() {
    this.gameState = 'finished';

    // ランキングを計算
    const rankings = this.calculateRanking('main');

    // プレイヤー情報を更新
    rankings.forEach(ranking => {
      const player = this.players.get(ranking.playerId);
      if (player) {
        player.score = ranking.score;
        player.totalAnswerTime = ranking.totalAnswerTime;
      }
    });

    const rankingStartTime = Date.now();
    this.broadcast({
      type: 'gameEnd',
      rankings: rankings,
      players: this.getPlayersArray(),
      allAnswers: Array.from(this.answers.entries()),
      startTime: rankingStartTime,
      duration: 15,
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
            const serverTime = Date.now();
            ws.send(JSON.stringify({
              type: 'timeSync',
              serverTime: serverTime,
              clientSendTime: message.clientSendTime, // クライアントの送信時刻をそのまま返す
              timestamp: serverTime
            }));
            console.log('timeSync へ応答:', {
              serverTime: serverTime,
              clientSendTime: message.clientSendTime
            });
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

        case 'explanationEnd':
          console.log('📨 explanationEndメッセージ受信 - roomId:', roomId);
          if (roomId && rooms.has(roomId)) {
            console.log('  カウントダウン開始');
            rooms.get(roomId).startCountdown();
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