import { ArrowRight, Leaf, ShieldAlert, Sprout } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { roofiRadii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Visual rotation sequence strip parsing "Major X -> Minor Y" / Cover steps
 * into icon nodes so farmers can read crop order at a glance.
 */
export function CropSequenceStrip({
  sequence,
  isBaseline,
}: {
  sequence: string;
  isBaseline: boolean;
}) {
  const theme = useTheme();
  const steps = sequence
    .split(/\s*->\s*|\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);

  const toneBg = isBaseline ? theme.gold.surface : theme.personal.surface;
  const toneFg = isBaseline ? theme.gold.ink : theme.personal.ink;
  const toneEdge = isBaseline ? theme.gold.edge : theme.personal.edge;

  return (
    <View
      style={[
        styles.strip,
        {
          backgroundColor: toneBg,
          borderColor: toneEdge,
        },
      ]}>
      {steps.map((step, idx) => (
        <View key={`${step}-${idx}`} style={styles.stepGroup}>
          {idx > 0 && <ArrowRight size={13} color={toneFg} />}
          <View
            style={[
              styles.stepPill,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            {idx === 0 ? (
              isBaseline ? (
                <ShieldAlert size={13} color={toneFg} />
              ) : (
                <Sprout size={13} color={theme.primary} />
              )
            ) : (
              <Leaf size={13} color={theme.sage.edge} />
            )}
            <ThemedText
              type="smallBold"
              style={{ color: theme.foreground }}
              numberOfLines={1}>
              {step}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: roofiRadii.xl,
    borderWidth: 1,
  },
  stepGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: roofiRadii.pill,
    borderWidth: 1,
  },
});
