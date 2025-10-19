import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ConfettiEffect = ({ isActive }) => {
  const confetti = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#FF9FF3'][
          Math.floor(Math.random() * 5)
        ],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8,
      })),
    []
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {isActive &&
        confetti.map((piece) => (
          <ConfettiPiece key={piece.id} piece={piece} />
        ))}
    </View>
  );
};

const ConfettiPiece = ({ piece }) => {
  const translateYAnim = useRef(new Animated.Value(-50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateYAnim, {
        toValue: SCREEN_HEIGHT + 50,
        duration: piece.duration * 1000,
        delay: piece.delay * 1000,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: piece.rotation,
        duration: piece.duration * 1000,
        delay: piece.delay * 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: piece.duration * 1000,
        delay: piece.delay * 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [piece, translateYAnim, rotateAnim, opacityAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: `${piece.x}%`,
          backgroundColor: piece.color,
          width: piece.size,
          height: piece.size,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }, { rotate }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
    top: -50,
    borderRadius: 2,
  },
});

export default ConfettiEffect;
