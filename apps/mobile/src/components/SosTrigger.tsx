import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Modal, Pressable, Text, View } from 'react-native';

const LONG_PRESS_MS = 2000;
const TRIPLE_TAP_WINDOW_MS = 600;
const COUNTDOWN_SEC = 3;
const AU_TRIPLE_ZERO = '000';

type Props = {
  /** Phone number of the emergency contact (from prefs). */
  contactPhone?: string;
  /** Name shown on confirmation modal. */
  contactName?: string;
};

export function SosTrigger({ contactPhone, contactName }: Props) {
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SEC);
  const longTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);
  const tapResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLong = useCallback(() => {
    if (longTimerRef.current) { clearTimeout(longTimerRef.current); longTimerRef.current = null; }
  }, []);

  const openCountdown = useCallback(() => {
    clearLong();
    if (tapResetRef.current) { clearTimeout(tapResetRef.current); tapResetRef.current = null; }
    tapCountRef.current = 0;
    setSecondsLeft(COUNTDOWN_SEC);
    setOpen(true);
  }, [clearLong]);

  const onPressIn = useCallback(() => {
    clearLong();
    longTimerRef.current = setTimeout(openCountdown, LONG_PRESS_MS);
  }, [clearLong, openCountdown]);

  const onPressOut = useCallback(() => clearLong(), [clearLong]);

  const onPress = useCallback(() => {
    tapCountRef.current += 1;
    if (tapResetRef.current) clearTimeout(tapResetRef.current);
    if (tapCountRef.current >= 3) { tapCountRef.current = 0; openCountdown(); return; }
    tapResetRef.current = setTimeout(() => { tapCountRef.current = 0; }, TRIPLE_TAP_WINDOW_MS);
  }, [openCountdown]);

  const cancel = useCallback(() => { setOpen(false); setSecondsLeft(COUNTDOWN_SEC); }, []);

  const sendSms = useCallback(async () => {
    const phone = contactPhone?.trim();
    if (!phone) return;
    try {
      const avail = await SMS.isAvailableAsync();
      if (!avail) return;
      let loc = '';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          loc = ` Location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        }
      } catch { /* no location */ }
      await SMS.sendSMSAsync([phone], `Emergency alert (AI-Detect).${loc}`);
    } catch {
      Alert.alert('SMS failed', 'Could not send emergency SMS.');
    }
  }, [contactPhone]);

  useEffect(() => {
    if (!open) return;
    let left = COUNTDOWN_SEC;
    setSecondsLeft(left);
    const id = setInterval(() => {
      left -= 1;
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        setOpen(false);
        setSecondsLeft(COUNTDOWN_SEC);
        void (async () => {
          try { await Linking.openURL(`tel:${AU_TRIPLE_ZERO}`); }
          catch { Alert.alert('Call failed', 'Could not open the phone dialler.'); }
          setTimeout(() => void sendSms(), 800);
        })();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [open, sendSms]);

  return (
    <>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        className="w-14 h-14 rounded-full items-center justify-center bg-red-500 shadow-lg active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS"
        accessibilityHint="Hold 2 seconds or triple-tap to call Triple Zero (000)"
      >
        <Text className="text-white text-xs font-bold">SOS</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={cancel}>
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-sm bg-white rounded-2xl p-6">
            <Text
              className="text-center text-lg font-bold text-gray-900"
              accessibilityLiveRegion="polite"
            >
              Calling {AU_TRIPLE_ZERO} in {secondsLeft}…
            </Text>
            {contactName ? (
              <Text className="text-center text-sm text-gray-500 mt-2">
                SMS will also be sent to {contactName}
              </Text>
            ) : null}
            <Text className="text-center text-sm text-gray-500 mt-1">
              Cancel now if this was a mistake.
            </Text>
            <Pressable
              onPress={cancel}
              className="mt-5 bg-gray-100 rounded-xl py-4 items-center active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Cancel emergency call"
            >
              <Text className="text-base font-semibold text-gray-800">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
