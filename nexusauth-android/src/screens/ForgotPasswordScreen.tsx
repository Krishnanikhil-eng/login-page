import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { FormInput } from '../components/FormInput';

type ForgotPasswordStep = 'request_code' | 'enter_otp';

export const ForgotPasswordScreen: React.FC = () => {
  const {
    sendPasswordRecoveryOtp,
    verifyRecoveryOtp,
    setCurrentScreen,
    isRecoveryMode,
    setIsRecoveryMode,
  } = useAuth();

  const [step, setStep] = useState<ForgotPasswordStep>('request_code');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // If recovery mode is already active (deep-link), go directly to Create New Password
  useEffect(() => {
    if (isRecoveryMode) {
      setCurrentScreen('create-new-password');
    }
  }, [isRecoveryMode, setCurrentScreen]);

  // OTP input refs
  const inputRefs = useRef<Array<any>>([]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step A: Request OTP
  const handleRequestCode = async () => {
    if (isSubmitting) return;
    setErrors({});

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrors({ email: 'Email address is required.' });
      return;
    }
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(trimmedEmail)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await sendPasswordRecoveryOtp(trimmedEmail);
    setIsSubmitting(false);

    if (error) {
      setErrors({ general: error });
    } else {
      setCooldown(60);
      setStep('enter_otp');
    }
  };

  // Step B: Resend OTP
  const handleResendCode = async () => {
    if (cooldown > 0 || isSubmitting) return;
    setErrors({});
    setIsSubmitting(true);
    const { error } = await sendPasswordRecoveryOtp(email.trim().toLowerCase());
    setIsSubmitting(false);

    if (error) {
      setErrors({ general: error });
    } else {
      setCooldown(60);
    }
  };

  // Handle OTP box changes
  const handleOtpChange = (text: string, index: number) => {
    // Check if user pasted multi-digit OTP
    const cleanText = text.replace(/[^0-9]/g, '');
    if (cleanText.length > 1) {
      const chars = cleanText.slice(0, 6).split('');
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = chars[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(chars.length, 5);
      inputRefs.current[nextIndex]?.focus?.();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    if (cleanText && index < 5) {
      inputRefs.current[index + 1]?.focus?.();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus?.();
    }
  };

  // Step C: Verify OTP → navigate to dedicated Create New Password screen
  const handleVerifyOtp = async () => {
    if (isSubmitting) return;
    setErrors({});

    const token = otp.join('').trim();
    if (token.length !== 6) {
      setErrors({ otp: 'Please enter the complete 6-digit code.' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await verifyRecoveryOtp(email.trim().toLowerCase(), token);
    setIsSubmitting(false);

    if (error) {
      setErrors({ general: error });
    } else {
      // Verified — hand off to the dedicated Create New Password screen
      setIsRecoveryMode(true);
      setCurrentScreen('create-new-password');
    }
  };



  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === 'enter_otp') setStep('request_code');
              else {
                setIsRecoveryMode(false);
                setCurrentScreen('login');
              }
            }}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
          <Text style={styles.title}>Password Recovery</Text>
          <Text style={styles.subtitle}>
            {step === 'request_code' && 'Enter your email to receive a 6-digit recovery code'}
            {step === 'enter_otp' && `Enter the 6-digit code sent to ${email}`}
          </Text>
        </View>

        {errors.general ? (
          <View style={styles.generalErrorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" style={styles.errorIcon} />
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        ) : null}

        {/* STEP A: REQUEST CODE */}
        {step === 'request_code' && (
          <View style={styles.card}>
            <FormInput
              label="Registered Email Address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) clearError('email');
              }}
              error={errors.email}
              editable={!isSubmitting}
            />

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleRequestCode}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Send Recovery Code</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* STEP B: ENTER 6-DIGIT OTP */}
        {step === 'enter_otp' && (
          <View style={styles.card}>
            <Text style={styles.otpInstruction}>
              Please check your email and enter the six-digit verification code below:
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => {
                    inputRefs.current[idx] = ref;
                  }}
                  style={[styles.otpBox, !!digit && styles.otpBoxFilled]}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, idx)}
                  onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isSubmitting}
                />
              ))}
            </View>

            {errors.otp ? <Text style={styles.otpErrorText}>{errors.otp}</Text> : null}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <View style={styles.infoNoticeBox}>
              <Ionicons name="information-circle-outline" size={16} color="#60A5FA" style={{ marginRight: 6 }} />
              <Text style={styles.infoNoticeText}>
                Received a "Reset password" button in your email? Tap that link on this device to proceed immediately.
              </Text>
            </View>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={cooldown > 0 || isSubmitting}
              >
                <Text style={[styles.resendLink, cooldown > 0 && styles.resendLinkDisabled]}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.footerContainer}>
          <TouchableOpacity
            onPress={() => {
              setIsRecoveryMode(false);
              setCurrentScreen('login');
            }}
          >
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  headerContainer: {
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
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
  errorIcon: {
    marginRight: 8,
  },
  generalErrorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  otpInstruction: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 18,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  otpBox: {
    width: 46,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E3A8A22',
  },
  otpErrorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  submitButtonDisabled: {
    backgroundColor: '#1E3A8A',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  infoNoticeText: {
    flex: 1,
    color: '#93C5FD',
    fontSize: 12,
    lineHeight: 16,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  resendText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  resendLink: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#64748B',
  },
  successCard: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  successBadge: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  backToLoginText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});
