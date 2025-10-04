# リアルタイム同期クイズゲーム

WebSocketを使った複数人参加型のクイズゲームです。

## 機能

- 🎮 リアルタイム同期クイズ
- 👥 複数プレイヤー対応
- ⏱️ 回答時間の記録
- 🏆 ランキング表示（正答数 → 回答時間でソート）
- 📱 Web/モバイル対応（React Native + Expo）

## ローカル開発

### 必要なもの

- Node.js 16以上
- npm または yarn

### セットアップ

```bash
# 依存関係をインストール
npm install

# WebSocketサーバーを起動（ターミナル1）
npm run server

# クライアントを起動（ターミナル2）
npm run web
```

ブラウザで `http://localhost:8081` にアクセス

### モバイルアプリとして起動

```bash
# iOS
npm run ios

# Android
npm run android
```

## デプロイ

詳細は [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) を参照してください。

### 簡単な手順（Render.com）

1. GitHubにプッシュ
2. [Render.com](https://render.com)でアカウント作成
3. Web Serviceを作成してサーバーをデプロイ
4. Static Siteを作成してクライアントをデプロイ

## プロジェクト構成

```
quiz-app/
├── server/
│   └── websocket-server.js    # WebSocketサーバー
├── src/
│   ├── context/
│   │   └── GameContext.js     # ゲーム状態管理
│   ├── screens/
│   │   ├── LoginScreen.js     # ログイン画面
│   │   ├── RoomScreen.js      # ルーム選択画面
│   │   ├── WaitingRoomScreen.js # 待機室
│   │   ├── SyncQuizScreen.js  # クイズ画面
│   │   └── RankingScreen.js   # ランキング画面
│   └── data/
│       └── quizData.js        # クイズデータ
├── App.js                     # エントリーポイント
└── package.json
```

## ゲームの流れ

1. **ログイン**: ユーザー名を入力
2. **ルーム作成/参加**: ホストがルームを作成、他のプレイヤーがルームコードで参加
3. **待機室**: 全員が準備完了したらホストがゲーム開始
4. **説明画面**: 15秒間のルール説明
5. **サンプルクイズ**: 2問の練習問題（10秒/問）
6. **本番準備**: 10秒間の準備時間
7. **本番クイズ**: 5問の本番問題（20秒/問）
8. **ランキング**: 結果発表

## スコアリング

- 正答数が多い方が上位
- 正答数が同じ場合は合計回答時間が短い方が上位
- 不正解/未回答の場合は20秒として計算

## トラブルシューティング

### WebSocket接続エラー

- サーバーが起動しているか確認
- ファイアウォールの設定を確認
- ブラウザのコンソールでエラーメッセージを確認

### ランキングが表示されない

- ブラウザのコンソールでエラーを確認
- サーバーログで`gameEnd`メッセージが送信されているか確認

## ライセンス

MIT
