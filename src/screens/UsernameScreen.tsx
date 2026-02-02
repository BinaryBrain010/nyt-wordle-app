import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState, useMemo, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { setCurrentUser } from '../utils/users';

type Props = NativeStackScreenProps<RootStackParamList, 'Username'>;

export function UsernameScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const responsive = useMemo(() => {
    const isNarrow = width < 380;
    const isShort = height < 700;
    return {
      paddingH: Math.max(20, Math.min(32, width * 0.08)),
      paddingTop: insets.top + (isShort ? 40 : 60),
      paddingBottom: insets.bottom + 24,
      titleSize: Math.min(52, Math.max(36, width * 0.14)),
      subtitleSize: isNarrow ? 16 : 18,
      inputFontSize: isNarrow ? 16 : 18,
      buttonPaddingV: isShort ? 14 : 16,
      buttonPaddingH: Math.min(44, width * 0.12)
    };
  }, [width, height, insets.top, insets.bottom]);

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await setCurrentUser(trimmed);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save username');
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: responsive.paddingH,
            paddingTop: responsive.paddingTop,
            paddingBottom: responsive.paddingBottom
          }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.content}>
          <Text style={[styles.title, { fontSize: responsive.titleSize }]}>Who is playing?</Text>
          <Text
            style={[
              styles.subtitle,
              {
                fontSize: responsive.subtitleSize,
                maxWidth: width * 0.82
              }
            ]}
          >
            Enter your name to track your stats and streaks
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  fontSize: responsive.inputFontSize,
                  paddingHorizontal: 16,
                  paddingVertical: 14
                },
                error && styles.inputError
              ]}
              placeholder="Enter your name"
              placeholderTextColor={colors.mutedText}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError(null);
              }}
              onSubmitEditing={handleSubmit}
              autoFocus={false}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              editable={!isSubmitting}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              {
                paddingVertical: responsive.buttonPaddingV,
                paddingHorizontal: responsive.buttonPaddingH
              },
              (isSubmitting || !username.trim()) && styles.submitButtonDisabled,
              pressed && !isSubmitting && styles.submitButtonPressed
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !username.trim()}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 20
  },
  title: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1.2,
    marginBottom: 16,
    textAlign: 'center',
    ...(Platform.OS === 'ios' && { fontVariant: ['tabular-nums'] })
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.2,
    opacity: 0.92
  },
  inputContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 24
  },
  input: {
    backgroundColor: colors.tileEmpty,
    borderWidth: 2,
    borderColor: colors.tileBorder,
    borderRadius: 8,
    color: colors.text,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8
      },
      android: { elevation: 2 }
    })
  },
  inputError: {
    borderColor: colors.loseCross
  },
  errorText: {
    color: colors.loseCross,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500'
  },
  submitButton: {
    backgroundColor: colors.button,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12
      },
      android: { elevation: 4 }
    })
  },
  submitButtonPressed: {
    opacity: 0.88
  },
  submitButtonDisabled: {
    opacity: 0.5
  },
  submitButtonText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
