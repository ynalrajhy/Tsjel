import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFirebase } from "../context/FirebaseContext";
import { useLanguage } from "../context/LanguageContext";
import { colors, cardBase, typography } from "../theme/styles";

interface GameHistoryScreenProps {
  onBack: () => void;
}

export const GameHistoryScreen: React.FC<GameHistoryScreenProps> = ({
  onBack,
}) => {
  const { getGameHistory, user } = useFirebase();
  const { t } = useLanguage();
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const history = await getGameHistory();
      setGames(history);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getGameTypeLabel = (type: string) => {
    switch (type) {
      case "kout":
        return "كوت / Kout";
      case "baloot":
        return "بلوت / Baloot";
      case "hand":
        return "هاند / Hand";
      default:
        return type;
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {t.common?.gameHistory || "Game History"}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {t.auth?.loginToSaveGames ||
              "Please login to see your game history"}
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {t.common?.gameHistory || "Game History"}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.loadingText}>
            {t.common?.loading || "Loading..."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {t.common?.gameHistory || "Game History"}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {games.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {t.auth?.noGamesYet || "No games yet. Start playing!"}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.gamesCount}>
            {games.length} {games.length === 1 ? "game" : "games"} played
          </Text>

          {games.map((game, index) => (
            <View key={game.id || index} style={styles.gameCard}>
              <View style={styles.gameHeader}>
                <Text style={styles.gameType}>
                  {getGameTypeLabel(game.gameType)}
                </Text>
                <Text style={styles.gameDate}>
                  {formatDate(game.timestamp)}
                </Text>
              </View>

              {game.gameType === "hand" ? (
                // Hand game display
                <View style={styles.playersContainer}>
                  <Text style={styles.winnerLabel}>🏆 {game.winner}</Text>
                  {game.players?.map((player: any, idx: number) => (
                    <View key={idx} style={styles.playerRow}>
                      <Text
                        style={[
                          styles.playerName,
                          player.name === game.winner && styles.winnerName,
                        ]}
                      >
                        {player.name}
                      </Text>
                      <Text style={styles.playerScore}>{player.score}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                // Team game display (Kout, Baloot)
                <View style={styles.teamsContainer}>
                  <View style={styles.teamRow}>
                    <Text
                      style={[
                        styles.teamName,
                        game.winner === game.team1?.name && styles.winnerName,
                      ]}
                    >
                      {game.winner === game.team1?.name && "🏆 "}
                      {game.team1?.name}
                    </Text>
                    <Text style={styles.teamScore}>{game.team1?.score}</Text>
                  </View>
                  <Text style={styles.vs}>vs</Text>
                  <View style={styles.teamRow}>
                    <Text
                      style={[
                        styles.teamName,
                        game.winner === game.team2?.name && styles.winnerName,
                      ]}
                    >
                      {game.winner === game.team2?.name && "🏆 "}
                      {game.team2?.name}
                    </Text>
                    <Text style={styles.teamScore}>{game.team2?.score}</Text>
                  </View>
                </View>
              )}

              {game.rounds && (
                <Text style={styles.roundsInfo}>
                  {game.rounds} {t.common?.rounds || "rounds"}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 40,
    paddingBottom: 12,
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
  title: {
    ...typography.heading,
    fontSize: 20,
  },
  placeholder: {
    minWidth: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 20,
  },
  gamesCount: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  gameCard: {
    ...cardBase,
    padding: 16,
    marginBottom: 12,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: 8,
  },
  gameType: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent.red,
  },
  gameDate: {
    fontSize: 12,
    color: colors.text.muted,
  },
  teamsContainer: {
    alignItems: "center",
  },
  teamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 4,
  },
  teamName: {
    fontSize: 16,
    color: colors.text.primary,
  },
  winnerName: {
    fontWeight: "700",
    color: colors.accent.red,
  },
  teamScore: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  vs: {
    fontSize: 12,
    color: colors.text.muted,
    marginVertical: 4,
  },
  playersContainer: {
    gap: 4,
  },
  winnerLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accent.red,
    marginBottom: 8,
    textAlign: "center",
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  playerName: {
    fontSize: 14,
    color: colors.text.primary,
  },
  playerScore: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  roundsInfo: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: "center",
    marginTop: 8,
  },
});
