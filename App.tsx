import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { hasCurrentUser } from './src/utils/users';

export default function App() {
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    hasCurrentUser().then(setHasUser);
  }, []);

  // Show nothing while checking for user
  if (hasUser === null) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator initialRouteName={hasUser ? 'Home' : 'Username'} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
