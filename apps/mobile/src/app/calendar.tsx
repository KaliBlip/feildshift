import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DekadHeatmapMatrix } from '@/components/dekad-heatmap-matrix';
import {
  type ChartPoint,
  HeroStatusCard,
  InteractiveAreaChartCard,
  SegmentedPillBar,
  TopBarHeader,
} from '@/components/design-system';
import { SyncStatusPill } from '@/components/sync-status-pill';
import { ThemedText } from '@/components/themed-text';
import { Heading } from '@/components/ui';
import { SEASONAL_VULNERABILITY_CALENDAR } from '@/constants/pilot-data';
import {
  BottomTabInset,
  CardShadow,
  MaxContentWidth,
  roofiRadii,
  roofiSpacing,
  roofiTypography,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/lib/toast';

type CalendarFilter = 'all' | 'bare' | 'cloud';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Windows' },
  { id: 'bare', label: 'Bare Risk' },
  { id: 'cloud', label: 'Cloud QA' },
] as const;

const QA_TIER_LABELS = {
  high: 'QA: High clear-sky',
  moderate: 'QA: Moderate',
  low_cloud_gap: 'QA: Cloud-gap fill',
} as const;

const TEMP_BY_MONTH = [33, 35, 34, 31, 29, 27, 27, 28, 29, 29, 31, 32];
const ET0_BY_MONTH = [138, 140, 144, 130, 122, 112, 114, 118, 118, 120, 126, 132];

export default function CalendarScreen() {
  const theme = useTheme();
  const { cells, selectedCell, selectCell } = usePilotState();
  const [filter, setFilter] = useState<CalendarFilter>('all');

  const cycleCell = () => {
    const idx = cells.findIndex((c) => c.cellId === selectedCell.cellId);
    const next = cells[(idx + 1) % cells.length];
    selectCell(next.cellId);
    toast.info(
      `Cell ${next.cellId}`,
      `${next.zoneName} · 36-dekad vulnerability calendar`,
    );
  };

  const handleFilterSelect = (nextFilter: CalendarFilter) => {
    setFilter(nextFilter);
    if (nextFilter === 'bare') {
      toast.warning(
        `${bareCount} bare-soil exposure windows`,
        'NDVI < 0.28 flagged for Harmattan wind & onset splash erosion.',
      );
    }
  };

  const filteredWindows = SEASONAL_VULNERABILITY_CALENDAR.filter((item) => {
    if (filter === 'bare') return item.bareFieldRisk;
    if (filter === 'cloud') return item.qaTier === 'low_cloud_gap';
    return true;
  });

  const bareCount = SEASONAL_VULNERABILITY_CALENDAR.filter(
    (item) => item.bareFieldRisk,
  ).length;

  const moistureChartPoints: ChartPoint[] = SEASONAL_VULNERABILITY_CALENDAR.map(
    (w) => ({
      xLabel: w.monthLabel,
      value: Math.round(w.ndviSmooth * 100),
      calloutTitle: `${w.monthLabel} ${w.dekadRange}`,
    }),
  );

  const tempChartPoints: ChartPoint[] = SEASONAL_VULNERABILITY_CALENDAR.map(
    (w, idx) => ({
      xLabel: w.monthLabel,
      value: TEMP_BY_MONTH[idx],
      calloutTitle: `${w.monthLabel} Tmax`,
    }),
  );

  const rainEt0BarData = SEASONAL_VULNERABILITY_CALENDAR.flatMap((w, idx) => [
    {
      value: w.rainMm,
      label: w.monthLabel,
      spacing: 2,
      labelWidth: 26,
      frontColor: w.bareFieldRisk ? theme.primary : theme.sage.edge,
    },
    {
      value: ET0_BY_MONTH[idx],
      frontColor: theme.pair.edge,
    },
  ]);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopBarHeader
        title={selectedCell.zoneName.split(' ')[0]}
        subtitle={`${selectedCell.soilTexture} · ${selectedCell.cellId}`}
        leftAction={{
          id: 'cycle-cell',
          icon: {
            ios: 'chevron.left',
            android: 'arrow_back',
            web: 'arrow_back',
          },
          onPress: cycleCell,
          accessibilityLabel: 'Switch pilot cell',
        }}
        rightActions={[
          {
            id: 'reset-filter',
            icon: {
              ios: 'ellipsis',
              android: 'more_vert',
              web: 'more_vert',
            },
            onPress: () => {
              setFilter('all');
              toast.info(
                'Calendar filter reset',
                'Showing all 12 monthly dekad windows.',
              );
            },
            accessibilityLabel: 'Reset calendar filter',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SyncStatusPill />

        <HeroStatusCard
          value="67"
          unit="%"
          deltaText={
            filter === 'bare'
              ? `↓ ${bareCount} bare months exposed`
              : '↑ +14% vs dry baseline'
          }
          statusLabel={filter === 'bare' ? 'Bare Risk' : 'Optimal'}
          statusTone={filter === 'bare' ? 'warning' : 'optimal'}
          subtitle="Canopy Greenness & Moisture Window"
          metaLeft={selectedCell.cellId}
          metaRight="36-DEKAD BASELINE"
        />

        <DekadHeatmapMatrix windows={SEASONAL_VULNERABILITY_CALENDAR} />

        <View
          style={[
            styles.windowCard,
            CardShadow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={styles.windowTopRow}>
            <ThemedText type="sectionTitle">Rainfall vs. ET₀ Demand</ThemedText>
            <ThemedText type="code" themeColor="mutedText">
              MM / MONTH
            </ThemedText>
          </View>
          <View style={styles.statChipsRow}>
            <View
              style={[
                styles.miniChip,
                { backgroundColor: theme.sage.surface },
              ]}>
              <ThemedText type="code" style={{ color: theme.sage.ink }}>
                Rain (Wet)
              </ThemedText>
            </View>
            <View
              style={[
                styles.miniChip,
                { backgroundColor: theme.personal.surface },
              ]}>
              <ThemedText type="code" style={{ color: theme.personal.ink }}>
                Rain (Bare Dip)
              </ThemedText>
            </View>
            <View
              style={[
                styles.miniChip,
                { backgroundColor: theme.pair.surface },
              ]}>
              <ThemedText type="code" style={{ color: theme.pair.ink }}>
                ET₀ Demand
              </ThemedText>
            </View>
          </View>
          <BarChart
            data={rainEt0BarData}
            barWidth={8}
            spacing={12}
            roundedTop
            hideRules
            noOfSections={4}
            maxValue={240}
            height={145}
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{
              color: theme.mutedText,
              fontFamily: roofiTypography.fontFamily.body,
              fontSize: 10,
            }}
            xAxisLabelTextStyle={{
              color: theme.secondary,
              fontFamily: roofiTypography.fontFamily.bodyBold,
              fontSize: 10,
            }}
          />
        </View>

        <SegmentedPillBar
          options={FILTER_OPTIONS}
          selectedId={filter}
          onSelect={handleFilterSelect}
        />

        <InteractiveAreaChartCard
          title="Vegetation Cover & Moisture"
          points={moistureChartPoints}
          unit="%"
          colorTone="green"
          statChips={['Avg 46%', 'Min 22%', 'Max 72%']}
          yMin={0}
          yMax={100}
          yTickCount={4}
        />

        <InteractiveAreaChartCard
          title="Air & Surface Temperature"
          points={tempChartPoints}
          unit="°C"
          colorTone="amber"
          statChips={['Avg 30°C', 'Min 27°C', 'Max 35°C']}
          yMin={20}
          yMax={40}
          yTickCount={4}
        />

        <View style={styles.sectionRow}>
          <Heading title="Dekad Windows" />
          <View
            style={[
              styles.countBadge,
              { backgroundColor: theme.surfaceSubtle },
            ]}>
            <ThemedText type="code" themeColor="secondary">
              {filteredWindows.length} · NDVI &lt; 0.28 BARE
            </ThemedText>
          </View>
        </View>

        {filteredWindows.map((win) => (
          <View
            key={win.id}
            style={[
              styles.windowCard,
              CardShadow,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderLeftWidth: win.bareFieldRisk ? 4 : 1,
                borderLeftColor: win.bareFieldRisk
                  ? theme.primary
                  : theme.border,
              },
            ]}>
            <View style={styles.windowTopRow}>
              <View style={styles.flexOne}>
                <ThemedText type="sectionTitle">
                  {win.monthLabel} · {win.dekadRange}
                </ThemedText>
                <ThemedText type="small" themeColor="secondary">
                  {win.seasonLabel}
                </ThemedText>
              </View>

              <View style={styles.badgeColumn}>
                {win.bareFieldRisk && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: theme.personal.surface },
                    ]}>
                    <ThemedText
                      type="code"
                      style={{ color: theme.personal.ink }}>
                      BARE RISK
                    </ThemedText>
                  </View>
                )}
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.surfaceSubtle },
                  ]}>
                  <ThemedText type="code" themeColor="secondary">
                    {QA_TIER_LABELS[win.qaTier]}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.statChipsRow}>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.surfaceSubtle },
                ]}>
                <ThemedText type="code" themeColor="secondary">
                  Rain {win.rainMm} mm ({win.rainReliability})
                </ThemedText>
              </View>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.surfaceSubtle },
                ]}>
                <ThemedText type="code" themeColor="secondary">
                  SMAP z={win.smapAnomalyZ >= 0 ? '+' : ''}
                  {win.smapAnomalyZ.toFixed(2)}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.miniChip,
                  { backgroundColor: theme.sage.surface },
                ]}>
                <ThemedText type="code" style={{ color: theme.sage.ink }}>
                  NDVI {win.ndviSmooth.toFixed(2)}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="default" themeColor="secondary">
              {win.summaryNote}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: roofiSpacing[5],
    paddingTop: roofiSpacing[2],
    paddingBottom: BottomTabInset + roofiSpacing[6],
    gap: roofiSpacing[4],
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  windowCard: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  windowTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: roofiSpacing[2],
  },
  flexOne: { flex: 1, gap: 2 },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  statChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
});
