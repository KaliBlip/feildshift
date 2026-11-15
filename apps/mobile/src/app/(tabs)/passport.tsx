import { AlertTriangle, BadgeCheck, Radar } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SegmentedPillBar,
  SmartInsightCard,
  ThreeZoneGaugeBar,
  TopBarHeader,
} from '@/components/design-system';
import { ThemedText } from '@/components/themed-text';
import { Button, Field, Heading, Label } from '@/components/ui';
import { Collapsible } from '@/components/ui/collapsible';
import {
  GLOSSARY_ITEMS,
  type EvidencePassportEntry,
} from '@/constants/pilot-data';
import {
  BottomTabInset,
  CardShadow,
  MaxContentWidth,
  roofiRadii,
  roofiSpacing,
} from '@/constants/theme';
import { usePilotState } from '@/hooks/use-pilot-state';
import { useTheme } from '@/hooks/use-theme';
import { toast } from '@/lib/toast';

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

const WATER_STRESS_OPTIONS = [
  { id: 'None', label: 'No stress' },
  { id: 'Mild', label: 'Mild wilt' },
  { id: 'Severe', label: 'Severe dry' },
] as const;

const YIELD_SIGNAL_OPTIONS = [
  { id: 'Strong', label: 'Good yield' },
  { id: 'Average', label: 'Normal' },
  { id: 'Stressed', label: 'Low yield' },
] as const;

export default function PassportScreen() {
  const theme = useTheme();
  const {
    selectedCell,
    passports,
    dataSourceMode,
    logFieldOutcome,
  } = usePilotState();
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [seasonName, setSeasonName] = useState<'Major' | 'Minor' | 'Dry'>(
    'Major',
  );
  const [soilCover, setSoilCover] = useState<'Intact' | 'Partial' | 'Bare'>(
    'Intact',
  );
  const [waterStress, setWaterStress] = useState<'None' | 'Mild' | 'Severe'>(
    'None',
  );
  const [yieldSignal, setYieldSignal] = useState<
    'Strong' | 'Average' | 'Stressed'
  >('Average');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const handleSubmitOutcome = async () => {
    const trimmed = outcomeNotes.trim();
    const summaryText = trimmed
      ? `${yieldSignal} outcome — ${trimmed}`
      : `${yieldSignal} outcome (${seasonName} season, ${soilCover.toLowerCase()} cover, ${waterStress.toLowerCase()} water stress)`;
    const res = await logFieldOutcome({
      seasonYear: 2026,
      seasonName,
      outcomeSummary: summaryText,
      soilCoverObserved: soilCover,
      waterStressObserved: waterStress,
      pestOrDiseaseNotes: null,
    });
    setOutcomeNotes('');
    if (res.status === 'submitted') {
      toast.success(
        'Field observation submitted',
        'Queued for extension-officer verification (does not auto-shift model).',
      );
    } else {
      toast.warning(
        'Field observation saved offline',
        `${res.queuedCount} report(s) waiting for connection.`,
      );
    }
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
        : 'Ashanti Bundle';

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
          const isDataDerived =
            passport.evidenceTier === 'data_derived_finding';
          const pillBg = isHypothesis
            ? theme.gold.surface
            : isDataDerived
              ? theme.personal.surface
              : theme.sage.surface;
          const pillFg = isHypothesis
            ? theme.gold.ink
            : isDataDerived
              ? theme.personal.ink
              : theme.sage.ink;

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
                  {isHypothesis ? (
                    <AlertTriangle size={12} color={pillFg} />
                  ) : isDataDerived ? (
                    <Radar size={12} color={pillFg} />
                  ) : (
                    <BadgeCheck size={12} color={pillFg} />
                  )}
                  <ThemedText type="code" style={{ color: pillFg }}>
                    {EVIDENCE_TIER_LABELS[passport.evidenceTier].toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type="default" themeColor="secondary">
                {passport.observationSummary}
              </ThemedText>

              <View style={styles.datasetChipsRow}>
                {passport.datasetsUsed.map((ds) => (
                  <View
                    key={ds}
                    style={[
                      styles.datasetChip,
                      { backgroundColor: theme.surfaceSubtle },
                    ]}>
                    <ThemedText type="code" themeColor="secondary">
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

              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />

              <ThemedText type="small" themeColor="secondary">
                Coverage: {passport.spatialTemporalCoverage}
              </ThemedText>
              <ThemedText type="small" themeColor="secondary">
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
          <Heading title="Plain-Language Glossary" />
          <View
            style={[
              styles.countBadge,
              { backgroundColor: theme.surfaceSubtle },
            ]}>
            <ThemedText type="code" themeColor="secondary">
              TAP TO EXPAND
            </ThemedText>
          </View>
        </View>

        <View style={styles.glossaryList}>
          {GLOSSARY_ITEMS.map((entry) => (
            <Collapsible key={entry.term} title={entry.term}>
              <View style={styles.glossaryBody}>
                <ThemedText type="default">{entry.plainMeaning}</ThemedText>
                <ThemedText type="small" themeColor="secondary">
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
            accessibilityRole="button"
            onPress={() => setShowOutcomeForm((v) => !v)}
            style={styles.cardHeader}>
            <View style={styles.flexOne}>
              <Label>EXTENSION OFFICER VERIFICATION</Label>
              <ThemedText type="sectionTitle">
                Submit Field Outcome Check
              </ThemedText>
              <ThemedText type="small" themeColor="mutedText">
                Saved for extension-officer review before model recalibration
              </ThemedText>
            </View>
            <View
              style={[
                styles.reportChip,
                { backgroundColor: theme.personal.surface },
              ]}>
              <ThemedText type="code" style={{ color: theme.personal.ink }}>
                {showOutcomeForm ? 'HIDE' : 'REPORT'}
              </ThemedText>
            </View>
          </Pressable>

          {showOutcomeForm && (
            <View style={styles.outcomeBody}>
              <Label>
                SEASON &amp; GROUND COVER OBSERVED ({selectedCell.cellId})
              </Label>
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
              <SegmentedPillBar
                options={WATER_STRESS_OPTIONS}
                selectedId={waterStress}
                onSelect={(id) =>
                  setWaterStress(id as 'None' | 'Mild' | 'Severe')
                }
              />
              <SegmentedPillBar
                options={YIELD_SIGNAL_OPTIONS}
                selectedId={yieldSignal}
                onSelect={(id) =>
                  setYieldSignal(id as 'Strong' | 'Average' | 'Stressed')
                }
              />
              <Field
                label="Field Observation Notes"
                value={outcomeNotes}
                onChangeText={setOutcomeNotes}
                placeholder="Optional notes (e.g., Cowpea relay kept soil moist)"
                multiline
                style={styles.outcomeInput}
              />
              <Button
                title="Submit Field Observation"
                onPress={() => void handleSubmitOutcome()}
              />
            </View>
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
    paddingHorizontal: roofiSpacing[5],
    paddingTop: roofiSpacing[2],
    paddingBottom: BottomTabInset + roofiSpacing[6],
    gap: roofiSpacing[4],
  },
  passportCard: {
    borderRadius: roofiRadii['2xl'],
    borderWidth: 1,
    padding: roofiSpacing[4],
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: roofiSpacing[2],
  },
  flexOne: { flex: 1, gap: 2 },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  datasetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  datasetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
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
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: roofiRadii.pill,
  },
  glossaryList: {
    gap: 10,
  },
  glossaryBody: {
    gap: 6,
  },
  reportChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
  },
  outcomeBody: {
    gap: 12,
    paddingTop: 6,
  },
  outcomeInput: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
});
