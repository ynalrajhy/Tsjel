// App/components/GameSelection.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { GAMES } from "../config/games";
import { useLanguage } from "../context/LanguageContext";
import { useFirebase } from "../context/FirebaseContext";
import { colors, cardBase, cardShadow, typography } from "../theme/styles";

interface GameSelectionProps {
  onSelectGame: (gameId: string) => void;
}

export const GameSelection: React.FC<GameSelectionProps> = ({
  onSelectGame,
}) => {
  const { t, toggleLanguage, language } = useLanguage();
  const { user, doSignOut } = useFirebase();
  const [showSettings, setShowSettings] = useState(false);
  const games = Object.values(GAMES);

  const handleSignOut = async () => {
    try {
      await doSignOut();
      setShowSettings(false);
    } catch (error) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* Settings Button (Left) */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>

          {/* Language Button (Right) */}
          <TouchableOpacity
            style={styles.languageButton}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <Text style={styles.languageButtonText}>
              {language === "en" ? "ع" : "E"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{t.gameSelection.title}</Text>
        <Text style={styles.subtitle}>{t.gameSelection.subtitle}</Text>

        {/* Show user email if logged in */}
        {user && <Text style={styles.userEmail}>{user.email}</Text>}
      </View>

      <View style={styles.gamesContainer}>
        {games.map((game) => {
          const gameTranslations = t.games[game.id as keyof typeof t.games];
          return (
            <TouchableOpacity
              key={game.id}
              style={styles.gameCard}
              onPress={() => onSelectGame(game.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.gameName}>
                {gameTranslations?.name || game.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>

            {user ? (
              <>
                <Text style={styles.modalText}>Signed in as:</Text>
                <Text style={styles.modalEmail}>{user.email}</Text>

                <TouchableOpacity
                  style={styles.signOutButton}
                  onPress={handleSignOut}
                >
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.modalText}>Playing as guest</Text>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  settingsButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.background.card,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  settingsButtonText: {
    fontSize: 18,
  },
  languageButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.button.primary,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border.accent,
    ...cardShadow,
  },
  languageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  title: {
    ...typography.heading,
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 8,
  },
  gamesContainer: {
    gap: 16,
  },
  gameCard: {
    ...cardBase,
    padding: 20,
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.border.default,
  },
  gameName: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.accent.red,
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  modalTitle: {
    ...typography.heading,
    fontSize: 22,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  modalEmail: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "600",
    marginBottom: 20,
  },
  signOutButton: {
    backgroundColor: colors.button.danger,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  signOutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
});
