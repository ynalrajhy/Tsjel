import React, { useState, useEffect, memo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useScoreStorage } from "../hooks/useScoreStorage";
import { useFirebase } from "../context/FirebaseContext";
import { TeamCard } from "./TeamCard";
import { ActionButton } from "./ActionButton";
import { GameConfig } from "../config/games";
import { useLanguage } from "../context/LanguageContext";
import { colors, cardBase, typography } from "../theme/styles";
import { useSwipeToGoBack } from "../hooks/useSwipeToGoBack";

interface Round {
  roundNumber: number;
  team1Score: number;
  team2Score: number;
}

interface BalootScoreboardProps {
  gameConfig: GameConfig;
  onBack: () => void;
  isTransitioning?: boolean;
}

export const BalootScoreboard: React.FC<BalootScoreboardProps> = memo(
  ({ gameConfig, onBack, isTransitioning }) => {
    const { t } = useLanguage();
    const { saveGameResult, user } = useFirebase();

    // CRITICAL PERFORMANCE FIX: Delay the heavy hook initialization
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      if (!isTransitioning) {
        const timer = setTimeout(() => setIsReady(true), 50);
        return () => clearTimeout(timer);
      }
    }, [isTransitioning]);

    const { team1, team2, updateTeam1, updateTeam2, resetScores, isLoading } =
      useScoreStorage(isReady ? gameConfig.id : "dummy");

    const swipeHandlers = useSwipeToGoBack({ onBack });
    const [team1Input, setTeam1Input] = useState<string>("");
    const [team2Input, setTeam2Input] = useState<string>("");
    const [gameWon, setGameWon] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [rounds, setRounds] = useState<Round[]>([]);
    const gameSavedRef = useRef(false);

    const targetScore = gameConfig.winCondition?.targetScore || 152;

    useEffect(() => {
      if (!isReady) return;
      setTeam1Input(String(team1.score));
      setTeam2Input(String(team2.score));
    }, [isReady, team1.score, team2.score]);

    useEffect(() => {
      if (!isReady || gameWon) return;

      let currentWinner = null;
      if (team1.score >= targetScore) {
        currentWinner = team1.name;
      } else if (team2.score >= targetScore) {
        currentWinner = team2.name;
      }

      if (currentWinner) {
        setGameWon(true);
        setWinner(currentWinner);

        if (user && !gameSavedRef.current) {
          gameSavedRef.current = true;
          saveGameResult({
            gameType: "baloot",
            team1: { name: team1.name, score: team1.score },
            team2: { name: team2.name, score: team2.score },
            winner: currentWinner,
            rounds: rounds.length + 1,
          }).catch(console.error);
        }

        Alert.alert(
          t.common.gameOver,
          t.balootScoreboard.gameOverMessage
            .replace("{name}", currentWinner)
            .replace(
              "{score}",
              (currentWinner === team1.name
                ? team1.score
                : team2.score
              ).toString()
            ),
          [{ text: t.common.ok }]
        );
      }
    }, [team1.score, team2.score, targetScore, gameWon, isReady]);

    const handleAddRound = useCallback(() => {
      if (gameWon) return;

      const parseTotal = (text: string, current: number, teamLabel: string) => {
        if (text.trim() === "") return current;
        const value = parseInt(text, 10);
        if (isNaN(value) || value < 0) {
          Alert.alert(
            t.balootScoreboard.invalidInput,
            t.balootScoreboard.pleaseEnterValidNumberTeam.replace(
              "{team}",
              teamLabel
            )
          );
          return null;
        }
        return value;
      };

      const newTeam1Total = parseTotal(team1Input, team1.score, "1");
      if (newTeam1Total === null) return;
      const newTeam2Total = parseTotal(team2Input, team2.score, "2");
      if (newTeam2Total === null) return;

      const team1Delta = newTeam1Total - team1.score;
      const team2Delta = newTeam2Total - team2.score;

      if (team1Delta < 0 || team2Delta < 0) {
        Alert.alert(
          t.balootScoreboard.invalidInput,
          "New total cannot be less than current score"
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

      if (team1Delta !== 0) updateTeam1({ score: newTeam1Total });
      if (team2Delta !== 0) updateTeam2({ score: newTeam2Total });

      const newRound: Round = {
        roundNumber: rounds.length + 1,
        team1Score: team1Delta,
        team2Score: team2Delta,
      };
      setRounds((prev) => [...prev, newRound]);
      setTeam1Input(String(newTeam1Total));
      setTeam2Input(String(newTeam2Total));
    }, [
      gameWon,
      team1Input,
      team2Input,
      team1.score,
      team2.score,
      rounds.length,
      t,
      updateTeam1,
      updateTeam2,
    ]);

    const handleReset = useCallback(() => {
      resetScores();
      setTeam1Input("");
      setTeam2Input("");
      setGameWon(false);
      setWinner(null);
      setRounds([]);
      gameSavedRef.current = false;
    }, [resetScores]);

    if (!isReady || isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.red} />
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[styles.wrapper, swipeHandlers.animatedStyle]}
          {...swipeHandlers.panHandlers}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.title}>
                  {t.games[gameConfig.id as keyof typeof t.games]?.name ||
                    gameConfig.name}
                </Text>
                {gameWon && winner && (
                  <Text style={styles.winnerText}>
                    🎉 {t.balootScoreboard.wins.replace("{name}", winner)} 🎉
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={handleReset}
                style={styles.resetIconButton}
              >
                <Text style={styles.resetIconText}>↻</Text>
              </TouchableOpacity>
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
                disabled={
                  gameWon ||
                  (team1Input.trim() === "" && team2Input.trim() === "")
                }
              />
            </View>

            {gameWon && gameSavedRef.current && (
              <View style={styles.savedIndicator}>
                <Text style={styles.savedText}>
                  ✓ {t.common?.gameSaved || "Game Saved"}
                </Text>
              </View>
            )}

            {rounds.length > 0 && (
              <View style={styles.roundsSection}>
                <Text style={styles.sectionTitle}>
                  {t.common.roundsHistory}
                </Text>
                {rounds.map((round, index) => (
                  <View key={index} style={styles.roundCard}>
                    <Text style={styles.roundNumber}>
                      {t.common.round} {round.roundNumber}
                    </Text>
                    <View style={styles.roundScores}>
                      <View style={styles.roundScoreItem}>
                        <Text style={styles.roundTeamName}>{team2.name}</Text>
                        <Text style={styles.roundScoreValue}>
                          {round.team2Score}
                        </Text>
                      </View>
                      <View style={styles.roundScoreItem}>
                        <Text style={styles.roundTeamName}>{team1.name}</Text>
                        <Text style={styles.roundScoreValue}>
                          {round.team1Score}
                        </Text>
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
  }
);

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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  header: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 50,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.accent.red,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.heading,
    textAlign: "center",
    marginBottom: 6,
  },
  resetIconButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 50,
    alignItems: "flex-end",
  },
  resetIconText: {
    fontSize: 28,
    color: colors.accent.red,
    fontWeight: "600",
  },
  winnerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.accent.green,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  teamsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border.accent,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    textAlign: "center",
    backgroundColor: colors.background.card,
    color: colors.text.primary,
  },
  inputDisabled: {
    backgroundColor: colors.button.disabled,
    borderColor: colors.border.light,
    color: colors.text.muted,
  },
  addButtonContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  savedIndicator: {
    alignItems: "center",
    marginBottom: 12,
  },
  savedText: {
    fontSize: 14,
    color: colors.accent.green,
    fontWeight: "600",
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
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
    fontWeight: "bold",
    color: colors.accent.red,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  roundScores: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  roundScoreItem: {
    alignItems: "center",
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
    alignItems: "center",
  },
});
