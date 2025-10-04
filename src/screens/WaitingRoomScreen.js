import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert
} from 'react-native';
import { useGame } from '../context/GameContext';
import { sampleQuizQuestions } from '../data/sampleQuizData';

export default function WaitingRoomScreen({ user, onBack }) {
  const gameContext = useGame();
  const {
    isHost,
    roomId,
    players,
    gameState,
    startGame,
    setPlayerReady,
    leaveRoom
  } = gameContext;

  const [isReady, setIsReady] = useState(false);
  const [allPlayersReady, setAllPlayersReady] = useState(false);

  // デバッグ: GameContextの内容を確認
  useEffect(() => {
    console.log('🔍 WaitingRoomScreen マウント');
    console.log('  GameContext:', gameContext);
    console.log('  isHost:', isHost);
    console.log('  roomId:', roomId);
    console.log('  startGame:', typeof startGame, startGame);
  }, []);

  // プレイヤーの準備状態をチェック
  useEffect(() => {
    if (isHost) {
      // ホストの場合: ゲスト全員が準備完了しているかチェック
      const guests = players.filter(player => !player.isHost);
      const readyGuests = guests.filter(player => player.isReady);
      // デバッグ用: ゲストがいない場合も準備完了とみなす
      const allReady = guests.length === 0 || readyGuests.length === guests.length;
      console.log('準備状態チェック (ホスト):', {
        guests: guests.length,
        readyGuests: readyGuests.length,
        allReady
      });
      setAllPlayersReady(allReady);
    } else {
      // ゲストの場合: 全員（ホスト含む）が準備完了しているかチェック
      const readyPlayers = players.filter(player => player.isReady);
      const allReady = players.length > 0 && readyPlayers.length === players.length;
      console.log('準備状態チェック (ゲスト):', {
        players: players.length,
        readyPlayers: readyPlayers.length,
        allReady
      });
      setAllPlayersReady(allReady);
    }
  }, [players, isHost]);

  // players 更新に合わせて自分の isReady を同期
  useEffect(() => {
    const me = players.find(p => p.name === user.name);
    if (me) {
      setIsReady(Boolean(me.isReady));
    }
  }, [players, user.name]);

  // ゲーム状態が変更されたら画面遷移
  useEffect(() => {
    if (gameState === 'playing') {
      // クイズ画面に遷移する処理は親コンポーネントで処理
    }
  }, [gameState]);

  const handleReady = () => {
    const newReady = !isReady;
    setIsReady(newReady);
    // サーバーに準備状態を明示的に送信
    setPlayerReady(newReady);
  };

  const handleStartGame = () => {
    console.log('🎮 handleStartGame呼び出し');
    console.log('  isHost:', isHost);
    console.log('  players.length:', players.length);
    console.log('  allPlayersReady:', allPlayersReady);

    if (!isHost) {
      console.log('  ❌ ホストではないため終了');
      return;
    }

    const guests = players.filter(player => !player.isHost);
    console.log('  ゲスト数:', guests.length);

    // デバッグ用: 1人でもゲーム開始可能にする
    if (players.length < 1) {
      console.log('  ❌ プレイヤー数不足');
      Alert.alert('エラー', '最低1人のプレイヤーが必要です');
      return;
    }

    // ゲストがいない場合は警告を表示するが、続行可能にする
    if (guests.length === 0) {
      console.log('  ⚠️ ゲストがいません（デバッグモード: 続行可能）');
    }

    // ゲストがいる場合のみ準備完了チェック
    if (guests.length > 0 && !allPlayersReady) {
      const readyGuests = guests.filter(player => player.isReady);
      console.log('  ❌ 全員準備完了していません:', readyGuests.length, '/', guests.length);
      Alert.alert('エラー', `全てのゲストが準備完了する必要があります（${readyGuests.length}/${guests.length}人準備完了）`);
      return;
    }

    console.log('  ✅ 全チェック通過 - startGame()を直接呼び出し');
    console.log('  startGame関数の型:', typeof startGame);
    console.log('  startGame関数:', startGame);

    // Web環境ではAlert.alertが正しく動作しないため、直接startGame()を呼び出す
    // 本番環境では確認ダイアログを表示する場合は、カスタムモーダルを使用する
    if (typeof startGame !== 'function') {
      console.error('  ❌ startGameが関数ではありません!');
      Alert.alert('エラー', 'startGameが関数ではありません');
      return;
    }

    try {
      console.log('  startGame()呼び出し開始');
      const result = startGame();
      console.log('  startGame()呼び出し完了 - 戻り値:', result);
    } catch (error) {
      console.error('  ❌ startGame()エラー:', error);
      console.error('  エラースタック:', error.stack);
      Alert.alert('エラー', `ゲーム開始に失敗しました: ${error.message}`);
    }
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'ルーム退出',
      'ルームから退出しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: () => {
            leaveRoom();
            onBack();
          }
        }
      ]
    );
  };

  const renderPlayer = ({ item }) => {
    // ホストは常に準備完了として表示
    const isPlayerReady = item.isHost || item.isReady;

    return (
      <View style={[
        styles.playerItem,
        item.name === user.name && styles.currentPlayerItem
      ]}>
        <View style={styles.playerInfo}>
          <Text style={[
            styles.playerName,
            item.name === user.name && styles.currentPlayerName
          ]}>
            {item.name}
            {item.isHost && ' 👑 (ホスト)'}
            {item.name === user.name && ' (あなた)'}
          </Text>
        </View>
        <View style={[
          styles.readyStatus,
          isPlayerReady ? styles.readyStatusReady : styles.readyStatusWaiting
        ]}>
          <Text style={[
            styles.readyStatusText,
            isPlayerReady ? styles.readyStatusTextReady : styles.readyStatusTextWaiting
          ]}>
            {item.isHost ? 'ホスト' : (item.isReady ? '準備完了' : '待機中')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>待機室</Text>
      <Text style={styles.roomCode}>ルームコード: {roomId}</Text>

      <View style={styles.gameInfo}>
        <Text style={styles.gameInfoTitle}>
          {isHost ? '👑 ホストの役割' : '🎮 ゲストの役割'}
        </Text>
        <Text style={styles.gameInfoText}>
          {isHost
            ? '• 全てのゲストが準備完了したらゲーム開始\n• ゲームの進行を管理します\n• 準備完了ボタンは不要です'
            : '• 「準備する」ボタンをクリック\n• ホストのゲーム開始を待機\n• 全員同時にクイズがスタートします'
          }
        </Text>
        <View style={styles.divider} />
        <Text style={styles.gameInfoTitle}>クイズ情報</Text>
        <Text style={styles.gameInfoText}>
          • サンプル: 2問×10秒{'\n'}
          • 本番: 5問×20秒{'\n'}
          • 全員同時進行でリアルタイム対戦
        </Text>
      </View>

      <View style={styles.playersSection}>
        <Text style={styles.playersTitle}>
          参加者 ({players.length}人)
        </Text>

        {players.length === 0 ? (
          <View style={styles.emptyPlayers}>
            <Text style={styles.emptyPlayersText}>
              他のプレイヤーの参加を待っています...
            </Text>
          </View>
        ) : (
          <FlatList
            data={players}
            renderItem={renderPlayer}
            keyExtractor={(item) => item.id}
            style={styles.playersList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        {!isHost && (
          <TouchableOpacity
            style={[
              styles.readyButton,
              isReady ? styles.readyButtonActive : styles.readyButtonInactive
            ]}
            onPress={handleReady}
          >
            <Text style={[
              styles.readyButtonText,
              isReady ? styles.readyButtonTextActive : styles.readyButtonTextInactive
            ]}>
              {isReady ? '準備完了' : '準備する'}
            </Text>
          </TouchableOpacity>
        )}

        {isHost && (
          <>
            <View style={styles.hostInfoContainer}>
              <Text style={styles.hostInfoText}>
                {allPlayersReady
                  ? '✅ 全てのゲストが準備完了しました！'
                  : `⏳ ゲストの準備完了を待っています... (${players.filter(p => !p.isHost && p.isReady).length}/${players.filter(p => !p.isHost).length})`
                }
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.startButton,
                allPlayersReady ? styles.startButtonEnabled : styles.startButtonDisabled
              ]}
              onPress={handleStartGame}
              disabled={!allPlayersReady}
            >
              <Text style={[
                styles.startButtonText,
                allPlayersReady ? styles.startButtonTextEnabled : styles.startButtonTextDisabled
              ]}>
                {allPlayersReady ? 'ゲーム開始' : 'ゲスト全員の準備完了を待機中'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.leaveButton}
          onPress={handleLeaveRoom}
        >
          <Text style={styles.leaveButtonText}>ルームを退出</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  roomCode: {
    fontSize: 18,
    color: '#2196f3',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  gameInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  gameInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  gameInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  playersSection: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyPlayers: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPlayersText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  playersList: {
    flex: 1,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  currentPlayerItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentPlayerName: {
    color: '#2196f3',
  },
  readyStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  readyStatusReady: {
    backgroundColor: '#4caf50',
  },
  readyStatusWaiting: {
    backgroundColor: '#ff9800',
  },
  readyStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  readyStatusTextReady: {
    color: 'white',
  },
  readyStatusTextWaiting: {
    color: 'white',
  },
  buttonContainer: {
    gap: 10,
  },
  hostInfoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  hostInfoText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
    fontWeight: '500',
  },
  readyButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  readyButtonActive: {
    backgroundColor: '#4caf50',
  },
  readyButtonInactive: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  readyButtonTextActive: {
    color: 'white',
  },
  readyButtonTextInactive: {
    color: '#4caf50',
  },
  startButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonEnabled: {
    backgroundColor: '#4caf50',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  startButtonTextEnabled: {
    color: 'white',
  },
  startButtonTextDisabled: {
    color: '#999',
  },
  leaveButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#f44336',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
});