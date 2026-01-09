import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  View,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { GameSelection } from "./App/components/GameSelection";
import { Scoreboard } from "./App/components/Scoreboard";
import { getGameConfig } from "./App/config/games";
import { LanguageProvider } from "./App/context/LanguageContext";
import { useLanguage } from "./App/context/LanguageContext";

const screenWidth = Dimensions.get("window").width;

function AppContent() {
  const { isRTL } = useLanguage();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const gameConfig = selectedGameId ? getGameConfig(selectedGameId) : null;

  // Animation values - initialize scoreboard off-screen
  const gameSelectionTranslateX = useRef(new Animated.Value(0)).current;
  const scoreboardTranslateX = useRef(new Animated.Value(screenWidth)).current;

  // Update initial position based on RTL
  useEffect(() => {
    if (isRTL) {
      scoreboardTranslateX.setValue(-screenWidth);
    } else {
      scoreboardTranslateX.setValue(screenWidth);
    }
  }, [isRTL]);

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);

    // Animate game selection sliding out and scoreboard sliding in
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

  const handleBack = () => {
    // Animate scoreboard sliding out and game selection sliding in
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
      // Reset animation values
      gameSelectionTranslateX.setValue(0);
      scoreboardTranslateX.setValue(isRTL ? -screenWidth : screenWidth);
    });
  };

  return (
    <View style={styles.container}>
      {/* Game Selection Screen */}
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
        <GameSelection onSelectGame={handleSelectGame} />
      </Animated.View>

      {/* Scoreboard Screen */}
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
    <LanguageProvider>
      <SafeAreaView style={styles.container}>
        <AppContent />
        <StatusBar style="auto" />
      </SafeAreaView>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1E8", // Aged paper background
  },
  screenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
