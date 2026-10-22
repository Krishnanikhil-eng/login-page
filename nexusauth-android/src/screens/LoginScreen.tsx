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
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { PhoneInput, COUNTRY_CODES, CountryCode, composeE164, validatePhone } from '../components/PhoneInput';

type LoginMethod = 'email' | 'phone';

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// India (+91) is the default country
const DEFAULT_COUNTRY: CountryCode = COUNTRY_CODES[0];

export const LoginScreen: React.FC = () => {
  const { signIn, signInWithGoogle, signInWithPhone, setCurrentScreen } = useAuth();

  const [method, setMethod] = useState<LoginMethod>('email');

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone login state
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phonePassword, setPhonePassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const clearError = (field: string) =>
    setErrors((prev) => { const c = { ...prev }; delete c[field]; return c; });

  // ── Email sign-in ──────────────────────────────────────────────────────────
  const handleEmailLogin = async () => {
    if (isSubmitting) return;
    setErrors({});

    const normalizedEmail = email.trim().toLowerCase();
    const errs: Record<string, string> = {};

    if (!normalizedEmail) errs.email = 'Email address is required.';
    else if (!EMAIL_REGEX.test(normalizedEmail)) errs.email = 'Please enter a valid email address.';
    if (!password) errs.password = 'Password is required.';

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    const { error } = await signIn(normalizedEmail, password);
    setIsSubmitting(false);

    if (error) {
      if (error.toLowerCase().includes('invalid login credentials')) {
        setErrors({ general: 'Invalid email or password. Please try again.' });
      } else if (error.toLowerCase().includes('email not confirmed')) {
        setErrors({ general: 'Your email has not been verified. Please check your inbox.' });
      } else {
        setErrors({ general: error });
      }
    }
  };

  // ── Phone sign-in ──────────────────────────────────────────────────────────
  const handlePhoneLogin = async () => {
    if (isSubmitting) return;
    setErrors({});

    const e164 = composeE164(selectedCountry.code, phoneNumber);
    const errs: Record<string, string> = {};

    if (!phoneNumber) errs.phone = 'Phone number is required.';
    else if (!validatePhone(e164)) errs.phone = 'Enter a valid phone number.';
    if (!phonePassword) errs.phonePassword = 'Password is required.';

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    const { error } = await signInWithPhone(e164, phonePassword);
    setIsSubmitting(false);

    if (error) {
      if (error.toLowerCase().includes('invalid login credentials')) {
        setErrors({ general: 'Invalid phone number or password. Please try again.' });
      } else if (error.toLowerCase().includes('phone not confirmed') || error.toLowerCase().includes('not found')) {
        setErrors({ general: 'No account found with this phone number.' });
      } else {
        setErrors({ general: error });
      }
    }
  };

  // ── Google sign-in ─────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    if (isGoogleLoading || isSubmitting) return;
    setErrors({});
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);

    if (error) setErrors({ general: error });
  };

  const handleSubmit = method === 'email' ? handleEmailLogin : handlePhoneLogin;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="shield-checkmark" size={36} color="#3B82F6" />
          </View>
          <Text style={styles.title}>Welcome to NexusAuth</Text>
          <Text style={styles.subtitle}>Sign in to access your secure profile</Text>
        </View>

        {/* General error banner */}
        {errors.general ? (
          <View style={styles.generalErrorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" style={styles.errorIcon} />
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        ) : null}

        {/* Login method tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, method === 'email' && styles.tabActive]}
            onPress={() => { setMethod('email'); setErrors({}); }}
            disabled={isSubmitting || isGoogleLoading}
          >
            <Ionicons
              name="mail-outline"
              size={15}
              color={method === 'email' ? '#3B82F6' : '#94A3B8'}
            />
            <Text style={[styles.tabText, method === 'email' && styles.tabTextActive]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, method === 'phone' && styles.tabActive]}
            onPress={() => { setMethod('phone'); setErrors({}); }}
            disabled={isSubmitting || isGoogleLoading}
          >
            <Ionicons
              name="call-outline"
              size={15}
              color={method === 'phone' ? '#3B82F6' : '#94A3B8'}
            />
            <Text style={[styles.tabText, method === 'phone' && styles.tabTextActive]}>Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          {method === 'email' ? (
            <>
              <FormInput
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => { setEmail(t); clearError('email'); }}
                error={errors.email}
                editable={!isSubmitting}
              />
              <FormInput
                label="Password"
                placeholder="••••••••"
                isPassword
                value={password}
                onChangeText={(t) => { setPassword(t); clearError('password'); }}
                error={errors.password}
                editable={!isSubmitting}
              />
            </>
          ) : (
            <>
              <PhoneInput
                label="Phone Number"
                selectedCountry={selectedCountry}
                phoneNumber={phoneNumber}
                onChangeCountry={(c) => { setSelectedCountry(c); clearError('phone'); }}
                onChangePhone={(p) => { setPhoneNumber(p); clearError('phone'); }}
                error={errors.phone}
                editable={!isSubmitting}
              />
              <FormInput
                label="Password"
                placeholder="••••••••"
                isPassword
                value={phonePassword}
                onChangeText={(t) => { setPhonePassword(t); clearError('phonePassword'); }}
                error={errors.phonePassword}
                editable={!isSubmitting}
              />
            </>
          )}

          {/* Forgot password — email mode only */}
          {method === 'email' && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => setCurrentScreen('forgot-password')}
              disabled={isSubmitting}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google sign-in */}
          <GoogleSignInButton
            onPress={handleGoogleLogin}
            loading={isGoogleLoading}
            disabled={isSubmitting}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => setCurrentScreen('register')}
            disabled={isSubmitting || isGoogleLoading}
          >
            <Text style={styles.signupLink}>Create an account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: '#0B1120' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  headerContainer: { alignItems: 'center', marginBottom: 24 },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },

  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: { marginRight: 8 },
  generalErrorText: { flex: 1, color: '#EF4444', fontSize: 13, lineHeight: 18 },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#131D31',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },

  // Card
  card: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: '#60A5FA', fontSize: 13, fontWeight: '500' },

  submitButton: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  submitButtonDisabled: { backgroundColor: '#1E3A8A', opacity: 0.7 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E293B' },
  dividerText: { color: '#475569', fontSize: 12 },

  // Footer
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: { color: '#94A3B8', fontSize: 14 },
  signupLink: { color: '#60A5FA', fontSize: 14, fontWeight: '600' },
});


