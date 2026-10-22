import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  label = 'Continue with Google',
}) => (
  <TouchableOpacity
    style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.82}
    accessibilityLabel={label}
  >
    {loading ? (
      <ActivityIndicator size="small" color="#4285F4" />
    ) : (
      <>
        {/* Google "G" logo built from pure React Native — no image asset needed */}
        <View style={styles.googleLogoWrapper}>
          <View style={styles.googleLogo}>
            <Text style={styles.googleLogoText}>G</Text>
          </View>
        </View>
        <Text style={styles.buttonText}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleLogoWrapper: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleLogoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  buttonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
  },
});
