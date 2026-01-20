import { Platform } from "react-native";

// AdMob App IDs
export const ADMOB_APP_ID = {
  ios: "ca-app-pub-6363360179665346~3248962284",
  android: "", // Add Android App ID when ready
};

// Ad Unit IDs
export const AD_UNIT_IDS = {
  banner: Platform.select({
    ios: "ca-app-pub-6363360179665346/1896529779",
    android: "", // Add Android Banner ID when ready
    default: "ca-app-pub-6363360179665346/1896529779",
  }),
  interstitial: Platform.select({
    ios: "ca-app-pub-6363360179665346/1457368467",
    android: "", // Add Android Interstitial ID when ready
    default: "ca-app-pub-6363360179665346/1457368467",
  }),
};

// Test Ad Unit IDs (use these during development)
export const TEST_AD_UNIT_IDS = {
  banner: Platform.select({
    ios: "ca-app-pub-3940256099942544/2934735716",
    android: "ca-app-pub-3940256099942544/6300978111",
    default: "ca-app-pub-3940256099942544/2934735716",
  }),
  interstitial: Platform.select({
    ios: "ca-app-pub-3940256099942544/4411468910",
    android: "ca-app-pub-3940256099942544/1033173712",
    default: "ca-app-pub-3940256099942544/4411468910",
  }),
};

// Set to false when ready for production
export const USE_TEST_ADS = __DEV__;

// Get the appropriate ad unit ID based on environment
export const getAdUnitId = (type: "banner" | "interstitial"): string => {
  if (USE_TEST_ADS) {
    return TEST_AD_UNIT_IDS[type] || "";
  }
  return AD_UNIT_IDS[type] || "";
};

// Interstitial ad frequency (show ad every N games)
export const INTERSTITIAL_FREQUENCY = 3;
