import { X } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
} from 'react-native';

import { colors, getColors } from '@/theme/colors';
import type { SermonFilters, Speaker } from '@/types';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = getColors(colorScheme);

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.primary[500] + '15',
          borderColor: colors.primary[500] + '30',
        },
      ]}
    >
      <Text style={[styles.chipText, { color: colors.primary[500] }]}>{label}</Text>
      <TouchableOpacity
        onPress={onRemove}
        style={styles.chipRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={14} color={colors.primary[500]} />
      </TouchableOpacity>
    </View>
  );
}

interface ActiveFiltersProps {
  filters: SermonFilters;
  speakers?: Speaker[];
  onRemoveFilter: (key: keyof SermonFilters, value?: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  filters,
  speakers = [],
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = getColors(colorScheme);

  const getFilterChips = () => {
    const chips: { key: keyof SermonFilters; label: string; value?: string }[] = [];

    if (filters.speakerId) {
      const speaker = speakers.find((s) => s.id === filters.speakerId);
      chips.push({
        key: 'speakerId',
        label: `Orateur: ${speaker?.name || 'Inconnu'}`,
      });
    }

    if (filters.speakerName) {
      chips.push({
        key: 'speakerName',
        label: `Orateur: ${filters.speakerName}`,
      });
    }

    if (filters.category) {
      chips.push({
        key: 'category',
        label: `Categorie: ${filters.category}`,
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag) => {
        chips.push({
          key: 'tags',
          label: tag,
          value: tag,
        });
      });
    }

    if (filters.dateFrom) {
      chips.push({
        key: 'dateFrom',
        label: `Depuis: ${new Date(filters.dateFrom).toLocaleDateString('fr-FR')}`,
      });
    }

    if (filters.dateTo) {
      chips.push({
        key: 'dateTo',
        label: `Jusqu'au: ${new Date(filters.dateTo).toLocaleDateString('fr-FR')}`,
      });
    }

    return chips;
  };

  const chips = getFilterChips();

  if (chips.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map((chip, index) => (
          <FilterChip
            key={`${chip.key}-${chip.value || index}`}
            label={chip.label}
            onRemove={() => onRemoveFilter(chip.key, chip.value)}
          />
        ))}
        {chips.length > 1 && (
          <TouchableOpacity
            style={[styles.clearAll, { borderColor: themeColors.border }]}
            onPress={onClearAll}
          >
            <Text style={[styles.clearAllText, { color: themeColors.textSecondary }]}>
              Effacer tout
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipRemove: {
    padding: 2,
  },
  clearAll: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
