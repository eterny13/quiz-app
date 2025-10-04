# デバッグガイド

## 問題: ゲーム開始ボタンを押してもゲームが開始しない

### ステップ1: サーバーの確認

```bash
# サーバーが起動しているか確認
lsof -i:3001

# サーバーのログを確認
tail -f /tmp/websocket-server.log
```

期待される出力:
```
WebSocketサーバーがポート3001で起動しました
```

### ステップ2: WebSocket接続のテスト

1. `test-websocket.html`をブラウザで開く
2. 「接続テスト」ボタンをクリック
3. 「✅ WebSocket接続成功！」が表示されることを確認
4. 「参加メッセージ送信」ボタンをクリック
5. サーバーログに以下が表示されることを確認:
   ```
   新しいWebSocket接続
   受信メッセージ: { type: 'join', userName: 'テストユーザー', isHost: true }
   Player テストユーザー joined room TEST123
   ```

### ステップ3: クライアント側のログ確認

ブラウザの開発者ツール（F12）を開いて、コンソールタブで以下を確認:

1. **WebSocket接続**
   ```
   WebSocket接続成功 ws://localhost:3001/room/XXXXXX
   ```

2. **メッセージ送信**
   ```
   📤 sendMessage呼び出し: startGame WebSocket状態: 1
     ✅ メッセージ送信: {type: 'startGame', timestamp: ...}
   ```

3. **メッセージ受信**
   ```
   受信メッセージ: {type: 'gameStart', startTime: ..., timestamp: ...}
   🎮 ゲーム開始メッセージ受信 - 説明画面へ遷移
   ```

4. **画面遷移**
   ```
   📺 画面制御 - gameMode: multi roomId: XXXXXX gameState: instructions
     → instructions画面へ
   ```

### ステップ4: よくある問題と解決策

#### 問題1: WebSocket接続が確立されない

**症状**:
- コンソールに「WebSocket エラー」が表示される
- サーバーログに「新しいWebSocket接続」が表示されない

**解決策**:
1. サーバーを再起動
   ```bash
   pkill -f websocket-server
   cd server
   node websocket-server.js > /tmp/websocket-server.log 2>&1 &
   ```

2. ブラウザをリロード（Cmd+R / Ctrl+R）

3. ファイアウォールの設定を確認

#### 問題2: メッセージが送信されない

**症状**:
- コンソールに「❌ WebSocket未接続 - メッセージ破棄」が表示される
- `readyState`が1（OPEN）ではない

**解決策**:
1. WebSocket接続が確立されるまで待つ
2. `wsRef.current`が正しく設定されているか確認
3. ルーム参加後にメッセージを送信しているか確認

#### 問題3: サーバーがメッセージを受信しない

**症状**:
- クライアント側で「✅ メッセージ送信」が表示される
- サーバーログに「受信メッセージ」が表示されない

**解決策**:
1. サーバーとクライアントが同じポート（3001）を使用しているか確認
2. ネットワークタブでWebSocket通信を確認
3. サーバーのメッセージハンドラーが正しく実装されているか確認

#### 問題4: 画面が遷移しない

**症状**:
- メッセージの送受信は成功している
- 画面が変わらない

**解決策**:
1. `gameState`が変更されているか確認（コンソールログ）
2. `gameMode`が`'multi'`になっているか確認
3. `roomId`が設定されているか確認
4. App.jsの画面制御ロジックが実行されているか確認

### ステップ5: 完全なログの例

#### 成功時のログ（クライアント側）

```
WebSocket接続成功 ws://localhost:3001/room/ABC123
📤 sendMessage呼び出し: timeSync WebSocket状態: 1
  ✅ メッセージ送信: {type: 'timeSync', clientTime: ..., timestamp: ...}
📤 sendMessage呼び出し: join WebSocket状態: 1
  ✅ メッセージ送信: {type: 'join', userName: 'ホスト', isHost: true, timestamp: ...}
受信メッセージ: {type: 'timeSync', serverTime: ..., timestamp: ...}
受信メッセージ: {type: 'playerJoined', players: [...], timestamp: ...}
準備状態チェック (ホスト): {guests: 0, readyGuests: 0, allReady: true}
🎮 handleStartGame呼び出し
  isHost: true
  players.length: 1
  allPlayersReady: true
  ゲスト数: 0
  ⚠️ ゲストがいません（デバッグモード: 続行可能）
  ✅ 全チェック通過 - 確認ダイアログ表示
  ✅ ゲーム開始確定 - startGame()呼び出し
🎮 startGame: サーバーにゲーム開始メッセージを送信
📤 sendMessage呼び出し: startGame WebSocket状態: 1
  ✅ メッセージ送信: {type: 'startGame', timestamp: ...}
受信メッセージ: {type: 'gameStart', startTime: ..., timestamp: ...}
🎮 ゲーム開始メッセージ受信 - 説明画面へ遷移
  startTime: 1234567890
  現在のgameState: waiting
  新しいgameState: instructions
📺 画面制御 - gameMode: multi roomId: ABC123 gameState: instructions
  → instructions画面へ
```

#### 成功時のログ（サーバー側）

```
WebSocketサーバーがポート3001で起動しました
新しいWebSocket接続
受信メッセージ: { type: 'timeSync', clientTime: ..., timestamp: ... }
timeSync へ応答: 1234567890
受信メッセージ: { type: 'join', userName: 'ホスト', isHost: true, timestamp: ... }
Player ホスト joined room ABC123
📨 startGameメッセージ受信 - roomId: ABC123
  ルームが存在します。startGame()を呼び出します
🎮 ゲーム開始 - 説明フェーズへ
  プレイヤー数: 1
  gameStartメッセージをブロードキャスト - startTime: 1234567890
```

### ステップ6: 緊急対応

すべてのステップを試しても解決しない場合:

1. **完全リセット**
   ```bash
   # サーバーを停止
   pkill -f websocket-server
   
   # ブラウザのキャッシュをクリア
   # Chrome: Cmd+Shift+Delete / Ctrl+Shift+Delete
   
   # サーバーを再起動
   cd server
   node websocket-server.js
   
   # 新しいブラウザタブでアプリを開く
   ```

2. **別のブラウザで試す**
   - Chrome、Firefox、Safariなど

3. **ローカルホストの確認**
   ```bash
   # localhostが正しく解決されるか確認
   ping localhost
   ```

4. **ポートの確認**
   ```bash
   # ポート3001が他のプロセスで使用されていないか確認
   lsof -i:3001
   ```

### ステップ7: サポート情報の収集

問題が解決しない場合、以下の情報を収集してください:

1. ブラウザのコンソールログ（全体）
2. サーバーのログ（全体）
3. ネットワークタブのWebSocket通信
4. 使用しているブラウザとバージョン
5. 実行した手順

これらの情報があれば、問題の特定が容易になります。
