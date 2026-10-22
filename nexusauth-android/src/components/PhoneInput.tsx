import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CountryCode {
  name: string;
  code: string; // e.g. '+91'
  iso: string;  // e.g. 'IN'
}

// Focused list — expand as needed
export const COUNTRY_CODES: CountryCode[] = [
  { name: 'India', code: '+91', iso: 'IN' },
  { name: 'United States', code: '+1', iso: 'US' },
  { name: 'United Kingdom', code: '+44', iso: 'GB' },
  { name: 'Canada', code: '+1', iso: 'CA' },
  { name: 'Australia', code: '+61', iso: 'AU' },
  { name: 'Germany', code: '+49', iso: 'DE' },
  { name: 'France', code: '+33', iso: 'FR' },
  { name: 'Singapore', code: '+65', iso: 'SG' },
  { name: 'United Arab Emirates', code: '+971', iso: 'AE' },
  { name: 'Saudi Arabia', code: '+966', iso: 'SA' },
  { name: 'Bangladesh', code: '+880', iso: 'BD' },
  { name: 'Pakistan', code: '+92', iso: 'PK' },
  { name: 'Sri Lanka', code: '+94', iso: 'LK' },
  { name: 'Nepal', code: '+977', iso: 'NP' },
  { name: 'Japan', code: '+81', iso: 'JP' },
  { name: 'China', code: '+86', iso: 'CN' },
  { name: 'Brazil', code: '+55', iso: 'BR' },
  { name: 'Mexico', code: '+52', iso: 'MX' },
];

interface PhoneInputProps {
  selectedCountry: CountryCode;
  phoneNumber: string;
  onChangeCountry: (country: CountryCode) => void;
  onChangePhone: (phone: string) => void;
  error?: string | null;
  editable?: boolean;
  label?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  selectedCountry,
  phoneNumber,
  onChangeCountry,
  onChangePhone,
  error,
  editable = true,
  label = 'Phone Number',
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputRow, !!error && styles.inputRowError]}>
        {/* Country code picker trigger */}
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => editable && setPickerVisible(true)}
          disabled={!editable}
          activeOpacity={0.7}
        >
          <Text style={styles.countryCode}>{selectedCountry.code}</Text>
          <Ionicons name="chevron-down" size={14} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={(t) => onChangePhone(t.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor="#64748B"
          editable={editable}
          maxLength={15}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Country picker modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.iso + item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.countryItem,
                    item.iso === selectedCountry.iso && styles.countryItemSelected,
                    pressed && styles.countryItemPressed,
                  ]}
                  onPress={() => {
                    onChangeCountry(item);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemCode}>{item.code}</Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

/**
 * Compose an E.164 phone number string from country code + local digits.
 * Strips leading zero from local number if present (common in India: 09xx → +919xx).
 */
export function composeE164(countryCode: string, localNumber: string): string {
  const digits = localNumber.replace(/[^0-9]/g, '');
  // Strip leading 0 for countries that use trunk prefixes
  const stripped = digits.startsWith('0') ? digits.slice(1) : digits;
  return `${countryCode}${stripped}`;
}

/**
 * Validate a composed phone string — must be E.164: +[1-15 digits].
 */
export function validatePhone(e164: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(e164);
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputRowError: { borderColor: '#EF4444' },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
  },
  countryCode: { color: '#F8FAFC', fontSize: 15, fontWeight: '500' },
  divider: { width: 1, height: 24, backgroundColor: '#334155', marginRight: 10 },
  input: { flex: 1, color: '#F8FAFC', fontSize: 15 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContainer: {
    flex: 1,
    marginTop: 80,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#F8FAFC' },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  countryItemSelected: { backgroundColor: 'rgba(59,130,246,0.1)' },
  countryItemPressed: { backgroundColor: '#1E293B' },
  countryItemName: { fontSize: 15, color: '#F8FAFC' },
  countryItemCode: { fontSize: 14, color: '#60A5FA', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#1E293B', marginHorizontal: 16 },
});
