import { Lock, Phone, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button, Field, Heading, Label } from '@/components/ui';
import {
  CardShadow,
  MaxContentWidth,
  roofiRadii,
  roofiSpacing,
} from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { DEMO_ACCOUNTS } from '@/lib/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('0512345601');
  const [pin, setPin] = useState('1111');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await signIn(phone, pin);
      if (!res.ok) {
        setError(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.brandHeader}>
            <View
              style={[
                styles.brandBadge,
                { backgroundColor: theme.personal.surface },
              ]}>
              <ShieldCheck size={20} color={theme.personal.ink} />
              <ThemedText
                type="smallBold"
                style={{ color: theme.personal.ink }}>
                FIELD SHIFT · ASHANTI PILOT
              </ThemedText>
            </View>
            <Heading title="Sign in with Phone & PIN" />
            <ThemedText type="small" style={{ color: theme.secondary }}>
              Offline-ready role access for smallholders, MoFA extension
              officers, and CSIR-CRI agronomists.
            </ThemedText>
          </View>

          <View
            style={[
              styles.card,
              CardShadow,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHeader}>
                <Phone size={14} color={theme.secondary} />
                <Label>PHONE NUMBER</Label>
              </View>
              <Field
                label=""
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setError(null);
                }}
                keyboardType="phone-pad"
                placeholder="0512345601"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldHeader}>
                <Lock size={14} color={theme.secondary} />
                <Label>4-DIGIT PIN</Label>
              </View>
              <Field
                label=""
                value={pin}
                onChangeText={(text) => {
                  setPin(text.replace(/\D/g, '').slice(0, 4));
                  setError(null);
                }}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                placeholder="••••"
              />
            </View>

            {error && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: theme.warningSurface,
                    borderColor: theme.warning,
                  },
                ]}>
                <ThemedText type="small" style={{ color: theme.warning }}>
                  {error}
                </ThemedText>
              </View>
            )}

            <Button
              title={submitting ? 'Signing in…' : 'Sign In'}
              onPress={() => void handleSignIn()}
              disabled={submitting}
            />
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}>
            <Label>CHALLENGE DEMO CREDENTIALS (TAP TO FILL)</Label>
            <View style={styles.demoList}>
              {DEMO_ACCOUNTS.map((acct) => {
                const isSelected =
                  phone === acct.phone && pin === acct.pin;
                return (
                  <Pressable
                    key={acct.id}
                    onPress={() => {
                      setPhone(acct.phone);
                      setPin(acct.pin);
                      setError(null);
                    }}
                    style={({ pressed }) => [
                      styles.demoChip,
                      {
                        backgroundColor: isSelected
                          ? theme.personal.surface
                          : theme.surface,
                        borderColor: isSelected
                          ? theme.personal.edge
                          : theme.border,
                        opacity: pressed ? 0.78 : 1,
                      },
                    ]}>
                    <View style={styles.demoChipMain}>
                      <ThemedText
                        type="smallBold"
                        style={{
                          color: isSelected
                            ? theme.personal.ink
                            : theme.foreground,
                        }}>
                        {acct.role === 'farmer'
                          ? 'Farmer'
                          : acct.role === 'extension_officer'
                            ? 'Extension Officer'
                            : 'Agronomist'}{' '}
                        · {acct.displayName}
                      </ThemedText>
                      <ThemedText
                        type="code"
                        style={{ color: theme.secondary }}>
                        {acct.phone} · PIN {acct.pin}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: roofiSpacing[5],
    gap: roofiSpacing[5],
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandHeader: {
    gap: 8,
  },
  brandBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: roofiRadii.pill,
  },
  card: {
    padding: roofiSpacing[5],
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
    gap: 14,
  },
  fieldRow: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBox: {
    padding: 10,
    borderRadius: roofiRadii.md,
    borderWidth: 1,
  },
  demoList: {
    gap: 8,
  },
  demoChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: roofiRadii.md,
    borderWidth: 1,
  },
  demoChipMain: {
    gap: 2,
  },
});
