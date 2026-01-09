import React, { useState } from "react";
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
} from "react-native";
import { useHandStorage } from "../hooks/useHandStorage";
import { ActionButton } from "./ActionButton";
import { GameConfig } from "../config/games";
import { useLanguage } from "../context/LanguageContext";
import {
  colors,
  cardBase,
  cardSelected,
  cardShadow,
  cardShadowStrong,
  typography,
} from "../theme/styles";
import { useSwipeToGoBack } from "../hooks/useSwipeToGoBack";

interface HandScoreboardProps {
  gameConfig: GameConfig;
  onBack: () => void;
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

// HAND_TYPES will be created dynamically using translations

export const HandScoreboard: React.FC<HandScoreboardProps> = ({
  gameConfig,
  onBack,
}) => {
  const { t } = useLanguage();
  const { players, updatePlayer, resetScores, isLoading } = useHandStorage(
    gameConfig.id
  );
  const swipeHandlers = useSwipeToGoBack({ onBack });
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [selectedHandType, setSelectedHandType] = useState<HandType | null>(
    null
  );
  const [currentRound, setCurrentRound] = useState(1);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [nzolValues, setNzolValues] = useState<string[]>(["", "", "", ""]);

  // Create HAND_TYPES with translations
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

    // Calculate Nzol multiplier based on hand type
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
        nzolMultiplier = 1; // Add as-is, no multiplication
        break;
    }

    const handConfig = HAND_TYPES[selectedHandType];

    // Apply scoring: winner gets winnerPoints, others get Nzol or regular scoring
    const newPlayers = players.map((player, index) => {
      if (index === selectedWinner) {
        // Winner always gets winnerPoints
        return {
          ...player,
          score: player.score + handConfig.winnerPoints,
        };
      } else {
        // For other players: check if they have Nzol
        const nzolValueStr = nzolValues[index];
        const hasNzol = nzolValueStr && nzolValueStr.trim() !== "";

        if (hasNzol) {
          // Player has Nzol: apply Nzol scoring (multiplier × nzolValue)
          const nzolValue = parseFloat(nzolValueStr) || 0;
          const nzolPoints = nzolValue * nzolMultiplier;
          return {
            ...player,
            score: player.score + nzolPoints,
          };
        } else {
          // Player has no Nzol: apply regular scoring (othersPoints)
          return {
            ...player,
            score: player.score + handConfig.othersPoints,
          };
        }
      }
    });

    // Record round before updating scores
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

    // Show confirmation
    const message = t.handScoreboard.roundWonHand
      .replace("{round}", currentRound.toString())
      .replace("{name}", players[selectedWinner].name)
      .replace("{handType}", HAND_TYPES[selectedHandType].label);
    Alert.alert(t.handScoreboard.handRecorded, message, [
      { text: t.common.ok },
    ]);

    // Increment round
    setCurrentRound(currentRound + 1);

    // Reset selection and Nzol values
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
        },
      },
    ]);
  };

  // Sort players by score (lowest first, since lowest wins)
  const sortedPlayers = [...players].sort((a, b) => a.score - b.score);
  const top3Players = sortedPlayers.slice(0, 3);
  const gameEnded = currentRound > 8;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </View>
    );
  }

  // Show podium when game ends
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

            {/* Podium View */}
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              {top3Players[1] && (
                <View style={styles.podiumSecond}>
                  <View style={[styles.podiumBase, styles.podiumSecondBase]}>
                    <Text style={styles.podiumMedal}>🥈</Text>
                    <Text style={styles.podiumName}>{top3Players[1].name}</Text>
                    <Text style={styles.podiumScore}>
                      {top3Players[1].score}
                    </Text>
                  </View>
                </View>
              )}

              {/* 1st Place */}
              {top3Players[0] && (
                <View style={styles.podiumFirst}>
                  <View style={[styles.podiumBase, styles.podiumFirstBase]}>
                    <Text style={styles.podiumMedal}>🥇</Text>
                    <Text style={styles.podiumName}>{top3Players[0].name}</Text>
                    <Text style={styles.podiumScore}>
                      {top3Players[0].score}
                    </Text>
                  </View>
                </View>
              )}

              {/* 3rd Place */}
              {top3Players[2] && (
                <View style={styles.podiumThird}>
                  <View style={[styles.podiumBase, styles.podiumThirdBase]}>
                    <Text style={styles.podiumMedal}>🥉</Text>
                    <Text style={styles.podiumName}>{top3Players[2].name}</Text>
                    <Text style={styles.podiumScore}>
                      {top3Players[2].score}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Game History */}
            {rounds.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.common.gameHistory}</Text>
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

            {/* New Game Button */}
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
      <View style={styles.wrapper} {...swipeHandlers.panHandlers}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
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

          {/* Players Display */}
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
                      isSelected && styles.playerCardSelected,
                      sortedIndex === 0 && styles.winningPlayer,
                    ]}
                    onPress={() => setSelectedWinner(index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.playerCardContent}>
                      <TextInput
                        style={styles.playerNameInput}
                        value={player.name}
                        onChangeText={(name) => updatePlayer(index, { name })}
                        placeholder={`${t.common.player} ${index + 1}`}
                      />
                      <View style={styles.scoreContainer}>
                        <Text
                          style={styles.playerScore}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.7}
                        >
                          {player.score}
                        </Text>
                      </View>
                      {(isSelected || (sortedIndex === 0 && !isSelected)) && (
                        <View style={styles.badgeContainer}>
                          {isSelected && (
                            <Text style={styles.selectedBadge}>
                              {t.common.selected}
                            </Text>
                          )}
                          {sortedIndex === 0 && !isSelected && (
                            <Text style={styles.winningBadge}>
                              {t.common.leading}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.nzolInput}
                    value={nzolValues[index]}
                    onChangeText={(text) => {
                      // Only allow numbers
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

          {/* Select Hand Type */}
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

          {/* Record Hand Button */}
          {selectedWinner !== null && selectedHandType !== null && (
            <View style={styles.section}>
              <ActionButton
                label={t.handScoreboard.recordHand.replace(
                  "{handType}",
                  HAND_TYPES[selectedHandType].label
                )}
                onPress={handleWin}
                variant="primary"
                disabled={currentRound > 8}
              />
            </View>
          )}

          {/* Game History */}
          {rounds.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.common.gameHistory}</Text>
              <View style={styles.historyContainer}>
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
            </View>
          )}
        </ScrollView>
      </View>
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
    marginBottom: 4,
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
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: colors.text.secondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  roundIndicator: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.accent.red,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  playersContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    alignItems: "stretch",
  },
  playerCardWrapper: {
    flex: 1,
    minWidth: 0,
  },
  playerCard: {
    ...cardBase,
    padding: 0,
    marginBottom: 6,
    minHeight: 110,
    overflow: "visible",
    width: "100%",
  },
  playerCardContent: {
    flex: 1,
    padding: 10,
    paddingHorizontal: 8,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  scoreContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
    minHeight: 32,
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  badgeContainer: {
    minHeight: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  playerCardSelected: {
    ...cardSelected,
    backgroundColor: colors.background.cardAlt,
  },
  winningPlayer: {
    borderColor: colors.accent.green,
    backgroundColor: colors.background.cardAlt,
    borderWidth: 3,
  },
  playerNameInput: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 0.2,
    minHeight: 20,
    maxHeight: 20,
    padding: 0,
    width: "100%",
  },
  playerScore: {
    ...typography.scoreSmall,
    textAlign: "center",
    color: colors.accent.red,
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 26,
    flexShrink: 1,
    width: "100%",
  },
  winningBadge: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.accent.green,
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 0.3,
    minHeight: 12,
  },
  selectedBadge: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.accent.red,
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 0.3,
    minHeight: 12,
  },
  nzolInput: {
    backgroundColor: colors.background.card,
    borderRadius: 10,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.border.default,
    fontSize: 12,
    textAlign: "center",
    minHeight: 36,
    maxHeight: 36,
    color: colors.text.primary,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  handTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  handTypeButton: {
    ...cardBase,
    padding: 8,
    width: "30%",
    minWidth: "30%",
    maxWidth: "30%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  handTypeButtonSelected: {
    ...cardSelected,
    backgroundColor: colors.background.cardAlt,
    borderWidth: 3,
  },
  handTypeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  handTypeButtonTextSelected: {
    color: colors.accent.red,
    fontWeight: "700",
  },
  handTypePoints: {
    fontSize: 9,
    color: colors.text.secondary,
    letterSpacing: 0.1,
    textAlign: "center",
    lineHeight: 12,
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    minHeight: 180,
  },
  podiumFirst: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  podiumSecond: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  podiumThird: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  podiumBase: {
    ...cardBase,
    padding: 14,
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    ...cardShadowStrong,
  },
  podiumFirstBase: {
    minHeight: 140,
    borderColor: colors.accent.gold,
    borderWidth: 3,
    backgroundColor: colors.background.cardAlt,
  },
  podiumSecondBase: {
    minHeight: 115,
    borderColor: colors.accent.silver,
    borderWidth: 3,
  },
  podiumThirdBase: {
    minHeight: 90,
    borderColor: colors.accent.bronze,
    borderWidth: 3,
  },
  podiumMedal: {
    fontSize: 40,
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  podiumScore: {
    ...typography.scoreSmall,
    color: colors.accent.red,
  },
  historyContainer: {
    gap: 6,
  },
  roundCard: {
    ...cardBase,
    padding: 10,
    marginBottom: 6,
    borderWidth: 2,
  },
  roundNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.accent.red,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  roundWinner: {
    fontSize: 13,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
});
