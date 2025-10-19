import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { useGame } from '../context/GameContext';

export default function InstructionsScreen() {
  const { instructionsTimeLeft, players } = useGame();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ゲーム開始準備</Text>
        <View style={styles.timerContainer}>
          <View style={[
            styles.timerCircle,
            instructionsTimeLeft <= 5 && styles.timerCircleWarning
          ]}>
            <Text style={[
              styles.timer,
              instructionsTimeLeft <= 5 && styles.timerWarning
            ]}>
              {instructionsTimeLeft}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>
          🎯 サンプルクイズについて
        </Text>
        
        <View style={styles.instructionItem}>
          <Text style={styles.instructionIcon}>📝</Text>
          <Text style={styles.instructionText}>
            これから5問のサンプルクイズを行います
          </Text>
        </View>

        <View style={styles.instructionItem}>
          <Text style={styles.instructionIcon}>⏰</Text>
          <Text style={styles.instructionText}>
            各問題の制限時間は20秒です
          </Text>
        </View>

        <View style={styles.instructionItem}>
          <Text style={styles.instructionIcon}>🚀</Text>
          <Text style={styles.instructionText}>
            全員が同時にスタートします
          </Text>
        </View>

        <View style={styles.instructionItem}>
          <Text style={styles.instructionIcon}>🎮</Text>
          <Text style={styles.instructionText}>
            回答後は結果発表まで待機してください
          </Text>
        </View>

        <View style={styles.instructionItem}>
          <Text style={styles.instructionIcon}>🏆</Text>
          <Text style={styles.instructionText}>
            正解数と回答速度で競争しましょう！
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
          {instructionsTimeLeft > 5 
            ? 'まもなくクイズが始まります...' 
            : `${instructionsTimeLeft}秒後にスタート！`
          }
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
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#2e7d32',
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
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    marginBottom: 30,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructionIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
  },
  instructionText: {
    fontSize: 16,
    color: '#555',
    flex: 1,
    lineHeight: 22,
  },
  playersInfo: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  playersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  countdownContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
});