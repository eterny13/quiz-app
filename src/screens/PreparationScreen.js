import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { useGame } from '../context/GameContext';

export default function PreparationScreen() {
  const { preparationTimeLeft, players } = useGame();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 本番クイズ準備</Text>
        <View style={styles.timerContainer}>
          <View style={[
            styles.timerCircle,
            preparationTimeLeft <= 3 && styles.timerCircleWarning
          ]}>
            <Text style={[
              styles.timer,
              preparationTimeLeft <= 3 && styles.timerWarning
            ]}>
              {preparationTimeLeft}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.congratsContainer}>
        <Text style={styles.congratsTitle}>
          🎉 サンプルクイズお疲れさまでした！
        </Text>
        <Text style={styles.congratsText}>
          いよいよ本番のクイズが始まります
        </Text>
      </View>

      <View style={styles.mainQuizInfo}>
        <Text style={styles.mainQuizTitle}>
          📚 本番クイズについて
        </Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📝</Text>
          <Text style={styles.infoText}>
            全10問の4択クイズです
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>⏰</Text>
          <Text style={styles.infoText}>
            各問題の制限時間は60秒です
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🏆</Text>
          <Text style={styles.infoText}>
            正解数と回答速度で順位が決まります
          </Text>
        </View>

      </View>

      <View style={styles.playersInfo}>
        <Text style={styles.playersTitle}>
          参加者 ({players.length}人)
        </Text>
        <Text style={styles.playersText}>
          {players.map(player => player.name).join(', ')}
        </Text>
      </View>

      <View style={styles.countdownContainer}>
        <Text style={styles.countdownText}>
          {preparationTimeLeft > 3 
            ? '本番クイズまであと少し...' 
            : `${preparationTimeLeft}秒後に本番スタート！`
          }
        </Text>
        <Text style={styles.readyText}>
          準備はいいですか？
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#1976d2',
  },
  timerCircleWarning: {
    backgroundColor: '#ff9800',
    borderColor: '#f57c00',
  },
  timer: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  timerWarning: {
    color: 'white',
    fontSize: 32,
  },
  congratsContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
    textAlign: 'center',
  },
  congratsText: {
    fontSize: 16,
    color: '#388e3c',
    textAlign: 'center',
  },
  mainQuizInfo: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    marginBottom: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainQuizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 25,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  playersInfo: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  playersText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  countdownContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f57c00',
    textAlign: 'center',
    marginBottom: 8,
  },
  readyText: {
    fontSize: 16,
    color: '#ff9800',
    textAlign: 'center',
  },
});