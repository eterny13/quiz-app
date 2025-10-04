import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useGame } from '../context/GameContext';

export default function RankingScreen({ navigation, user, onPlayAgain, onBackToLogin }) {
  const { players, leaveRoom } = useGame();
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    loadRankings();
  }, [players]);

  const loadRankings = () => {
    if (players && players.length > 0) {
      // マルチプレイヤーモード: プレイヤーのスコアと回答時間でランキングを作成
      const sortedPlayers = [...players].sort((a, b) => {
        // 正答数が多い方が上位
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // 正答数が同じ場合は回答時間が短い方が上位
        const timeA = a.totalAnswerTime || 0;
        const timeB = b.totalAnswerTime || 0;
        return timeA - timeB;
      });

      const rankedPlayers = sortedPlayers.map((player, index) => ({
        id: player.id,
        user: player.name,
        score: player.score,
        time: player.totalAnswerTime || 0,
        rank: index + 1
      }));

      setRankings(rankedPlayers);
    } else {
      // シングルプレイヤーモード: モックデータ
      const mockRankings = [
        { id: 1, user: 'テストユーザー', score: 5, time: 45000, rank: 1 },
        { id: 2, user: '田中太郎', score: 4, time: 38000, rank: 2 },
        { id: 3, user: '佐藤花子', score: 4, time: 42000, rank: 3 },
        { id: 4, user: '山田次郎', score: 3, time: 35000, rank: 4 },
        { id: 5, user: '鈴木美咲', score: 3, time: 40000, rank: 5 },
      ];

      const sortedRankings = mockRankings.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.time - b.time;
      });

      setRankings(sortedRankings);
    }
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const ms = Math.floor((milliseconds % 1000) / 100);
    return `${seconds}.${ms}秒`;
  };

  const renderRankingItem = ({ item }) => (
    <View style={[
      styles.rankingItem,
      user && item.user === user.name && styles.currentUserItem
    ]}>
      <Text style={styles.rank}>#{item.rank}</Text>
      <View style={styles.userInfo}>
        <Text style={[
          styles.userName,
          user && item.user === user.name && styles.currentUserName
        ]}>
          {item.user}
          {user && item.user === user.name && ' (あなた)'}
        </Text>
        <Text style={styles.userStats}>
          {item.score}問正解 - 合計回答時間: {formatTime(item.time || 0)}
        </Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{item.score}</Text>
        <Text style={styles.scoreLabel}>点</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ランキング</Text>

      <FlatList
        data={rankings}
        renderItem={renderRankingItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />

      <View style={styles.buttonContainer}>
        {onPlayAgain && (
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={onPlayAgain}
          >
            <Text style={styles.playAgainText}>もう一度プレイ</Text>
          </TouchableOpacity>
        )}

        {onBackToLogin && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (leaveRoom) {
                leaveRoom();
              }
              onBackToLogin();
            }}
          >
            <Text style={styles.backButtonText}>ログイン画面に戻る</Text>
          </TouchableOpacity>
        )}
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  currentUserItem: {
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
  scoreContainer: {
    alignItems: 'center',
    marginLeft: 10,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
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