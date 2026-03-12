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
              <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                  <Text style={styles.title}>{t.common.gameOver}!</Text>
                  <Text style={styles.subtitle}>{t.common.finalResults}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleReset}
                  style={styles.resetIconButton}
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
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            removeClippedSubviews={true}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>{t.common.back}</Text>
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.title}>
                  {t.games[gameConfig.id as keyof typeof t.games]?.name ||
                    gameConfig.name}
                </Text>
                <Text style={styles.roundIndicator}>
                  {t.common.round} {currentRound} / 8
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleReset}
                style={styles.resetIconButton}
              >
                <Text style={styles.resetIconText}>↻</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.playersContainer}>
              {players.map((player, index) => {
                const sortedIndex = sortedPlayers.findIndex(
                  (p) => p.name === player.name
                );
                const isSelected = selectedWinner === index;
                return (
                  <View key={index} style={styles.playerCardWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.playerCard,
                        sortedIndex === 0 && styles.winningPlayer,
                        isSelected && styles.playerCardSelected,
                      ]}
                      onPress={() => setSelectedWinner(index)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.playerCardContent}>
                        <TextInput
                          style={[
                            styles.playerNameInput,
                            isSelected && styles.playerNameInputSelected,
                          ]}
                          value={player.name}
                          onChangeText={(name) => updatePlayer(index, { name })}
                          placeholder={`${t.common.player} ${index + 1}`}
                        />
                        <View style={styles.scoreContainer}>
                          <Text
                            style={[
                              styles.playerScore,
                              isSelected && styles.playerScoreSelected,
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.7}
                          >
                            {player.score}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.nzolInput}
                      value={nzolValues[index]}
                      onChangeText={(text) => {
                        const numericValue = text.replace(/[^0-9]/g, "");
                        const newNzolValues = [...nzolValues];
                        newNzolValues[index] = numericValue;
                        setNzolValues(newNzolValues);
                      }}
                      placeholder={t.common.nzol}
                      keyboardType="numeric"
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t.handScoreboard.selectHandType}
              </Text>
              <View style={styles.handTypesContainer}>
                {Object.entries(HAND_TYPES).map(([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.handTypeButton,
                      selectedHandType === key && styles.handTypeButtonSelected,
                    ]}
                    onPress={() => setSelectedHandType(key as HandType)}
                  >
                    <Text
                      style={[
                        styles.handTypeButtonText,
                        selectedHandType === key &&
                          styles.handTypeButtonTextSelected,
                      ]}
                    >
                      {config.label}
                    </Text>
                    <Text style={styles.handTypePoints}>
                      {t.handScoreboard.points.winner}: {config.winnerPoints} |{" "}
                      {t.handScoreboard.points.others}: +{config.othersPoints}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedWinner !== null && selectedHandType !== null && (
              <View style={styles.section}>
                <ActionButton
                  label={t.handScoreboard.recordHand}
                  onPress={handleWin}
                  variant="primary"
                />
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    );
  }
);

const DARK_SELECTED_BACKGROUND = "#002244";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.primary },
  wrapper: { flex: 1 },
  container: { flex: 1 },
  contentContainer: { padding: 12, paddingBottom: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
  },
  header: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { paddingVertical: 8, paddingHorizontal: 4, minWidth: 50 },
  backButtonText: { fontSize: 18, color: colors.accent.red, fontWeight: "600" },
  headerCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { ...typography.heading, textAlign: "center" },
  subtitle: { fontSize: 16, color: colors.text.secondary, marginTop: 4 },
  roundIndicator: { fontSize: 14, color: colors.text.secondary, marginTop: 2 },
  resetIconButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 50,
    alignItems: "flex-end",
  },
  resetIconText: { fontSize: 28, color: colors.accent.red, fontWeight: "600" },
  playersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  playerCardWrapper: { flex: 1, minWidth: "45%", gap: 8 },
  playerCard: { ...cardBase, padding: 12, alignItems: "center" },
  playerCardSelected: {
    borderColor: DARK_SELECTED_BACKGROUND,
    backgroundColor: DARK_SELECTED_BACKGROUND,
    borderWidth: 3,
  },
  winningPlayer: { borderColor: colors.accent.green, borderWidth: 1 },
  playerCardContent: { alignItems: "center", width: "100%" },
  playerNameInput: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 4,
    width: "100%",
  },
  playerNameInputSelected: {
    color: "#ffffff",
  },
  scoreContainer: { height: 40, justifyContent: "center" },
  playerScore: { ...typography.scoreSmall, color: colors.accent.red },
  playerScoreSelected: {
    color: "#ffffff",
  },
  nzolInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border.accent,
    borderRadius: 8,
    padding: 8,
    textAlign: "center",
    backgroundColor: colors.background.card,
  },
  section: { marginVertical: 12 },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  handTypesContainer: { gap: 8 },
  handTypeButton: { ...cardBase, padding: 12 },
  handTypeButtonSelected: {
    backgroundColor: colors.accent.red + "10",
    borderColor: colors.accent.red,
  },
  handTypeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 4,
  },
  handTypeButtonTextSelected: { color: colors.accent.red },
  handTypePoints: { fontSize: 12, color: colors.text.secondary },
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
  savedIndicator: { alignItems: "center", marginBottom: 12 },
  savedText: { fontSize: 14, color: colors.accent.green, fontWeight: "600" },
});
