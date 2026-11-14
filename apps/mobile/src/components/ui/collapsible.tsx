import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wrapper,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <Pressable
        style={({ pressed }) => [styles.heading, pressed && styles.pressedHeading]}
        onPress={() => setIsOpen((value) => !value)}>
        <View
          style={[
            styles.button,
            { backgroundColor: isOpen ? theme.primarySoft : theme.iconBg },
          ]}>
          <SymbolView
            name={{
              ios: 'chevron.right',
              android: 'chevron_right',
              web: 'chevron_right',
            }}
            size={13}
            weight="bold"
            tintColor={isOpen ? theme.primaryText : theme.textSecondary}
            style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
          />
        </View>

        <ThemedText type="smallBold" style={styles.titleText}>
          {title}
        </ThemedText>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(180)}>
          <View
            style={[
              styles.content,
              {
                backgroundColor: theme.backgroundElement,
              },
            ]}>
            {children}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pressedHeading: {
    opacity: 0.75,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: Radii.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    flex: 1,
  },
  content: {
    marginTop: 10,
    borderRadius: Radii.md,
    padding: 12,
  },
});
