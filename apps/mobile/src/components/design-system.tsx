import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppIconName = SymbolViewProps['name'];

export function TopSearchRegionHeader({
  searchQuery,
  onChangeSearch,
  searchPlaceholder = 'Search region or cell',
  regionCaption = 'Region',
  regionName,
}: {
  searchQuery: string;
  onChangeSearch: (text: string) => void;
  searchPlaceholder?: string;
  regionCaption?: string;
  regionName: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.topHeaderBar,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
        },
      ]}>
      <View
        style={[
          styles.searchPill,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <SymbolView
          name={{
            ios: 'magnifyingglass',
            android: 'search',
            web: 'search',
          }}
          size={16}
          tintColor={theme.textMuted}
        />
        <TextInput
          value={searchQuery}
          onChangeText={onChangeSearch}
          placeholder={searchPlaceholder}
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.regionStack}>
        <ThemedText type="small" themeColor="textMuted">
          {regionCaption}
        </ThemedText>
        <ThemedText type="subtitle" numberOfLines={1}>
          {regionName}
        </ThemedText>
      </View>
    </View>
  );
}

export interface HeaderAction {
  id: string;
  icon: AppIconName;
  onPress: () => void;
  variant?: 'neutral' | 'primary';
  badgeDot?: boolean;
  accessibilityLabel: string;
}

export function TopBarHeader({
  title,
  subtitle,
  leftAction,
  rightActions = [],
}: {
  title: string;
  subtitle?: string;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.topHeaderBar,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
        },
      ]}>
      <View style={styles.headerLeftGroup}>
        {leftAction && (
          <Pressable
            accessibilityLabel={leftAction.accessibilityLabel}
            onPress={leftAction.onPress}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={leftAction.icon}
              size={18}
              tintColor={theme.text}
            />
          </Pressable>
        )}

        <View style={styles.headerTitleStack}>
          <ThemedText type="subtitle" numberOfLines={1}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {rightActions.length > 0 && (
        <View style={styles.headerRightActions}>
          {rightActions.map((action) => {
            const isPrimary = action.variant === 'primary';
            return (
              <Pressable
                key={action.id}
                accessibilityLabel={action.accessibilityLabel}
                onPress={action.onPress}
                style={({ pressed }) => [
                  isPrimary ? styles.primaryCircleButton : styles.iconButton,
                  {
                    backgroundColor: isPrimary
                      ? theme.primary
                      : theme.backgroundElement,
                  },
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  name={action.icon}
                  size={18}
                  tintColor={isPrimary ? '#FFFFFF' : theme.text}
                />
                {action.badgeDot && (
                  <View
                    style={[
                      styles.actionDot,
                      {
                        backgroundColor: theme.primary,
                        borderColor: theme.surface,
                      },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export interface SegmentedOption<T extends string = string> {
  id: T;
  label: string;
}

export function SegmentedPillBar<T extends string>({
  options,
  selectedId,
  onSelect,
}: {
  options: readonly SegmentedOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.segmentedContainer,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      {options.map((opt) => {
        const active = opt.id === selectedId;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            style={({ pressed }) => [
              styles.segmentedOption,
              active && { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <Text
              numberOfLines={1}
              style={[
                styles.segmentedText,
                {
                  color: active ? '#FFFFFF' : theme.text,
                  fontWeight: active ? '600' : '500',
                },
              ]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function KpiMetricCard({
  icon,
  value,
  unit,
  label,
}: {
  icon: AppIconName;
  value: string;
  unit?: string;
  label: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.kpiCard,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View style={[styles.kpiIconBox, { backgroundColor: theme.iconBg }]}>
        <SymbolView name={icon} size={18} tintColor={theme.textSecondary} />
      </View>

      <View style={styles.kpiBody}>
        <View style={styles.kpiValueRow}>
          <ThemedText type="kpi">{value}</ThemedText>
          {unit ? (
            <ThemedText type="default" themeColor="textSecondary">
              {' '}
              {unit}
            </ThemedText>
          ) : null}
        </View>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
    </View>
  );
}

export function HeroStatusCard({
  value,
  unit,
  deltaText,
  statusLabel,
  statusTone = 'optimal',
  subtitle,
  metaLeft,
  metaRight,
}: {
  value: string;
  unit?: string;
  deltaText: string;
  statusLabel: string;
  statusTone?: 'optimal' | 'warning';
  subtitle: string;
  metaLeft: string;
  metaRight: string;
}) {
  const theme = useTheme();
  const isWarning = statusTone === 'warning';
  const pillBg = isWarning ? theme.amberSoft : theme.primarySoft;
  const pillFg = isWarning ? theme.amber : theme.primaryText;

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroMetricGroup}>
          <ThemedText type="hero">
            {value}
            {unit ? <Text style={styles.heroUnit}> {unit}</Text> : null}
          </ThemedText>
          <ThemedText
            type="smallBold"
            style={{ color: isWarning ? theme.amber : theme.primaryText }}>
            {deltaText}
          </ThemedText>
        </View>

        <View style={[styles.statusPill, { backgroundColor: pillBg }]}>
          <ThemedText type="smallBold" style={{ color: pillFg }}>
            {statusLabel}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="default" themeColor="textSecondary">
        {subtitle}
      </ThemedText>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.heroMetaRow}>
        <View style={styles.heroMetaItem}>
          <SymbolView
            name={{
              ios: 'square.2.layers.3d',
              android: 'layers',
              web: 'layers',
            }}
            size={14}
            tintColor={theme.textMuted}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {metaLeft}
          </ThemedText>
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          {metaRight}
        </ThemedText>
      </View>
    </View>
  );
}

export interface ChartPoint {
  xLabel: string;
  value: number;
  calloutTitle?: string;
}

export interface ChartTimeframeOption {
  id: string;
  label: string;
}

function interpolateCatmullRom(values: number[], totalSlices: number): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return new Array(totalSlices).fill(values[0]);

  const result: number[] = [];
  const n = values.length;
  for (let i = 0; i < totalSlices; i++) {
    const tGlobal = (i / Math.max(1, totalSlices - 1)) * (n - 1);
    const idx = Math.min(n - 2, Math.floor(tGlobal));
    const t = tGlobal - idx;

    const p0 = values[Math.max(0, idx - 1)];
    const p1 = values[idx];
    const p2 = values[Math.min(n - 1, idx + 1)];
    const p3 = values[Math.min(n - 1, idx + 2)];

    const t2 = t * t;
    const t3 = t2 * t;
    const interp =
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
    result.push(interp);
  }
  return result;
}

export function InteractiveAreaChartCard({
  title,
  points,
  unit = '%',
  colorTone = 'green',
  timeframes,
  activeTimeframeId,
  onSelectTimeframe,
  statChips,
  yMin,
  yMax,
  yTickCount = 4,
}: {
  title: string;
  points: ChartPoint[];
  unit?: string;
  colorTone?: 'green' | 'amber';
  timeframes?: ChartTimeframeOption[];
  activeTimeframeId?: string;
  onSelectTimeframe?: (id: string) => void;
  statChips?: string[];
  yMin?: number;
  yMax?: number;
  yTickCount?: number;
}) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(260);
  const [selectedIdx, setSelectedIdx] = useState(() =>
    Math.min(Math.max(0, Math.floor(points.length / 2)), points.length - 1),
  );

  const safeIdx = Math.min(selectedIdx, Math.max(0, points.length - 1));
  const strokeColor = colorTone === 'amber' ? theme.amber : theme.primary;
  const fillTint =
    colorTone === 'amber' ? 'rgba(229, 122, 36, 0.20)' : 'rgba(135, 198, 224, 0.30)';
  const fillBottomTint =
    colorTone === 'amber' ? 'rgba(229, 122, 36, 0.04)' : 'rgba(78, 168, 41, 0.04)';

  const rawValues = points.map((p) => p.value);
  const minVal =
    yMin !== undefined
      ? yMin
      : Math.floor(Math.min(...rawValues, 0));
  const maxVal =
    yMax !== undefined
      ? yMax
      : Math.ceil(Math.max(...rawValues, minVal + 1));
  const span = Math.max(1e-6, maxVal - minVal);

  const plotHeight = 148;
  const smoothCount = Math.max(36, points.length * 6);
  const smoothValues = useMemo(
    () => interpolateCatmullRom(rawValues, smoothCount),
    [rawValues, smoothCount],
  );

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let i = 0; i <= yTickCount; i++) {
      ticks.push(Math.round(maxVal - (span * i) / yTickCount));
    }
    return ticks;
  }, [maxVal, span, yTickCount]);

  const toY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const norm = (clamped - minVal) / span;
    return plotHeight - norm * (plotHeight - 16) - 8;
  };

  const handlePlotLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0 && Math.abs(measured - plotWidth) > 1) {
      setPlotWidth(measured);
    }
  };

  const smoothCoords = smoothValues.map((val, idx) => ({
    x: (idx / Math.max(1, smoothValues.length - 1)) * plotWidth,
    y: toY(val),
  }));

  const activePoint = points[safeIdx] ?? { xLabel: '', value: 0 };
  const activeX =
    points.length > 1 ? (safeIdx / (points.length - 1)) * plotWidth : plotWidth / 2;
  const activeY = toY(activePoint.value);
  const tooltipLeft = Math.max(4, Math.min(plotWidth - 96, activeX - 46));
  const tooltipTop = Math.max(2, activeY - 46);

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.chartHeaderRow}>
        <ThemedText type="sectionTitle">{title}</ThemedText>

        {timeframes && timeframes.length > 0 && (
          <View style={styles.timeframeRow}>
            {timeframes.map((tf) => {
              const isActive = tf.id === activeTimeframeId;
              return (
                <Pressable
                  key={tf.id}
                  onPress={() => onSelectTimeframe?.(tf.id)}
                  style={({ pressed }) => [
                    styles.timeframePill,
                    {
                      backgroundColor: isActive
                        ? theme.primary
                        : theme.backgroundElement,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.timeframeText,
                      { color: isActive ? '#FFFFFF' : theme.text },
                    ]}>
                    {tf.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {statChips && statChips.length > 0 && (
        <View style={styles.statChipsRow}>
          {statChips.map((chip) => (
            <View
              key={chip}
              style={[
                styles.statChip,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {chip}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.chartBody}>
        <View style={[styles.yAxisColumn, { height: plotHeight }]}>
          {yTicks.map((tick, idx) => (
            <ThemedText
              key={`${tick}-${idx}`}
              type="small"
              themeColor="textMuted"
              style={styles.yTickLabel}>
              {tick}
              {unit}
            </ThemedText>
          ))}
        </View>

        <View style={styles.plotOuter}>
          <View
            onLayout={handlePlotLayout}
            style={[styles.plotCanvas, { height: plotHeight }]}>
            {yTicks.map((_, idx) => (
              <View
                key={`grid-${idx}`}
                style={[
                  styles.gridLine,
                  {
                    top: (idx / Math.max(1, yTicks.length - 1)) * (plotHeight - 16) + 8,
                    backgroundColor: theme.border,
                  },
                ]}
              />
            ))}

            {/* Soft multi-slice area fill under curve */}
            {smoothCoords.map((pt, idx) => {
              const sliceWidth = plotWidth / smoothCoords.length + 0.8;
              const areaHeight = Math.max(0, plotHeight - pt.y);
              return (
                <View
                  key={`fill-${idx}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: pt.x - sliceWidth / 2,
                    top: pt.y,
                    width: sliceWidth,
                    height: areaHeight,
                    backgroundColor: fillTint,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: areaHeight * 0.45,
                      backgroundColor: fillBottomTint,
                    }}
                  />
                </View>
              );
            })}

            {/* Crisp interpolated line segments */}
            {smoothCoords.slice(0, -1).map((pt, idx) => {
              const next = smoothCoords[idx + 1];
              const dx = next.x - pt.x;
              const dy = next.y - pt.y;
              const length = Math.hypot(dx, dy) + 1.2;
              const angle = Math.atan2(dy, dx);
              const mx = (pt.x + next.x) / 2;
              const my = (pt.y + next.y) / 2;
              return (
                <View
                  key={`seg-${idx}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: mx - length / 2,
                    top: my - 1.25,
                    width: length,
                    height: 2.5,
                    borderRadius: 2,
                    backgroundColor: strokeColor,
                    transform: [{ rotate: `${angle}rad` }],
                  }}
                />
              );
            })}

            {/* Vertical dashed crosshair line */}
            <View
              pointerEvents="none"
              style={[
                styles.crosshairLine,
                {
                  left: activeX,
                  height: plotHeight,
                  borderColor: theme.textMuted,
                },
              ]}
            />

            {/* Floating callout card */}
            <View
              pointerEvents="none"
              style={[
                styles.calloutBubble,
                CardShadow,
                {
                  left: tooltipLeft,
                  top: tooltipTop,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <ThemedText type="small" themeColor="textMuted">
                {activePoint.calloutTitle ?? activePoint.xLabel}
              </ThemedText>
              <ThemedText type="smallBold">
                {activePoint.value}
                {unit}
              </ThemedText>
            </View>

            {/* Active ring marker */}
            <View
              pointerEvents="none"
              style={[
                styles.activeRingDot,
                {
                  left: activeX - 5,
                  top: activeY - 5,
                  borderColor: strokeColor,
                  backgroundColor: theme.surface,
                },
              ]}
            />

            {/* Interactive touch columns */}
            <View style={styles.touchOverlay}>
              {points.map((pt, idx) => (
                <Pressable
                  key={`tap-${pt.xLabel}-${idx}`}
                  style={styles.touchColumn}
                  onPress={() => setSelectedIdx(idx)}
                  accessibilityLabel={`Inspect ${pt.xLabel}: ${pt.value}${unit}`}
                />
              ))}
            </View>
          </View>

          <View style={styles.xAxisRow}>
            {points.map((pt, idx) => {
              const showLabel =
                points.length <= 7 ||
                idx === 0 ||
                idx === points.length - 1 ||
                idx % 2 === 0;
              return (
                <Text
                  key={`x-${pt.xLabel}-${idx}`}
                  numberOfLines={1}
                  style={[
                    styles.xAxisLabel,
                    {
                      color:
                        idx === safeIdx ? theme.text : theme.textMuted,
                      fontWeight: idx === safeIdx ? '600' : '400',
                    },
                  ]}>
                  {showLabel ? pt.xLabel : ''}
                </Text>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

export function SmartInsightCard({
  icon,
  category,
  headline,
  footer,
  tone = 'green',
}: {
  icon: AppIconName;
  category: string;
  headline: string;
  footer: string;
  tone?: 'green' | 'amber';
}) {
  const theme = useTheme();
  const isAmber = tone === 'amber';

  return (
    <View
      style={[
        styles.insightCard,
        CardShadow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View
        style={[
          styles.insightIconBadge,
          { backgroundColor: isAmber ? theme.amberSoft : theme.primarySoft },
        ]}>
        <SymbolView
          name={icon}
          size={19}
          tintColor={isAmber ? theme.amber : theme.primaryText}
        />
      </View>

      <View style={styles.insightContent}>
        <ThemedText type="captionUppercase" themeColor="textMuted">
          {category}
        </ThemedText>
        <ThemedText type="default">{headline}</ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {footer}
        </ThemedText>
      </View>
    </View>
  );
}

export function FieldParcelBanner({
  badgeText,
  accentColor = '#38D976',
}: {
  badgeText: string;
  accentColor?: string;
}) {
  return (
    <View style={styles.aerialCanvas}>
      {/* Background neighbouring field mosaic */}
      <View style={styles.aerialPatchTopLeft} />
      <View style={styles.aerialPatchTopRight} />
      <View style={styles.aerialPatchBottomLeft} />
      <View style={styles.aerialPatchBottomRight} />
      <View style={styles.aerialAccessTrackH} />
      <View style={styles.aerialAccessTrackV} />

      {/* Highlighted parcel polygon */}
      <View
        style={[
          styles.aerialPolygon,
          {
            borderColor: accentColor,
            backgroundColor: 'rgba(56, 217, 118, 0.28)',
          },
        ]}>
        <View style={styles.aerialTagPill}>
          <Text style={styles.aerialTagText}>{badgeText}</Text>
        </View>
      </View>
    </View>
  );
}

export function ThreeZoneGaugeBar({
  label = 'Strategy fit',
  scorePercent,
  zoneLabels = ['Low fit', 'Optimal', 'Robust'],
}: {
  label?: string;
  scorePercent: number;
  zoneLabels?: [string, string, string];
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(scorePercent)));
  const pillColor =
    clamped < 45 ? theme.amber : clamped < 75 ? theme.primaryText : theme.blue;
  const clampedLeftPct = Math.max(8, Math.min(82, clamped - 7));

  return (
    <View style={styles.gaugeWrapper}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>

      <View style={styles.gaugeTrackArea}>
        <View style={styles.gaugeTrackRow}>
          <View
            style={[
              styles.gaugeSegment,
              styles.gaugeSegLeft,
              { flex: 32, backgroundColor: '#EA8C35' },
            ]}
          />
          <View
            style={[
              styles.gaugeSegment,
              { flex: 38, backgroundColor: '#35A853' },
            ]}
          />
          <View
            style={[
              styles.gaugeSegment,
              styles.gaugeSegRight,
              { flex: 30, backgroundColor: '#2B7CE9' },
            ]}
          />
        </View>

        <View
          style={[
            styles.gaugeMarkerPill,
            {
              left: `${clampedLeftPct}%`,
              backgroundColor: pillColor,
              borderColor: theme.surface,
            },
          ]}>
          <Text style={styles.gaugeMarkerText}>{clamped}%</Text>
        </View>
      </View>

      <View style={styles.gaugeLabelsRow}>
        <ThemedText type="small" themeColor="textMuted">
          {zoneLabels[0]}
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {zoneLabels[1]}
        </ThemedText>
        <ThemedText type="small" themeColor="textMuted">
          {zoneLabels[2]}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  regionStack: {
    alignItems: 'flex-end',
    maxWidth: 150,
  },
  headerLeftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitleStack: {
    flex: 1,
    gap: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryCircleButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: 4,
    gap: 2,
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedText: {
    fontSize: 12.5,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 12,
  },
  kpiIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiBody: {
    flex: 1,
    gap: 2,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  heroMetricGroup: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 8,
  },
  heroUnit: {
    fontSize: 18,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeframePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.xs,
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.xs,
  },
  chartBody: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  yAxisColumn: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 2,
    width: 38,
  },
  yTickLabel: {
    fontVariant: ['tabular-nums'],
  },
  plotOuter: {
    flex: 1,
  },
  plotCanvas: {
    position: 'relative',
    width: '100%',
    overflow: 'visible',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.7,
  },
  crosshairLine: {
    position: 'absolute',
    top: 4,
    width: 1,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
  },
  calloutBubble: {
    position: 'absolute',
    minWidth: 74,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    zIndex: 5,
  },
  activeRingDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2.5,
    zIndex: 4,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    zIndex: 6,
  },
  touchColumn: {
    flex: 1,
    height: '100%',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xAxisLabel: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 12,
  },
  insightIconBadge: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
    gap: 4,
  },
  aerialCanvas: {
    height: 132,
    borderRadius: Radii.md,
    backgroundColor: '#3A4726',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aerialPatchTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '54%',
    height: '48%',
    backgroundColor: '#564E35',
  },
  aerialPatchTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '44%',
    height: '52%',
    backgroundColor: '#2B361C',
  },
  aerialPatchBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '40%',
    height: '48%',
    backgroundColor: '#48522E',
  },
  aerialPatchBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '58%',
    height: '44%',
    backgroundColor: '#323E21',
  },
  aerialAccessTrackH: {
    position: 'absolute',
    top: '48%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(182, 165, 134, 0.5)',
    transform: [{ rotate: '-5deg' }],
  },
  aerialAccessTrackV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '34%',
    width: 3,
    backgroundColor: 'rgba(182, 165, 134, 0.45)',
    transform: [{ rotate: '12deg' }],
  },
  aerialPolygon: {
    width: '62%',
    height: '66%',
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 8,
    transform: [{ rotate: '-2deg' }],
  },
  aerialTagPill: {
    backgroundColor: 'rgba(20, 26, 18, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  aerialTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  gaugeWrapper: {
    gap: 6,
  },
  gaugeTrackArea: {
    height: 22,
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeTrackRow: {
    height: 8,
    flexDirection: 'row',
    borderRadius: Radii.pill,
    overflow: 'hidden',
    gap: 2,
  },
  gaugeSegment: {
    height: '100%',
  },
  gaugeSegLeft: {
    borderTopLeftRadius: Radii.pill,
    borderBottomLeftRadius: Radii.pill,
  },
  gaugeSegRight: {
    borderTopRightRadius: Radii.pill,
    borderBottomRightRadius: Radii.pill,
  },
  gaugeMarkerPill: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: 2,
  },
  gaugeMarkerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  gaugeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.75 },
});
