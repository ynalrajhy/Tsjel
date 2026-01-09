import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager, View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  t: TranslationKey;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@app_language';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  const updateRTL = (rtl: boolean) => {
    if (I18nManager.isRTL !== rtl) {
      I18nManager.forceRTL(rtl);
      // Note: App restart may be required for RTL changes to fully apply
      // But we'll set it anyway for immediate effect where possible
    }
  };

  // Load language from storage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage === 'ar' || savedLanguage === 'en') {
          setLanguageState(savedLanguage);
          updateRTL(savedLanguage === 'ar');
        } else {
          // Ensure RTL is false for default English
          updateRTL(false);
        }
      } catch (error) {
        console.error('Error loading language:', error);
        // Ensure RTL is false on error
        updateRTL(false);
      } finally {
        setIsInitialized(true);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
      updateRTL(lang === 'ar');
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  const value: LanguageContextType = {
    language,
    t: translations[language],
    toggleLanguage,
    setLanguage,
    isRTL: language === 'ar',
  };

  // Show loading indicator while language is being loaded
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

