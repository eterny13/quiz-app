# クイズデータのサーバー側管理への移行

## 概要
クイズデータをクライアント側からサーバー側に移行し、サーバーが問題データを管理・配信する構造に変更しました。

## 変更内容

### 1. サーバー側 (server/websocket-server.js)

#### 追加されたクイズデータ
- `sampleQuizQuestions`: サンプルクイズの2問（日本の首都、1+1）
- `mainQuizQuestions`: 本番クイズの5問（日本の首都、海洋、日数、富士山、川）

#### 変更されたメソッド
- `startSampleQuiz()`: 問題データを含む `questionStart` メッセージを送信
- `startMainQuiz()`: 問題データを含む `questionStart` メッセージを送信
- `showQuestionResults()`: サーバー側のクイズデータから正解を取得
- `nextQuestion()`: 次の問題データを含む `questionStart` メッセージを送信
- `endGame()`: サーバー側のクイズデータから正解を取得してスコア計算

#### 送信メッセージの変更
`questionStart` メッセージに以下のフィールドを追加:
```javascript
{
  type: 'questionStart',
  questionIndex: number,
  isMainQuiz: boolean,
  startTime: timestamp,
  questionData: {
    question: string,
    options: string[]
  },
  timestamp: timestamp
}
```

### 2. クライアント側 (src/context/GameContext.js)

#### 追加された状態
- `currentQuestionData`: サーバーから受信した問題データを保存

#### 変更されたメッセージハンドラ
- `questionStart` ケース: `message.questionData` を `currentQuestionData` に保存

#### エクスポートされた値
- `currentQuestionData` を Provider の value に追加

### 3. クライアント側 (src/screens/SyncQuizScreen.js)

#### 削除されたインポート
```javascript
// 削除
import { sampleQuizQuestions } from '../data/sampleQuizData';
import { quizQuestions } from '../data/quizData';
```

#### 変更されたロジック
- `useGame()` から `currentQuestionData` を取得
- ローカルのクイズデータ配列の代わりに `currentQuestionData` を直接使用
- 問題データがない場合のローディング表示を追加
- 正解表示を `currentQuestionResult.correctOption` から取得（サーバーから送信される）

### 4. その他のクリーンアップ
- `src/screens/WaitingRoomScreen.js`: 未使用の `sampleQuizQuestions` インポートを削除

## 影響を受けないファイル

以下のファイルは**シングルプレイヤーモード**で使用されるため、ローカルのクイズデータを引き続き使用します:
- `src/screens/QuizScreen.js`: シングルプレイヤー専用画面
- `App.js`: シングルプレイヤーモードのロジック
- `src/data/quizData.js`: シングルプレイヤーモード用データ（保持）
- `src/data/sampleQuizData.js`: 現在は未使用だが保持

## メリット

1. **データの一元管理**: クイズデータがサーバー側で一元管理され、更新が容易
2. **セキュリティ向上**: クライアント側に正解データが露出しない
3. **同期の改善**: 全プレイヤーが同じ問題データを確実に受信
4. **拡張性**: サーバー側でデータベースからクイズを取得する実装への移行が容易

## 今後の拡張案

1. データベース連携: クイズデータをデータベースから取得
2. 動的な問題数: ルーム作成時に問題数を指定可能に
3. カテゴリー選択: 問題のカテゴリーを選択可能に
4. 難易度設定: 問題の難易度を選択可能に
