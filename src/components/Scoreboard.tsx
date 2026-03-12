import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useScoreStorage } from '../hooks/useScoreStorage';
import { TeamCard } from './TeamCard';
import { PointButton } from './PointButton';
import { ActionButton } from './ActionButton';
import { BalootScoreboard } from './BalootScoreboard';
import { HandScoreboard } from './HandScoreboard';
import { GameConfig } from '../config/games';
import { useLanguage } from '../context/LanguageContext';

interface ScoreboardProps {
  gameConfig: GameConfig;
  onBack: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ gameConfig, onBack }) => {
  // If hand mode, render HandScoreboard
  if (gameConfig.scoringMode === 'hand') {
    return <HandScoreboard gameConfig={gameConfig} onBack={onBack} />;
  }

  // If manual input mode, render BalootScoreboard
  if (gameConfig.scoringMode === 'manualInput') {
    return <BalootScoreboard gameConfig={gameConfig} onBack={onBack} />;
  }

  // Otherwise, render point selection scoreboard (default for backward compatibility)
  const { t } = useLanguage();
  const { team1, team2, updateTeam1, updateTeam2, resetScores, isLoading } =
    useScoreStorage(gameConfig.id);
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<1 | 2 | null>(null);

  const handleWin = () => {
    if (selectedPoints === null || selectedTeam === null || !gameConfig.scoringRules) return;

    const pointsToAward = gameConfig.scoringRules.win(selectedPoints);

    if (selectedTeam === 1) {
      updateTeam1({ score: team1.score + pointsToAward });
    } else {
      updateTeam2({ score: team2.score + pointsToAward });
    }
    
    setSelectedPoints(null);
  };

  const handleLose = () => {
    if (selectedPoints === null || selectedTeam === null || !gameConfig.scoringRules) return;

    const pointsToAward = gameConfig.scoringRules.lose(selectedPoints);

    if (selectedTeam === 1) {
      updateTeam2({ score: team2.score + pointsToAward });
    } else {
      updateTeam1({ score: team1.score + pointsToAward });
    }
    
    setSelectedPoints(null);
  };

  const handleReset = () => {
    resetScores();
    setSelectedPoints(null);
    setSelectedTeam(null);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {t.games[gameConfig.id as keyof typeof t.games]?.name || gameConfig.name}
        </Text>
      </View>

      <TeamCard
        team={team1}
        selected={selectedTeam === 1}
        onNameChange={(name) => updateTeam1({ name })}
        onSelect={() => setSelectedTeam(1)}
      />
      <TeamCard
        team={team2}
        selected={selectedTeam === 2}
        onNameChange={(name) => updateTeam2({ name })}
        onSelect={() => setSelectedTeam(2)}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.common.selectPoints}</Text>
        <View style={styles.pointsContainer}>
          {(gameConfig.pointValues || []).map((points) => (
            <PointButton
              key={points}
              points={points}
              selected={selectedPoints === points}
              onPress={() => setSelectedPoints(points)}
            />
          ))}
        </View>
      </View>

      {selectedTeam !== null && selectedPoints !== null && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedTeam === 1 ? team1.name : team2.name} {t.common.actions}
          </Text>
          <View style={styles.actionsContainer}>
            <ActionButton
              label={t.common.win}
              onPress={handleWin}
              variant="primary"
            />
            <ActionButton
              label={t.common.lose}
              onPress={handleLose}
              variant="secondary"
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <ActionButton
          label={t.common.resetScores}
          onPress={handleReset}
          variant="danger"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 10,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  section: {
    marginVertical: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});

