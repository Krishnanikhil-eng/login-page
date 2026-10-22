import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase, getRedirectUrl } from '../lib/supabase';
import { Profile, RegisterFormData, AuthScreen } from '../types';
import { formatDateToLocalDateString } from '../lib/dateUtils';

// Ensure the browser session is warmed up and redirects work on Android
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  currentScreen: AuthScreen;
  setCurrentScreen: (screen: AuthScreen) => void;
  isLoading: boolean;
  profileLoading: boolean;
  isRecoveryMode: boolean;
  setIsRecoveryMode: (mode: boolean) => void;
  refreshProfile: () => Promise<Profile | null>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: RegisterFormData) => Promise<{ error: string | null; emailConfirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordRecoveryOtp: (email: string) => Promise<{ error: string | null }>;
  verifyRecoveryOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Robust URL parameter parser supporting both query string (?key=val)
 * and hash fragment (#key=val) from Supabase callback redirects.
 */
const parseAuthParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  try {
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const hashIndex = url.indexOf('#');
      const queryString =
        hashIndex > queryIndex
          ? url.substring(queryIndex + 1, hashIndex)
          : url.substring(queryIndex + 1);
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const fragmentString = url.substring(hashIndex + 1);
      const fragmentParams = new URLSearchParams(fragmentString);
      fragmentParams.forEach((val, key) => {
        params[key] = val;
      });
    }
  } catch (e) {
    console.error('Error parsing auth parameters from URL:', e);
  }
  return params;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);
  const lastHandledUrlRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }

      setProfile(data as Profile);
      return data as Profile;
    } catch (err: any) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null;
    return fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const handleAuthUrl = useCallback(
    async (url: string | null): Promise<{ error: string | null }> => {
      if (!url) return { error: null };
      if (lastHandledUrlRef.current === url) {
        return { error: null };
      }

      try {
        const params = parseAuthParams(url);

        // Check for deep link / OAuth errors
        if (params.error || params.error_description) {
          const errDesc = decodeURIComponent(
            params.error_description || params.error || 'Authentication error.'
          ).replace(/\+/g, ' ');
          console.warn('Deep link authentication error:', errDesc);
          return { error: errDesc };
        }

        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;
        const code = params.code;
        const type = params.type;

        // 1. PKCE Authorization Code flow
        if (code) {
          lastHandledUrlRef.current = url;
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error.message);
            return { error: error.message };
          }

          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            await fetchProfile(data.session.user.id);
            setCurrentScreen('profile');
            return { error: null };
          }
        }

        // 2. Implicit Grant Token flow (hash fragment)
        if (accessToken && refreshToken) {
          lastHandledUrlRef.current = url;
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session from URL tokens:', error.message);
            return { error: error.message };
          }

          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);

            // Recovery callback opens the new-password screen immediately
            if (type === 'recovery') {
              setIsRecoveryMode(true);
              setCurrentScreen('create-new-password');
            } else {
              await fetchProfile(data.session.user.id);
              setCurrentScreen('profile');
            }
            return { error: null };
          }
        }

        // 3. Fallback: verify if session is already active
        const { data: currentSessionData } = await supabase.auth.getSession();
        if (currentSessionData?.session?.user) {
          setSession(currentSessionData.session);
          setUser(currentSessionData.session.user);
          await fetchProfile(currentSessionData.session.user.id);
          setCurrentScreen('profile');
          return { error: null };
        }

        return { error: null };
      } catch (err: any) {
        console.error('Error handling auth URL:', err);
        return { error: err.message || 'Failed to process authentication redirect.' };
      }
    },
    [fetchProfile]
  );

  // Handle deep linking for email confirmation and password reset callbacks
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthUrl(url);
    });
    const subscription = Linking.addEventListener('url', (event) => {
      handleAuthUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleAuthUrl]);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setCurrentScreen('profile');
      } else {
        setCurrentScreen('login');
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        if (!isRecoveryMode) {
          await fetchProfile(newSession.user.id);
          setCurrentScreen('profile');
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsRecoveryMode(false);
        setCurrentScreen('login');
      } else if (event === 'USER_UPDATED' && newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else if (event === 'PASSWORD_RECOVERY') {
        // Recovery session established via magic-link
        setIsRecoveryMode(true);
        setCurrentScreen('create-new-password');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, isRecoveryMode]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      setIsRecoveryMode(false);
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
        setCurrentScreen('profile');
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign in.' };
    }
  };

  /**
   * Google OAuth via Supabase + expo-web-browser.
   * Opens a browser tab for the Google consent screen; the Supabase deep-link
   * callback lands on nexusauth://auth/callback and is processed either
   * directly from openAuthSessionAsync result or via the deep-link listener.
   */
  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
      setIsRecoveryMode(false);
      const redirectUrl = getRedirectUrl('auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // we open the browser manually below
        },
      });

      if (error || !data?.url) {
        return { error: error?.message ?? 'Failed to initiate Google sign-in.' };
      }

      // Open the Google OAuth URL in an in-app browser tab
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { error: null }; // user cancelled / closed browser tab — clean exit
      }

      if (result.type === 'locked') {
        return { error: 'An authentication browser session is already in progress.' };
      }

      if (result.type === 'success' && result.url) {
        return await handleAuthUrl(result.url);
      }

      // Fallback check if session was established concurrently
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        setSession(sessionData.session);
        setUser(sessionData.session.user);
        await fetchProfile(sessionData.session.user.id);
        setCurrentScreen('profile');
        return { error: null };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Google sign-in failed.' };
    }
  };

  /**
   * Phone + password sign-in.
   * Expects phone in E.164 format (e.g. +919876543210).
   * Uses signInWithPassword with `phone` identifier — no SMS OTP required.
   */
  const signInWithPhone = async (
    phone: string,
    password: string
  ): Promise<{ error: string | null }> => {
    try {
      setIsRecoveryMode(false);
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: phone.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
        setCurrentScreen('profile');
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during phone sign-in.' };
    }
  };

  const signUp = async (
    data: RegisterFormData
  ): Promise<{ error: string | null; emailConfirmationRequired?: boolean }> => {
    try {
      setIsRecoveryMode(false);
      // Pure calendar date format (YYYY-MM-DD) avoiding timezone shifts
      const dobFormatted = formatDateToLocalDateString(data.dateOfBirth);
      const redirectUrl = getRedirectUrl();
      const normalizedEmail = data.email.trim().toLowerCase();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            date_of_birth: dobFormatted,
            country_code: data.countryCode.trim(),
            phone_number: data.phoneNumber.trim(),
            street_address: data.streetAddress.trim(),
            city: data.city.trim(),
            state: data.state.trim(),
            postal_code: data.postalCode.trim(),
            country: data.country.trim(),
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        return { error: authError.message };
      }

      if (authData.session) {
        setSession(authData.session);
        setUser(authData.session.user);
        await fetchProfile(authData.session.user.id);
        setCurrentScreen('profile');
        return { error: null, emailConfirmationRequired: false };
      } else {
        return { error: null, emailConfirmationRequired: true };
      }
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during registration.' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsRecoveryMode(false);
      setCurrentScreen('login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const sendPasswordRecoveryOtp = async (email: string): Promise<{ error: string | null }> => {
    try {
      const redirectUrl = getRedirectUrl();
      const normalizedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to request password recovery.' };
    }
  };

  const verifyRecoveryOtp = async (
    email: string,
    token: string
  ): Promise<{ error: string | null }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: token.trim(),
        type: 'recovery',
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsRecoveryMode(true);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to verify recovery OTP.' };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      setIsRecoveryMode(false);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update password.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        currentScreen,
        setCurrentScreen,
        isLoading,
        profileLoading,
        isRecoveryMode,
        setIsRecoveryMode,
        refreshProfile,
        signIn,
        signInWithGoogle,
        signInWithPhone,
        signUp,
        signOut,
        sendPasswordRecoveryOtp,
        verifyRecoveryOtp,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
