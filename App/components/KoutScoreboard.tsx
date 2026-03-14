import React, { useState, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useScoreStorage } from "../hooks/useScoreStorage";
import { useFirebase } from "../context/FirebaseContext";
import { ActionButton } from "./ActionButton";
import { useLanguage } from "../context/LanguageContext";
import { colors, cardBase, typography } from "../theme/styles";
import { useSwipeToGoBack } from "../hooks/useSwipeToGoBack";

interface KoutScoreboardProps {
  gameEndCondition: 51 | 101 | null;
  onBack: () => void;
}

interface RoundRecord {
  id: string;
  round: number;
  team1Score: number;
  team2Score: number;
  team1HandType: string;
  team2HandType: string;
}

// Correct scoring logic for each hand type
const getScoringForHand = (
  handType: string,
): { winPoints: number; losePoints: number } => {
  switch (handType) {
    case "M":
      return { winPoints: 5, losePoints: 5 };
    case "5":
      return { winPoints: 5, losePoints: 10 };
    case "6":
      return { winPoints: 6, losePoints: 12 };
    case "7":
      return { winPoints: 7, losePoints: 14 };
    case "8":
      return { winPoints: 8, losePoints: 16 };
    case "9":
      return { winPoints: 36, losePoints: 18 };
    default:
      return { winPoints: 0, losePoints: 0 };
  }
};

const KoutScoreboardContent = memo(
  ({ gameEndCondition, onBack }: KoutScoreboardProps) => {
    const { t } = useLanguage();
    const { saveGameResult, user } = useFirebase();
    const { team1, team2, updateTeam1, updateTeam2, resetScores, isLoading } =
      useScoreStorage("kout");

    const [selectedTeam, setSelectedTeam] = useState<1 | 2 | null>(null);
    const [selectedHandType, setSelectedHandType] = useState<string | null>(
      null,
    );
    const [roundHistory, setRoundHistory] = useState<RoundRecord[]>([]);
    const [gameSaved, setGameSaved] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [showGameSummary, setShowGameSummary] = useState(false);
    const [team1Name, setTeam1Name] = useState(team1.name || "Team 1");
    const [team2Name, setTeam2Name] = useState(team2.name || "Team 2");
    const swipeHandlers = useSwipeToGoBack({ onBack });

    const winner =
      team1.score > team2.score
        ? team1Name
        : team2.score > team1.score
          ? team2Name
          : null;

    const handleRecordRound = (selectedTeamWon: boolean) => {
      if (selectedTeam === null || selectedHandType === null || gameEnded)
        return;

      const scoring = getScoringForHand(selectedHandType);
      let newTeam1Score = team1.score;
      let newTeam2Score = team2.score;

      if (selectedTeam === 1) {
        if (selectedTeamWon) {
          newTeam1Score += scoring.winPoints;
        } else {
          newTeam2Score += scoring.losePoints;
        }
      } else {
        if (selectedTeamWon) {
          newTeam2Score += scoring.winPoints;
        } else {
          newTeam1Score += scoring.losePoints;
        }
      }

      const newRound: RoundRecord = {
        id: `round-${Date.now()}`,
        round: roundHistory.length + 1,
        team1Score: newTeam1Score,
        team2Score: newTeam2Score,
        team1HandType: selectedHandType,
        team2HandType: selectedHandType,
      };

      setRoundHistory([...roundHistory, newRound]);
      updateTeam1({ score: newTeam1Score });
      updateTeam2({ score: newTeam2Score });

      checkGameEnd(newTeam1Score, newTeam2Score);

      setSelectedTeam(null);
      setSelectedHandType(null);
    };

    const checkGameEnd = (t1Score: number, t2Score: number) => {
      if (gameEndCondition === null) return;
      if (gameEndCondition === 51 && (t1Score >= 51 || t2Score >= 51)) {
        setGameEnded(true);
        setShowGameSummary(true);
      }
      if (gameEndCondition === 101 && (t1Score >= 101 || t2Score >= 101)) {
        setGameEnded(true);
        setShowGameSummary(true);
      }
    };

    const handleUndoRound = () => {
      if (roundHistory.length === 0) return;
      const prevHistory = roundHistory.slice(0, -1);
      const prevTeam1Score =
        prevHistory.length > 0
          ? prevHistory[prevHistory.length - 1].team1Score
          : 0;
      const prevTeam2Score =
        prevHistory.length > 0
          ? prevHistory[prevHistory.length - 1].team2Score
          : 0;
      setRoundHistory(prevHistory);
      updateTeam1({ score: prevTeam1Score });
      updateTeam2({ score: prevTeam2Score });
      setGameEnded(false);
      setShowGameSummary(false);
    };

    const handleSaveGame = async () => {
      const gameWinner = team1.score > team2.score ? team1Name : team2Name;
      try {
        await saveGameResult({
          gameType: "kout",
          team1: { name: team1Name, score: team1.score },
          team2: { name: team2Name, score: team2.score },
          winner: gameWinner,
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
      Alert.alert(
        t.common.resetGame,
        "Are you sure you want to reset the game?",
        [
          { text: t.common.cancel, onPress: () => {} },
          {
            text: t.common.ok,
            onPress: () => {
              resetScores();
              setRoundHistory([]);
              setSelectedTeam(null);
              setSelectedHandType(null);
              setGameSaved(false);
              setGameEnded(false);
              setShowGameSummary(false);
            },
          },
        ],
      );
    };

    const handleNewGame = () => {
      setShowGameSummary(false);
      resetScores();
      setRoundHistory([]);
      setSelectedTeam(null);
      setSelectedHandType(null);
      setGameSaved(false);
      setGameEnded(false);
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
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerSideButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{t.games.kout.name}</Text>
          </View>
          <TouchableOpacity
            onPress={handleUndoRound}
            disabled={roundHistory.length === 0 || gameEnded}
            style={[
              styles.headerSideButton,
              (roundHistory.length === 0 || gameEnded) &&
                styles.undoButtonDisabled,
            ]}
          >
            <Text style={styles.undoButtonText}>↶</Text>
          </TouchableOpacity>
        </View>

        {/* ===== MAIN CONTENT (scrollable) ===== */}
        <View style={styles.mainContent}>
          {/* ===== TOP SECTION: Teams + Score Table ===== */}
          <View style={styles.topSection}>
            {/* Team Names + Total Scores */}
            <View style={styles.teamsRow}>
              <View style={styles.teamBlock}>
                <TextInput
                  style={styles.teamNameInput}
                  value={team1Name}
                  onChangeText={(text) => {
                    setTeam1Name(text);
                    updateTeam1({ name: text });
                  }}
                  placeholder="Team 1"
                  placeholderTextColor={colors.text.muted}
                  editable={!gameEnded}
                />
                <Text style={styles.teamTotalScore}>{team1.score}</Text>
              </View>

              <View style={styles.teamsDivider}>
                <Text style={styles.vsText}>vs</Text>
              </View>

              <View style={styles.teamBlock}>
                <TextInput
                  style={styles.teamNameInput}
                  value={team2Name}
                  onChangeText={(text) => {
                    setTeam2Name(text);
                    updateTeam2({ name: text });
                  }}
                  placeholder="Team 2"
                  placeholderTextColor={colors.text.muted}
                  editable={!gameEnded}
                />
                <Text style={styles.teamTotalScore}>{team2.score}</Text>
              </View>
            </View>

            {/* Score Table */}
            <View style={styles.scoreTable}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.roundCol]}>
                  RND
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    styles.teamCol,
                    { color: colors.accent.blue },
                  ]}
                >
                  {team1Name}
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    styles.teamCol,
                    { color: colors.accent.red },
                  ]}
                >
                  {team2Name}
                </Text>
              </View>

              {/* Table Rows */}
              <ScrollView
                style={styles.tableBody}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {roundHistory.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyRowText}>. . .</Text>
                  </View>
                ) : (
                  roundHistory.map((round) => (
                    <View key={round.id} style={styles.tableRow}>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.roundCol,
                          styles.roundNumText,
                        ]}
                      >
                        {round.round}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.teamCol,
                          styles.team1CellText,
                        ]}
                      >
                        {round.team1Score} / {round.team1HandType}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.teamCol,
                          styles.team2CellText,
                        ]}
                      >
                        {round.team2Score} / {round.team2HandType}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>

          {/* ===== BOTTOM SECTION: Controls ===== */}
          <View style={styles.bottomSection}>
            {/* Team Selection Buttons */}
            <View style={styles.teamSelectRow}>
              <TouchableOpacity
                style={[
                  styles.teamSelectButton,
                  selectedTeam === 1 && styles.teamSelectButtonActive,
                ]}
                onPress={() => setSelectedTeam((c) => (c === 1 ? null : 1))}
                disabled={gameEnded}
              >
                <Text
                  style={[
                    styles.teamSelectButtonText,
                    selectedTeam === 1 && styles.teamSelectButtonTextActive,
                  ]}
                >
                  {team1Name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.teamSelectButton,
                  selectedTeam === 2 && styles.teamSelectButtonActive,
                ]}
                onPress={() => setSelectedTeam((c) => (c === 2 ? null : 2))}
                disabled={gameEnded}
              >
                <Text
                  style={[
                    styles.teamSelectButtonText,
                    selectedTeam === 2 && styles.teamSelectButtonTextActive,
                  ]}
                >
                  {team2Name}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hand Type Grid */}
            {selectedTeam !== null && !gameEnded && (
              <View style={styles.handTypesGrid}>
                <View style={styles.handTypeRow}>
                  {["M", "6", "8"].map((ht) => (
                    <TouchableOpacity
                      key={ht}
                      style={[
                        styles.handTypeButton,
                        selectedHandType === ht &&
                          styles.handTypeButtonSelected,
                      ]}
                      onPress={() => setSelectedHandType(ht)}
                    >
                      <Text
                        style={[
                          styles.handTypeButtonText,
                          selectedHandType === ht &&
                            styles.handTypeButtonTextSelected,
                        ]}
                      >
                        {ht}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.handTypeRow}>
                  {["5", "7", "9"].map((ht) => (
                    <TouchableOpacity
                      key={ht}
                      style={[
                        styles.handTypeButton,
                        selectedHandType === ht &&
                          styles.handTypeButtonSelected,
                      ]}
                      onPress={() => setSelectedHandType(ht)}
                    >
                      <Text
                        style={[
                          styles.handTypeButtonText,
                          selectedHandType === ht &&
                            styles.handTypeButtonTextSelected,
                        ]}
                      >
                        {ht}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Win / Loss Buttons */}
            {selectedTeam !== null &&
              selectedHandType !== null &&
              !gameEnded && (
                <View style={styles.winLossRow}>
                  <TouchableOpacity
                    style={styles.winButton}
                    onPress={() => handleRecordRound(true)}
                  >
                    <Text style={styles.winButtonText}>{t.common.win}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.lossButton}
                    onPress={() => handleRecordRound(false)}
                  >
                    <Text style={styles.lossButtonText}>{t.common.lose}</Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* Reset Game */}
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>{t.common.resetGame}</Text>
            </TouchableOpacity>

            {/* Save Game */}
            {(team1.score > 0 || team2.score > 0) && user && !gameSaved && (
              <View style={styles.saveSection}>
                <ActionButton
                  label={t.common?.saveGame || "Save Game"}
                  onPress={handleSaveGame}
                  variant="secondary"
                />
              </View>
            )}

            {gameSaved && (
              <Text style={styles.savedText}>
                ✓ {t.common?.gameSaved || "Game Saved"}
              </Text>
            )}
          </View>
        </View>

        {/* ===== GAME SUMMARY MODAL ===== */}
        <Modal
          visible={showGameSummary}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {t.koutScoreboard.gameEnded}
              </Text>

              <View style={styles.modalWinnerBlock}>
                <Text style={styles.modalWinnerLabel}>Winner</Text>
                <Text style={styles.modalWinnerName}>{winner}</Text>
              </View>

              <View style={styles.modalScoresRow}>
                <View style={styles.modalScoreBlock}>
                  <Text style={styles.modalScoreTeam}>{team1Name}</Text>
                  <Text style={styles.modalScoreValue}>{team1.score}</Text>
                </View>
                <Text style={styles.modalVs}>vs</Text>
                <View style={styles.modalScoreBlock}>
                  <Text style={styles.modalScoreTeam}>{team2Name}</Text>
                  <Text style={styles.modalScoreValue}>{team2.score}</Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <ActionButton
                  label={t.common.newGame}
                  onPress={handleNewGame}
                  variant="primary"
                />
                {user && !gameSaved && (
                  <ActionButton
                    label={t.common?.saveGame || "Save Game"}
                    onPress={handleSaveGame}
                    variant="secondary"
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    );
  },
);

export const KoutScoreboard: React.FC<KoutScoreboardProps> = memo(
  ({ gameEndCondition, onBack }) => {
    return (
      <View style={styles.wrapper}>
        <KoutScoreboardContent
          gameEndCondition={gameEndCondition}
          onBack={onBack}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  // ===== LAYOUT =====
  wrapper: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  mainContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  },

  // ===== HEADER =====
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.primary,
    borderBottomWidth: 2,
    borderBottomColor: colors.border.default,
  },
  headerSideButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 50,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: colors.accent.red,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    ...typography.heading,
    fontSize: 20,
    textAlign: "center",
  },
  undoButtonDisabled: {
    opacity: 0.3,
  },
  undoButtonText: {
    fontSize: 24,
    color: colors.accent.blue,
    fontWeight: "600",
  },

  // ===== TEAMS ROW (TOP) =====
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teamBlock: {
    flex: 1,
    alignItems: "center",
  },
  teamNameInput: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 100,
    letterSpacing: 0.3,
  },
  teamTotalScore: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.accent.red,
    marginTop: 4,
    letterSpacing: 1,
  },
  teamsDivider: {
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.muted,
    marginTop: 20,
  },

  // ===== SCORE TABLE =====
  scoreTable: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.background.card,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.background.secondary,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tableHeaderCell: {
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.text.muted,
  },
  roundCol: {
    flex: 0.6,
  },
  teamCol: {
    flex: 1.2,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tableCell: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  roundNumText: {
    color: colors.text.muted,
    fontSize: 13,
  },
  team1CellText: {
    color: colors.text.primary,
  },
  team2CellText: {
    color: colors.text.primary,
  },
  emptyRow: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyRowText: {
    color: colors.text.muted,
    fontSize: 14,
    letterSpacing: 4,
  },

  // ===== TEAM SELECT BUTTONS =====
  teamSelectRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  teamSelectButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  teamSelectButtonActive: {
    backgroundColor: colors.accent.blue,
    borderColor: colors.accent.blue,
  },
  teamSelectButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  teamSelectButtonTextActive: {
    color: colors.background.primary,
  },

  // ===== HAND TYPE GRID =====
  handTypesGrid: {
    gap: 8,
    marginBottom: 12,
  },
  handTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  handTypeButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.border.default,
  },
  handTypeButtonSelected: {
    backgroundColor: colors.accent.gold,
  },
  handTypeButtonText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.background.primary,
    letterSpacing: 0.3,
  },
  handTypeButtonTextSelected: {
    color: colors.text.primary,
  },

  // ===== WIN / LOSS BUTTONS =====
  winLossRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  winButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent.green,
  },
  winButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.background.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  lossButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent.red,
  },
  lossButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.background.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ===== RESET / SAVE =====
  resetButton: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 4,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  saveSection: {
    marginTop: 8,
  },
  savedText: {
    fontSize: 14,
    color: colors.accent.green,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },

  // ===== MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: 28,
    width: "85%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  modalTitle: {
    ...typography.heading,
    fontSize: 24,
    marginBottom: 20,
    color: colors.accent.red,
  },
  modalWinnerBlock: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalWinnerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  modalWinnerName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.accent.red,
    letterSpacing: 0.5,
  },
  modalScoresRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 16,
  },
  modalScoreBlock: {
    alignItems: "center",
  },
  modalScoreTeam: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  modalScoreValue: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.accent.red,
    letterSpacing: 0.5,
  },
  modalVs: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.muted,
  },
  modalButtons: {
    width: "100%",
    gap: 12,
  },
});
