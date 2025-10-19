import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const SparkleEffect = ({ isActive }) => {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 1 + Math.random() * 2,
        scale: 0.5 + Math.random() * 0.5,
      })),
    []
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {isActive &&
        sparkles.map((sparkle) => (
          <SparkleParticle key={sparkle.id} sparkle={sparkle} />
        ))}
    </View>
  );
};

const SparkleParticle = ({ sparkle }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: sparkle.duration * 500,
            delay: sparkle.delay * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: sparkle.scale,
            duration: sparkle.duration * 500,
            delay: sparkle.delay * 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: sparkle.duration * 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: sparkle.duration * 500,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [sparkle, opacityAnim, scaleAnim]);

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        {
          left: `${sparkle.x}%`,
          top: `${sparkle.y}%`,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      ✨
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
});

export default SparkleEffect;
