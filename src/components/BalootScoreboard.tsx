import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { useScoreStorage } from '../hooks/useScoreStorage';
import { TeamCard } from './TeamCard';
import { ActionButton } from './ActionButton';
import { GameConfig } from '../config/games';
import { useLanguage } from '../context/LanguageContext';

interface Round {
  roundNumber: number;
  team1Score: number;
  team2Score: number;
}

interface BalootScoreboardProps {
  gameConfig: GameConfig;
  onBack: () => void;
}

export const BalootScoreboard: React.FC<BalootScoreboardProps> = ({ gameConfig, onBack }) => {
  const { t } = useLanguage();
  const { team1, team2, updateTeam1, updateTeam2, resetScores, isLoading } =
    useScoreStorage(gameConfig.id);
  const [team1Input, setTeam1Input] = useState<string>('');
  const [team2Input, setTeam2Input] = useState<string>('');
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);

  const targetScore = gameConfig.winCondition?.targetScore || 152;

  useEffect(() => {
    setTeam1Input(String(team1.score));
    setTeam2Input(String(team2.score));
  }, [team1.score, team2.score]);

  useEffect(() => {
    // Check for win condition
    if (team1.score >= targetScore && !gameWon) {
      setGameWon(true);
      setWinner(team1.name);
      Alert.alert(
        t.common.gameOver,
        t.balootScoreboard.gameOverMessage.replace('{name}', team1.name).replace('{score}', team1.score.toString()),
        [{ text: t.common.ok }]
      );
    } else if (team2.score >= targetScore && !gameWon) {
      setGameWon(true);
      setWinner(team2.name);
      Alert.alert(
        t.common.gameOver,
        t.balootScoreboard.gameOverMessage.replace('{name}', team2.name).replace('{score}', team2.score.toString()),
        [{ text: t.common.ok }]
      );
    }
  }, [team1.score, team2.score, targetScore, gameWon, team1.name, team2.name]);

  const handleAddRound = () => {
    if (gameWon) return;

    const parseTotal = (text: string, current: number, teamLabel: string) => {
      if (text.trim() === '') return current;
      const value = parseInt(text, 10);
      if (isNaN(value) || value < 0) {
        Alert.alert(
          t.balootScoreboard.invalidInput,
          t.balootScoreboard.pleaseEnterValidNumberTeam.replace(
            '{team}',
            teamLabel
          )
        );
        return null;
      }
      return value;
    };

    const newTeam1Total = parseTotal(team1Input, team1.score, '1');
    if (newTeam1Total === null) return;
    const newTeam2Total = parseTotal(team2Input, team2.score, '2');
    if (newTeam2Total === null) return;

    const team1Delta = newTeam1Total - team1.score;
    const team2Delta = newTeam2Total - team2.score;

    if (team1Delta < 0 || team2Delta < 0) {
      Alert.alert(
        t.balootScoreboard.invalidInput,
        t.balootScoreboard.cannotDecreaseTotal ||
          'New total cannot be less than current score'
      );
      return;
    }

    if (team1Delta === 0 && team2Delta === 0) {
      Alert.alert(
        t.balootScoreboard.invalidInput,
        t.balootScoreboard.pleaseEnterAtLeastOneScore
      );
      return;
    }

    if (team1Delta !== 0) {
      updateTeam1({ score: newTeam1Total });
    }
    if (team2Delta !== 0) {
      updateTeam2({ score: newTeam2Total });
    }

    const newRound: Round = {
      roundNumber: rounds.length + 1,
      team1Score: team1Delta,
      team2Score: team2Delta,
    };
    setRounds([...rounds, newRound]);

    setTeam1Input(String(newTeam1Total));
    setTeam2Input(String(newTeam2Total));
  };

  const handleReset = () => {
    resetScores();
    setTeam1Input('');
    setTeam2Input('');
    setGameWon(false);
    setWinner(null);
    setRounds([]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
          {gameWon && winner && (
            <Text style={styles.winnerText}>
              🎉 {t.balootScoreboard.wins.replace('{name}', winner)} 🎉
            </Text>
          )}
        </View>

        <View style={styles.teamsRow}>
          <TeamCard
            team={team2}
            onNameChange={(name) => updateTeam2({ name })}
            onSelect={() => {}}
            editableScore
            scoreValue={team2Input}
            onChangeScoreText={setTeam2Input}
          />
          <TeamCard
            team={team1}
            onNameChange={(name) => updateTeam1({ name })}
            onSelect={() => {}}
            editableScore
            scoreValue={team1Input}
            onChangeScoreText={setTeam1Input}
          />
        </View>

        <View style={styles.addButtonContainer}>
          <ActionButton
            label={t.common.addRound}
            onPress={handleAddRound}
            variant="primary"
            disabled={gameWon || (team1Input.trim() === '' && team2Input.trim() === '')}
          />
        </View>

        {rounds.length > 0 && (
          <View style={styles.roundsSection}>
            <Text style={styles.sectionTitle}>{t.common.roundsHistory}</Text>
            {rounds.map((round, index) => (
              <View key={index} style={styles.roundCard}>
                <Text style={styles.roundNumber}>
                  {t.common.round} {round.roundNumber}
                </Text>
                <View style={styles.roundScores}>
                  <View style={styles.roundScoreItem}>
                    <Text style={styles.roundTeamName}>{team2.name}</Text>
                    <Text style={styles.roundScoreValue}>{round.team2Score}</Text>
                  </View>
                  <View style={styles.roundScoreItem}>
                    <Text style={styles.roundTeamName}>{team1.name}</Text>
                    <Text style={styles.roundScoreValue}>{round.team1Score}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <ActionButton
            label={t.common.resetGame}
            onPress={handleReset}
            variant="danger"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
    marginBottom: 16,
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
  winnerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34C759',
    marginTop: 10,
  },
  teamsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    color: '#999',
  },
  addButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  roundsSection: {
    marginVertical: 20,
  },
  roundCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  roundNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  roundScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roundScoreItem: {
    alignItems: 'center',
  },
  roundTeamName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roundScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginVertical: 20,
    alignItems: 'center',
  },
});

