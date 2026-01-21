import { ArrowUpDown, Check, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useColorScheme,
  Pressable,
} from 'react-native';

import { colors, getColors } from '@/theme/colors';
import type { SermonSortField, SortDirection, SermonSortOptions } from '@/types';

interface SortOption {
  field: SermonSortField;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: 'date', label: 'Date' },
  { field: 'speaker', label: 'Orateur' },
  { field: 'title', label: 'Titre' },
  { field: 'category', label: 'Categorie' },
  { field: 'duration_seconds', label: 'Duree' },
];

interface SortSelectorProps {
  currentSort: SermonSortOptions;
  onSortChange: (sort: SermonSortOptions) => void;
  compact?: boolean;
}

export function SortSelector({
  currentSort,
  onSortChange,
  compact = false,
}: SortSelectorProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = getColors(colorScheme);
  const [modalVisible, setModalVisible] = useState(false);

  const currentLabel = SORT_OPTIONS.find((o) => o.field === currentSort.field)?.label || 'Date';
  const directionLabel = currentSort.direction === 'asc' ? 'Croissant' : 'Decroissant';

  const handleSelectSort = (field: SermonSortField) => {
    // If same field, toggle direction
    if (field === currentSort.field) {
      onSortChange({
        field,
        direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      // New field, default to descending for date, ascending for others
      onSortChange({
        field,
        direction: field === 'date' ? 'desc' : 'asc',
      });
    }
    setModalVisible(false);
  };

  const toggleDirection = () => {
    onSortChange({
      ...currentSort,
      direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactButton, { backgroundColor: themeColors.surface }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <ArrowUpDown size={18} color={themeColors.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: themeColors.surface }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <ArrowUpDown size={16} color={themeColors.textSecondary} />
          <Text style={[styles.sortLabel, { color: themeColors.text }]}>
            {currentLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.directionButton, { backgroundColor: themeColors.surface }]}
          onPress={toggleDirection}
          activeOpacity={0.7}
        >
          <Text style={[styles.directionText, { color: themeColors.textSecondary }]}>
            {currentSort.direction === 'asc' ? '\u2191' : '\u2193'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.surfaceElevated },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Trier par
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalClose}
              >
                <X size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {SORT_OPTIONS.map((option) => {
              const isSelected = currentSort.field === option.field;
              return (
                <TouchableOpacity
                  key={option.field}
                  style={[
                    styles.modalOption,
                    isSelected && { backgroundColor: colors.primary[500] + '15' },
                  ]}
                  onPress={() => handleSelectSort(option.field)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: themeColors.text },
                      isSelected && { color: colors.primary[500], fontWeight: '600' },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={{ color: colors.primary[500], marginRight: 4 }}>
                        {currentSort.direction === 'asc' ? '\u2191' : '\u2193'}
                      </Text>
                      <Check size={18} color={colors.primary[500]} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <View style={[styles.directionSection, { borderTopColor: themeColors.border }]}>
              <Text style={[styles.directionTitle, { color: themeColors.textSecondary }]}>
                Ordre
              </Text>
              <View style={styles.directionOptions}>
                <TouchableOpacity
                  style={[
                    styles.directionOption,
                    { backgroundColor: themeColors.surface },
                    currentSort.direction === 'asc' && {
                      backgroundColor: colors.primary[500],
                    },
                  ]}
                  onPress={() => onSortChange({ ...currentSort, direction: 'asc' })}
                >
                  <Text
                    style={[
                      styles.directionOptionText,
                      { color: themeColors.text },
                      currentSort.direction === 'asc' && { color: '#FFFFFF' },
                    ]}
                  >
                    Croissant
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.directionOption,
                    { backgroundColor: themeColors.surface },
                    currentSort.direction === 'desc' && {
                      backgroundColor: colors.primary[500],
                    },
                  ]}
                  onPress={() => onSortChange({ ...currentSort, direction: 'desc' })}
                >
                  <Text
                    style={[
                      styles.directionOptionText,
                      { color: themeColors.text },
                      currentSort.direction === 'desc' && { color: '#FFFFFF' },
                    ]}
                  >
                    Decroissant
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  directionButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  directionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactButton: {
    padding: 10,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalClose: {
    padding: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  modalOptionText: {
    fontSize: 16,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionSection: {
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  directionTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  directionOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  directionOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  directionOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
