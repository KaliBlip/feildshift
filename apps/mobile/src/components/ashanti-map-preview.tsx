import { MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import type { PilotCellSummary } from '@/constants/pilot-data';
import { CardShadow, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface AshantiMapPreviewProps {
  cells: PilotCellSummary[];
  selectedCellId: string;
  onSelectCell: (cellId: string) => void;
}

function cellSquareCoords(cell: PilotCellSummary, halfDeg = 0.022) {
  return [
    { latitude: cell.centreLat - halfDeg, longitude: cell.centreLon - halfDeg },
    { latitude: cell.centreLat - halfDeg, longitude: cell.centreLon + halfDeg },
    { latitude: cell.centreLat + halfDeg, longitude: cell.centreLon + halfDeg },
    { latitude: cell.centreLat + halfDeg, longitude: cell.centreLon - halfDeg },
  ];
}

/**
 * Interactive native / Expo Go map displaying Ashanti 5x5 km pilot cells.
 * Isolated from web bundles via `ashanti-map-preview.web.tsx`.
 */
export function AshantiMapPreview({
  cells,
  selectedCellId,
  onSelectCell,
}: AshantiMapPreviewProps) {
  const theme = useTheme();
  const activeCell =
    cells.find((c) => c.cellId === selectedCellId) ?? cells[0];

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

      <View style={styles.mapFrame}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 6.875,
            longitude: -1.425,
            latitudeDelta: 0.18,
            longitudeDelta: 0.18,
          }}>
          {cells.map((cell) => {
            const isSelected = cell.cellId === selectedCellId;
            return (
              <Polygon
                key={`poly-${cell.cellId}`}
                coordinates={cellSquareCoords(cell)}
                strokeColor={isSelected ? theme.primary : theme.amber}
                fillColor={
                  isSelected
                    ? 'rgba(78, 168, 41, 0.28)'
                    : 'rgba(229, 122, 36, 0.14)'
                }
                strokeWidth={isSelected ? 2.5 : 1.5}
                tappable
                onPress={() => onSelectCell(cell.cellId)}
              />
            );
          })}
          {cells.map((cell) => (
            <Marker
              key={`pin-${cell.cellId}`}
              coordinate={{
                latitude: cell.centreLat,
                longitude: cell.centreLon,
              }}
              title={cell.cellId}
              description={`${cell.zoneName} · Slope ${cell.slopePct}%`}
              pinColor={cell.cellId === selectedCellId ? '#4EA829' : '#E57A24'}
              onPress={() => onSelectCell(cell.cellId)}
            />
          ))}
        </MapView>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Tap any 5×5 km cell pin to switch local EO climate, soil pH, and slope priors.
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
  mapFrame: {
    height: 176,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
