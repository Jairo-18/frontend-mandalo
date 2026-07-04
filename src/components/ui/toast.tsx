import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setToastListener, ToastPayload, ToastType } from '@/lib/toast';

const CONFIG: Record<
  ToastType,
  { bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  success: { bg: '#16A34A', icon: 'checkmark-circle' },
  error: { bg: '#DC2626', icon: 'alert-circle' },
  info: { bg: '#1E1E2D', icon: 'information-circle' },
};

const DURATION = 3500;

/** Overlay global de toasts. Se monta una sola vez en el layout raíz. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [payload, setPayload] = useState<ToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setToastListener((t) => setPayload(t));
    return () => setToastListener(null);
  }, []);

  useEffect(() => {
    if (!payload) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(hide, DURATION);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  function hide() {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -24,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setPayload(null));
  }

  if (!payload) return null;
  const cfg = CONFIG[payload.type];

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 10, left: 16, right: 16 }}
    >
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Pressable
          onPress={hide}
          style={{ backgroundColor: cfg.bg }}
          className="flex-row items-center gap-3 rounded-2xl px-4 py-3 shadow-lg"
        >
          <Ionicons name={cfg.icon} size={22} color="#FFFFFF" />
          <Text className="flex-1 text-[14px] font-semibold text-white">
            {payload.message}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
