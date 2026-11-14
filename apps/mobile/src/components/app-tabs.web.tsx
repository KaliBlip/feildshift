import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, Text } from 'react-native';

import { CardShadow, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="calendar" href="/calendar" asChild>
            <TabButton>Calendar</TabButton>
          </TabTrigger>
          <TabTrigger name="compare" href="/compare" asChild>
            <TabButton>Compare</TabButton>
          </TabTrigger>
          <TabTrigger name="passport" href="/passport" asChild>
            <TabButton>Passport</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ref: _ref,
  ...props
}: TabTriggerSlotProps) {
  const theme = useTheme();

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused
              ? theme.primary
              : theme.backgroundElement,
          },
        ]}>
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? '#FFFFFF' : theme.textSecondary,
              fontWeight: isFocused ? '600' : '500',
            },
          ]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();

  return (
    <View {...props} style={styles.tabListContainer}>
      <View
        style={[
          styles.innerContainer,
          CardShadow,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Field Shift
        </ThemedText>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: 6,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.75,
  },
  tabButtonView: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
  },
  tabLabel: {
    fontSize: 12.5,
  },
});
