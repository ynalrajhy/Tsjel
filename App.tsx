import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Animated, Dimensions } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { GameSelection } from "./App/components/GameSelection";
import { Scoreboard } from "./App/components/Scoreboard";
import { AuthScreen } from "./App/components/AuthScreen";
import { getGameConfig } from "./App/config/games";
import { LanguageProvider } from "./App/context/LanguageContext";
import { useLanguage } from "./App/context/LanguageContext";
import { FirebaseProvider, useFirebase } from "./App/context/FirebaseContext";

const screenWidth = Dimensions.get("window").width;

function AppContent() {
  const { isRTL } = useLanguage();
  const { user } = useFirebase();

  const [showAuth, setShowAuth] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const gameSelectionTranslateX = useRef(new Animated.Value(0)).current;
  const scoreboardTranslateX = useRef(new Animated.Value(screenWidth)).current;

  const gameConfig = selectedGameId ? getGameConfig(selectedGameId) : null;

  useEffect(() => {
    if (!user) {
      setShowAuth(true);
    }
  }, [user]);

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

  const handleBack = () => {
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

  if (!user && showAuth) {
    return (
      <AuthScreen
        onAuthSuccess={() => setShowAuth(false)}
        onSkip={() => setShowAuth(false)}
      />
    );
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
        <GameSelection onSelectGame={handleSelectGame} />
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
      <LanguageProvider>
        <SafeAreaView style={styles.container}>
          <AppContent />
          <StatusBar style="auto" />
        </SafeAreaView>
      </LanguageProvider>
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
