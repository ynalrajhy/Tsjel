import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Team } from '../models/Score';
import { useLanguage } from '../context/LanguageContext';

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
        style={[styles.nameInput, selected && styles.nameInputSelected]}
        value={team.name}
        onChangeText={onNameChange}
        placeholder={t.common.teamName}
        placeholderTextColor="#999"
      />
      {editableScore && scoreValue !== undefined && onChangeScoreText ? (
        <TextInput
          style={[
            styles.scoreInput,
            selected && styles.scoreInputSelected,
          ]}
          value={scoreValue}
          onChangeText={onChangeScoreText}
          keyboardType="numeric"
        />
      ) : (
        <Text style={[styles.scoreText, selected && styles.scoreTextSelected]}>
          {team.score}
        </Text>
      )}
      {children}
    </TouchableOpacity>
  );
};

const DARK_SELECTED_BACKGROUND = '#002244';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  containerSelected: {
    borderColor: DARK_SELECTED_BACKGROUND,
    backgroundColor: DARK_SELECTED_BACKGROUND,
    shadowOpacity: 0.15,
  },
  nameInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
    width: '100%',
  },
  nameInputSelected: {
    color: '#fff',
    borderBottomColor: '#fff',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  scoreTextSelected: {
    color: '#fff',
  },
  scoreInput: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    paddingVertical: 0,
  },
  scoreInputSelected: {
    color: '#fff',
  },
});

