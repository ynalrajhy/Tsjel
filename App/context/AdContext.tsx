import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from "react-native-google-mobile-ads";
import {
  getAdUnitId,
  INTERSTITIAL_FREQUENCY,
  USE_TEST_ADS,
} from "../config/admob";

interface AdContextType {
  gamesPlayedCount: number;
  incrementGamesPlayed: () => void;
  showInterstitialAd: () => Promise<void>;
  isInterstitialReady: boolean;
  shouldShowInterstitial: boolean;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

// Create interstitial ad instance
const interstitialAdUnitId = USE_TEST_ADS
  ? TestIds.INTERSTITIAL
  : getAdUnitId("interstitial");

const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export const AdProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gamesPlayedCount, setGamesPlayedCount] = useState(0);
  const [isInterstitialReady, setIsInterstitialReady] = useState(false);
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);

  // Load interstitial ad
  const loadInterstitial = useCallback(() => {
    if (!isInterstitialLoading && !isInterstitialReady) {
      setIsInterstitialLoading(true);
      interstitial.load();
    }
  }, [isInterstitialLoading, isInterstitialReady]);

  useEffect(() => {
    // Set up event listeners
    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setIsInterstitialReady(true);
        setIsInterstitialLoading(false);
        console.log("Interstitial ad loaded");
      }
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsInterstitialReady(false);
        // Reload ad for next time
        loadInterstitial();
      }
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        setIsInterstitialLoading(false);
        console.log("Interstitial ad error:", error);
        // Retry loading after a delay
        setTimeout(loadInterstitial, 30000);
      }
    );

    // Load initial ad
    loadInterstitial();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [loadInterstitial]);

  const incrementGamesPlayed = useCallback(() => {
    setGamesPlayedCount((prev) => prev + 1);
  }, []);

  const shouldShowInterstitial =
    gamesPlayedCount > 0 && gamesPlayedCount % INTERSTITIAL_FREQUENCY === 0;

  const showInterstitialAd = useCallback(async () => {
    if (isInterstitialReady && shouldShowInterstitial) {
      try {
        await interstitial.show();
      } catch (error) {
        console.log("Error showing interstitial:", error);
      }
    }
  }, [isInterstitialReady, shouldShowInterstitial]);

  const value: AdContextType = {
    gamesPlayedCount,
    incrementGamesPlayed,
    showInterstitialAd,
    isInterstitialReady,
    shouldShowInterstitial,
  };

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
};

export const useAds = () => {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error("useAds must be used within an AdProvider");
  }
  return context;
};
