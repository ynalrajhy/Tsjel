import React, { useState, useEffect, useRef, memo } from "react";
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
import { useHandStorage } from "../hooks/useHandStorage";
import { useFirebase } from "../context/FirebaseContext";
import { ActionButton } from "./ActionButton";
import { GameConfig } from "../config/games";
import { useLanguage } from "../context/LanguageContext";
import { colors, cardBase, typography } from "../theme/styles";
import { useSwipeToGoBack } from "../hooks/useSwipeToGoBack";

interface HandScoreboardProps {
  gameConfig: GameConfig;
  onBack: () => void;
  isTransitioning?: boolean;
}

type HandType =
  | "regular"
  | "jokerColored"
  | "oneJokerColored"
  | "twoJokersColored"
  | "zat"
  | "finished";

interface HandTypeConfig {
  label: string;
  winnerPoints: number;
  othersPoints: number;
}

interface Round {
  roundNumber: number;
  winnerIndex: number;
  winnerName: string;
  handType: HandType;
  scores: number[];
}

const HAND_TYPE_ORDER: HandType[] = [
  "regular",
  "jokerColored",
  "oneJokerColored",
  "twoJokersColored",
  "zat",
  "finished",
];

export const HandScoreboard: React.FC<HandScoreboardProps> = memo(
  ({ gameConfig, onBack, isTransitioning = false }) => {
    const { t } = useLanguage();
    const { saveGameResult, user } = useFirebase();

    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      if (!isTransitioning) {
        const timer = setTimeout(() => setIsReady(true), 50);
        return () => clearTimeout(timer);
      }
    }, [isTransitioning]);

    const { players, updatePlayer, resetScores, isLoading } = useHandStorage(
      isReady ? gameConfig.id : "dummy"
    );

    const swipeHandlers = useSwipeToGoBack({ onBack });
    const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
    const [selectedHandType, setSelectedHandType] = useState<HandType | null>(
      null
    );
    const [currentRound, setCurrentRound] = useState(1);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [nzolValues, setNzolValues] = useState<string[]>(["", "", "", ""]);
    const gameSavedRef = useRef(false);
    const tableScrollRef = useRef<ScrollView>(null);

    const HAND_TYPES: Record<HandType, HandTypeConfig> = {
      regular: {
        label: t.handScoreboard.handTypes.regular,
        winnerPoints: -60,
        othersPoints: 200,
      },
      jokerColored: {
        label: t.handScoreboard.handTypes.jokerColored,
        winnerPoints: -120,
        othersPoints: 400,
      },
      oneJokerColored: {
        label: t.handScoreboard.handTypes.oneJokerColored,
        winnerPoints: -240,
        othersPoints: 800,
      },
      twoJokersColored: {
        label: t.handScoreboard.handTypes.twoJokersColored,
        winnerPoints: -360,
        othersPoints: 1200,
      },
      zat: {
        label: t.handScoreboard.handTypes.zat,
        winnerPoints: -480,
        othersPoints: 1600,
      },
      finished: {
        label: t.handScoreboard.handTypes.finished,
        winnerPoints: -30,
        othersPoints: 100,
      },
    };

    useEffect(() => {
      if (currentRound > 8 && user && !gameSavedRef.current) {
        gameSavedRef.current = true;
        const sortedPlayers = [...players].sort((a, b) => a.score - b.score);
        const winner = sortedPlayers[0]?.name || "Unknown";

        saveGameResult({
          gameType: "hand",
          players: players.map((p) => ({ name: p.name, score: p.score })),
          winner: winner,
          rounds: 8,
        });
      }
    }, [currentRound, user, players]);

    const handleWin = () => {
      if (selectedWinner === null || selectedHandType === null) {
        Alert.alert(
          t.common.error,
          t.handScoreboard.pleaseSelectWinnerAndHandType
        );
        return;
      }

      if (currentRound > 8) {
        Alert.alert(t.common.gameOver, t.handScoreboard.gameEndedAfter8Rounds);
        return;
      }

      let nzolMultiplier = 1;
      switch (selectedHandType) {
        case "regular":
          nzolMultiplier = 2;
          break;
        case "jokerColored":
          nzolMultiplier = 4;
          break;
        case "oneJokerColored":
          nzolMultiplier = 8;
          break;
        case "twoJokersColored":
          nzolMultiplier = 16;
          break;
        case "zat":
          nzolMultiplier = 32;
          break;
        case "finished":
          nzolMultiplier = 1;
          break;
      }

      const handConfig = HAND_TYPES[selectedHandType];

      const newPlayers = players.map((player, index) => {
        if (index === selectedWinner) {
          return { ...player, score: player.score + handConfig.winnerPoints };
        } else {
          const nzolValueStr = nzolValues[index];
          const hasNzol = nzolValueStr && nzolValueStr.trim() !== "";
          if (hasNzol) {
            const nzolValue = parseFloat(nzolValueStr) || 0;
            return {
              ...player,
              score: player.score + nzolValue * nzolMultiplier,
            };
          } else {
            return { ...player, score: player.score + handConfig.othersPoints };
          }
        }
      });

      const roundData: Round = {
        roundNumber: currentRound,
        winnerIndex: selectedWinner,
        winnerName: players[selectedWinner].name,
        handType: selectedHandType,
        scores: newPlayers.map((p) => p.score),
      };

      setRounds([...rounds, roundData]);
      newPlayers.forEach((player, index) => {
        updatePlayer(index, { score: player.score });
      });

      const message = t.handScoreboard.roundWonHand
        .replace("{round}", currentRound.toString())
        .replace("{name}", players[selectedWinner].name)
        .replace("{handType}", HAND_TYPES[selectedHandType].label);
      Alert.alert(t.handScoreboard.handRecorded, message, [
        { text: t.common.ok },
      ]);

      setCurrentRound(currentRound + 1);
      setSelectedWinner(null);
      setSelectedHandType(null);
      setNzolValues(["", "", "", ""]);

      setTimeout(() => {
        tableScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const handleReset = () => {
      Alert.alert(t.common.resetGame, t.handScoreboard.areYouSureReset, [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.common.reset,
          style: "destructive",
          onPress: () => {
            resetScores();
            setSelectedWinner(null);
            setSelectedHandType(null);
            setCurrentRound(1);
            setRounds([]);
            setNzolValues(["", "", "", ""]);
            gameSavedRef.current = false;
          },
        },
      ]);
    };

    const sortedPlayers = [...players].sort((a, b) => a.score - b.score);
    const top3Players = sortedPlayers.slice(0, 3);
    const gameEnded = currentRound > 8;

    if (!isReady || isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.red} />
        </View>
      );
    }

    if (gameEnded) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[styles.wrapper, swipeHandlers.animatedStyle]}
            {...swipeHandlers.panHandlers}
          >
            <ScrollView
              style={styles.container}
              contentContainerStyle={styles.contentContainer}
              removeClippedSubviews={true}
            >
              {/* Same header as Kout/Baloot */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerSideBtn}>
                  <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>{t.common.gameOver}!</Text>
                  <Text style={styles.headerSubtitle}>
                    {t.common.finalResults}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleReset}
                  style={styles.headerSideBtn}
                >
                  <Text style={styles.resetIconText}>↻</Text>
                </TouchableOpacity>
              </View>

              {gameSavedRef.current && (
                <View style={styles.savedIndicator}>
                  <Text style={styles.savedText}>
                    ✓ {t.common?.gameSaved || "Game Saved"}
                  </Text>
                </View>
              )}

              <View style={styles.podiumContainer}>
                {top3Players[1] && (
                  <View style={styles.podiumSecond}>
                    <View style={[styles.podiumBase, styles.podiumSecondBase]}>
                      <Text style={styles.podiumMedal}>🥈</Text>
                      <Text style={styles.podiumName}>
                        {top3Players[1].name}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {top3Players[1].score}
                      </Text>
                    </View>
                  </View>
                )}
                {top3Players[0] && (
                  <View style={styles.podiumFirst}>
                    <View style={[styles.podiumBase, styles.podiumFirstBase]}>
                      <Text style={styles.podiumMedal}>🥇</Text>
                      <Text style={styles.podiumName}>
                        {top3Players[0].name}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {top3Players[0].score}
                      </Text>
                    </View>
                  </View>
                )}
                {top3Players[2] && (
                  <View style={styles.podiumThird}>
                    <View style={[styles.podiumBase, styles.podiumThirdBase]}>
                      <Text style={styles.podiumMedal}>🥉</Text>
                      <Text style={styles.podiumName}>
                        {top3Players[2].name}
                      </Text>
                      <Text style={styles.podiumScore}>
                        {top3Players[2].score}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {rounds.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {t.common.gameHistory}
                  </Text>
                  {rounds.map((round, index) => (
                    <View key={index} style={styles.roundCard}>
                      <Text style={styles.roundNumber}>
                        {t.common.round} {round.roundNumber}
                      </Text>
                      <Text style={styles.roundWinner}>
                        {round.winnerName} - {HAND_TYPES[round.handType].label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.section}>
                <ActionButton
                  label={t.common.newGame}
                  onPress={handleReset}
                  variant="primary"
                />
              </View>
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[styles.wrapper, swipeHandlers.animatedStyle]}
          {...swipeHandlers.panHandlers}
        >
          {/* ===== HEADER (same as Kout and Baloot) ===== */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.headerSideBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {t.games[gameConfig.id as keyof typeof t.games]?.name ||
                  gameConfig.name}
              </Text>
              <Text style={styles.headerSubtitle}>
                {t.common.round} {currentRound} / 8
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleReset}
              style={styles.headerSideBtn}
            >
              <Text style={styles.resetIconText}>↻</Text>
            </TouchableOpacity>
          </View>

          {/* ===== SCOREBOARD TABLE ===== */}
          <View style={styles.tableWrapper}>
            <View style={styles.scoreTable}>
              <View style={styles.tableHeader}>
                {players.map((player, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.playerColHeader,
                      selectedWinner === index && styles.playerColHeaderSelected,
                    ]}
                    onPress={() =>
                      setSelectedWinner((prev) => (prev === index ? null : index))
                    }
                  >
                    <Text
                      style={[
                        styles.tableHeaderText,
                        selectedWinner === index &&
                          styles.tableHeaderTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {player.name || `${t.common.player} ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.roundColHeader}>
                  <Text style={styles.tableHeaderText}>RND</Text>
                </View>
              </View>

              <ScrollView
                ref={tableScrollRef}
                style={styles.tableBody}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                  rounds.length === 0 ? styles.emptyTableContent : undefined
                }
              >
                {rounds.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyText}>. . .</Text>
                  </View>
                ) : (
                  rounds.map((round, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      {round.scores.map((score, cellIdx) => (
                        <View
                          key={cellIdx}
                          style={styles.playerCol}
                        >
                          <Text style={styles.cellText}>{score}</Text>
                        </View>
                      ))}
                      <View style={styles.roundCol}>
                        <Text
                          style={[
                            styles.cellText,
                            styles.roundNumText,
                          ]}
                        >
                          {round.roundNumber}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>

          {/* ===== HAND TYPE + ADD ROUND (wireframe bottom) ===== */}
          <View style={styles.controlsPanel}>
            <Text style={styles.controlsSectionTitle}>
              {t.handScoreboard.selectHandType}
            </Text>
            <View style={styles.handTypesGrid}>
              {/* Row 1: first 3 hand types */}
              <View style={styles.handTypesRow}>
                {HAND_TYPE_ORDER.slice(0, 3).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.handTypeButton,
                      selectedHandType === key && styles.handTypeButtonSelected,
                    ]}
                    onPress={() =>
                      setSelectedHandType((prev) => (prev === key ? null : key))
                    }
                  >
                    <Text
                      style={[
                        styles.handTypeButtonText,
                        selectedHandType === key &&
                          styles.handTypeButtonTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {HAND_TYPES[key].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Row 2: last 3 hand types */}
              <View style={styles.handTypesRow}>
                {HAND_TYPE_ORDER.slice(3, 6).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.handTypeButton,
                      selectedHandType === key && styles.handTypeButtonSelected,
                    ]}
                    onPress={() =>
                      setSelectedHandType((prev) => (prev === key ? null : key))
                    }
                  >
                    <Text
                      style={[
                        styles.handTypeButtonText,
                        selectedHandType === key &&
                          styles.handTypeButtonTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {HAND_TYPES[key].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedWinner !== null && (
              <View style={styles.nzolRow}>
                <Text style={styles.nzolLabel}>{t.common.nzol}</Text>
                {players.map((_, index) => (
                  <TextInput
                    key={index}
                    style={styles.nzolInput}
                    value={nzolValues[index]}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9.-]/g, "");
                      const next = [...nzolValues];
                      next[index] = numericValue;
                      setNzolValues(next);
                    }}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.addRoundBtn,
                (selectedWinner === null ||
                  selectedHandType === null ||
                  gameEnded) && styles.addRoundBtnDisabled,
              ]}
              onPress={handleWin}
              disabled={
                selectedWinner === null ||
                selectedHandType === null ||
                gameEnded
              }
            >
              <Text style={styles.addRoundBtnText}>
                {t.common.addRound}
              </Text>
            </TouchableOpacity>
          </View>
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

  /* ===== HEADER (same as Kout/Baloot) ===== */
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
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  resetIconText: {
    fontSize: 24,
    color: colors.accent.red,
    fontWeight: "600",
  },

  /* ===== SCORE TABLE ===== */
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 120,
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
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  playerColHeader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  playerColHeaderSelected: {
    backgroundColor: colors.accent.blue,
  },
  roundColHeader: {
    flex: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tableHeaderText: {
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.3,
    color: colors.text.muted,
  },
  tableHeaderTextSelected: {
    color: "#fff",
  },
  tableBody: {
    flex: 1,
  },
  emptyTableContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 80,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  playerCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  roundCol: {
    flex: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    color: colors.text.primary,
  },
  roundNumText: {
    color: colors.text.muted,
    fontSize: 13,
  },
  emptyRow: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 16,
    letterSpacing: 6,
  },

  /* ===== BOTTOM: HAND TYPE + ADD ROUND ===== */
  controlsPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  controlsSectionTitle: {
    ...typography.subheading,
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  handTypesGrid: {
    marginBottom: 12,
  },
  handTypesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  handTypeButton: {
    ...cardBase,
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  handTypeButtonSelected: {
    borderColor: colors.accent.blue,
    backgroundColor: colors.accent.blue + "20",
    borderWidth: 2,
  },
  handTypeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
  },
  handTypeButtonTextSelected: {
    color: colors.accent.blue,
  },
  nzolRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  nzolLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    width: 36,
  },
  nzolInput: {
    flex: 1,
    minWidth: 50,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: 6,
    textAlign: "center",
    backgroundColor: colors.background.card,
    fontSize: 14,
  },
  addRoundBtn: {
    backgroundColor: colors.accent.red,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addRoundBtnDisabled: {
    opacity: 0.5,
  },
  addRoundBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  /* Game over / podium */
  savedIndicator: {
    alignItems: "center",
    marginBottom: 12,
  },
  savedText: {
    fontSize: 14,
    color: colors.accent.green,
    fontWeight: "600",
  },
  section: {
    marginVertical: 12,
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: 200,
    marginVertical: 30,
  },
  podiumBase: {
    width: 100,
    alignItems: "center",
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  podiumFirst: { zIndex: 2 },
  podiumFirstBase: { height: 150, backgroundColor: "#FFD700" },
  podiumSecond: { marginRight: -10 },
  podiumSecondBase: { height: 120, backgroundColor: "#C0C0C0" },
  podiumThird: { marginLeft: -10 },
  podiumThirdBase: { height: 100, backgroundColor: "#CD7F32" },
  podiumMedal: { fontSize: 30, marginBottom: 5 },
  podiumName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  podiumScore: { fontSize: 18, fontWeight: "bold", color: "#000" },
  roundCard: {
    ...cardBase,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundNumber: { fontSize: 14, fontWeight: "bold", color: colors.accent.red },
  roundWinner: { fontSize: 14, color: colors.text.primary },
});
