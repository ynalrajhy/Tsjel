import React, { useState, useRef, memo } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useScoreStorage } from "../hooks/useScoreStorage";
import { useFirebase } from "../context/FirebaseContext";
import { ActionButton } from "./ActionButton";
import { GameConfig } from "../config/games";
import { useLanguage } from "../context/LanguageContext";
import { colors, cardBase, typography } from "../theme/styles";
import { useSwipeToGoBack } from "../hooks/useSwipeToGoBack";

interface BalootScoreboardProps {
  gameConfig: GameConfig;
  onBack: () => void;
  isTransitioning?: boolean;
}

interface RoundRecord {
  id: string;
  round: number;
  team1Points: number;
  team2Points: number;
  team1Cumulative: number;
  team2Cumulative: number;
}

export const BalootScoreboard: React.FC<BalootScoreboardProps> = memo(
  ({ gameConfig, onBack }) => {
    const { t } = useLanguage();
    const { saveGameResult, user } = useFirebase();
    const { team1, team2, updateTeam1, updateTeam2, resetScores, isLoading } =
      useScoreStorage(gameConfig.id);

    const targetScore = gameConfig.winCondition?.targetScore || 152;

    const [roundHistory, setRoundHistory] = useState<RoundRecord[]>([]);
    const [gameSaved, setGameSaved] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [showGameSummary, setShowGameSummary] = useState(false);
    const [showAddRoundModal, setShowAddRoundModal] = useState(false);
    const [team1Name, setTeam1Name] = useState(team1.name || "Team 1");
    const [team2Name, setTeam2Name] = useState(team2.name || "Team 2");
    const [editingTeam, setEditingTeam] = useState<1 | 2 | null>(null);
    const [modalTeam1Input, setModalTeam1Input] = useState("");
    const [modalTeam2Input, setModalTeam2Input] = useState("");
    const scrollViewRef = useRef<ScrollView>(null);
    const swipeHandlers = useSwipeToGoBack({ onBack });

    // Derive current totals from round history (single source of truth)
    const currentTeam1Score =
      roundHistory.length > 0
        ? roundHistory[roundHistory.length - 1].team1Cumulative
        : 0;
    const currentTeam2Score =
      roundHistory.length > 0
        ? roundHistory[roundHistory.length - 1].team2Cumulative
        : 0;

    const winner =
      currentTeam1Score > currentTeam2Score
        ? team1Name
        : currentTeam2Score > currentTeam1Score
          ? team2Name
          : null;

    const handleOpenAddRound = () => {
      if (gameEnded) return;
      setModalTeam1Input("");
      setModalTeam2Input("");
      setShowAddRoundModal(true);
    };

    const handleConfirmAddRound = () => {
      const t1Points = parseInt(modalTeam1Input, 10);
      const t2Points = parseInt(modalTeam2Input, 10);

      // Validate inputs
      if (
        (modalTeam1Input.trim() === "" || isNaN(t1Points)) &&
        (modalTeam2Input.trim() === "" || isNaN(t2Points))
      ) {
        Alert.alert(
          t.balootScoreboard.invalidInput,
          t.balootScoreboard.pleaseEnterAtLeastOneScore,
        );
        return;
      }

      const team1Points =
        modalTeam1Input.trim() !== "" && !isNaN(t1Points) ? t1Points : 0;
      const team2Points =
        modalTeam2Input.trim() !== "" && !isNaN(t2Points) ? t2Points : 0;

      if (team1Points < 0 || team2Points < 0) {
        Alert.alert(
          t.balootScoreboard.invalidInput,
          t.balootScoreboard.pleaseEnterValidNumberTeam.replace(
            "{team}",
            "both",
          ),
        );
        return;
      }

      if (team1Points === 0 && team2Points === 0) {
        Alert.alert(
          t.balootScoreboard.invalidInput,
          t.balootScoreboard.pleaseEnterAtLeastOneScore,
        );
        return;
      }

      // Calculate cumulative from round history, NOT from storage
      const newTeam1Cumulative = currentTeam1Score + team1Points;
      const newTeam2Cumulative = currentTeam2Score + team2Points;

      const newRound: RoundRecord = {
        id: `round-${Date.now()}`,
        round: roundHistory.length + 1,
        team1Points: team1Points,
        team2Points: team2Points,
        team1Cumulative: newTeam1Cumulative,
        team2Cumulative: newTeam2Cumulative,
      };

      setRoundHistory([...roundHistory, newRound]);

      // Sync storage for save/persistence
      updateTeam1({ score: newTeam1Cumulative });
      updateTeam2({ score: newTeam2Cumulative });
      setShowAddRoundModal(false);

      // Check game end
      if (
        newTeam1Cumulative >= targetScore ||
        newTeam2Cumulative >= targetScore
      ) {
        setGameEnded(true);
        setShowGameSummary(true);
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const handleUndoRound = () => {
      if (roundHistory.length === 0) return;
      const prevHistory = roundHistory.slice(0, -1);
      const prevTeam1Score =
        prevHistory.length > 0
          ? prevHistory[prevHistory.length - 1].team1Cumulative
          : 0;
      const prevTeam2Score =
        prevHistory.length > 0
          ? prevHistory[prevHistory.length - 1].team2Cumulative
          : 0;
      setRoundHistory(prevHistory);
      updateTeam1({ score: prevTeam1Score });
      updateTeam2({ score: prevTeam2Score });
      setGameEnded(false);
      setShowGameSummary(false);
    };

    const handleSaveGame = async () => {
      const gameWinner =
        currentTeam1Score > currentTeam2Score ? team1Name : team2Name;
      try {
        await saveGameResult({
          gameType: "baloot",
          team1: { name: team1Name, score: currentTeam1Score },
          team2: { name: team2Name, score: currentTeam2Score },
          winner: gameWinner,
          rounds: roundHistory.length,
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
      setGameSaved(false);
      setGameEnded(false);
    };

    // Format cell: [cumulative] / [round points]
    const formatCell = (cumulative: number, points: number): string => {
      return `${cumulative} / ${points}`;
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
          <TouchableOpacity onPress={onBack} style={styles.headerSideBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {t.games[gameConfig.id as keyof typeof t.games]?.name ||
                gameConfig.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleUndoRound}
            disabled={roundHistory.length === 0 || gameEnded}
            style={[
              styles.headerSideBtn,
              (roundHistory.length === 0 || gameEnded) && styles.disabledBtn,
            ]}
          >
            <Text style={styles.undoText}>↶</Text>
          </TouchableOpacity>
        </View>

        {/* ===== SCORE TABLE (fills available space) ===== */}
        <View style={styles.tableWrapper}>
          <View style={styles.scoreTable}>
            {/* Table Header with clickable team names */}
            <View style={styles.tableHeader}>
              <View style={styles.teamColHeader}>
                {editingTeam === 1 ? (
                  <TextInput
                    style={styles.teamNameInput}
                    value={team1Name}
                    onChangeText={(text) => {
                      setTeam1Name(text);
                      updateTeam1({ name: text });
                    }}
                    onBlur={() => setEditingTeam(null)}
                    autoFocus
                    selectTextOnFocus
                  />
                ) : (
                  <TouchableOpacity onPress={() => setEditingTeam(1)}>
                    <Text style={[styles.tableHeaderText, styles.team1Color]}>
                      {team1Name}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.teamColHeader}>
                {editingTeam === 2 ? (
                  <TextInput
                    style={styles.teamNameInput}
                    value={team2Name}
                    onChangeText={(text) => {
                      setTeam2Name(text);
                      updateTeam2({ name: text });
                    }}
                    onBlur={() => setEditingTeam(null)}
                    autoFocus
                    selectTextOnFocus
                  />
                ) : (
                  <TouchableOpacity onPress={() => setEditingTeam(2)}>
                    <Text style={[styles.tableHeaderText, styles.team2Color]}>
                      {team2Name}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.roundColHeader}>
                <Text style={styles.tableHeaderText}>RND</Text>
              </View>
            </View>

            {/* Table Body (scrollable) */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.tableBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                roundHistory.length === 0 ? styles.emptyTableContent : undefined
              }
            >
              {roundHistory.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>. . .</Text>
                </View>
              ) : (
                roundHistory.map((round) => (
                  <View key={round.id} style={styles.tableRow}>
                    <Text style={[styles.cellText, styles.teamCol]}>
                      {formatCell(round.team1Cumulative, round.team1Points)}
                    </Text>
                    <Text style={[styles.cellText, styles.teamCol]}>
                      {formatCell(round.team2Cumulative, round.team2Points)}
                    </Text>
                    <Text
                      style={[
                        styles.cellText,
                        styles.roundCol,
                        styles.roundNumText,
                      ]}
                    >
                      {round.round}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* ===== BOTTOM CONTROLS ===== */}
        <View style={styles.controlsPanel}>
          {/* Add Round Button */}
          <TouchableOpacity
            style={[styles.addRoundBtn, gameEnded && styles.disabledBtn]}
            onPress={handleOpenAddRound}
            disabled={gameEnded}
          >
            <Text style={styles.addRoundBtnText}>{t.common.addRound}</Text>
          </TouchableOpacity>

          {/* Reset Game */}
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>{t.common.resetGame}</Text>
          </TouchableOpacity>

          {/* Save Game */}
          {(currentTeam1Score > 0 || currentTeam2Score > 0) &&
            user &&
            !gameSaved && (
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

        {/* ===== ADD ROUND MODAL ===== */}
        <Modal
          visible={showAddRoundModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddRoundModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t.common.addRound}</Text>

              <View style={styles.modalInputsRow}>
                {/* Team 1 Input */}
                <View style={styles.modalInputBlock}>
                  <Text style={[styles.modalInputLabel, styles.team1Color]}>
                    {team1Name}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalTeam1Input}
                    onChangeText={setModalTeam1Input}
                    placeholder="0"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="number-pad"
                    textAlign="center"
                    autoFocus
                  />
                </View>

                {/* Team 2 Input */}
                <View style={styles.modalInputBlock}>
                  <Text style={[styles.modalInputLabel, styles.team2Color]}>
                    {team2Name}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    value={modalTeam2Input}
                    onChangeText={setModalTeam2Input}
                    placeholder="0"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="number-pad"
                    textAlign="center"
                  />
                </View>
              </View>

              <View style={styles.modalBtnsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddRoundModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>
                    {t.common.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalAddBtn}
                  onPress={handleConfirmAddRound}
                >
                  <Text style={styles.modalAddBtnText}>
                    {t.common.addRound}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ===== GAME SUMMARY MODAL ===== */}
        <Modal
          visible={showGameSummary}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.gameSummaryTitle}>{t.common.gameOver}</Text>
              <View style={styles.gameSummaryWinnerBlock}>
                <Text style={styles.gameSummaryWinnerLabel}>Winner</Text>
                <Text style={styles.gameSummaryWinnerName}>{winner}</Text>
              </View>
              <View style={styles.gameSummaryScoresRow}>
                <View style={styles.gameSummaryScoreBlock}>
                  <Text style={styles.gameSummaryScoreTeam}>{team1Name}</Text>
                  <Text style={styles.gameSummaryScoreValue}>
                    {currentTeam1Score}
                  </Text>
                </View>
                <Text style={styles.gameSummaryVs}>vs</Text>
                <View style={styles.gameSummaryScoreBlock}>
                  <Text style={styles.gameSummaryScoreTeam}>{team2Name}</Text>
                  <Text style={styles.gameSummaryScoreValue}>
                    {currentTeam2Score}
                  </Text>
                </View>
              </View>
              <View style={styles.gameSummaryBtns}>
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

const styles = StyleSheet.create({
  /* ===== LAYOUT ===== */
  wrapper: {
    flex: 1,
    backgroundColor: colors.background.primary,
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

  /* ===== HEADER ===== */
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
  headerSideBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 50,
    alignItems: "center",
  },
  backText: {
    fontSize: 24,
    color: colors.accent.red,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 20,
    textAlign: "center",
  },
  undoText: {
    fontSize: 24,
    color: colors.accent.blue,
    fontWeight: "600",
  },
  disabledBtn: {
    opacity: 0.3,
  },

  /* ===== SCORE TABLE ===== */
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  scoreTable: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.background.card,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.background.secondary,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  teamColHeader: {
    flex: 1.3,
    alignItems: "center",
    justifyContent: "center",
  },
  roundColHeader: {
    flex: 0.6,
    alignItems: "center",
    justifyContent: "center",
  },
  tableHeaderText: {
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.text.muted,
  },
  team1Color: {
    color: colors.accent.blue,
  },
  team2Color: {
    color: colors.accent.red,
  },
  teamNameInput: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.gold,
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 80,
  },
  tableBody: {
    flex: 1,
  },
  emptyTableContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  cellText: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    color: colors.text.primary,
  },
  teamCol: {
    flex: 1.3,
  },
  roundCol: {
    flex: 0.6,
  },
  roundNumText: {
    color: colors.text.muted,
    fontSize: 14,
  },
  emptyRow: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 16,
    letterSpacing: 6,
  },

  /* ===== BOTTOM CONTROLS ===== */
  controlsPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  addRoundBtn: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent.blue,
    marginBottom: 10,
  },
  addRoundBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.background.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  resetBtn: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  saveSection: {
    marginTop: 4,
  },
  savedText: {
    fontSize: 14,
    color: colors.accent.green,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },

  /* ===== ADD ROUND MODAL ===== */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: colors.background.card,
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  modalTitle: {
    ...typography.heading,
    fontSize: 20,
    marginBottom: 20,
    color: colors.text.primary,
  },
  modalInputsRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginBottom: 20,
  },
  modalInputBlock: {
    flex: 1,
    alignItems: "center",
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  modalInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 24,
    fontWeight: "800",
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  modalBtnsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalAddBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent.green,
  },
  modalAddBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.background.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* ===== GAME SUMMARY MODAL ===== */
  gameSummaryTitle: {
    ...typography.heading,
    fontSize: 24,
    marginBottom: 20,
    color: colors.accent.red,
  },
  gameSummaryWinnerBlock: {
    alignItems: "center",
    marginBottom: 20,
  },
  gameSummaryWinnerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  gameSummaryWinnerName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.accent.red,
  },
  gameSummaryScoresRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 16,
  },
  gameSummaryScoreBlock: {
    alignItems: "center",
  },
  gameSummaryScoreTeam: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  gameSummaryScoreValue: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.accent.red,
  },
  gameSummaryVs: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.muted,
  },
  gameSummaryBtns: {
    width: "100%",
    gap: 12,
  },
});
