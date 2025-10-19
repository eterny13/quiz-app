import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const FinalResultsScreen = ({ rankings, onBackToLogin }) => {
  if (!rankings || rankings.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>結果を読み込み中...</Text>
      </View>
    );
  }

  // 統計情報を計算
  const fastestPlayer = [...rankings].sort(
    (a, b) => a.totalAnswerTime - b.totalAnswerTime
  )[0];
  const topScorer = [...rankings].sort((a, b) => b.score - a.score)[0];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🎉 ゲーム終了 🎉</Text>
          <Text style={styles.subtitle}>お疲れさまでした！</Text>
        </View>

        {/* 最終順位サマリー */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最終順位</Text>
          {rankings.map((ranking) => (
            <View key={ranking.playerId} style={styles.summaryItem}>
              <View style={styles.summaryRank}>
                <Text style={styles.summaryRankText}>{ranking.rank}位</Text>
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryName}>{ranking.playerName}</Text>
                <Text style={styles.summaryStats}>
                  {ranking.score}問正解 • {(ranking.totalAnswerTime / 1000).toFixed(1)}秒
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 統計情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>統計情報</Text>
          
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statLabel}>最多正解者</Text>
            <Text style={styles.statValue}>{topScorer.playerName}</Text>
            <Text style={styles.statDetail}>{topScorer.score}問正解</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statLabel}>最速回答者</Text>
            <Text style={styles.statValue}>{fastestPlayer.playerName}</Text>
            <Text style={styles.statDetail}>
              合計 {(fastestPlayer.totalAnswerTime / 1000).toFixed(1)}秒
            </Text>
          </View>
        </View>

        {/* ボタン */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToLogin}
          >
            <Text style={styles.backButtonText}>ログイン画面に戻る</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryRank: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  summaryRankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryStats: {
    fontSize: 14,
    color: '#666',
  },
  statCard: {
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  statIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statDetail: {
    fontSize: 14,
    color: '#999',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default FinalResultsScreen;
