import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { getAdUnitId, USE_TEST_ADS } from "../config/admob";

interface BannerAdComponentProps {
  size?: BannerAdSize;
}

export const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  const adUnitId = USE_TEST_ADS ? TestIds.BANNER : getAdUnitId("banner");

  if (adError) {
    return null; // Don't show anything if ad fails to load
  }

  return (
    <View style={[styles.container, !adLoaded && styles.hidden]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setAdLoaded(true);
          console.log("Banner ad loaded");
        }}
        onAdFailedToLoad={(error) => {
          setAdError(true);
          console.log("Banner ad failed to load:", error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  hidden: {
    height: 0,
    opacity: 0,
  },
});
