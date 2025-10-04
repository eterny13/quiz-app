import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useGame } from '../context/GameContext';

export default function RoomScreen({ user, onBack }) {
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const { connectToRoom } = useGame();

  // ルーム作成
  const createRoom = () => {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setIsCreatingRoom(true);
    
    try {
      connectToRoom(newRoomCode, user.name, true); // ホストとして接続
      Alert.alert(
        'ルーム作成完了',
        `ルームコード: ${newRoomCode}\n他のプレイヤーにこのコードを共有してください`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('エラー', 'ルームの作成に失敗しました');
      setIsCreatingRoom(false);
    }
  };

  // ルーム参加
  const joinRoom = () => {
    if (!roomCode.trim()) {
      Alert.alert('エラー', 'ルームコードを入力してください');
      return;
    }

    try {
      connectToRoom(roomCode.trim().toUpperCase(), user.name, false);
    } catch (error) {
      Alert.alert('エラー', 'ルームへの参加に失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>マルチプレイヤー</Text>
      <Text style={styles.subtitle}>ようこそ、{user.name}さん！</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>新しいルームを作成</Text>
        <Text style={styles.description}>
          あなたがホストとなり、他のプレイヤーを招待できます
        </Text>
        <TouchableOpacity
          style={[styles.createButton, isCreatingRoom && styles.disabledButton]}
          onPress={createRoom}
          disabled={isCreatingRoom}
        >
          <Text style={styles.createButtonText}>
            {isCreatingRoom ? 'ルーム作成中...' : 'ルームを作成'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>既存のルームに参加</Text>
        <Text style={styles.description}>
          ホストから共有されたルームコードを入力してください
        </Text>
        
        <TextInput
          style={styles.textInput}
          value={roomCode}
          onChangeText={setRoomCode}
          placeholder="ルームコードを入力 (例: ABC123)"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          maxLength={6}
        />
        
        <TouchableOpacity
          style={styles.joinButton}
          onPress={joinRoom}
        >
          <Text style={styles.joinButtonText}>ルームに参加</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>戻る</Text>
      </TouchableOpacity>
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  joinButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});