import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, cardShadow } from '../theme/styles';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  const getButtonStyle = () => {
    if (disabled) {
      return [styles.button, styles.buttonDisabled];
    }
    switch (variant) {
      case 'secondary':
        return [styles.button, styles.buttonSecondary];
      case 'danger':
        return [styles.button, styles.buttonDanger];
      default:
        return [styles.button, styles.buttonPrimary];
    }
  };

  const getTextStyle = () => {
    if (disabled) {
      return [styles.buttonText, styles.buttonTextDisabled];
    }
    return [styles.buttonText, styles.buttonTextPrimary];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={getTextStyle()}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginHorizontal: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...cardShadow,
  },
  buttonPrimary: {
    backgroundColor: colors.button.primary,
    borderColor: colors.border.accent,
  },
  buttonSecondary: {
    backgroundColor: colors.button.secondary,
    borderColor: colors.border.accent,
  },
  buttonDanger: {
    backgroundColor: colors.button.danger,
    borderColor: colors.border.selected,
  },
  buttonDisabled: {
    backgroundColor: colors.button.disabled,
    borderColor: colors.border.light,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonTextDisabled: {
    color: colors.text.muted,
  },
});

