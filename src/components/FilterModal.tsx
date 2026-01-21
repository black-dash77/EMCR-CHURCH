import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { X, Check, ChevronDown, Calendar } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Pressable,
  Platform,
} from 'react-native';

import { colors, getColors } from '@/theme/colors';
import type { SermonFilters, Speaker } from '@/types';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SermonFilters) => void;
  currentFilters: SermonFilters;
  speakers?: Speaker[];
  categories?: string[];
  tags?: string[];
}

export function FilterModal({
  visible,
  onClose,
  onApply,
  currentFilters,
  speakers = [],
  categories = [],
  tags = [],
}: FilterModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = getColors(colorScheme);

  const [filters, setFilters] = useState<SermonFilters>(currentFilters);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Date picker states
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, visible]);

  const formatDateDisplay = (dateString: string | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDateFromChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDateFromPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFilters({ ...filters, dateFrom: dateString });
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowDateFromPicker(false);
    }
  };

  const handleDateToChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDateToPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFilters({ ...filters, dateTo: dateString });
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowDateToPicker(false);
    }
  };

  const clearDateFrom = () => {
    setFilters({ ...filters, dateFrom: undefined });
  };

  const clearDateTo = () => {
    setFilters({ ...filters, dateTo: undefined });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || [];
    if (currentTags.includes(tag)) {
      setFilters({
        ...filters,
        tags: currentTags.filter((t) => t !== tag),
      });
    } else {
      setFilters({
        ...filters,
        tags: [...currentTags, tag],
      });
    }
  };

  const hasActiveFilters = () => {
    return (
      filters.speakerId ||
      filters.category ||
      (filters.tags && filters.tags.length > 0) ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.seminarId
    );
  };

  const renderSection = (
    title: string,
    sectionKey: string,
    content: React.ReactNode
  ) => {
    const isExpanded = expandedSection === sectionKey;

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.sectionHeader, { borderBottomColor: themeColors.border }]}
          onPress={() => setExpandedSection(isExpanded ? null : sectionKey)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            {title}
          </Text>
          <ChevronDown
            size={20}
            color={themeColors.textSecondary}
            style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.sectionContent}>{content}</View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Filtrer
          </Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={[styles.resetText, { color: colors.primary[500] }]}>
              Effacer
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Speakers Section */}
          {speakers.length > 0 &&
            renderSection(
              'Orateur',
              'speaker',
              <View style={styles.optionsList}>
                {speakers.map((speaker) => (
                  <TouchableOpacity
                    key={speaker.id}
                    style={[
                      styles.optionItem,
                      filters.speakerId === speaker.id && {
                        backgroundColor: colors.primary[500] + '20',
                      },
                    ]}
                    onPress={() =>
                      setFilters({
                        ...filters,
                        speakerId: filters.speakerId === speaker.id ? undefined : speaker.id,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: themeColors.text },
                        filters.speakerId === speaker.id && {
                          color: colors.primary[500],
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {speaker.name}
                    </Text>
                    {filters.speakerId === speaker.id && (
                      <Check size={18} color={colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

          {/* Categories Section */}
          {categories.length > 0 &&
            renderSection(
              'Categorie / Theme',
              'category',
              <View style={styles.optionsList}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.optionItem,
                      filters.category === category && {
                        backgroundColor: colors.primary[500] + '20',
                      },
                    ]}
                    onPress={() =>
                      setFilters({
                        ...filters,
                        category: filters.category === category ? undefined : category,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: themeColors.text },
                        filters.category === category && {
                          color: colors.primary[500],
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {category}
                    </Text>
                    {filters.category === category && (
                      <Check size={18} color={colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

          {/* Tags Section */}
          {tags.length > 0 &&
            renderSection(
              'Tags',
              'tags',
              <View style={styles.tagsContainer}>
                {tags.map((tag) => {
                  const isSelected = filters.tags?.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary[500]
                            : themeColors.surface,
                          borderColor: isSelected
                            ? colors.primary[500]
                            : themeColors.border,
                        },
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          {
                            color: isSelected ? '#FFFFFF' : themeColors.text,
                          },
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

          {/* Date Range Section */}
          {renderSection(
            'Periode',
            'date',
            <View style={styles.dateSection}>
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: filters.dateFrom ? colors.primary[500] : 'transparent',
                      borderWidth: filters.dateFrom ? 1 : 0,
                    },
                  ]}
                  onPress={() => setShowDateFromPicker(true)}
                >
                  <Calendar
                    size={18}
                    color={filters.dateFrom ? colors.primary[500] : themeColors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      {
                        color: filters.dateFrom ? themeColors.text : themeColors.textTertiary,
                      },
                    ]}
                  >
                    {formatDateDisplay(filters.dateFrom) || 'Date de debut'}
                  </Text>
                  {filters.dateFrom && (
                    <TouchableOpacity onPress={clearDateFrom} style={styles.clearDateButton}>
                      <X size={14} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                <Text style={[styles.dateSeparator, { color: themeColors.textSecondary }]}>
                  a
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: filters.dateTo ? colors.primary[500] : 'transparent',
                      borderWidth: filters.dateTo ? 1 : 0,
                    },
                  ]}
                  onPress={() => setShowDateToPicker(true)}
                >
                  <Calendar
                    size={18}
                    color={filters.dateTo ? colors.primary[500] : themeColors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      {
                        color: filters.dateTo ? themeColors.text : themeColors.textTertiary,
                      },
                    ]}
                  >
                    {formatDateDisplay(filters.dateTo) || 'Date de fin'}
                  </Text>
                  {filters.dateTo && (
                    <TouchableOpacity onPress={clearDateTo} style={styles.clearDateButton}>
                      <X size={14} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* Quick date presets */}
              <View style={styles.datePresets}>
                <TouchableOpacity
                  style={[styles.presetButton, { backgroundColor: themeColors.surface }]}
                  onPress={() => {
                    const today = new Date();
                    const lastMonth = new Date(today);
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    setFilters({
                      ...filters,
                      dateFrom: lastMonth.toISOString().split('T')[0],
                      dateTo: today.toISOString().split('T')[0],
                    });
                  }}
                >
                  <Text style={[styles.presetText, { color: themeColors.text }]}>
                    Dernier mois
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, { backgroundColor: themeColors.surface }]}
                  onPress={() => {
                    const today = new Date();
                    const lastYear = new Date(today);
                    lastYear.setFullYear(lastYear.getFullYear() - 1);
                    setFilters({
                      ...filters,
                      dateFrom: lastYear.toISOString().split('T')[0],
                      dateTo: today.toISOString().split('T')[0],
                    });
                  }}
                >
                  <Text style={[styles.presetText, { color: themeColors.text }]}>
                    Derniere annee
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, { backgroundColor: themeColors.surface }]}
                  onPress={() => {
                    const year = new Date().getFullYear();
                    setFilters({
                      ...filters,
                      dateFrom: `${year}-01-01`,
                      dateTo: `${year}-12-31`,
                    });
                  }}
                >
                  <Text style={[styles.presetText, { color: themeColors.text }]}>
                    Cette annee
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Pickers */}
              {showDateFromPicker && (
                <DateTimePicker
                  value={filters.dateFrom ? new Date(filters.dateFrom) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateFromChange}
                  maximumDate={filters.dateTo ? new Date(filters.dateTo) : new Date()}
                />
              )}
              {showDateToPicker && (
                <DateTimePicker
                  value={filters.dateTo ? new Date(filters.dateTo) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateToChange}
                  minimumDate={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                  maximumDate={new Date()}
                />
              )}
            </View>
          )}
        </ScrollView>

        {/* Apply Button */}
        <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
          <TouchableOpacity
            style={[
              styles.applyButton,
              { backgroundColor: colors.primary[500] },
            ]}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>
              Appliquer les filtres
              {hasActiveFilters() && ' (actif)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    padding: 4,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionsList: {
    gap: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateSection: {
    gap: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
    flex: 1,
  },
  dateSeparator: {
    fontSize: 14,
  },
  clearDateButton: {
    padding: 4,
  },
  datePresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
