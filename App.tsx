import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Animated, Dimensions } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { GameSelection } from "./App/components/GameSelection";
import { Scoreboard } from "./App/components/Scoreboard";
import { AuthScreen } from "./App/components/AuthScreen";
import { GameHistoryScreen } from "./App/components/GameHistoryScreen";
import { getGameConfig } from "./App/config/games";
import { LanguageProvider } from "./App/context/LanguageContext";
import { useLanguage } from "./App/context/LanguageContext";
import { FirebaseProvider, useFirebase } from "./App/context/FirebaseContext";
import { AdProvider, useAds } from "./App/context/AdContext";

const screenWidth = Dimensions.get("window").width;

function AppContent() {
  const { isRTL } = useLanguage();
  const { user } = useFirebase();
  const { incrementGamesPlayed, showInterstitialAd, shouldShowInterstitial } =
    useAds();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [showAuth, setShowAuth] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const gameSelectionTranslateX = useRef(new Animated.Value(0)).current;
  const scoreboardTranslateX = useRef(new Animated.Value(screenWidth)).current;

  const gameConfig = selectedGameId ? getGameConfig(selectedGameId) : null;

  useEffect(() => {
    if (isRTL) {
      scoreboardTranslateX.setValue(-screenWidth);
    } else {
      scoreboardTranslateX.setValue(screenWidth);
    }
  }, [isRTL]);

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    Animated.parallel([
      Animated.timing(gameSelectionTranslateX, {
        toValue: isRTL ? screenWidth : -screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scoreboardTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBack = async () => {
    // Increment games played counter
    incrementGamesPlayed();

    // Show interstitial ad if it's time (every 3rd game)
    if (shouldShowInterstitial) {
      await showInterstitialAd();
    }

    Animated.parallel([
      Animated.timing(scoreboardTranslateX, {
        toValue: isRTL ? -screenWidth : screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(gameSelectionTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedGameId(null);
      gameSelectionTranslateX.setValue(0);
      scoreboardTranslateX.setValue(isRTL ? -screenWidth : screenWidth);
    });
  };

  // Handle showing auth screen from settings (for guests)
  const handleShowAuth = () => {
    setShowAuth(true);
  };

  // NOW we can do conditional returns (after all hooks)
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
      <Animated.View
        style={[
          styles.screenContainer,
          {
            transform: [{ translateX: gameSelectionTranslateX }],
            zIndex: gameConfig ? 0 : 1,
          },
        ]}
        pointerEvents={gameConfig ? "none" : "auto"}
      >
        <GameSelection
          onSelectGame={handleSelectGame}
          onShowHistory={() => setShowHistory(true)}
          onShowAuth={handleShowAuth}
        />
      </Animated.View>

      {gameConfig && (
        <Animated.View
          style={[
            styles.screenContainer,
            {
              transform: [{ translateX: scoreboardTranslateX }],
              zIndex: 2,
            },
          ]}
        >
          <Scoreboard gameConfig={gameConfig} onBack={handleBack} />
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
            <SafeAreaView style={styles.container}>
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
