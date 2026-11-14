import Slider from '@react-native-community/slider';
import { Layers, ShieldCheck, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CropSequenceStrip } from '@/components/crop-sequence-strip';
import {
  SegmentedPillBar,
  ThreeZoneGaugeBar,
  TopBarHeader,
} from '@/components/design-system';
import { SmsShareModal } from '@/components/sms-share-modal';
import { SyncStatusPill } from '@/components/sync-status-pill';
import { ThemedText } from '@/components/themed-text';
import {
  PRIORITY_PRESETS,
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
import {
  buildSmsSummaryCard,
  estimateNitrogenOffsetSummary,
} from '@/lib/sms-export';
import {
  applyClimateStressToStrategies,
  CLIMATE_STRESS_SCENARIOS,
  computeMinimaxRegretRankings,
  type ClimateStressId,
} from '@/lib/stress';

const PRESET_PILL_OPTIONS = PRIORITY_PRESETS.map((p) => ({
  id: p.id,
  label: p.label.replace(' & Erosion', '').replace(' Focus', ''),
}));

const STRESS_PILL_OPTIONS = CLIMATE_STRESS_SCENARIOS.map((s) => ({
  id: s.id,
  label: s.shortLabel,
}));

const VIEW_MODE_OPTIONS = [
  { id: 'cards', label: 'Strategy Cards' },
  { id: 'matrix', label: 'Head-to-Head Matrix' },
] as const;

export default function CompareScreen() {
  const theme = useTheme();
  const {
    selectedCell,
    weights,
    setExactWeightAt,
    applyPreset,
    strategies,
    dataSourceMode,
    queuedLogsCount,
    logFarmerDecision,
  } = usePilotState();

  const [activePresetId, setActivePresetId] = useState<string>(
    PRIORITY_PRESETS[0].id,
  );
  const [stressId, setStressId] = useState<ClimateStressId>('baseline');
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [showPriorityEditor, setShowPriorityEditor] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [smsPreview, setSmsPreview] = useState<{
    strategyName: string;
    message: string;
  } | null>(null);

  const baselineMatrix = strategies.map((s) => [...s.criterionScores]);
  const baselineScores = baseScores(baselineMatrix, [...weights]);
  const scoreMatrix = applyClimateStressToStrategies(strategies, stressId);
  const computedScores = baseScores(scoreMatrix, [...weights]);
  const stability = rankProbabilities(scoreMatrix, [...weights], {
    runs: 2000,
    seed: 42,
  });
  const minimax = computeMinimaxRegretRankings(strategies, [...weights], baseScores);

  const activeScenario =
    CLIMATE_STRESS_SCENARIOS.find((item) => item.id === stressId) ??
    CLIMATE_STRESS_SCENARIOS[0];
  const sourceBadge =
    dataSourceMode === 'supabase'
      ? 'Live Supabase'
      : dataSourceMode === 'cached'
        ? 'Offline Cache'
        : 'Ashanti Fixture';

  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  const rankedIndices = strategies
    .map((_, idx) => idx)
    .sort((a, b) => computedScores[b] - computedScores[a]);

  const handleSelectPreset = (id: string) => {
    const preset = PRIORITY_PRESETS.find((p) => p.id === id);
    if (preset) {
      setActivePresetId(id);
      applyPreset(preset.weights);
    }
  };

  const handleShareSms = (sIdx: number) => {
    const strategy = strategies[sIdx];
    const scorePct = Math.round(computedScores[sIdx] * 100);
    const probPct = Math.round(stability.probabilityFirst[sIdx] * 100);
    const deltaPct = Math.round(
      (computedScores[sIdx] - baselineScores[sIdx]) * 100,
    );
    const message = buildSmsSummaryCard({
      cellId: selectedCell.cellId,
      strategy,
      baseScorePct: scorePct,
      winProbPct: probPct,
      scenarioLabel: activeScenario.shortLabel,
      stressDeltaPct: stressId === 'baseline' ? undefined : deltaPct,
    });
    setSmsPreview({ strategyName: strategy.name, message });
  };

  const handleLogDecision = async (strategyCode: string, strategyName: string) => {
    const baseScoreMap: Record<string, number> = {};
    const rankProbMap: Record<string, number> = {};
    strategies.forEach((s, idx) => {
      baseScoreMap[s.code] = Number(computedScores[idx].toFixed(4));
      rankProbMap[s.code] = Number(stability.probabilityFirst[idx].toFixed(4));
    });
    const res = await logFarmerDecision({
      selectedStrategyCode: strategyCode,
      computedBaseScores: baseScoreMap,
      rankProbabilities: rankProbMap,
      reasoningNotes: `Selected under ${activeScenario.shortLabel} preset`,
    });
    setDecisionFeedback(
      res.status === 'submitted'
        ? `Logged ${strategyName} to Supabase decision log.`
        : `Saved ${strategyName} offline (${res.queuedCount} queued to sync).`,
    );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopBarHeader
        title={`My Strategies (${strategies.length})`}
        subtitle={`${selectedCell.cellId} · ${sourceBadge} · ${activeScenario.shortLabel}`}
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
        <SyncStatusPill />

        <SegmentedPillBar
          options={PRESET_PILL_OPTIONS}
          selectedId={activePresetId}
          onSelect={handleSelectPreset}
        />

        <View style={styles.stressSection}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Climate Stress &amp; Analog Replay
          </ThemedText>
          <SegmentedPillBar
            options={STRESS_PILL_OPTIONS}
            selectedId={stressId}
            onSelect={(id) => setStressId(id as ClimateStressId)}
          />
          {stressId !== 'baseline' && (
            <ThemedText type="small" themeColor="textMuted">
              Simulating: {activeScenario.label}
            </ThemedText>
          )}
        </View>

        <SegmentedPillBar
          options={VIEW_MODE_OPTIONS}
          selectedId={viewMode}
          onSelect={(id) => setViewMode(id as 'cards' | 'matrix')}
        />

        {(decisionFeedback !== null || queuedLogsCount > 0) && (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: theme.primarySoft,
                borderColor: theme.primary,
              },
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
              {decisionFeedback ??
                `${queuedLogsCount} field submission(s) waiting offline to sync.`}
            </ThemedText>
          </View>
        )}

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
                <View key={criterion} style={styles.sliderBlock}>
                  <View style={styles.weightRow}>
                    <ThemedText type="small">{criterion}</ThemedText>
                    <ThemedText type="code" style={{ color: theme.primaryText }}>
                      {sharePct}% share ({weights[idx].toFixed(2)})
                    </ThemedText>
                  </View>
                  <Slider
                    minimumValue={0.05}
                    maximumValue={1}
                    step={0.05}
                    value={weights[idx]}
                    onValueChange={(val) => setExactWeightAt(idx, val)}
                    minimumTrackTintColor={theme.primary}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.primary}
                  />
                </View>
              );
            })}
          </View>
        )}

        {viewMode === 'matrix' && (
          <View
            style={[
              styles.strategyCard,
              CardShadow,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <ThemedText type="sectionTitle">
              Strategy &amp; Regret Matrix ({activeScenario.shortLabel})
            </ThemedText>
            <View style={[styles.matrixHeader, { borderBottomColor: theme.border }]}>
              <ThemedText type="code" themeColor="textMuted" style={styles.matrixColName}>
                Strategy
              </ThemedText>
              <ThemedText type="code" themeColor="textMuted" style={styles.matrixColStat}>
                Fit
              </ThemedText>
              <ThemedText type="code" themeColor="textMuted" style={styles.matrixColStat}>
                Win%
              </ThemedText>
              <ThemedText type="code" themeColor="textMuted" style={styles.matrixColStat}>
                Regret
              </ThemedText>
            </View>
            {rankedIndices.map((sIdx) => {
              const s = strategies[sIdx];
              const isSafe = minimax.lowestRegretCode === s.code;
              const regret = minimax.rowsByCode[s.code];
              return (
                <View
                  key={`mtx-${s.code}`}
                  style={[styles.matrixRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.matrixColName}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {s.name}
                    </ThemedText>
                    {isSafe && (
                      <ThemedText type="code" style={{ color: theme.primaryText }}>
                        Lowest-Regret Pick
                      </ThemedText>
                    )}
                  </View>
                  <ThemedText type="code" style={styles.matrixColStat}>
                    {Math.round(computedScores[sIdx] * 100)}
                  </ThemedText>
                  <ThemedText type="code" style={styles.matrixColStat}>
                    {Math.round(stability.probabilityFirst[sIdx] * 100)}%
                  </ThemedText>
                  <ThemedText
                    type="code"
                    style={[
                      styles.matrixColStat,
                      { color: isSafe ? theme.primaryText : theme.amber },
                    ]}>
                    {regret ? `${Math.round(regret.maxRegret * 100)}%` : '—'}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}

        {viewMode === 'cards' &&
          rankedIndices.map((sIdx, rankPos) => {
          const strategy = strategies[sIdx];
          const scorePct = Math.round(computedScores[sIdx] * 100);
          const deltaPct = Math.round(
            (computedScores[sIdx] - baselineScores[sIdx]) * 100,
          );
          const probPct = Math.round(stability.probabilityFirst[sIdx] * 100);
          const isExpanded = expandedCode === strategy.code;
          const isLowestRegret = minimax.lowestRegretCode === strategy.code;
          const regretRow = minimax.rowsByCode[strategy.code];
          const nOffset = estimateNitrogenOffsetSummary(strategy);

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
              <CropSequenceStrip
                sequence={strategy.sequence}
                isBaseline={strategy.isBaseline}
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
                    {stressId !== 'baseline'
                      ? ` · ${deltaPct >= 0 ? `+${deltaPct}` : deltaPct}% vs base`
                      : ''}
                  </ThemedText>
                </View>
              </View>

              {(isLowestRegret || nOffset.ureaBagsSavedPerHa > 0 || nOffset.bareDaysAvoided > 0) && (
                <View style={styles.highlightChipsRow}>
                  {isLowestRegret && (
                    <View
                      style={[
                        styles.regretBadge,
                        { backgroundColor: theme.primarySoft },
                      ]}>
                      <ShieldCheck size={13} color={theme.primaryText} />
                      <ThemedText type="code" style={{ color: theme.primaryText }}>
                        Lowest-Regret Safe Pick
                        {regretRow ? ` (gap ${(regretRow.maxRegret * 100).toFixed(0)}%)` : ''}
                      </ThemedText>
                    </View>
                  )}
                  {nOffset.ureaBagsSavedPerHa > 0 && (
                    <View
                      style={[
                        styles.regretBadge,
                        { backgroundColor: theme.backgroundElement },
                      ]}>
                      <Sprout size={13} color={theme.primaryText} />
                      <ThemedText type="code" themeColor="textSecondary">
                        ~{nOffset.ureaBagsSavedPerHa} urea bags/ha saved
                      </ThemedText>
                    </View>
                  )}
                  {nOffset.bareDaysAvoided > 0 && (
                    <View
                      style={[
                        styles.regretBadge,
                        { backgroundColor: theme.backgroundElement },
                      ]}>
                      <Layers size={13} color={theme.amber} />
                      <ThemedText type="code" themeColor="textSecondary">
                        -{nOffset.bareDaysAvoided} Harmattan bare d
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}

              <ThreeZoneGaugeBar
                label="Weighted priority fit"
                scorePercent={scorePct}
                zoneLabels={['Low fit', 'Optimal', 'Robust']}
              />

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => handleShareSms(sIdx)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: theme.backgroundElement },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    Share SMS / Twi
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => void handleLogDecision(strategy.code, strategy.name)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: theme.primarySoft },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                    Log Choice
                  </ThemedText>
                </Pressable>
              </View>

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
                          {scoreMatrix[sIdx][cIdx].toFixed(2)}
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

      <SmsShareModal
        visible={smsPreview !== null}
        strategyName={smsPreview?.strategyName ?? ''}
        message={smsPreview?.message ?? ''}
        onClose={() => setSmsPreview(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  stressSection: {
    gap: 6,
  },
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
  sliderBlock: {
    gap: 2,
  },
  matrixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  matrixColName: {
    flex: 1,
    paddingRight: 8,
  },
  matrixColStat: {
    width: 48,
    textAlign: 'right',
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
  feedbackBanner: {
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  highlightChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  regretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  pressed: { opacity: 0.75 },
});
