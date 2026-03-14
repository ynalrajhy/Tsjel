import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { colors, cardBase, cardSelected, typography } from "../theme/styles";

interface KoutGameSetupProps {
  onSelectGameEnd: (endCondition: 51 | 101 | null) => void;
  onBack: () => void;
}

export const KoutGameSetup: React.FC<KoutGameSetupProps> = ({
  onSelectGameEnd,
  onBack,
}) => {
  const { t } = useLanguage();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{t.games.kout.name}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t.koutScoreboard.selectGameEnd}
        </Text>
        <Text style={styles.description}>Choose when the game should end</Text>
      </View>

      {/* 51 Points Option */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => onSelectGameEnd(51)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{t.koutScoreboard.gameEnd51}</Text>
          <Text style={styles.optionDescription}>
            First team to reach 51 points wins
          </Text>
        </View>
        <Text style={styles.optionArrow}>→</Text>
      </TouchableOpacity>

      {/* 101 Points Option */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => onSelectGameEnd(101)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{t.koutScoreboard.gameEnd101}</Text>
          <Text style={styles.optionDescription}>
            First team to reach 101 points wins
          </Text>
        </View>
        <Text style={styles.optionArrow}>→</Text>
      </TouchableOpacity>

      {/* Unlimited Option */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => onSelectGameEnd(null)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>
            {t.koutScoreboard.gameEndUnlimited}
          </Text>
          <Text style={styles.optionDescription}>Play as long as you want</Text>
        </View>
        <Text style={styles.optionArrow}>→</Text>
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
    padding: 12,
    paddingBottom: 20,
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
  section: {
    marginVertical: 12,
    alignItems: "center",
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 20,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  optionCard: {
    ...cardBase,
    padding: 16,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    letterSpacing: 0.2,
  },
  optionArrow: {
    fontSize: 24,
    color: colors.accent.red,
    marginLeft: 12,
  },
});
