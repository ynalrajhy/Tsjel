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
  children?: React.ReactNode;
  editableScore?: boolean;
  scoreValue?: string;
  onChangeScoreText?: (text: string) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  selected = false,
  onNameChange,
  onSelect,
  children,
  editableScore = false,
  scoreValue,
  onChangeScoreText,
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
      {editableScore && scoreValue !== undefined && onChangeScoreText ? (
        <TextInput
          style={styles.scoreInput}
          value={scoreValue}
          onChangeText={onChangeScoreText}
          keyboardType="numeric"
        />
      ) : (
        <Text style={styles.scoreText}>{team.score}</Text>
      )}
      {children}
    </TouchableOpacity>
  );
};

const DARK_SELECTED_BACKGROUND = '#002244';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...cardBase,
    padding: 12,
    alignItems: 'center',
  },
  containerSelected: {
    ...cardSelected,
    backgroundColor: colors.accent.blue,
    borderColor: colors.border.accent,
    borderWidth: 3,
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
  scoreInput: {
    ...typography.score,
    textAlign: "center",
    color: colors.accent.red,
    paddingVertical: 0,
  },
});

