import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import type { SignalState } from './crossing-api';

type Props = {
  signal: SignalState;
};

const CONFIG: Record<
  Exclude<SignalState, 'none'>,
  { bg: string; icon: string; label: string }
> = {
  walk: {
    bg: '#16a34a',    // green-600
    icon: '🚶',
    label: 'Walk Signal',
  },
  dont_walk: {
    bg: '#dc2626',    // red-600
    icon: '✋',
    label: "Don't Walk Signal",
  },
};

export function CrossingBanner({ signal }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: signal === 'none' ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [signal, opacity]);

  if (signal === 'none') {
    return (
      <Animated.View style={{ opacity, position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View />
      </Animated.View>
    );
  }

  const { bg, icon, label } = CONFIG[signal];

  return (
    <Animated.View
      style={{
        opacity,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: bg,
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
      accessibilityLiveRegion="assertive"
      accessibilityLabel={label}
    >
      {/* Circle icon */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: 'rgba(255,255,255,0.25)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text
        style={{
          color: '#ffffff',
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: 0.2,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
