import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlannerIcon, type PlannerIconName } from '@/components/icons';
import { roofiRadii, roofiTypography } from '@/constants/theme';
import { useTheme } from '@/theme/useTheme';

const VISIBLE_TABS = new Set(['index', 'calendar', 'compare', 'passport']);

const tabIcons: Record<string, PlannerIconName> = {
  index: 'home',
  calendar: 'calendar',
  compare: 'compare',
  passport: 'passport',
};

type BottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

export function RoofiBottomTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  const activeRouteName = state.routes[state.index]?.name;
  if (activeRouteName && !VISIBLE_TABS.has(activeRouteName)) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: Math.max(insets.bottom, 12),
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 10,
          paddingVertical: 7,
          borderRadius: 28,
          backgroundColor: isDark ? '#1A1B1E' : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          elevation: 8,
          shadowColor: '#000000',
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 3 },
          gap: 5,
        }}>
        {state.routes.map((route, index) => {
          if (!VISIBLE_TABS.has(route.name)) return null;
          const options = descriptors[route.key]?.options as
            | {
                href?: string | null;
                tabBarLabel?: string;
                title?: string;
                tabBarAccessibilityLabel?: string;
              }
            | undefined;
          if (options?.href === null) return null;

          const isFocused = state.index === index;
          const label =
            typeof options?.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options?.title === 'string'
                ? options.title
                : route.name;

          const iconName = tabIcons[route.name] ?? 'home';

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          const onLongPress = () => {
            emitter.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (isFocused) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: true }}
                accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: roofiRadii.pill,
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : colors.surfaceSubtle,
                  opacity: pressed ? 0.75 : 1,
                })}>
                <PlannerIcon
                  name={iconName}
                  size={21}
                  color={colors.foreground}
                  strokeWidth={2.1}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: colors.foreground,
                    fontFamily: roofiTypography.fontFamily.bodyBold,
                    fontSize: 14,
                    letterSpacing: -0.2,
                  }}>
                  {label}
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: false }}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => ({
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 13,
                paddingVertical: 9,
                borderRadius: roofiRadii.pill,
                opacity: pressed ? 0.5 : 1,
              })}>
              <PlannerIcon
                name={iconName}
                size={21}
                color={colors.mutedText}
                strokeWidth={1.7}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <RoofiBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarAccessibilityLabel: 'Home' }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar', tabBarAccessibilityLabel: 'Calendar' }}
      />
      <Tabs.Screen
        name="compare"
        options={{ title: 'Compare', tabBarAccessibilityLabel: 'Compare' }}
      />
      <Tabs.Screen
        name="passport"
        options={{ title: 'Passport', tabBarAccessibilityLabel: 'Passport' }}
      />
      <Tabs.Screen
        name="scale-honesty"
        options={{
          href: null,
          title: 'Scale Honesty',
        }}
      />
    </Tabs>
  );
}
