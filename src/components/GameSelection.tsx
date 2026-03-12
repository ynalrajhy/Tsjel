import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GAMES } from '../config/games';
import { useLanguage } from '../context/LanguageContext';

interface GameSelectionProps {
  onSelectGame: (gameId: string) => void;
}

export const GameSelection: React.FC<GameSelectionProps> = ({ onSelectGame }) => {
  const { t, toggleLanguage, language } = useLanguage();
  const games = Object.values(GAMES);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.placeholder} />
          <TouchableOpacity
            style={styles.languageButton}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <Text style={styles.languageButtonText}>
              {language === 'en' ? 'العربية' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{t.gameSelection.title}</Text>
        <Text style={styles.subtitle}>{t.gameSelection.subtitle}</Text>
      </View>

      <View style={styles.gamesContainer}>
        {games.map((game) => {
          const gameTranslations = t.games[game.id as keyof typeof t.games];
          return (
            <TouchableOpacity
              key={game.id}
              style={[
                styles.gameCard,
                selectedGameId === game.id && styles.gameCardSelected,
              ]}
              onPress={() => {
                setSelectedGameId(game.id);
                onSelectGame(game.id);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.gameName,
                  selectedGameId === game.id && styles.gameNameSelected,
                ]}
              >
                {gameTranslations?.name || game.name}
              </Text>
              {game.description && (
                <Text
                  style={[
                    styles.gameDescription,
                    selectedGameId === game.id &&
                      styles.gameDescriptionSelected,
                  ]}
                >
                  {gameTranslations?.description || game.description}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  placeholder: {
    width: 80,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    minWidth: 80,
    alignItems: 'center',
  },
  languageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  gamesContainer: {
    gap: 16,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gameCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowOpacity: 0.18,
  },
  gameName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  gameNameSelected: {
    color: '#fff',
  },
  gameDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  gameDescriptionSelected: {
    color: '#f5f5f5',
  },
});

