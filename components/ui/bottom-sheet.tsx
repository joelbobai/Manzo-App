import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.92;
const MID_POSITION = SHEET_HEIGHT * 0.35;
const HIDDEN_POSITION = SHEET_HEIGHT + 48;

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const translateY = useSharedValue(HIDDEN_POSITION);
  const contextY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(MID_POSITION, {
        damping: 16,
        stiffness: 260,
        overshootClamping: false,
      });
      return;
    }

    translateY.value = withTiming(HIDDEN_POSITION, { duration: 260 });
  }, [visible, translateY]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextValue = contextY.value + event.translationY;
      translateY.value = Math.min(Math.max(0, nextValue), HIDDEN_POSITION);
    })
    .onEnd(() => {
      const shouldClose = translateY.value > SHEET_HEIGHT * 0.6;

      if (shouldClose) {
        translateY.value = withTiming(HIDDEN_POSITION, { duration: 220 });
        runOnJS(onClose)();
        return;
      }

      const snapPoints = [0, MID_POSITION];
      const distances = snapPoints.map((point) => Math.abs(point - translateY.value));
      const nearestPoint = snapPoints[distances.indexOf(Math.min(...distances))];

      translateY.value = withSpring(nearestPoint, { damping: 16, stiffness: 260 });
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, HIDDEN_POSITION], [0.45, 0], Extrapolation.CLAMP),
  }));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[styles.overlay, overlayStyle]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.container, sheetStyle]}>
          <View style={styles.handle} />
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000066',
  },
  container: {
    position: 'absolute',
    bottom: -24,
    height: SHEET_HEIGHT,
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#0c2047',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  handle: {
    width: 56,
    height: 6,
    backgroundColor: '#e2e8f4',
    alignSelf: 'center',
    borderRadius: 3,
    marginVertical: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});

export default BottomSheet;
