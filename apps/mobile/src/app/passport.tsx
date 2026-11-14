import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SegmentedPillBar,
  SmartInsightCard,
  ThreeZoneGaugeBar,
  TopBarHeader,
} from '@/components/design-system';
import { ThemedText } from '@/components/themed-text';
import { Collapsible } from '@/components/ui/collapsible';
import { GLOSSARY_ITEMS, type EvidencePassportEntry } from '@/constants/pilot-data';
import {
  BottomTabInset,
  CardShadow,
  MaxContentWidth,
  Radii,
  Spacing,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';

type TierFilter = 'all' | 'data' | 'science' | 'hypothesis';

const TIER_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'data', label: 'Data' },
  { id: 'science', label: 'Science' },
  { id: 'hypothesis', label: 'Hypoth.' },
] as const;

const EVIDENCE_TIER_LABELS: Record<
  EvidencePassportEntry['evidenceTier'],
  string
> = {
  established_science: 'Established science',
  data_derived_finding: 'Data-derived',
  farmer_reported_observation: 'Farmer-reported',
  unverified_hypothesis: 'Unverified hypothesis',
  expert_validated_insight: 'Expert-validated',
};

const CONFIDENCE_BY_TIER: Record<
  EvidencePassportEntry['evidenceTier'],
  number
> = {
  expert_validated_insight: 92,
  established_science: 86,
  data_derived_finding: 74,
  farmer_reported_observation: 58,
  unverified_hypothesis: 42,
};

const SEASON_NAME_OPTIONS = [
  { id: 'Major', label: 'Major' },
  { id: 'Minor', label: 'Minor' },
  { id: 'Dry', label: 'Dry' },
] as const;

const COVER_OPTIONS = [
  { id: 'Intact', label: 'Good cover' },
  { id: 'Partial', label: 'Partial' },
  { id: 'Bare', label: 'Bare soil' },
] as const;

export default function PassportScreen() {
  const theme = useTheme();
  const {
    selectedCell,
    passports,
    dataSourceMode,
    queuedLogsCount,
    logFieldOutcome,
  } = usePilotState();
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [seasonName, setSeasonName] = useState<'Major' | 'Minor' | 'Dry'>('Major');
  const [soilCover, setSoilCover] = useState<'Intact' | 'Partial' | 'Bare'>('Intact');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [outcomeStatus, setOutcomeStatus] = useState<string | null>(null);

  const handleSubmitOutcome = async () => {
    const trimmed = outcomeNotes.trim();
    if (!trimmed) {
      setOutcomeStatus('Enter brief crop cover or rainfall observations first.');
      return;
    }
    const res = await logFieldOutcome({
      seasonYear: 2026,
      seasonName,
      outcomeSummary: trimmed,
      soilCoverObserved: soilCover,
      waterStressObserved: 'Field check recorded',
      pestOrDiseaseNotes: null,
    });
    setOutcomeNotes('');
    setOutcomeStatus(
      res.status === 'submitted'
        ? 'Submitted for officer verification (does not auto-shift model).'
        : `Queued offline (${res.queuedCount} waiting) until connection returns.`,
    );
  };

  const visiblePassports = passports.filter((ep) => {
    if (tierFilter === 'data') return ep.evidenceTier === 'data_derived_finding';
    if (tierFilter === 'science')
      return ep.evidenceTier === 'established_science';
    if (tierFilter === 'hypothesis')
      return ep.evidenceTier === 'unverified_hypothesis';
    return true;
  });

  const sourceLabel =
    dataSourceMode === 'supabase'
      ? 'Live Supabase'
      : dataSourceMode === 'cached'
        ? 'Offline Cache'
        : 'Ashanti Fixture';

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <TopBarHeader
        title="Evidence Passports"
        subtitle={`${selectedCell.cellId} · ${sourceLabel}`}
        rightActions={[
          {
            id: 'reset-tier',
            icon: {
              ios: 'shield.checkered',
              android: 'verified_user',
              web: 'verified_user',
            },
            onPress: () => setTierFilter('all'),
            accessibilityLabel: 'Show all evidence tiers',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SegmentedPillBar
          options={TIER_FILTER_OPTIONS}
          selectedId={tierFilter}
          onSelect={setTierFilter}
        />

        {visiblePassports.map((passport) => {
          const isHypothesis =
            passport.evidenceTier === 'unverified_hypothesis';
          const pillBg = isHypothesis ? theme.amberSoft : theme.primarySoft;
          const pillFg = isHypothesis ? theme.amber : theme.primaryText;

          return (
            <View
              key={passport.id}
              style={[
                styles.passportCard,
                CardShadow,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <View style={styles.cardHeader}>
                <ThemedText type="sectionTitle" style={styles.flexOne}>
                  {passport.title}
                </ThemedText>
                <View style={[styles.tierPill, { backgroundColor: pillBg }]}>
                  <ThemedText type="code" style={{ color: pillFg }}>
                    {EVIDENCE_TIER_LABELS[passport.evidenceTier]}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="small" themeColor="textSecondary">
                {passport.observationSummary}
              </ThemedText>

              <View style={styles.datasetChipsRow}>
                {passport.datasetsUsed.map((ds) => (
                  <View
                    key={ds}
                    style={[
                      styles.datasetChip,
                      { backgroundColor: theme.backgroundElement },
                    ]}>
                    <ThemedText type="code" themeColor="textSecondary">
                      {ds}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <ThreeZoneGaugeBar
                label="Evidence strength & uncertainty"
                scorePercent={CONFIDENCE_BY_TIER[passport.evidenceTier]}
                zoneLabels={['Hypothesis', 'Data-derived', 'Validated']}
              />

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <ThemedText type="small" themeColor="textSecondary">
                Coverage: {passport.spatialTemporalCoverage}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Scale honesty: {passport.scaleHonestyNote}
              </ThemedText>

              <SmartInsightCard
                icon={{
                  ios: isHypothesis ? 'exclamationmark.triangle' : 'leaf',
                  android: isHypothesis ? 'warning' : 'eco',
                  web: isHypothesis ? 'warning' : 'eco',
                }}
                category="REQUIRED LOCAL REVIEW"
                headline={passport.requiredLocalReview[0]}
                footer={`Info gap: ${passport.informationGaps[0]}`}
                tone={isHypothesis ? 'amber' : 'green'}
              />
            </View>
          );
        })}

        <View style={styles.glossaryHeader}>
          <ThemedText type="sectionTitle">Plain-Language Glossary</ThemedText>
          <ThemedText type="small" themeColor="textMuted">
            Tap to expand
          </ThemedText>
        </View>

        <View style={styles.glossaryList}>
          {GLOSSARY_ITEMS.map((entry) => (
            <Collapsible key={entry.term} title={entry.term}>
              <View style={styles.glossaryBody}>
                <ThemedText type="small">{entry.plainMeaning}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Why it matters: {entry.whyItMatters}
                </ThemedText>
              </View>
            </Collapsible>
          ))}
        </View>

        <View
          style={[
            styles.passportCard,
            CardShadow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <Pressable
            onPress={() => setShowOutcomeForm((v) => !v)}
            style={styles.cardHeader}>
            <View style={styles.flexOne}>
              <ThemedText type="sectionTitle">
                Submit Field Outcome Check
              </ThemedText>
              <ThemedText type="small" themeColor="textMuted">
                Saved for extension-officer review before model recalibration
                {queuedLogsCount > 0 ? ` · ${queuedLogsCount} queued` : ''}
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
              {showOutcomeForm ? 'Hide' : 'Report'}
            </ThemedText>
          </Pressable>

          {showOutcomeForm && (
            <View style={styles.outcomeBody}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Season &amp; ground cover observed ({selectedCell.cellId})
              </ThemedText>
              <SegmentedPillBar
                options={SEASON_NAME_OPTIONS}
                selectedId={seasonName}
                onSelect={(id) =>
                  setSeasonName(id as 'Major' | 'Minor' | 'Dry')
                }
              />
              <SegmentedPillBar
                options={COVER_OPTIONS}
                selectedId={soilCover}
                onSelect={(id) =>
                  setSoilCover(id as 'Intact' | 'Partial' | 'Bare')
                }
              />
              <TextInput
                value={outcomeNotes}
                onChangeText={setOutcomeNotes}
                placeholder="e.g., Cowpea relay kept soil moist through 10-day dry spell"
                placeholderTextColor={theme.textMuted}
                multiline
                style={[
                  styles.outcomeInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundElement,
                  },
                ]}
              />
              <Pressable
                onPress={() => void handleSubmitOutcome()}
                style={({ pressed }) => [
                  styles.submitOutcomeBtn,
                  { backgroundColor: theme.primarySoft },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                  Submit Field Observation
                </ThemedText>
              </Pressable>
            </View>
          )}

          {outcomeStatus !== null && (
            <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
              {outcomeStatus}
            </ThemedText>
          )}
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  passportCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flexOne: { flex: 1 },
  tierPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  datasetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  datasetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.xs,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  glossaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  glossaryList: {
    gap: 10,
  },
  glossaryBody: {
    gap: 6,
  },
  outcomeBody: {
    gap: 10,
    paddingTop: 4,
  },
  outcomeInput: {
    minHeight: 74,
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  submitOutcomeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  pressed: { opacity: 0.75 },
});
