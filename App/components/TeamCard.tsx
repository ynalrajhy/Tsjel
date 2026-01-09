import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Team } from '../models/Score';
import { useLanguage } from '../context/LanguageContext';
import { colors, cardBase, cardSelected, cardShadow, typography } from '../theme/styles';

interface TeamCardProps {
  team: Team;
  selected?: boolean;
  onNameChange: (name: string) => void;
  onSelect: () => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  selected = false,
  onNameChange,
  onSelect,
}) => {
  const { t } = useLanguage();
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <TextInput
        style={styles.nameInput}
        value={team.name}
        onChangeText={onNameChange}
        placeholder={t.common.teamName}
        placeholderTextColor="#999"
      />
      <Text style={styles.scoreText}>{team.score}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...cardBase,
    padding: 12,
    alignItems: 'center',
  },
  containerSelected: {
    ...cardSelected,
    backgroundColor: colors.background.cardAlt,
  },
  nameInput: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.border.accent,
    paddingBottom: 4,
    width: '100%',
    letterSpacing: 0.3,
  },
  scoreText: {
    ...typography.score,
    color: colors.accent.red,
  },
});

