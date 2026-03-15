import React, { useState, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { useScoreStorage } from "../hooks/useScoreStorage";
import { useFirebase } from "../context/FirebaseContext";
import { TeamCard } from "./TeamCard";
import { PointButton } from "./PointButton";
import { ActionButton } from "./ActionButton";
import { BalootGameSetup } from "./BalootGameSetup";
import { BalootScoreboard } from "./BalootScoreboard";
import { HandGameSetup } from "./HandGameSetup";
import { HandScoreboard } from "./HandScoreboard";
import { KoutGameSetup } from "./KoutGameSetup";
import { KoutScoreboard } from "./KoutScoreboard";
import { GameConfig } from "../config/games";
import { useLanguage } from "../context/LanguageContext";
import { colors, typography } from "../theme/styles";
import { useSwipeToGoBack } from "../hooks/useSwipeToGoBack";

interface ScoreboardProps {
  gameConfig: GameConfig;
  onBack: () => void;
}

// ===== KOUT WRAPPER =====
const KoutScoreboardWrapper = memo(
  ({ gameConfig, onBack }: ScoreboardProps) => {
    const [state, setState] = useState<{
      stage: "setup" | "playing";
      gameEndCondition: 51 | 101 | null;
      team1Name: string;
      team2Name: string;
      penaltyPoints: number;
    }>({
      stage: "setup",
      gameEndCondition: null,
      team1Name: "Team 1",
      team2Name: "Team 2",
      penaltyPoints: 0,
    });

    const handleStartGame = (config: {
      gameEndCondition: 51 | 101 | null;
      team1Name: string;
      team2Name: string;
      penaltyPoints: number;
    }) => {
      setState({
        stage: "playing",
        ...config,
      });
    };

    const handleBackFromGame = () => {
      setState({
        stage: "setup",
        gameEndCondition: null,
        team1Name: "Team 1",
        team2Name: "Team 2",
        penaltyPoints: 0,
      });
      onBack();
    };

    if (state.stage === "setup") {
      return <KoutGameSetup onStartGame={handleStartGame} onBack={onBack} />;
    }

    return (
      <KoutScoreboard
        gameEndCondition={state.gameEndCondition}
        team1Name={state.team1Name}
        team2Name={state.team2Name}
        penaltyPoints={state.penaltyPoints}
        onBack={handleBackFromGame}
      />
    );
  },
);

// ===== BALOOT WRAPPER =====
const BalootScoreboardWrapper = memo(
  ({ gameConfig, onBack }: ScoreboardProps) => {
    const [state, setState] = useState<{
      stage: "setup" | "playing";
      team1Name: string;
      team2Name: string;
      penaltyPoints: number;
    }>({
      stage: "setup",
      team1Name: "Team 1",
      team2Name: "Team 2",
      penaltyPoints: 0,
    });

    const handleStartGame = (config: {
      team1Name: string;
      team2Name: string;
      penaltyPoints: number;
    }) => {
      setState({
        stage: "playing",
        ...config,
      });
    };

    const handleBackFromGame = () => {
      setState({
        stage: "setup",
        team1Name: "Team 1",
        team2Name: "Team 2",
        penaltyPoints: 0,
      });
      onBack();
    };

    if (state.stage === "setup") {
      return <BalootGameSetup onStartGame={handleStartGame} onBack={onBack} />;
    }

    return (
      <BalootScoreboard
        team1Name={state.team1Name}
        team2Name={state.team2Name}
        penaltyPoints={state.penaltyPoints}
        onBack={handleBackFromGame}
      />
    );
  },
);

// ===== HAND WRAPPER =====
const HandScoreboardWrapper = memo(
  ({ gameConfig, onBack }: ScoreboardProps) => {
    const [state, setState] = useState<{
      stage: "setup" | "playing";
      playerCount: number;
      playerNames: string[];
      penaltyPoints: number;
    }>({
      stage: "setup",
      playerCount: 4,
      playerNames: ["Player 1", "Player 2", "Player 3", "Player 4"],
      penaltyPoints: 0,
    });

    const handleStartGame = (config: {
      playerCount: number;
      playerNames: string[];
      penaltyPoints: number;
    }) => {
      setState({
        stage: "playing",
        ...config,
      });
    };

    const handleBackFromGame = () => {
      setState({
        stage: "setup",
        playerCount: 4,
        playerNames: ["Player 1", "Player 2", "Player 3", "Player 4"],
        penaltyPoints: 0,
      });
      onBack();
    };

    if (state.stage === "setup") {
      return <HandGameSetup onStartGame={handleStartGame} onBack={onBack} />;
    }

    return (
      <HandScoreboard
        gameConfig={gameConfig}
        playerCount={state.playerCount}
        playerNames={state.playerNames}
        penaltyPoints={state.penaltyPoints}
        onBack={handleBackFromGame}
      />
    );
  },
);

// ===== FALLBACK POINT SELECTION SCOREBOARD =====
const PointSelectionScoreboard = memo(
  ({ gameConfig, onBack }: ScoreboardProps) => {
    const { t } = useLanguage();
    const { saveGameResult, user } = useFirebase();
    const { team1, team2, updateTeam1, updateTeam2, resetScores, isLoading } =
      useScoreStorage(gameConfig.id);

    const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<1 | 2 | null>(null);
    const [gameSaved, setGameSaved] = useState(false);
    const swipeHandlers = useSwipeToGoBack({ onBack });

    const handleWin = () => {
      if (
        selectedPoints === null ||
        selectedTeam === null ||
        !gameConfig.scoringRules
      )
        return;
      const pointsToAward = gameConfig.scoringRules.win(selectedPoints);
      if (selectedTeam === 1) {
        updateTeam1({ score: team1.score + pointsToAward });
      } else {
        updateTeam2({ score: team2.score + pointsToAward });
      }
      setSelectedPoints(null);
    };

    const handleLose = () => {
      if (
        selectedPoints === null ||
        selectedTeam === null ||
        !gameConfig.scoringRules
      )
        return;
      const pointsToAward = gameConfig.scoringRules.lose(selectedPoints);
      if (selectedTeam === 1) {
        updateTeam2({ score: team2.score + pointsToAward });
      } else {
        updateTeam1({ score: team1.score + pointsToAward });
      }
      setSelectedPoints(null);
    };

    const handleSaveGame = async () => {
      const winner = team1.score > team2.score ? team1.name : team2.name;
      try {
        await saveGameResult({
          gameType: "kout",
          team1: { name: team1.name, score: team1.score },
          team2: { name: team2.name, score: team2.score },
          winner: winner,
        });
        setGameSaved(true);
        Alert.alert(
          t.common?.success || "Success",
          t.common?.gameSaved || "Game saved!",
        );
      } catch (error) {
        Alert.alert(
          t.common?.error || "Error",
          t.common?.failedToSave || "Failed to save game",
        );
      }
    };

    const handleReset = () => {
      resetScores();
      setSelectedPoints(null);
      setSelectedTeam(null);
      setGameSaved(false);
    };

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      );
    }

    return (
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
            </View>
            <TouchableOpacity
              onPress={handleReset}
              style={styles.resetIconButton}
            >
              <Text style={styles.resetIconText}>↻</Text>
            </TouchableOpacity>
          </View>

          <TeamCard
            team={team1}
            selected={selectedTeam === 1}
            onNameChange={(name) => updateTeam1({ name })}
            onSelect={() =>
              setSelectedTeam((current) => (current === 1 ? null : 1))
            }
          />
          <TeamCard
            team={team2}
            selected={selectedTeam === 2}
            onNameChange={(name) => updateTeam2({ name })}
            onSelect={() =>
              setSelectedTeam((current) => (current === 2 ? null : 2))
            }
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
                {selectedTeam === 1 ? team1.name : team2.name}{" "}
                {t.common.actions}
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

          {(team1.score > 0 || team2.score > 0) && user && !gameSaved && (
            <View style={styles.section}>
              <ActionButton
                label={t.common?.saveGame || "💾 Save Game"}
                onPress={handleSaveGame}
                variant="secondary"
              />
            </View>
          )}

          {gameSaved && (
            <View style={styles.section}>
              <Text style={styles.savedText}>
                ✓ {t.common?.gameSaved || "Game Saved"}
              </Text>
            </View>
          )}

          {(team1.score > 0 || team2.score > 0) && !user && (
            <View style={styles.section}>
              <Text style={styles.guestNote}>
                {t.common?.loginToSaveGames || "Login to save your games"}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    );
  },
);

// ===== MAIN SCOREBOARD ROUTER =====
export const Scoreboard: React.FC<ScoreboardProps> = memo(
  ({ gameConfig, onBack }) => {
    const content = useMemo(() => {
      if (gameConfig.id === "kout") {
        return (
          <KoutScoreboardWrapper gameConfig={gameConfig} onBack={onBack} />
        );
      }
      if (gameConfig.scoringMode === "hand") {
        return (
          <HandScoreboardWrapper gameConfig={gameConfig} onBack={onBack} />
        );
      }
      if (gameConfig.scoringMode === "manualInput") {
        return (
          <BalootScoreboardWrapper gameConfig={gameConfig} onBack={onBack} />
        );
      }
      return (
        <PointSelectionScoreboard gameConfig={gameConfig} onBack={onBack} />
      );
    }, [gameConfig.id, onBack]);

    return <View style={styles.wrapper}>{content}</View>;
  },
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  section: {
    marginVertical: 12,
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 18,
    marginBottom: 8,
  },
  pointsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  savedText: {
    fontSize: 16,
    color: colors.accent.green,
    fontWeight: "600",
    textAlign: "center",
  },
  guestNote: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: "center",
    fontStyle: "italic",
  },
});
