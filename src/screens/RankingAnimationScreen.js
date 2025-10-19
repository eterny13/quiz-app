import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import RankingItem from '../components/RankingItem';
import SparkleEffect from '../components/SparkleEffect';
import ConfettiEffect from '../components/ConfettiEffect';

const RankingAnimationScreen = ({
  rankings,
  quizType,
  currentUserId,
  onComplete,
  startTime,
  duration,
  getServerNow,
}) => {
  const [visibleRanks, setVisibleRanks] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration || (quizType === 'sample' ? 10 : 15));

  const totalQuestions = quizType === 'sample' ? 5 : 10;
  const displayDuration = (duration || (quizType === 'sample' ? 10 : 15)) * 1000;

  const getDelayForRank = useCallback((rank) => {
    if (rank === 3) return 800;
    if (rank === 2) return 1000;
    if (rank === 1) return 1200;
    return 300;
  }, []);

  const displayRankings = useCallback(async () => {
    if (!rankings || rankings.length === 0) return;

    // 10位から1位の順にソート
    const sortedRankings = [...rankings].sort((a, b) => b.rank - a.rank);

    for (let i = 0; i < sortedRankings.length; i++) {
      if (isSkipped) break;

      const ranking = sortedRankings[i];
      const delay = getDelayForRank(ranking.rank);

      await new Promise((resolve) => setTimeout(resolve, delay));

      setVisibleRanks((prev) => [...prev, ranking.rank]);

      if (ranking.rank === 1) {
        setShowConfetti(true);
      }
    }

    // 全て表示完了後、カウントダウン表示（サーバー時刻で同期）
    const interval = setInterval(() => {
      const serverNow = getServerNow ? getServerNow() : Date.now();
      const elapsed = serverNow - (startTime || Date.now());
      const remaining = Math.max(
        0,
        Math.ceil((displayDuration - elapsed) / 1000)
      );
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        // 自動遷移
        onComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [rankings, isSkipped, getDelayForRank, displayDuration, onComplete, startTime, getServerNow]);

  useEffect(() => {
    displayRankings();
  }, [displayRankings]);

  const handleSkip = () => {
    if (isSkipped) return;

    setIsSkipped(true);
    // 全順位を即座に表示
    setVisibleRanks(rankings.map((r) => r.rank));
    // 1位の紙吹雪を表示
    if (rankings.some((r) => r.rank === 1)) {
      setShowConfetti(true);
    }

    // スキップ後も一定時間表示
    setTimeout(() => {
      onComplete();
    }, 5000);
  };

  if (!rankings || rankings.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>ランキングを読み込み中...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={handleSkip}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {quizType === 'sample' ? 'サンプルクイズ' : '本番クイズ'}
        </Text>
        <Text style={styles.subtitle}>ランキング発表</Text>
        <Text style={styles.timer}>次の画面まで: {timeLeft}秒</Text>
        {!isSkipped && visibleRanks.length < rankings.length && (
          <Text style={styles.skipHint}>画面をタップでスキップ</Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {rankings.map((ranking) => {
          const isVisible = visibleRanks.includes(ranking.rank);
          const isCurrentUser = ranking.playerId === currentUserId;
          const isTopThree = ranking.rank <= 3;

          return (
            <View key={ranking.playerId} style={styles.rankingItemContainer}>
              {isTopThree && isVisible && (
                <SparkleEffect isActive={true} />
              )}
              <RankingItem
                ranking={ranking}
                isVisible={isVisible}
                isCurrentUser={isCurrentUser}
                animationDelay={0}
              />
            </View>
          );
        })}
      </ScrollView>

      {showConfetti && <ConfettiEffect isActive={true} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 10,
  },
  timer: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  skipHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  rankingItemContainer: {
    position: 'relative',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default RankingAnimationScreen;
