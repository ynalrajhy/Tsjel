// App/components/AuthScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFirebase } from "../context/FirebaseContext";
import { colors, typography } from "../theme/styles";
import { useLanguage } from "../context/LanguageContext";

interface AuthScreenProps {
  onAuthSuccess: () => void;
  onSkip: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  onSkip,
}) => {
  const { signUpWithEmail, signInWithEmail } = useFirebase();
  const { t, isRTL } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      onAuthSuccess();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tsjel</Text>
      <Text style={styles.subtitle}>
        {isLogin ? "Welcome back!" : "Create your account"}
      </Text>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          placeholder="Email"
          placeholderTextColor={colors.text.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          placeholder="Password"
          placeholderTextColor={colors.text.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isLogin ? "Sign In" : "Sign Up"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.secondaryButtonText}>
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>
            Skip for now (play without account)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    ...typography.heading,
    fontSize: 36,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputRTL: {
    textAlign: "right",
  },
  primaryButton: {
    backgroundColor: colors.button.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    padding: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.accent.red,
    fontSize: 14,
  },
  skipButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  skipButtonText: {
    color: colors.text.muted,
    fontSize: 14,
  },
});
