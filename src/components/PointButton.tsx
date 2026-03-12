import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

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
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  buttonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  buttonTextSelected: {
    color: '#fff',
  },
});

