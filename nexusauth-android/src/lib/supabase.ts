import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ohkdiqnxfqygbzvjjpve.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LLsonXrNUrAgnXCEu2C-uw_iVGe4kVO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Returns the deep link redirect URI for this application:
 * Native Android: 'nexusauth://auth/callback'
 */
export const getRedirectUrl = (path: string = 'auth/callback'): string => {
  return Linking.createURL(path, {
    scheme: 'nexusauth',
  });
};
