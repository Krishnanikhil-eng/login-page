import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { CreateNewPasswordScreen } from './src/screens/CreateNewPasswordScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const RootNavigator: React.FC = () => {
  const { currentScreen, setCurrentScreen, isLoading } = useAuth();

  // Android hardware back button handler
  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === 'register' || currentScreen === 'forgot-password' || currentScreen === 'create-new-password') {
        setCurrentScreen('login');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [currentScreen, setCurrentScreen]);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'register' && <RegisterScreen />}
      {currentScreen === 'forgot-password' && <ForgotPasswordScreen />}
      {currentScreen === 'create-new-password' && <CreateNewPasswordScreen />}
      {currentScreen === 'profile' && <ProfileScreen />}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
