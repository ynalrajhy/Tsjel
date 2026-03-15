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
} from "react-native";
import { useScoreStorage } from "../hooks/useScoreStorage";
import { useFirebase } from "../context/FirebaseContext";
import { ActionButton } from "./ActionButton";
import { useLanguage } from "../context/LanguageContext";
import { colors, cardBase, typography } from "../theme/styles";
import { useSwipeToGoBack } from "../hooks/useSwipeToGoBack";

interface KoutScoreboardProps {
  gameEndCondition: 51 | 101 | null;
  team1Name: string;
  team2Name: string;
  penaltyPoints: number;
  onBack: () => void;
}

interface RoundRecord {
  id: string;
  round: number;
  type: "score" | "penalty";
  selectedTeam: 1 | 2;
  handType: string;
  won: boolean;
  team1Score: number;
  team2Score: number;
  penaltyTeam?: 1 | 2;
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
  ({
    gameEndCondition,
    team1Name: initialTeam1Name,
    team2Name: initialTeam2Name,
    penaltyPoints,
    onBack,
  }: KoutScoreboardProps) => {
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
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);
    const [team1NameState, setTeam1NameState] = useState(initialTeam1Name);
    const [team2NameState, setTeam2NameState] = useState(initialTeam2Name);
    const [editingTeam, setEditingTeam] = useState<1 | 2 | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const swipeHandlers = useSwipeToGoBack({ onBack });

    // Derive current totals from round history
    const currentTeam1Score =
      roundHistory.length > 0
        ? roundHistory[roundHistory.length - 1].team1Score
        : 0;
    const currentTeam2Score =
      roundHistory.length > 0
        ? roundHistory[roundHistory.length - 1].team2Score
        : 0;

    const winner =
      currentTeam1Score > currentTeam2Score
        ? team1NameState
        : currentTeam2Score > currentTeam1Score
          ? team2NameState
          : null;

    const handleRecordRound = (selectedTeamWon: boolean) => {
      if (selectedTeam === null || selectedHandType === null || gameEnded)
        return;

      const scoring = getScoringForHand(selectedHandType);
      let newTeam1Score = currentTeam1Score;
      let newTeam2Score = currentTeam2Score;

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
        type: "score",
        selectedTeam: selectedTeam,
        handType: selectedHandType,
        won: selectedTeamWon,
        team1Score: newTeam1Score,
        team2Score: newTeam2Score,
      };

      setRoundHistory([...roundHistory, newRound]);
      updateTeam1({ score: newTeam1Score });
      updateTeam2({ score: newTeam2Score });

      checkGameEnd(newTeam1Score, newTeam2Score);

      setSelectedTeam(null);
      setSelectedHandType(null);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const handleApplyPenalty = (penalizedTeam: 1 | 2) => {
      if (gameEnded || penaltyPoints === 0) return;

      let newTeam1Score = currentTeam1Score;
      let newTeam2Score = currentTeam2Score;

      if (penalizedTeam === 1) {
        newTeam1Score -= penaltyPoints;
      } else {
        newTeam2Score -= penaltyPoints;
      }

      const penaltyRecord: RoundRecord = {
        id: `penalty-${Date.now()}`,
        round: roundHistory.length + 1,
        type: "penalty",
        selectedTeam: penalizedTeam,
        handType: "PEN",
        won: false,
        team1Score: newTeam1Score,
        team2Score: newTeam2Score,
        penaltyTeam: penalizedTeam,
      };

      setRoundHistory([...roundHistory, penaltyRecord]);
      updateTeam1({ score: newTeam1Score });
      updateTeam2({ score: newTeam2Score });
      setShowPenaltyModal(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
      const gameWinner =
        currentTeam1Score > currentTeam2Score ? team1NameState : team2NameState;
      try {
        await saveGameResult({
          gameType: "kout",
          team1: { name: team1NameState, score: currentTeam1Score },
          team2: { name: team2NameState, score: currentTeam2Score },
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
        t.setup?.areYouSureReset || "Are you sure you want to reset the game?",
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

    // Format the display for a team cell in a round row
    const formatTeamCell = (round: RoundRecord, teamNumber: 1 | 2): string => {
      const score = teamNumber === 1 ? round.team1Score : round.team2Score;
      if (round.type === "penalty") {
        if (round.penaltyTeam === teamNumber) {
          return `${score} / -${penaltyPoints}`;
        } else {
          return `${score} / -`;
        }
      }
      if (round.selectedTeam === teamNumber) {
        return `${score} / ${round.handType}`;
      } else {
        return `${score} / -`;
      }
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

          {/* Penalty Icon */}
          {penaltyPoints > 0 && (
            <TouchableOpacity
              onPress={() => !gameEnded && setShowPenaltyModal(true)}
              disabled={gameEnded}
              style={[styles.headerIconBtn, gameEnded && styles.disabledBtn]}
            >
              <Text style={styles.penaltyIcon}>⚠️</Text>
            </TouchableOpacity>
          )}

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t.games.kout.name}</Text>
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
                    value={team1NameState}
                    onChangeText={(text) => {
                      setTeam1NameState(text);
                      updateTeam1({ name: text });
                    }}
                    onBlur={() => setEditingTeam(null)}
                    autoFocus
                    selectTextOnFocus
                  />
                ) : (
                  <TouchableOpacity onPress={() => setEditingTeam(1)}>
                    <Text style={[styles.tableHeaderText, styles.team1Color]}>
                      {team1NameState}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.teamColHeader}>
                {editingTeam === 2 ? (
                  <TextInput
                    style={styles.teamNameInput}
                    value={team2NameState}
                    onChangeText={(text) => {
                      setTeam2NameState(text);
                      updateTeam2({ name: text });
                    }}
                    onBlur={() => setEditingTeam(null)}
                    autoFocus
                    selectTextOnFocus
                  />
                ) : (
                  <TouchableOpacity onPress={() => setEditingTeam(2)}>
                    <Text style={[styles.tableHeaderText, styles.team2Color]}>
                      {team2NameState}
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
                  <View
                    key={round.id}
                    style={[
                      styles.tableRow,
                      round.type === "penalty" && styles.penaltyRow,
                    ]}
                  >
                    <Text style={[styles.cellText, styles.teamCol]}>
                      {formatTeamCell(round, 1)}
                      {round.type === "penalty" && round.penaltyTeam === 1
                        ? " ⚠️"
                        : ""}
                    </Text>
                    <Text style={[styles.cellText, styles.teamCol]}>
                      {formatTeamCell(round, 2)}
                      {round.type === "penalty" && round.penaltyTeam === 2
                        ? " ⚠️"
                        : ""}
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

        {/* ===== BOTTOM CONTROLS (always visible) ===== */}
        <View style={styles.controlsPanel}>
          {/* Team Select Buttons */}
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[
                styles.teamBtn,
                selectedTeam === 1 && styles.teamBtnActive,
              ]}
              onPress={() => setSelectedTeam(selectedTeam === 1 ? null : 1)}
              disabled={gameEnded}
            >
              <Text
                style={[
                  styles.teamBtnText,
                  selectedTeam === 1 && styles.teamBtnTextActive,
                ]}
              >
                {team1NameState}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.teamBtn,
                selectedTeam === 2 && styles.teamBtnActive,
              ]}
              onPress={() => setSelectedTeam(selectedTeam === 2 ? null : 2)}
              disabled={gameEnded}
            >
              <Text
                style={[
                  styles.teamBtnText,
                  selectedTeam === 2 && styles.teamBtnTextActive,
                ]}
              >
                {team2NameState}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hand Type Grid (always visible) */}
          <View style={styles.handGrid}>
            <View style={styles.handRow}>
              {["M", "6", "8"].map((ht) => (
                <TouchableOpacity
                  key={ht}
                  style={[
                    styles.handBtn,
                    selectedHandType === ht && styles.handBtnActive,
                  ]}
                  onPress={() =>
                    setSelectedHandType(selectedHandType === ht ? null : ht)
                  }
                  disabled={gameEnded}
                >
                  <Text
                    style={[
                      styles.handBtnText,
                      selectedHandType === ht && styles.handBtnTextActive,
                    ]}
                  >
                    {ht}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.handRow}>
              {["5", "7", "9"].map((ht) => (
                <TouchableOpacity
                  key={ht}
                  style={[
                    styles.handBtn,
                    selectedHandType === ht && styles.handBtnActive,
                  ]}
                  onPress={() =>
                    setSelectedHandType(selectedHandType === ht ? null : ht)
                  }
                  disabled={gameEnded}
                >
                  <Text
                    style={[
                      styles.handBtnText,
                      selectedHandType === ht && styles.handBtnTextActive,
                    ]}
                  >
                    {ht}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Win / Loss Buttons (always visible) */}
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.winBtn, gameEnded && styles.disabledBtn]}
              onPress={() => handleRecordRound(true)}
              disabled={
                gameEnded || selectedTeam === null || selectedHandType === null
              }
            >
              <Text style={styles.winBtnText}>{t.common.win}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.lossBtn, gameEnded && styles.disabledBtn]}
              onPress={() => handleRecordRound(false)}
              disabled={
                gameEnded || selectedTeam === null || selectedHandType === null
              }
            >
              <Text style={styles.lossBtnText}>{t.common.lose}</Text>
            </TouchableOpacity>
          </View>

          {/* Reset Game */}
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>{t.common.resetGame}</Text>
          </TouchableOpacity>

          {/* Save Game */}
          {(currentTeam1Score !== 0 || currentTeam2Score !== 0) &&
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

        {/* ===== PENALTY MODAL ===== */}
        <Modal
          visible={showPenaltyModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPenaltyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {t.setup?.applyPenalty || "Apply Penalty"}
              </Text>
              <Text style={styles.penaltyAmountText}>
                -{penaltyPoints} {t.setup?.points || "points"}
              </Text>
              <Text style={styles.penaltySelectText}>
                {t.setup?.selectTeamToPenalize || "Select team to penalize"}
              </Text>

              <View style={styles.penaltyTeamBtns}>
                <TouchableOpacity
                  style={styles.penaltyTeamBtn}
                  onPress={() => handleApplyPenalty(1)}
                >
                  <Text style={styles.penaltyTeamBtnText}>
                    {team1NameState}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.penaltyTeamBtn}
                  onPress={() => handleApplyPenalty(2)}
                >
                  <Text style={styles.penaltyTeamBtnText}>
                    {team2NameState}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.penaltyCancelBtn}
                onPress={() => setShowPenaltyModal(false)}
              >
                <Text style={styles.penaltyCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
              <Text style={styles.modalTitle}>
                {t.koutScoreboard.gameEnded}
              </Text>
              <View style={styles.modalWinnerBlock}>
                <Text style={styles.modalWinnerLabel}>Winner</Text>
                <Text style={styles.modalWinnerName}>{winner}</Text>
              </View>
              <View style={styles.modalScoresRow}>
                <View style={styles.modalScoreBlock}>
                  <Text style={styles.modalScoreTeam}>{team1NameState}</Text>
                  <Text style={styles.modalScoreValue}>
                    {currentTeam1Score}
                  </Text>
                </View>
                <Text style={styles.modalVs}>vs</Text>
                <View style={styles.modalScoreBlock}>
                  <Text style={styles.modalScoreTeam}>{team2NameState}</Text>
                  <Text style={styles.modalScoreValue}>
                    {currentTeam2Score}
                  </Text>
                </View>
              </View>
              <View style={styles.modalBtns}>
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
  ({ gameEndCondition, team1Name, team2Name, penaltyPoints, onBack }) => {
    return (
      <View style={styles.wrapper}>
        <KoutScoreboardContent
          gameEndCondition={gameEndCondition}
          team1Name={team1Name}
          team2Name={team2Name}
          penaltyPoints={penaltyPoints}
          onBack={onBack}
        />
      </View>
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
    minWidth: 40,
    alignItems: "center",
  },
  headerIconBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 36,
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
  penaltyIcon: {
    fontSize: 20,
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
  penaltyRow: {
    backgroundColor: colors.accent.red + "10",
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
  controlRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  /* Team Select */
  teamBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  teamBtnActive: {
    backgroundColor: colors.accent.blue,
    borderColor: colors.accent.blue,
  },
  teamBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.primary,
  },
  teamBtnTextActive: {
    color: colors.background.primary,
  },

  /* Hand Type Grid */
  handGrid: {
    gap: 8,
    marginBottom: 10,
  },
  handRow: {
    flexDirection: "row",
    gap: 8,
  },
  handBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.border.default,
  },
  handBtnActive: {
    backgroundColor: colors.accent.gold,
  },
  handBtnText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.background.primary,
  },
  handBtnTextActive: {
    color: colors.text.primary,
  },

  /* Win / Loss */
  winBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent.green,
  },
  winBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.background.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  lossBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent.red,
  },
  lossBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.background.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  /* Reset / Save */
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

  /* ===== PENALTY MODAL ===== */
  penaltyAmountText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.accent.red,
    marginBottom: 12,
  },
  penaltySelectText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  penaltyTeamBtns: {
    width: "100%",
    gap: 10,
    marginBottom: 16,
  },
  penaltyTeamBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.accent.red,
  },
  penaltyTeamBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  penaltyCancelBtn: {
    paddingVertical: 10,
  },
  penaltyCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.muted,
  },

  /* ===== GAME SUMMARY MODAL ===== */
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
  },
  modalVs: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.muted,
  },
  modalBtns: {
    width: "100%",
    gap: 12,
  },
});
