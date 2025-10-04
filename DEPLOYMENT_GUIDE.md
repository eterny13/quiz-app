# デプロイメントガイド

このクイズゲームを無料でホスティングする方法を説明します。

## 推奨: Render.com を使用する方法

### 前提条件
- GitHubアカウント
- Render.comアカウント（無料）

### 手順

#### 1. GitHubリポジトリの準備

```bash
# プロジェクトをGitHubにプッシュ
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/quiz-game.git
git push -u origin main
```

#### 2. Render.comでWebSocketサーバーをデプロイ

1. [Render.com](https://render.com)にアクセスしてサインアップ
2. ダッシュボードで「New +」→「Web Service」を選択
3. GitHubリポジトリを接続
4. 以下の設定を入力:
   - **Name**: `quiz-websocket-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/websocket-server.js`
   - **Plan**: `Free`
5. 環境変数を追加:
   - `PORT`: `3001`（自動的に設定される場合もあります）
6. 「Create Web Service」をクリック

デプロイ後、URLが発行されます（例: `https://quiz-websocket-server.onrender.com`）

#### 3. クライアントコードの更新

`src/context/GameContext.js`のWebSocket接続URLを更新:

```javascript
const connectToRoom = (roomCode, userName, asHost = false) => {
  // 本番環境のWebSocketサーバーURL
  const wsUrl = `wss://quiz-websocket-server.onrender.com/room/${roomCode}`;
  
  // または環境変数を使用
  // const wsUrl = `wss://${process.env.REACT_APP_WS_HOST || 'localhost:3001'}/room/${roomCode}`;
  
  // ... 残りのコード
}
```

#### 4. Webクライアントをデプロイ

**オプション A: Render.comで静的サイトとしてデプロイ**

1. 「New +」→「Static Site」を選択
2. 同じGitHubリポジトリを選択
3. 以下の設定:
   - **Name**: `quiz-web-client`
   - **Build Command**: `npm install && npx expo export:web`
   - **Publish Directory**: `web-build`
4. 「Create Static Site」をクリック

**オプション B: Vercelを使用（より高速）**

```bash
# Vercel CLIをインストール
npm install -g vercel

# デプロイ
npx expo export:web
vercel --prod
```

#### 5. 動作確認

1. デプロイされたWebクライアントのURLにアクセス
2. ルームを作成してクイズをプレイ
3. 別のブラウザ/タブで同じルームコードで参加

---

## 代替案: Railway.app

### 手順

1. [Railway.app](https://railway.app)でアカウント作成
2. 「New Project」→「Deploy from GitHub repo」
3. リポジトリを選択
4. 自動的にNode.jsアプリとして認識されます
5. 環境変数を設定（必要に応じて）
6. デプロイ完了

Railway.appは自動的にWebSocketをサポートし、設定が非常に簡単です。

---

## 代替案: Fly.io

### 手順

```bash
# Fly CLIをインストール
curl -L https://fly.io/install.sh | sh

# ログイン
fly auth login

# アプリを作成
fly launch

# デプロイ
fly deploy
```

---

## 環境変数の設定

本番環境とローカル環境を切り替えるため、`.env`ファイルを作成:

```env
# .env
REACT_APP_WS_HOST=quiz-websocket-server.onrender.com
REACT_APP_WS_PROTOCOL=wss
```

ローカル開発用:
```env
# .env.local
REACT_APP_WS_HOST=localhost:3001
REACT_APP_WS_PROTOCOL=ws
```

---

## トラブルシューティング

### WebSocket接続エラー

- HTTPSサイトからはWSS（WebSocket Secure）を使用する必要があります
- サーバーURLが正しいか確認
- CORSの設定を確認

### サーバーがスリープする

Render.comの無料プランでは15分間アクセスがないとスリープします。
対策:
- UptimeRobotなどのサービスで定期的にpingを送る
- 有料プランにアップグレード

### パフォーマンスの問題

- 無料プランはリソースが限られています
- 多数のプレイヤーが同時接続する場合は有料プランを検討

---

## おすすめの構成

**最もシンプル**: Render.com（サーバー + クライアント）
**最も高速**: Railway.app（サーバー） + Vercel（クライアント）
**最も柔軟**: Fly.io（サーバー） + Cloudflare Pages（クライアント）

初めての場合は**Render.com**が最も簡単でおすすめです！
