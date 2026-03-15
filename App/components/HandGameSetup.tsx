import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { colors, cardBase, typography } from "../theme/styles";

interface HandGameSetupProps {
  onStartGame: (config: {
    playerCount: number;
    playerNames: string[];
    penaltyPoints: number;
  }) => void;
  onBack: () => void;
}

const PLAYER_COUNT_OPTIONS = [2, 4, 5];

export const HandGameSetup: React.FC<HandGameSetupProps> = ({
  onStartGame,
  onBack,
}) => {
  const { t } = useLanguage();
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [playerNames, setPlayerNames] = useState<string[]>([
    "Player 1",
    "Player 2",
    "Player 3",
    "Player 4",
  ]);
  const [penaltyInput, setPenaltyInput] = useState("");

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    // Build new names array based on count
    const newNames: string[] = [];
    for (let i = 0; i < count; i++) {
      // Keep existing name if available, otherwise default
      newNames.push(playerNames[i] || `Player ${i + 1}`);
    }
    setPlayerNames(newNames);
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    const penalty = parseInt(penaltyInput) || 0;
    const finalNames = playerNames.map(
      (name, i) => name.trim() || `Player ${i + 1}`,
    );
    onStartGame({
      playerCount,
      playerNames: finalNames,
      penaltyPoints: Math.abs(penalty),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{t.games.hand.name}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Game Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t.setup?.gameInfo || "Game Info"}
        </Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {t.setup?.handInfo || "8 rounds — lowest score wins"}
          </Text>
        </View>
      </View>

      {/* Player Count Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t.setup?.numberOfPlayers || "Number of Players"}
        </Text>
        <Text style={styles.description}>
          {t.setup?.selectPlayerCount ||
            "Select how many players are in the game"}
        </Text>
      </View>

      <View style={styles.playerCountRow}>
        {PLAYER_COUNT_OPTIONS.map((count) => (
          <TouchableOpacity
            key={count}
            style={[
              styles.playerCountBtn,
              playerCount === count && styles.playerCountBtnSelected,
            ]}
            onPress={() => handlePlayerCountChange(count)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.playerCountBtnText,
                playerCount === count && styles.playerCountBtnTextSelected,
              ]}
            >
              {count}
            </Text>
            <Text
              style={[
                styles.playerCountLabel,
                playerCount === count && styles.playerCountLabelSelected,
              ]}
            >
              {t.setup?.players || "Players"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Player Names */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t.setup?.playerNames || "Player Names"}
        </Text>
        <Text style={styles.description}>
          {t.setup?.optionalPlayerNames ||
            "Optional — defaults to Player 1, 2, 3..."}
        </Text>
      </View>

      <View style={styles.playersGrid}>
        {playerNames.map((name, index) => (
          <View key={index} style={styles.playerNameField}>
            <Text style={styles.fieldLabel}>
              {t.common?.player || "Player"} {index + 1}
            </Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={(text) => updatePlayerName(index, text)}
              placeholder={`Player ${index + 1}`}
              placeholderTextColor={colors.text.muted}
              selectTextOnFocus
            />
          </View>
        ))}
      </View>

      {/* Penalty Points */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t.setup?.penaltyPoints || "Penalty Points"}
        </Text>
        <Text style={styles.description}>
          {t.setup?.penaltyDescription ||
            "Points deducted when a penalty is applied during the game"}
        </Text>
      </View>

      <View style={styles.penaltyRow}>
        <TextInput
          style={styles.penaltyInput}
          value={penaltyInput}
          onChangeText={(text) => setPenaltyInput(text.replace(/[^0-9]/g, ""))}
          placeholder="0"
          placeholderTextColor={colors.text.muted}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Text style={styles.penaltyLabel}>
          {t.setup?.pointsPerPenalty || "points per penalty"}
        </Text>
      </View>

      {/* Start Game Button */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={handleStartGame}
        activeOpacity={0.7}
      >
        <Text style={styles.startBtnText}>
          {t.setup?.startGame || "Start Game"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.heading,
    textAlign: "center",
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 18,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.text.secondary,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  infoCard: {
    ...cardBase,
    padding: 14,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  infoText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "500",
    textAlign: "center",
  },

  /* Player Count Selection */
  playerCountRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  playerCountBtn: {
    ...cardBase,
    width: 90,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  playerCountBtnSelected: {
    borderColor: colors.accent.blue,
    backgroundColor: colors.accent.blue,
    borderWidth: 2,
  },
  playerCountBtnText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text.primary,
  },
  playerCountBtnTextSelected: {
    color: "#FFFFFF",
  },
  playerCountLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  playerCountLabelSelected: {
    color: "#FFFFFF",
  },

  /* Player Names - 2-column grid */
  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  playerNameField: {
    width: "47%",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    ...cardBase,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text.primary,
    textAlign: "center",
  },

  /* Penalty */
  penaltyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  penaltyInput: {
    ...cardBase,
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
  },
  penaltyLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },

  /* Start Button */
  startBtn: {
    marginTop: 30,
    backgroundColor: colors.accent.green,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
