import { MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import type { PilotCellSummary } from '@/constants/pilot-data';
import { CardShadow, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface AshantiMapPreviewProps {
  cells: PilotCellSummary[];
  selectedCellId: string;
  onSelectCell: (cellId: string) => void;
}

/**
 * Interactive SVG spatial grid map for React Native Web so `expo start --web`
 * never bundles native-only `react-native-maps` modules.
 */
export function AshantiMapPreview({
  cells,
  selectedCellId,
  onSelectCell,
}: AshantiMapPreviewProps) {
  const theme = useTheme();
  const activeCell =
    cells.find((c) => c.cellId === selectedCellId) ?? cells[0];

  const minLon = -1.52;
  const maxLon = -1.33;
  const minLat = 6.78;
  const maxLat = 6.97;

  return (
    <View
      style={[
        styles.card,
        CardShadow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MapPin size={15} color={theme.primaryText} />
          <ThemedText type="smallBold">Ashanti 5×5 km Grid Map</ThemedText>
        </View>
        <ThemedText type="code" themeColor="textMuted">
          {activeCell.centreLat.toFixed(3)}°N, {Math.abs(activeCell.centreLon).toFixed(3)}°W
        </ThemedText>
      </View>

      <View
        style={[
          styles.mapBox,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Svg width="100%" height={156} viewBox="0 0 320 156">
          {[38, 78, 118].map((y) => (
            <Line
              key={`h-${y}`}
              x1={8}
              y1={y}
              x2={312}
              y2={y}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}
          {[64, 160, 256].map((x) => (
            <Line
              key={`v-${x}`}
              x1={x}
              y1={8}
              x2={x}
              y2={148}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}

          {cells.map((cell) => {
            const nx = (cell.centreLon - minLon) / (maxLon - minLon);
            const ny = 1 - (cell.centreLat - minLat) / (maxLat - minLat);
            const cx = Math.round(28 + nx * 264);
            const cy = Math.round(24 + ny * 108);
            const isSelected = cell.cellId === selectedCellId;
            return (
              <Rect
                key={cell.cellId}
                x={cx - 34}
                y={cy - 20}
                width={68}
                height={40}
                rx={8}
                fill={isSelected ? theme.primarySoft : theme.surface}
                stroke={isSelected ? theme.primary : theme.amber}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
            );
          })}

          {cells.map((cell) => {
            const nx = (cell.centreLon - minLon) / (maxLon - minLon);
            const ny = 1 - (cell.centreLat - minLat) / (maxLat - minLat);
            const cx = Math.round(28 + nx * 264);
            const cy = Math.round(24 + ny * 108);
            const isSelected = cell.cellId === selectedCellId;
            return (
              <SvgText
                key={`lbl-${cell.cellId}`}
                x={cx}
                y={cy + 3}
                fontSize={10}
                fontWeight="700"
                textAnchor="middle"
                fill={isSelected ? theme.primaryText : theme.text}>
                {cell.cellId.replace('ASH_', '')}
              </SvgText>
            );
          })}
        </Svg>

        <View style={styles.pillSelectorRow}>
          {cells.map((cell) => {
            const isSelected = cell.cellId === selectedCellId;
            return (
              <Pressable
                key={`btn-${cell.cellId}`}
                onPress={() => onSelectCell(cell.cellId)}
                style={[
                  styles.cellChip,
                  {
                    backgroundColor: isSelected
                      ? theme.primarySoft
                      : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}>
                <ThemedText
                  type="code"
                  style={{
                    color: isSelected ? theme.primaryText : theme.textSecondary,
                  }}>
                  {cell.cellId}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Tap a 5×5 km cell pill above to switch EO baselines across Ejura, Mampong, and Offinso.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapBox: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: 8,
    gap: 8,
  },
  pillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cellChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
});
