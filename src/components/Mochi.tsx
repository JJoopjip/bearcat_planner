import React, { useEffect } from "react";
import { StyleSheet, View, AccessibilityInfo } from "react-native";
import { Image, type ImageSource } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import type { MochiPose } from "@/lib/mood";
import { poseTint, poseMotion } from "@/lib/mood";
import { colors } from "@/theme/tokens";

const POSES: Record<MochiPose, ImageSource> = {
  angry: require("../../assets/mochi/mochi-angry.png"),
  confused: require("../../assets/mochi/mochi-confused.png"),
  drink: require("../../assets/mochi/mochi-drink.png"),
  exercising: require("../../assets/mochi/mochi-exercising.png"),
  happy: require("../../assets/mochi/mochi-happy.png"),
  icecream: require("../../assets/mochi/mochi-icecream.png"),
  love: require("../../assets/mochi/mochi-love.png"),
  peeking: require("../../assets/mochi/mochi-peeking.png"),
  playing: require("../../assets/mochi/mochi-playing.png"),
  reading: require("../../assets/mochi/mochi-reading.png"),
  sad: require("../../assets/mochi/mochi-sad.png"),
  scared: require("../../assets/mochi/mochi-scared.png"),
  sleeping: require("../../assets/mochi/mochi-sleeping.png"),
  thinking: require("../../assets/mochi/mochi-thinking.png"),
  thumbsup: require("../../assets/mochi/mochi-thumbsup.png"),
  waving: require("../../assets/mochi/mochi-waving.png"),
};

type Scene = "blossom" | "garden" | "night" | "cafe" | null;

export type MochiProps = {
  pose: MochiPose;
  size?: number;
  stage?: 1 | 2 | 3;
  scene?: Scene;
  /** small non-animated variant for chips/buttons */
  mini?: boolean;
};

const sceneColors: Record<Exclude<Scene, null>, string> = {
  blossom: "#FDE4EE",
  garden: "#E4F2E9",
  night: "#E5DDF6",
  cafe: "#FAEBD6",
};

export function Mochi({ pose, size = 150, stage = 1, scene = null, mini = false }: MochiProps) {
  const bob = useSharedValue(0);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    cancelAnimation(bob);
    if (mini || reduceMotion) {
      bob.value = 0;
      return;
    }
    const motion = poseMotion[pose];
    switch (motion) {
      case "idle":
        bob.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) })
          ),
          -1
        );
        break;
      case "rock":
        bob.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
            withTiming(-1, { duration: 1300, easing: Easing.inOut(Easing.sin) })
          ),
          -1
        );
        break;
      case "hop":
        bob.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 750, easing: Easing.in(Easing.quad) })
          ),
          -1
        );
        break;
      case "breathe":
        bob.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2750, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 2750, easing: Easing.inOut(Easing.sin) })
          ),
          -1
        );
        break;
      case "sway":
        bob.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
            withTiming(-1, { duration: 3000, easing: Easing.inOut(Easing.sin) })
          ),
          -1
        );
        break;
      case "settle":
        bob.value = 1;
        bob.value = withSpring(0, { damping: 9, stiffness: 90 });
        break;
      default:
        bob.value = 0;
    }
  }, [pose, mini, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const motion = poseMotion[pose];
    if (mini || reduceMotion) return {};
    switch (motion) {
      case "idle":
        return { transform: [{ translateY: -4 * bob.value }, { rotate: `${-1.2 * bob.value}deg` }] };
      case "rock":
        return { transform: [{ rotate: `${3 * bob.value}deg` }, { translateY: -3 * Math.abs(bob.value) }] };
      case "hop":
        return { transform: [{ translateY: -11 * bob.value }, { scale: 1 + 0.03 * bob.value }] };
      case "breathe":
        return { transform: [{ scale: 1 + 0.035 * bob.value }] };
      case "sway":
        return { transform: [{ rotate: `${1.6 * bob.value}deg` }] };
      case "settle":
        return { transform: [{ translateY: 14 * bob.value }], opacity: 1 - 0.5 * bob.value };
      default:
        return {};
    }
  });

  const dim = { width: size, height: size * 1.071 };

  return (
    <View style={[styles.wrap, dim]}>
      {scene && <View style={[styles.scene, { backgroundColor: sceneColors[scene] }]} />}
      <View style={[styles.glow, { backgroundColor: poseTint[pose] }]} />
      {!mini && stage >= 2 && <View style={styles.halo} />}
      <Animated.View style={[dim, animatedStyle]}>
        <Image source={POSES[pose]} style={dim} contentFit="contain" />
      </Animated.View>
      {!mini && stage >= 3 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.orbitDot, { left: "4%", top: "38%", backgroundColor: colors.lilac }]} />
          <View style={[styles.orbitDot, { right: "2%", top: "24%", backgroundColor: colors.butter }]} />
          <View style={[styles.orbitDot, { left: "22%", bottom: "8%", backgroundColor: colors.mint }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "center", position: "relative" },
  glow: {
    position: "absolute",
    left: "2%",
    top: "4%",
    width: "96%",
    aspectRatio: 1,
    borderRadius: 999,
    opacity: 0.6,
  },
  halo: {
    position: "absolute",
    left: "-5%",
    top: "-1%",
    width: "110%",
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.pink,
    borderStyle: "dashed",
    opacity: 0.4,
  },
  scene: {
    position: "absolute",
    left: "-9%",
    top: "-6%",
    width: "118%",
    aspectRatio: 1,
    borderRadius: 999,
  },
  orbitDot: { position: "absolute", width: 7, height: 7, borderRadius: 4 },
});
