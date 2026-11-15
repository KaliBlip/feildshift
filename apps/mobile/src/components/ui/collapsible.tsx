import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PlannerIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, roofiRadii, roofiSpacing } from '@/constants/theme';
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
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        style={({ pressed }) => [
          styles.heading,
          pressed && styles.pressedHeading,
        ]}
        onPress={() => setIsOpen((value) => !value)}>
        <View
          style={[
            styles.button,
            {
              backgroundColor: isOpen
                ? theme.personal.surface
                : theme.surfaceSubtle,
            },
          ]}>
          <View style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
            <PlannerIcon
              name="chevron"
              size={15}
              color={isOpen ? theme.primary : theme.secondary}
            />
          </View>
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
                backgroundColor: theme.surfaceSubtle,
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
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
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
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    flex: 1,
  },
  content: {
    marginTop: 10,
    borderRadius: roofiRadii.xl,
    padding: 12,
  },
});
