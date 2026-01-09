import { useRef, useCallback } from 'react';
import { 
  PanResponder, 
  GestureResponderEvent, 
  PanResponderGestureState, 
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface UseSwipeToGoBackOptions {
  onBack: () => void;
  swipeThreshold?: number; // Minimum distance to trigger swipe (default: 80)
  edgeThreshold?: number; // Maximum distance from edge to start swipe (default: 30)
}

export const useSwipeToGoBack = ({ 
  onBack, 
  swipeThreshold = 80,
  edgeThreshold = 30 
}: UseSwipeToGoBackOptions) => {
  const { isRTL } = useLanguage();
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(0)).current;
  const lastDx = useRef(0);
  
  const animateBack = useCallback(() => {
    Animated.timing(translateX, {
      toValue: isRTL ? -screenWidth : screenWidth,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(0);
      onBack();
    });
  }, [translateX, screenWidth, isRTL, onBack]);

  const resetPosition = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [translateX]);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt: GestureResponderEvent) => {
        // Only start if touch is near the left edge (or right edge for RTL)
        const { pageX } = evt.nativeEvent;
        
        if (isRTL) {
          // For RTL, check if touch is near right edge
          return pageX >= screenWidth - edgeThreshold;
        } else {
          // For LTR, check if touch is near left edge
          return pageX <= edgeThreshold;
        }
      },
      onMoveShouldSetPanResponder: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Only respond if horizontal movement is greater than vertical
        const { dx, dy } = gestureState;
        const isHorizontalSwipe = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
        
        // Check if starting from edge
        const { pageX } = evt.nativeEvent;
        const isNearEdge = isRTL 
          ? pageX >= screenWidth - edgeThreshold
          : pageX <= edgeThreshold;
        
        return isHorizontalSwipe && isNearEdge;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(lastDx.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { dx } = gestureState;
        
        // For RTL, allow negative dx (swipe left)
        // For LTR, allow positive dx (swipe right)
        const allowedDirection = isRTL ? dx <= 0 : dx >= 0;
        
        if (allowedDirection) {
          const clampedDx = isRTL 
            ? Math.min(0, dx) // Clamp to negative for RTL
            : Math.max(0, dx); // Clamp to positive for LTR
          
          translateX.setValue(clampedDx);
          lastDx.current = clampedDx;
        }
      },
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        translateX.flattenOffset();
        const { dx, vx } = gestureState;
        
        // Check if swipe is significant enough (distance or velocity)
        const isSignificantSwipe = Math.abs(dx) > swipeThreshold || Math.abs(vx) > 0.5;
        
        // For RTL, swipe left (negative dx) should go back
        // For LTR, swipe right (positive dx) should go back
        const shouldGoBack = isRTL 
          ? isSignificantSwipe && dx < 0  // Swipe left in RTL
          : isSignificantSwipe && dx > 0;  // Swipe right in LTR
        
        if (shouldGoBack) {
          animateBack();
        } else {
          resetPosition();
        }
        
        lastDx.current = 0;
      },
    })
  ).current;

  const animatedStyle = {
    transform: [{ translateX }],
  };

  return {
    panHandlers: panResponder.panHandlers,
    animatedStyle,
  };
};

