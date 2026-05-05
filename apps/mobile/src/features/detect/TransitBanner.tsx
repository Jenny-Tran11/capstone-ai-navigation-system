import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

type Props = {
  busNumber: string | null;
  destination: string | null;
};

export function TransitBanner({ busNumber, destination }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const visible = busNumber !== null;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) {
    return <Animated.View style={{ opacity }} />;
  }

  return (
    <Animated.View
      style={{
        opacity,
        position: 'absolute',
        bottom: 120,
        left: 16,
        right: 16,
        backgroundColor: '#facc15', // yellow-400
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      }}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Bus ${busNumber}${destination ? `, ${destination}` : ''}`}
    >
      {/* Bus icon circle */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#1c1c1c',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 20 }}>🚌</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#1c1c1c', fontSize: 20, fontWeight: '700' }}>
          {busNumber} arrived
        </Text>
        {destination ? (
          <Text style={{ color: '#1c1c1c', fontSize: 14, marginTop: 2 }}>
            {destination}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}
