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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { FormInput } from '../components/FormInput';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { RegisterFormData } from '../types';
import { formatDateToLocalDateString } from '../lib/dateUtils';

// Standard RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const RegisterScreen: React.FC = () => {
  const { signUp, signInWithGoogle, setCurrentScreen } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    countryCode: '+1',
    phoneNumber: '',
  });

  const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [hasPickedDob, setHasPickedDob] = useState<boolean>(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [emailSentNotice, setEmailSentNotice] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Location autofill states
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<{ message: string; isError: boolean } | null>(null);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDateOfBirth(selectedDate);
      setHasPickedDob(true);
      if (errors.dateOfBirth) {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.dateOfBirth;
          return copy;
        });
      }
    }
  };

  // Current location autofill handler
  const handleUseCurrentLocation = async () => {
    if (isLocating || isSubmitting) return;
    setLocationStatus(null);
    setIsLocating(true);

    try {
      // 1. Check if location services are enabled on device
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        setLocationStatus({
          message: 'Location services are disabled on your device. Please enable GPS in device settings.',
          isError: true,
        });
        setIsLocating(false);
        return;
      }

      // 2. Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus({
          message: 'Location permission was denied. You can continue by entering your address manually.',
          isError: true,
        });
        setIsLocating(false);
        return;
      }

      // 3. Retrieve current coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 4. Reverse geocode coordinates to structured address
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocoded && geocoded.length > 0) {
        const address = geocoded[0];
        
        // Assemble readable street address
        const streetParts = [
          address.streetNumber,
          address.street,
          address.name && address.name !== address.street ? address.name : null,
        ].filter(Boolean);
        const streetAddress = streetParts.join(' ') || address.formattedAddress || '';

        setFormData((prev) => ({
          ...prev,
          streetAddress: streetAddress || prev.streetAddress,
          city: address.city || address.subregion || prev.city,
          state: address.region || prev.state,
          postalCode: address.postalCode || prev.postalCode,
          country: address.country || prev.country,
        }));

        // Clear any previous validation errors for address fields
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.streetAddress;
          delete copy.city;
          delete copy.state;
          delete copy.postalCode;
          delete copy.country;
          return copy;
        });

        setLocationStatus({
          message: 'Address autofilled from your current location. You can edit any details below.',
          isError: false,
        });
      } else {
        setLocationStatus({
          message: 'No address found for your current coordinates. Please enter manually.',
          isError: true,
        });
      }
    } catch (err: any) {
      console.error('Location autofill error:', err);
      setLocationStatus({
        message: err?.message?.toLowerCase().includes('network')
          ? 'Network error resolving address. Please enter manually.'
          : 'Unable to retrieve location. Please enter manually.',
        isError: true,
      });
    } finally {
      setIsLocating(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Full name
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      errs.fullName = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errs.fullName = 'Full name must be at least 2 characters.';
    }

    // 2. Email normalization and format validation
    const trimmedEmail = formData.email.trim().toLowerCase();
    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address (e.g., user@example.com).';
    }

    // 3. Password policy
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errs.password = 'Password must contain at least one letter and one number.';
    }

    // 4. Confirm password match
    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    // 5. Date of birth calendar check
    if (!hasPickedDob) {
      errs.dateOfBirth = 'Date of birth is required.';
    } else {
      const today = new Date();
      if (dateOfBirth > today) {
        errs.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }

    // 6. Address fields
    if (!formData.streetAddress.trim()) {
      errs.streetAddress = 'Street address is required.';
    }
    if (!formData.city.trim()) {
      errs.city = 'City is required.';
    }
    if (!formData.state.trim()) {
      errs.state = 'State / Province is required.';
    }
    if (!formData.postalCode.trim()) {
      errs.postalCode = 'Postal / ZIP code is required.';
    }
    if (!formData.country.trim()) {
      errs.country = 'Country is required.';
    }

    // 7. Phone number validation
    if (!formData.phoneNumber.trim()) {
      errs.phoneNumber = 'Phone number is required.';
    } else {
      const digitsOnly = formData.phoneNumber.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        errs.phoneNumber = 'Enter a valid phone number (7-15 digits).';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (isSubmitting) return;
    setErrors({});

    if (!validate()) return;

    setIsSubmitting(true);
    const registerPayload: RegisterFormData = {
      ...formData,
      email: formData.email.trim().toLowerCase(),
      fullName: formData.fullName.trim(),
      dateOfBirth,
    };

    const { error, emailConfirmationRequired } = await signUp(registerPayload);
    setIsSubmitting(false);

    if (error) {
      setErrors({ general: error });
    } else if (emailConfirmationRequired) {
      setEmailSentNotice(true);
    }
  };

  if (emailSentNotice) {
    return (
      <View style={styles.confirmNoticeContainer}>
        <View style={styles.confirmNoticeCard}>
          <View style={styles.successIconCircle}>
            <Ionicons name="mail-unread-outline" size={48} color="#10B981" />
          </View>
          <Text style={styles.confirmNoticeTitle}>Confirm Your Email</Text>
          <Text style={styles.confirmNoticeText}>
            We have sent a verification email to:
          </Text>
          <Text style={styles.confirmNoticeEmail}>{formData.email.trim().toLowerCase()}</Text>
          <Text style={styles.confirmNoticeSubtext}>
            Please tap the link in the confirmation email to activate your account. Once verified,
            you can sign in to view your profile.
          </Text>

          <TouchableOpacity
            style={styles.returnLoginButton}
            onPress={() => setCurrentScreen('login')}
          >
            <Text style={styles.returnLoginButtonText}>Proceed to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formattedDobString = hasPickedDob ? formatDateToLocalDateString(dateOfBirth) : '';

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
            onPress={() => setCurrentScreen('login')}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Fill in your details to register for NexusAuth</Text>
        </View>

        {errors.general ? (
          <View style={styles.generalErrorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" style={styles.errorIcon} />
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Account Credentials</Text>

          <FormInput
            label="Full Name *"
            placeholder="John Doe"
            autoCapitalize="words"
            value={formData.fullName}
            onChangeText={(val) => updateField('fullName', val)}
            error={errors.fullName}
            editable={!isSubmitting}
          />

          <FormInput
            label="Email Address *"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(val) => updateField('email', val)}
            error={errors.email}
            editable={!isSubmitting}
          />

          <FormInput
            label="Password *"
            placeholder="At least 8 characters (letters & numbers)"
            isPassword
            value={formData.password}
            onChangeText={(val) => updateField('password', val)}
            error={errors.password}
            editable={!isSubmitting}
          />

          <FormInput
            label="Confirm Password *"
            placeholder="Re-enter password"
            isPassword
            value={formData.confirmPassword}
            onChangeText={(val) => updateField('confirmPassword', val)}
            error={errors.confirmPassword}
            editable={!isSubmitting}
          />

          <Text style={styles.sectionHeader}>Personal Details</Text>

          {/* Date of Birth Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date of Birth (YYYY-MM-DD) *</Text>
            <TouchableOpacity
              style={[styles.dateButton, !!errors.dateOfBirth && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color="#94A3B8" style={styles.dateIcon} />
              <Text style={[styles.dateText, !hasPickedDob && styles.datePlaceholder]}>
                {hasPickedDob ? formattedDobString : 'Select Date of Birth (YYYY-MM-DD)'}
              </Text>
            </TouchableOpacity>
            {errors.dateOfBirth ? (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            ) : null}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display={Platform.OS === 'android' ? 'default' : 'spinner'}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              onChange={handleDateChange}
            />
          )}

          {/* Address Section with Location Autofill */}
          <View style={styles.addressHeaderRow}>
            <Text style={styles.sectionHeader}>Address</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleUseCurrentLocation}
              disabled={isLocating || isSubmitting}
              activeOpacity={0.7}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#60A5FA" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="navigate-outline" size={16} color="#60A5FA" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.locationButtonText}>
                {isLocating ? 'Locating...' : 'Use my current location'}
              </Text>
            </TouchableOpacity>
          </View>

          {locationStatus ? (
            <View
              style={[
                styles.locationStatusBox,
                locationStatus.isError ? styles.locationStatusError : styles.locationStatusSuccess,
              ]}
            >
              <Ionicons
                name={locationStatus.isError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={16}
                color={locationStatus.isError ? '#EF4444' : '#10B981'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.locationStatusText,
                  locationStatus.isError ? styles.locationStatusTextError : styles.locationStatusTextSuccess,
                ]}
              >
                {locationStatus.message}
              </Text>
            </View>
          ) : null}

          <FormInput
            label="Street Address *"
            placeholder="123 Main St, Apt 4B"
            autoCapitalize="words"
            value={formData.streetAddress}
            onChangeText={(val) => updateField('streetAddress', val)}
            error={errors.streetAddress}
            editable={!isSubmitting}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormInput
                label="City *"
                placeholder="New York"
                autoCapitalize="words"
                value={formData.city}
                onChangeText={(val) => updateField('city', val)}
                error={errors.city}
                editable={!isSubmitting}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={styles.flex1}>
              <FormInput
                label="State / Province *"
                placeholder="NY"
                autoCapitalize="words"
                value={formData.state}
                onChangeText={(val) => updateField('state', val)}
                error={errors.state}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormInput
                label="Postal / ZIP Code *"
                placeholder="10001"
                autoCapitalize="characters"
                value={formData.postalCode}
                onChangeText={(val) => updateField('postalCode', val)}
                error={errors.postalCode}
                editable={!isSubmitting}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={styles.flex1}>
              <FormInput
                label="Country *"
                placeholder="United States"
                autoCapitalize="words"
                value={formData.country}
                onChangeText={(val) => updateField('country', val)}
                error={errors.country}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <Text style={styles.sectionHeader}>Contact Information</Text>

          <View style={styles.row}>
            <View style={{ width: 90 }}>
              <FormInput
                label="Code *"
                placeholder="+1"
                keyboardType="phone-pad"
                value={formData.countryCode}
                onChangeText={(val) => updateField('countryCode', val)}
                editable={!isSubmitting}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={styles.flex1}>
              <FormInput
                label="Phone Number *"
                placeholder="5551234567"
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(val) => updateField('phoneNumber', val)}
                error={errors.phoneNumber}
                editable={!isSubmitting}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting || isGoogleLoading}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Google sign-up */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <GoogleSignInButton
            label="Sign up with Google"
            onPress={async () => {
              if (isGoogleLoading || isSubmitting) return;
              setErrors({});
              setIsGoogleLoading(true);
              const { error } = await signInWithGoogle();
              setIsGoogleLoading(false);
              if (error) setErrors({ general: error });
            }}
            loading={isGoogleLoading}
            disabled={isSubmitting}
          />
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => setCurrentScreen('login')}
            disabled={isSubmitting}
          >
            <Text style={styles.loginLink}>Sign in</Text>
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
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#60A5FA',
    marginTop: 8,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationButtonText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  locationStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  locationStatusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  locationStatusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  locationStatusText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  locationStatusTextSuccess: {
    color: '#10B981',
  },
  locationStatusTextError: {
    color: '#EF4444',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 15,
    color: '#F8FAFC',
  },
  datePlaceholder: {
    color: '#64748B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
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
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  loginLink: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmNoticeContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
    justifyContent: 'center',
    padding: 24,
  },
  confirmNoticeCard: {
    backgroundColor: '#131D31',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmNoticeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 10,
  },
  confirmNoticeText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
  },
  confirmNoticeEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmNoticeSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  returnLoginButton: {
    backgroundColor: '#2563EB',
    width: '100%',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E293B' },
  dividerText: { color: '#475569', fontSize: 12 },
});

