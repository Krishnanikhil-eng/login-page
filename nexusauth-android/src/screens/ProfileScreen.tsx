import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { formatDisplayDate } from '../lib/dateUtils';

export const ProfileScreen: React.FC = () => {
  const { user, profile, profileLoading, refreshProfile, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of NexusAuth?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await signOut();
            setSigningOut(false);
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (profileLoading && !refreshing && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  // Format full address cleanly
  const formattedAddress = [
    profile?.street_address,
    [profile?.city, profile?.state].filter(Boolean).join(', '),
    profile?.postal_code,
    profile?.country,
  ]
    .filter(Boolean)
    .join('\n');

  // Format phone number cleanly
  const formattedPhone = profile?.phone_number
    ? `${profile.country_code ? profile.country_code + ' ' : ''}${profile.phone_number}`
    : 'Not provided';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#3B82F6"
          colors={['#3B82F6']}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{profile?.full_name || 'NexusAuth User'}</Text>
        <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Verified Account</Text>
        </View>
      </View>

      {!profile && !profileLoading && (
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
          <Text style={styles.warningText}>
            Profile details are currently being synchronized. Pull down to refresh.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Saved Registration Details</Text>

        {/* Full Name */}
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="person-outline" size={18} color="#60A5FA" />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>{profile?.full_name || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Email Address */}
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="mail-outline" size={18} color="#60A5FA" />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{profile?.email || user?.email || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Date of Birth */}
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="calendar-outline" size={18} color="#60A5FA" />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Date of Birth</Text>
            <Text style={styles.detailValue}>
              {formatDisplayDate(profile?.date_of_birth)}
            </Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Phone Number */}
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="call-outline" size={18} color="#60A5FA" />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            <Text style={styles.detailValue}>{formattedPhone}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Full Address */}
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="location-outline" size={18} color="#60A5FA" />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Full Address</Text>
            <Text style={styles.detailValue}>
              {formattedAddress || 'Not provided'}
            </Text>
          </View>
        </View>
      </View>

      {/* Account Security Information */}
      <View style={styles.securityCard}>
        <View style={styles.detailItem}>
          <View style={styles.detailIconContainer}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
          </View>
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Account Security</Text>
            <Text style={styles.securityMetaText}>
              Supabase Auth Session Active{'\n'}
              UID: {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-6)}` : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[styles.signOutButton, signingOut && styles.signOutButtonDisabled]}
        onPress={handleSignOut}
        disabled={signingOut}
        activeOpacity={0.8}
      >
        {signingOut ? (
          <ActivityIndicator color="#EF4444" size="small" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#94A3B8',
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 18,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#60A5FA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '500',
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 12,
  },
  securityCard: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 24,
  },
  securityMetaText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
