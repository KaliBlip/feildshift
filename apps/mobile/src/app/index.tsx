import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AshantiMapPreview } from '@/components/ashanti-map-preview';
import {
  type ChartPoint,
  InteractiveAreaChartCard,
  KpiMetricCard,
  SmartInsightCard,
  TopSearchRegionHeader,
} from '@/components/design-system';
import { ScaleFootprintDiagram } from '@/components/scale-footprint-diagram';
import { SyncStatusPill } from '@/components/sync-status-pill';
import { ThemedText } from '@/components/themed-text';
import { Heading, Label } from '@/components/ui';
import { evaluateMobileScaleHonesty } from '@/constants/pilot-data';
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

const CELL_METRICS: Record<
  string,
  {
    soilMoisturePct: string;
    airTempC: string;
    soilTempC: string;
    canopyPct: string;
    insight: string;
  }
> = {
  ASH_R05_C05: {
    soilMoisturePct: '52',
    airTempC: '29',
    soilTempC: '25',
    canopyPct: '67',
    insight:
      'Optimal major-season moisture in Ejura-Kumasi sandy clay loam — minor-season cowpea relay holds soil cover.',
  },
  ASH_R04_C04: {
    soilMoisturePct: '58',
    airTempC: '28',
    soilTempC: '24',
    canopyPct: '71',
    insight:
      'Higher upland rainfall (1,426 mm) increases runoff on 3.68% slopes — cover mulch strongly lowers soil wash.',
  },
  ASH_R06_C06: {
    soilMoisturePct: '47',
    airTempC: '30',
    soilTempC: '26',
    canopyPct: '62',
    insight:
      'Faster drainage in sandy loam soils calls for early drought-tolerant planting windows in late March.',
  },
  ASH_R05_C04: {
    soilMoisturePct: '54',
    airTempC: '29',
    soilTempC: '25',
    canopyPct: '69',
    insight:
      'Gentle 0.72% terrain slope in Akomadan-Offinso retains moisture well for maize-soybean relay sequences.',
  },
  ASH_R04_C05: {
    soilMoisturePct: '55',
    airTempC: '28',
    soilTempC: '24',
    canopyPct: '70',
    insight:
      'Rich 11.2 g/kg organic carbon in Sekyere Central supports high-residue mucuna cover during Harmattan.',
  },
};

type HomeTimeframeId = 'maj' | 'min' | 'dry' | 'yr';

const MOISTURE_SERIES: Record<HomeTimeframeId, ChartPoint[]> = {
  maj: [
    { xLabel: 'D07', value: 38, calloutTitle: 'Mar D07' },
    { xLabel: 'D09', value: 49, calloutTitle: 'Mar D09' },
    { xLabel: 'D11', value: 64, calloutTitle: 'Apr D11' },
    { xLabel: 'D13', value: 78, calloutTitle: 'May D13' },
    { xLabel: 'D16', value: 86, calloutTitle: 'Jun D16' },
    { xLabel: 'D19', value: 70, calloutTitle: 'Jul D19' },
    { xLabel: 'D21', value: 58, calloutTitle: 'Jul D21' },
  ],
  min: [
    { xLabel: 'D25', value: 44, calloutTitle: 'Sep D25' },
    { xLabel: 'D27', value: 62, calloutTitle: 'Sep D27' },
    { xLabel: 'D29', value: 74, calloutTitle: 'Oct D29' },
    { xLabel: 'D30', value: 79, calloutTitle: 'Oct D30' },
    { xLabel: 'D32', value: 56, calloutTitle: 'Nov D32' },
    { xLabel: 'D33', value: 42, calloutTitle: 'Nov D33' },
  ],
  dry: [
    { xLabel: 'D34', value: 35, calloutTitle: 'Dec D34' },
    { xLabel: 'D36', value: 27, calloutTitle: 'Dec D36' },
    { xLabel: 'D02', value: 21, calloutTitle: 'Jan D02' },
    { xLabel: 'D04', value: 19, calloutTitle: 'Feb D04' },
    { xLabel: 'D05', value: 24, calloutTitle: 'Feb D05' },
    { xLabel: 'D06', value: 30, calloutTitle: 'Feb D06' },
  ],
  yr: [
    { xLabel: 'Jan', value: 24, calloutTitle: 'Jan D02' },
    { xLabel: 'Feb', value: 26, calloutTitle: 'Feb D05' },
    { xLabel: 'Mar', value: 45, calloutTitle: 'Mar D08' },
    { xLabel: 'Apr', value: 62, calloutTitle: 'Apr D11' },
    { xLabel: 'May', value: 78, calloutTitle: 'May D14' },
    { xLabel: 'Jun', value: 86, calloutTitle: 'Jun D17' },
    { xLabel: 'Jul', value: 66, calloutTitle: 'Jul D20' },
    { xLabel: 'Aug', value: 42, calloutTitle: 'Aug D23' },
    { xLabel: 'Sep', value: 64, calloutTitle: 'Sep D26' },
    { xLabel: 'Oct', value: 74, calloutTitle: 'Oct D29' },
    { xLabel: 'Nov', value: 48, calloutTitle: 'Nov D32' },
    { xLabel: 'Dec', value: 29, calloutTitle: 'Dec D35' },
  ],
};

const HOME_TIMEFRAMES = [
  { id: 'maj', label: 'Maj' },
  { id: 'min', label: 'Min' },
  { id: 'dry', label: 'Dry' },
  { id: 'yr', label: 'Yr' },
];

const TIER_LABELS = {
  field_scale: 'Field scale',
  sub_regional: 'Sub-regional',
  regional_context_only: 'Regional context',
} as const;

export default function HomeScreen() {
  const theme = useTheme();
  const {
    cells,
    selectedCell,
    selectCell,
    farmAreaHa,
    setFarmAreaHa,
  } = usePilotState();

  const [searchQuery, setSearchQuery] = useState('');
  const [timeframeId, setTimeframeId] = useState<HomeTimeframeId>('maj');

  const handleSelectCell = (cellId: string) => {
    selectCell(cellId);
    const target = cells.find((c) => c.cellId === cellId);
    if (target) {
      toast.info(
        `Switched to ${target.cellId}`,
        `${target.zoneName} · ${target.soilTexture} (pH ${target.soilPh})`,
      );
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    const trimmed = text.trim().toLowerCase();
    if (trimmed.length >= 2) {
      const match = cells.find(
        (c) =>
          c.cellId.toLowerCase().includes(trimmed) ||
          c.zoneName.toLowerCase().includes(trimmed) ||
          c.soilTexture.toLowerCase().includes(trimmed),
      );
      if (match && match.cellId !== selectedCell.cellId) {
        handleSelectCell(match.cellId);
      }
    }
  };

  const kpis = CELL_METRICS[selectedCell.cellId] ?? CELL_METRICS.ASH_R05_C05;
  const scaleAssessment = evaluateMobileScaleHonesty(farmAreaHa);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopSearchRegionHeader
        searchQuery={searchQuery}
        onChangeSearch={handleSearchChange}
        searchPlaceholder="Search soil, district, or cell"
        regionCaption="Ashanti Region"
        regionName="Ghana"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SyncStatusPill />

        {/* Autis Planner Horizontal Workspace / Cell Switcher */}
        <View style={styles.workspaceSwitcherWrap}>
          <View style={styles.workspaceSwitcherHeader}>
            <Label>PILOT WORKSPACE CELL</Label>
            <Text
              style={[
                styles.workspaceRoleText,
                { color: theme.secondary },
              ]}>
              {selectedCell.soilTexture} · pH {selectedCell.soilPh}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workspacePillsRow}>
            {cells.map((cell) => {
              const selected = cell.cellId === selectedCell.cellId;
              const shortDistrict = cell.zoneName.split(' ')[0];
              return (
                <Pressable
                  key={cell.cellId}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={cell.zoneName}
                  onPress={() => handleSelectCell(cell.cellId)}
                  style={[
                    styles.workspacePill,
                    {
                      backgroundColor: selected
                        ? theme.foreground
                        : theme.surface,
                      borderColor: selected ? theme.foreground : theme.border,
                    },
                  ]}>
                  <View
                    style={[
                      styles.workspaceInitialBox,
                      {
                        backgroundColor: selected
                          ? theme.surfaceSubtle
                          : theme.personal.surface,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.workspaceInitialText,
                        { color: theme.primary },
                      ]}>
                      {shortDistrict.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.workspacePillLabel,
                      {
                        color: selected
                          ? theme.background
                          : theme.foreground,
                      },
                    ]}>
                    {shortDistrict} · {cell.cellId.replace('ASH_', '')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <AshantiMapPreview
          cells={cells}
          selectedCellId={selectedCell.cellId}
          onSelectCell={handleSelectCell}
        />

        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KpiMetricCard
              icon={{
                ios: 'drop',
                android: 'water_drop',
                web: 'water_drop',
              }}
              value={kpis.soilMoisturePct}
              unit="%"
              label="Soil Moisture"
            />
            <KpiMetricCard
              icon={{
                ios: 'thermometer.medium',
                android: 'thermostat',
                web: 'thermostat',
              }}
              value={kpis.airTempC}
              unit="°C"
              label="Air Temp"
            />
          </View>
          <View style={styles.kpiRow}>
            <KpiMetricCard
              icon={{
                ios: 'thermometer.medium',
                android: 'thermostat',
                web: 'thermostat',
              }}
              value={kpis.soilTempC}
              unit="°C"
              label="Soil Temp"
            />
            <KpiMetricCard
              icon={{
                ios: 'leaf',
                android: 'eco',
                web: 'eco',
              }}
              value={kpis.canopyPct}
              unit="%"
              label="Canopy Cover"
            />
          </View>
        </View>

        <InteractiveAreaChartCard
          title="Soil Moisture Trajectory"
          points={MOISTURE_SERIES[timeframeId]}
          unit="%"
          colorTone="green"
          timeframes={HOME_TIMEFRAMES}
          activeTimeframeId={timeframeId}
          onSelectTimeframe={(id) => setTimeframeId(id as HomeTimeframeId)}
          yMin={0}
          yMax={100}
          yTickCount={4}
        />

        <View style={styles.sectionHeader}>
          <Heading title="Smart Insights" />
          <View
            style={[
              styles.countBadge,
              { backgroundColor: theme.surfaceSubtle },
            ]}>
            <ThemedText type="code" themeColor="secondary">
              {selectedCell.cellId}
            </ThemedText>
          </View>
        </View>

        <SmartInsightCard
          icon={{ ios: 'leaf', android: 'eco', web: 'eco' }}
          category="SOIL & ROTATION STATUS"
          headline={kpis.insight}
          footer={`Baseline 2022–2025 · Slope ${selectedCell.slopePct}% · pH ${selectedCell.soilPh}`}
          tone="green"
        />

        <View
          style={[
            styles.scaleCard,
            CardShadow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.scaleHeader}>
            <View style={styles.flexOne}>
              <Label>SCALE HONESTY CHECK</Label>
              <ThemedText type="sectionTitle">
                Your farm: {farmAreaHa.toFixed(1)} ha (
                {(farmAreaHa / 100).toFixed(3)} km²)
              </ThemedText>
            </View>

            <View style={styles.stepperGroup}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease farm area"
                onPress={() => setFarmAreaHa(farmAreaHa - 0.5)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">−</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase farm area"
                onPress={() => setFarmAreaHa(farmAreaHa + 0.5)}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: theme.onPrimary }}>
                  +
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <ScaleFootprintDiagram farmAreaHa={farmAreaHa} />

          {scaleAssessment.slice(0, 4).map((entry) => {
            const isField = entry.resolvesFarm;
            return (
              <View key={entry.dataset} style={styles.scaleRow}>
                <ThemedText
                  type="small"
                  themeColor="secondary"
                  style={styles.flexOne}
                  numberOfLines={1}>
                  {entry.dataset}
                </ThemedText>
                <View
                  style={[
                    styles.scaleBadge,
                    {
                      backgroundColor: isField
                        ? theme.sage.surface
                        : theme.surfaceSubtle,
                    },
                  ]}>
                  <ThemedText
                    type="code"
                    style={{
                      color: isField ? theme.sage.ink : theme.secondary,
                    }}>
                    {TIER_LABELS[entry.advisoryTier]}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>
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
  workspaceSwitcherWrap: {
    gap: 10,
  },
  workspaceSwitcherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workspaceRoleText: {
    fontFamily: roofiTypography.fontFamily.body,
    fontSize: 12,
  },
  workspacePillsRow: {
    gap: 8,
  },
  workspacePill: {
    minHeight: 42,
    maxWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
  workspaceInitialBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  workspaceInitialText: {
    fontFamily: roofiTypography.fontFamily.bodyBold,
    fontSize: 11,
    fontWeight: '700',
  },
  workspacePillLabel: {
    flexShrink: 1,
    fontFamily: roofiTypography.fontFamily.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  kpiGrid: {
    gap: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeader: {
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
  scaleCard: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  scaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: roofiSpacing[2],
  },
  flexOne: { flex: 1, gap: 2 },
  stepperGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: roofiSpacing[2],
  },
  scaleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  pressed: { opacity: 0.75 },
});
