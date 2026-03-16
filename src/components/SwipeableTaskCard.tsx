import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 70;
// isOpen encoding: 0=closed, -1=swiped left (delete visible), 1=swiped right (add visible)

interface SwipeableTaskCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  onAddMore: () => void;
}

export function SwipeableTaskCard({ children, onDelete, onAddMore }: SwipeableTaskCardProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      let tx: number;
      if (isOpen.value === -1) {
        tx = -90 + e.translationX;
      } else if (isOpen.value === 1) {
        tx = 90 + e.translationX;
      } else {
        tx = e.translationX;
      }
      translateX.value = Math.max(-90, Math.min(90, tx));
    })
    .onEnd(() => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-90, { duration: 200 });
        isOpen.value = -1;
      } else if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(90, { duration: 200 });
        isOpen.value = 1;
      } else {
        translateX.value = withTiming(0, { duration: 200 });
        isOpen.value = 0;
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleDelete = () => {
    translateX.value = withTiming(0, { duration: 200 });
    isOpen.value = 0;
    onDelete();
  };

  const handleAddMore = () => {
    translateX.value = withTiming(0, { duration: 200 });
    isOpen.value = 0;
    onAddMore();
  };

  return (
    <View style={styles.container}>
      {/* Left: "Thêm việc" button (swipe right reveals) */}
      <View style={[styles.bg, styles.leftBg]}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: 12 }]}
          onPress={handleAddMore}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Thêm việc</Text>
        </Pressable>
      </View>

      {/* Right: Delete button (swipe left reveals) */}
      <View style={[styles.bg, styles.rightBg]}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: theme.colors.danger, borderRadius: 12 }]}
          onPress={handleDelete}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionText}>Xóa</Text>
        </Pressable>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden', marginBottom: 12 },
  bg: { position: 'absolute', top: 0, bottom: 12, flexDirection: 'row', alignItems: 'center' },
  leftBg: { left: 0, paddingLeft: 6 },
  rightBg: { right: 0, paddingRight: 6 },
  actionBtn: { width: 80, height: '100%', alignItems: 'center', justifyContent: 'center' },
  actionIcon: { fontSize: 20 },
  actionText: { color: 'white', fontSize: 11, fontWeight: '700', marginTop: 3 },
});
