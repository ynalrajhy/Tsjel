import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, cardShadow } from '../theme/styles';

interface PointButtonProps {
  points: number;
  selected: boolean;
  onPress: () => void;
}

export const PointButton: React.FC<PointButtonProps> = ({
  points,
  selected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, selected && styles.buttonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, selected && styles.buttonTextSelected]}>
        {points}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.background.card,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 4,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.default,
    ...cardShadow,
  },
  buttonSelected: {
    backgroundColor: colors.accent.blue,
    borderColor: colors.border.accent,
    borderWidth: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  buttonTextSelected: {
    color: '#fff',
  },
});

