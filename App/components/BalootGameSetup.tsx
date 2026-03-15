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

interface BalootGameSetupProps {
  onStartGame: (config: {
    team1Name: string;
    team2Name: string;
    penaltyPoints: number;
  }) => void;
  onBack: () => void;
}

export const BalootGameSetup: React.FC<BalootGameSetupProps> = ({
  onStartGame,
  onBack,
}) => {
  const { t } = useLanguage();
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [penaltyInput, setPenaltyInput] = useState("");

  const handleStartGame = () => {
    const penalty = parseInt(penaltyInput) || 0;
    onStartGame({
      team1Name: team1Name.trim() || "Team 1",
      team2Name: team2Name.trim() || "Team 2",
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
          <Text style={styles.title}>{t.games.baloot.name}</Text>
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
            {t.setup?.balootWinCondition ||
              "First team to reach 152 points wins"}
          </Text>
        </View>
      </View>

      {/* Team Names */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t.setup?.teamNames || "Team Names"}
        </Text>
        <Text style={styles.description}>
          {t.setup?.optionalTeamNames ||
            "Optional — defaults to Team 1 & Team 2"}
        </Text>
      </View>

      <View style={styles.teamNamesRow}>
        <View style={styles.teamNameField}>
          <Text style={styles.fieldLabel}>{t.setup?.team1 || "Team 1"}</Text>
          <TextInput
            style={styles.textInput}
            value={team1Name}
            onChangeText={setTeam1Name}
            placeholder="Team 1"
            placeholderTextColor={colors.text.muted}
            selectTextOnFocus
          />
        </View>
        <View style={styles.teamNameField}>
          <Text style={styles.fieldLabel}>{t.setup?.team2 || "Team 2"}</Text>
          <TextInput
            style={styles.textInput}
            value={team2Name}
            onChangeText={setTeam2Name}
            placeholder="Team 2"
            placeholderTextColor={colors.text.muted}
            selectTextOnFocus
          />
        </View>
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

  /* Team Names */
  teamNamesRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  teamNameField: {
    flex: 1,
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
