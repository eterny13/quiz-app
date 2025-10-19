import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const RankingItem = ({ ranking, isVisible, isCurrentUser, animationDelay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const isTopThree = ranking.rank <= 3;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          delay: animationDelay,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay: animationDelay,
          useNativeDriver: true,
        }),
        isTopThree && Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 300,
            delay: animationDelay,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isVisible, animationDelay, isTopThree, slideAnim, fadeAnim, scaleAnim]);

  const getBackgroundStyle = () => {
    if (!isTopThree) {
      return styles.normalBackground;
    }

    switch (ranking.rank) {
      case 1:
        return styles.goldBackground;
      case 2:
        return styles.silverBackground;
      case 3:
        return styles.bronzeBackground;
      default:
        return styles.normalBackground;
    }
  };

  const getRankIcon = () => {
    switch (ranking.rank) {
      case 1:
        return '👑';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        getBackgroundStyle(),
        isCurrentUser && styles.currentUserBorder,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: isTopThree ? scaleAnim : 1 },
          ],
        },
      ]}
    >
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, isTopThree && styles.topThreeRankText]}>
          {ranking.rank}
        </Text>
        {getRankIcon() && (
          <Text style={styles.rankIcon}>{getRankIcon()}</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.playerName, isTopThree && styles.topThreeText]}>
          {ranking.playerName}
          {isCurrentUser && ' (あなた)'}
        </Text>
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, isTopThree && styles.topThreeStatsText]}>
            {ranking.score}問正解
          </Text>
          <Text style={[styles.statsText, isTopThree && styles.topThreeStatsText]}>
            {' • '}
          </Text>
          <Text style={[styles.statsText, isTopThree && styles.topThreeStatsText]}>
            {(ranking.totalAnswerTime / 1000).toFixed(1)}秒
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  normalBackground: {
    backgroundColor: '#FFFFFF',
  },
  goldBackground: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  silverBackground: {
    backgroundColor: '#C0C0C0',
    borderWidth: 2,
    borderColor: '#A8A8A8',
  },
  bronzeBackground: {
    backgroundColor: '#CD7F32',
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  currentUserBorder: {
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    marginRight: 15,
  },
  rankText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  topThreeRankText: {
    fontSize: 28,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rankIcon: {
    fontSize: 24,
    marginLeft: 5,
  },
  infoContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  topThreeText: {
    fontSize: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  topThreeStatsText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default RankingItem;
