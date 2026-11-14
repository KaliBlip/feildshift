import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FieldParcelBanner,
  SegmentedPillBar,
  ThreeZoneGaugeBar,
  TopBarHeader,
} from '@/components/design-system';
import { ThemedText } from '@/components/themed-text';
import {
  PRIORITY_PRESETS,
  ROTATION_STRATEGIES,
  SCORING_CRITERIA,
} from '@/constants/pilot-data';
import {
  BottomTabInset,
  CardShadow,
  MaxContentWidth,
  Radii,
  Spacing,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';
import { baseScores, rankProbabilities } from '@/lib/scoring';

const PRESET_PILL_OPTIONS = PRIORITY_PRESETS.map((p) => ({
  id: p.id,
  label: p.label.replace(' & Erosion', '').replace(' Focus', ''),
}));

export default function CompareScreen() {
  const theme = useTheme();
  const { selectedCell, weights, setWeightAt, applyPreset } = usePilotState();

  const [activePresetId, setActivePresetId] = useState<string>(
    PRIORITY_PRESETS[0].id,
  );
  const [showPriorityEditor, setShowPriorityEditor] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const scoreMatrix = ROTATION_STRATEGIES.map((s) => [...s.criterionScores]);
  const computedScores = baseScores(scoreMatrix, [...weights]);
  const stability = rankProbabilities(scoreMatrix, [...weights], {
    runs: 2000,
    seed: 42,
  });

  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  const rankedIndices = ROTATION_STRATEGIES.map((_, idx) => idx).sort(
    (a, b) => computedScores[b] - computedScores[a],
  );

  const handleSelectPreset = (id: string) => {
    const preset = PRIORITY_PRESETS.find((p) => p.id === id);
    if (preset) {
      setActivePresetId(id);
      applyPreset(preset.weights);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopBarHeader
        title={`My Strategies (${ROTATION_STRATEGIES.length})`}
        subtitle={`${selectedCell.cellId} · 2,000 Monte Carlo runs`}
        rightActions={[
          {
            id: 'preset-filter',
            icon: {
              ios: 'slider.horizontal.3',
              android: 'tune',
              web: 'tune',
            },
            badgeDot: true,
            onPress: () => setShowPriorityEditor((v) => !v),
            accessibilityLabel: 'Toggle priority weight sliders',
          },
          {
            id: 'add-adjust',
            icon: {
              ios: 'plus',
              android: 'add',
              web: 'add',
            },
            variant: 'primary',
            onPress: () => setShowPriorityEditor((v) => !v),
            accessibilityLabel: 'Adjust farmer priorities',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SegmentedPillBar
          options={PRESET_PILL_OPTIONS}
          selectedId={activePresetId}
          onSelect={handleSelectPreset}
        />

        {showPriorityEditor && (
          <View
            style={[
              styles.editorCard,
              CardShadow,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <ThemedText type="smallBold">Custom Priority Weights</ThemedText>
            {SCORING_CRITERIA.map((criterion, idx) => {
              const sharePct = Math.round((weights[idx] / weightSum) * 100);
              return (
                <View key={criterion} style={styles.weightRow}>
                  <View style={styles.flexOne}>
                    <ThemedText type="small">{criterion}</ThemedText>
                    <ThemedText type="code" themeColor="textMuted">
                      {sharePct}% share
                    </ThemedText>
                  </View>
                  <View style={styles.stepperGroup}>
                    <Pressable
                      onPress={() => setWeightAt(idx, -0.05)}
                      style={({ pressed }) => [
                        styles.stepperBtn,
                        { backgroundColor: theme.backgroundElement },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="smallBold">−</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => setWeightAt(idx, 0.05)}
                      style={({ pressed }) => [
                        styles.stepperBtn,
                        { backgroundColor: theme.primarySoft },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={{ color: theme.primaryText }}>
                        +
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {rankedIndices.map((sIdx, rankPos) => {
          const strategy = ROTATION_STRATEGIES[sIdx];
          const scorePct = Math.round(computedScores[sIdx] * 100);
          const probPct = Math.round(stability.probabilityFirst[sIdx] * 100);
          const isExpanded = expandedCode === strategy.code;

          return (
            <View
              key={strategy.code}
              style={[
                styles.strategyCard,
                CardShadow,
                {
                  backgroundColor: theme.surface,
                  borderColor:
                    rankPos === 0 ? theme.primary : theme.border,
                },
              ]}>
              <FieldParcelBanner
                badgeText={strategy.sequence}
                accentColor={strategy.isBaseline ? theme.amber : '#38D976'}
              />

              <View style={styles.cardMetaRow}>
                <View style={styles.flexOne}>
                  <ThemedText type="sectionTitle">{strategy.name}</ThemedText>
                  <ThemedText type="small" themeColor="textMuted">
                    {selectedCell.cellId} ·{' '}
                    {strategy.isBaseline ? 'Current baseline' : `Option #${rankPos + 1}`}
                  </ThemedText>
                </View>

                <View style={styles.statusRight}>
                  <View style={styles.onlineRow}>
                    <View
                      style={[
                        styles.onlineDot,
                        {
                          backgroundColor:
                            rankPos === 0 ? theme.primaryText : theme.amber,
                        },
                      ]}
                    />
                    <ThemedText type="smallBold">
                      Rank #{rankPos + 1} · {probPct}% win
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textMuted">
                    Mean rank {stability.meanRank[sIdx].toFixed(2)}
                  </ThemedText>
                </View>
              </View>

              <ThreeZoneGaugeBar
                label="Weighted priority fit"
                scorePercent={scorePct}
                zoneLabels={['Low fit', 'Optimal', 'Robust']}
              />

              <Pressable
                onPress={() =>
                  setExpandedCode(isExpanded ? null : strategy.code)
                }
                style={({ pressed }) => [
                  styles.expandToggle,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {isExpanded
                    ? 'Hide agronomic breakdown'
                    : 'View benefits, gaps & local checks'}
                </ThemedText>
              </Pressable>

              {isExpanded && (
                <View style={styles.expandedBody}>
                  <View style={styles.criteriaChips}>
                    {SCORING_CRITERIA.map((criterion, cIdx) => (
                      <View
                        key={criterion}
                        style={[
                          styles.criterionChip,
                          { backgroundColor: theme.backgroundElement },
                        ]}>
                        <ThemedText type="code" themeColor="textSecondary">
                          {criterion.split(' ')[0]}:{' '}
                          {strategy.criterionScores[cIdx].toFixed(2)}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  <ThemedText type="smallBold">Expected benefits</ThemedText>
                  {strategy.expectedBenefits.map((benefit) => (
                    <ThemedText
                      key={benefit}
                      type="small"
                      themeColor="textSecondary">
                      • {benefit}
                    </ThemedText>
                  ))}

                  <ThemedText type="smallBold">
                    Information gaps &amp; local review
                  </ThemedText>
                  {strategy.informationGaps.map((gap) => (
                    <ThemedText key={gap} type="small" themeColor="textSecondary">
                      • Gap: {gap}
                    </ThemedText>
                  ))}
                  {strategy.risksNeedingReview.map((risk) => (
                    <ThemedText
                      key={risk}
                      type="small"
                      themeColor="textSecondary">
                      • Local check: {risk}
                    </ThemedText>
                  ))}
                </View>
              )}
            </View>
          );
        })}
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  editorCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 10,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strategyCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flexOne: { flex: 1 },
  statusRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  expandToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  expandedBody: {
    gap: 6,
    paddingTop: 4,
  },
  criteriaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  criterionChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.xs,
  },
  pressed: { opacity: 0.75 },
});
