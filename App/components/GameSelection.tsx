import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GAMES } from '../config/games';
import { useLanguage } from '../context/LanguageContext';
import { colors, cardBase, cardShadow, typography } from '../theme/styles';

interface GameSelectionProps {
  onSelectGame: (gameId: string) => void;
}

export const GameSelection: React.FC<GameSelectionProps> = ({ onSelectGame }) => {
  const { t, toggleLanguage, language } = useLanguage();
  const games = Object.values(GAMES);

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
              {language === 'en' ? 'ع' : 'E'}
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
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  placeholder: {
    width: 80,
  },
  languageButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.button.primary,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.accent,
    ...cardShadow,
  },
  languageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  gamesContainer: {
    gap: 16,
  },
  gameCard: {
    ...cardBase,
    padding: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border.default,
  },
  gameName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.accent.red,
    letterSpacing: 0.5,
  },
});

