import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView, Animated } from 'react-native';
import { useScoreStorage } from '../hooks/useScoreStorage';
import { TeamCard } from './TeamCard';
import { ActionButton } from './ActionButton';
import { GameConfig } from '../config/games';
import { useLanguage } from '../context/LanguageContext';
import { colors, cardBase, cardShadow, typography } from '../theme/styles';
import { useSwipeToGoBack } from '../hooks/useSwipeToGoBack';

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
  const swipeHandlers = useSwipeToGoBack({ onBack });
  const [team1Input, setTeam1Input] = useState<string>('');
  const [team2Input, setTeam2Input] = useState<string>('');
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);

  const targetScore = gameConfig.winCondition?.targetScore || 152;

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

    const team1Score = team1Input.trim() === '' ? 0 : parseInt(team1Input, 10);
    const team2Score = team2Input.trim() === '' ? 0 : parseInt(team2Input, 10);

    if ((team1Input.trim() !== '' && isNaN(team1Score)) || team1Score < 0) {
      Alert.alert(
        t.balootScoreboard.invalidInput,
        t.balootScoreboard.pleaseEnterValidNumberTeam.replace('{team}', '1')
      );
      return;
    }

    if ((team2Input.trim() !== '' && isNaN(team2Score)) || team2Score < 0) {
      Alert.alert(
        t.balootScoreboard.invalidInput,
        t.balootScoreboard.pleaseEnterValidNumberTeam.replace('{team}', '2')
      );
      return;
    }

    if (team1Score === 0 && team2Score === 0) {
      Alert.alert(
        t.balootScoreboard.invalidInput,
        t.balootScoreboard.pleaseEnterAtLeastOneScore
      );
      return;
    }

    // Add scores to teams
    if (team1Score > 0) {
      updateTeam1({ score: team1.score + team1Score });
    }
    if (team2Score > 0) {
      updateTeam2({ score: team2.score + team2Score });
    }

    // Add round to history
    const newRound: Round = {
      roundNumber: rounds.length + 1,
      team1Score: team1Score,
      team2Score: team2Score,
    };
    setRounds([...rounds, newRound]);

    // Clear inputs
    setTeam1Input('');
    setTeam2Input('');
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
      <Animated.View style={[styles.wrapper, swipeHandlers.animatedStyle]} {...swipeHandlers.panHandlers}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>
              {t.games[gameConfig.id as keyof typeof t.games]?.name || gameConfig.name}
            </Text>
            {gameWon && winner && (
              <Text style={styles.winnerText}>
                🎉 {t.balootScoreboard.wins.replace('{name}', winner)} 🎉
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.resetIconButton}>
            <Text style={styles.resetIconText}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.teamsRow}>
          <TeamCard
            team={team2}
            selected={false}
            onNameChange={(name) => updateTeam2({ name })}
            onSelect={() => {}}
          />
          <TeamCard
            team={team1}
            selected={false}
            onNameChange={(name) => updateTeam1({ name })}
            onSelect={() => {}}
          />
        </View>

        <View style={styles.inputsRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{team2.name}</Text>
            <TextInput
              style={[styles.input, gameWon && styles.inputDisabled]}
              value={team2Input}
              onChangeText={setTeam2Input}
              placeholder="0"
              keyboardType="numeric"
              editable={!gameWon}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{team1.name}</Text>
            <TextInput
              style={[styles.input, gameWon && styles.inputDisabled]}
              value={team1Input}
              onChangeText={setTeam1Input}
              placeholder="0"
              keyboardType="numeric"
              editable={!gameWon}
            />
          </View>
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

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  header: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 50,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.accent.red,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.heading,
    textAlign: 'center',
    marginBottom: 6,
  },
  resetIconButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  resetIconText: {
    fontSize: 28,
    color: colors.accent.red,
    fontWeight: '600',
  },
  winnerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.accent.green,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  teamsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border.accent,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: colors.background.card,
    color: colors.text.primary,
  },
  inputDisabled: {
    backgroundColor: colors.button.disabled,
    borderColor: colors.border.light,
    color: colors.text.muted,
  },
  addButtonContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  roundsSection: {
    marginVertical: 12,
  },
  roundCard: {
    ...cardBase,
    padding: 12,
    marginBottom: 8,
  },
  roundNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent.red,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
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
    color: colors.text.secondary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  roundScoreValue: {
    ...typography.scoreSmall,
    color: colors.text.primary,
  },
  section: {
    marginVertical: 12,
    alignItems: 'center',
  },
});

