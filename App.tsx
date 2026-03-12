import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Animated, Easing } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useState, useRef, useEffect, useMemo } from "react";
import { GameSelection } from "./App/components/GameSelection";
import { Scoreboard } from "./App/components/Scoreboard";
import { AuthScreen } from "./App/components/AuthScreen";
import { GameHistoryScreen } from "./App/components/GameHistoryScreen";
import { getGameConfig } from "./App/config/games";
import { LanguageProvider } from "./App/context/LanguageContext";
import { useLanguage } from "./App/context/LanguageContext";
import { FirebaseProvider, useFirebase } from "./App/context/FirebaseContext";
import { AdProvider, useAds } from "./App/context/AdContext";

function AppContent() {
  const { user } = useFirebase();
  const { incrementGamesPlayed, showInterstitialAd, shouldShowInterstitial } =
    useAds();

  const [showAuth, setShowAuth] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Animation value (0 = Home, 1 = Scoreboard)
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const gameConfig = useMemo(
    () => (selectedGameId ? getGameConfig(selectedGameId) : null),
    [selectedGameId]
  );

  useEffect(() => {
    if (!user) {
      setShowAuth(true);
    }
  }, [user]);

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handleBack = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setSelectedGameId(null);
    });

    incrementGamesPlayed();
    if (shouldShowInterstitial) {
      await showInterstitialAd();
    }
  };

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  // Cross-Fade Interpolations
  const homeOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const scoreboardOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (showAuth && !user) {
    return (
      <AuthScreen
        onAuthSuccess={() => setShowAuth(false)}
        onSkip={() => setShowAuth(false)}
      />
    );
  }

  if (showHistory) {
    return <GameHistoryScreen onBack={() => setShowHistory(false)} />;
  }

  return (
    <View style={styles.container}>
      {/* Home Screen */}
      <Animated.View
        style={[
          styles.screenContainer,
          {
            opacity: homeOpacity,
            zIndex: selectedGameId ? 0 : 1,
          },
        ]}
        pointerEvents={selectedGameId ? "none" : "auto"}
      >
        <GameSelection
          onSelectGame={handleSelectGame}
          onShowHistory={() => setShowHistory(true)}
          onShowAuth={handleShowAuth}
        />
      </Animated.View>

      {/* Scoreboard Screen */}
      {selectedGameId && (
        <Animated.View
          style={[
            styles.screenContainer,
            {
              opacity: scoreboardOpacity,
              zIndex: 2,
            },
          ]}
        >
          <Scoreboard gameConfig={gameConfig!} onBack={handleBack} />
        </Animated.View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FirebaseProvider>
        <AdProvider>
          <LanguageProvider>
            <SafeAreaView
              style={styles.container}
              edges={["top", "left", "right"]}
            >
              <AppContent />
              <StatusBar style="auto" />
            </SafeAreaView>
          </LanguageProvider>
        </AdProvider>
      </FirebaseProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1E8",
  },
  screenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
