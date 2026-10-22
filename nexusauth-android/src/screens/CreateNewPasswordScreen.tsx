import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { FormInput } from '../components/FormInput';

export const CreateNewPasswordScreen: React.FC = () => {
  const { updatePassword, setIsRecoveryMode, setCurrentScreen } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  const handleUpdatePassword = async () => {
    if (isSubmitting) return;
    setErrors({});

    const errs: Record<string, string> = {};

    if (!newPassword) {
      errs.newPassword = 'New password is required.';
    } else if (!hasMinLength) {
      errs.newPassword = 'Password must be at least 8 characters.';
    } else if (!hasLetter || !hasNumber) {
      errs.newPassword = 'Password must contain at least one letter and one number.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    const { error } = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (error) {
      setErrors({ general: error });
    } else {
      setIsRecoveryMode(false);
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={44} color="#10B981" />
              </View>
            </View>
            <Text style={styles.successTitle}>Password Updated!</Text>
            <Text style={styles.successSubtext}>
              Your password has been securely updated. You can now sign in with your new credentials.
            </Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                setIsRecoveryMode(false);
                setCurrentScreen('login');
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Return to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setIsRecoveryMode(false);
              setCurrentScreen('forgot-password');
            }}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
          </TouchableOpacity>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>Choose a strong password to secure your account</Text>
        </View>

        {/* General error banner */}
        {errors.general ? (
          <View style={styles.generalErrorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" style={styles.errorIcon} />
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        ) : null}

        {/* Form card */}
        <View style={styles.card}>
          <FormInput
            label="New Password"
            placeholder="At least 8 characters"
            isPassword
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              clearError('newPassword');
            }}
            error={errors.newPassword}
            editable={!isSubmitting}
          />

          {/* Strength hints */}
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <StrengthRow met={hasMinLength} label="At least 8 characters" />
              <StrengthRow met={hasLetter} label="Contains a letter" />
              <StrengthRow met={hasNumber} label="Contains a number" />
            </View>
          )}

          <FormInput
            label="Confirm New Password"
            placeholder="Re-enter your new password"
            isPassword
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearError('confirmPassword');
            }}
            error={errors.confirmPassword}
            editable={!isSubmitting}
          />

          {/* Match indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchRow}>
              <Ionicons
                name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                size={15}
                color={newPassword === confirmPassword ? '#10B981' : '#EF4444'}
              />
              <Text
                style={[
                  styles.matchText,
                  { color: newPassword === confirmPassword ? '#10B981' : '#EF4444' },
                ]}
              >
                {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              styles.submitButtonFull,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleUpdatePassword}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={17} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <TouchableOpacity
            onPress={() => {
              setIsRecoveryMode(false);
              setCurrentScreen('login');
            }}
            disabled={isSubmitting}
          >
            <Text style={styles.backToLoginText}>Cancel — Return to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const StrengthRow: React.FC<{ met: boolean; label: string }> = ({ met, label }) => (
  <View style={styles.strengthRow}>
    <Ionicons
      name={met ? 'checkmark-circle' : 'ellipse-outline'}
      size={14}
      color={met ? '#10B981' : '#475569'}
    />
    <Text style={[styles.strengthLabel, met && styles.strengthLabelMet]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: '#0B1120' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  headerContainer: { marginBottom: 24 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#94A3B8', lineHeight: 20 },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  errorIcon: { marginRight: 8 },
  generalErrorText: { flex: 1, color: '#EF4444', fontSize: 13 },
  card: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  strengthContainer: { marginTop: -8, marginBottom: 14, paddingHorizontal: 4, gap: 4 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strengthLabel: { fontSize: 12, color: '#475569' },
  strengthLabelMet: { color: '#10B981' },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  matchText: { fontSize: 12 },
  submitButton: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  submitButtonFull: { width: '100%', marginTop: 8 },
  submitButtonDisabled: { backgroundColor: '#1E3A8A', opacity: 0.7 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  footerContainer: { alignItems: 'center', marginTop: 24 },
  backToLoginText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  successCard: {
    backgroundColor: '#131D31',
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  successIconWrapper: { marginBottom: 20 },
  successIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginBottom: 10 },
  successSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
});
