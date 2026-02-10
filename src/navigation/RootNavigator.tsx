import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { SafeAreaHeader } from '../components/SafeAreaHeader';
import { FinishedPuzzleScreen } from '../screens/FinishedPuzzleScreen';
import { GameScreen } from '../screens/GameScreen';
import { GamesScreen } from '../screens/GamesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { UsernameScreen } from '../screens/UsernameScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Username: undefined;
  Home: undefined;
  Game: { dateToPlay?: string } | undefined;
  Result: {
    outcome: 'win' | 'lose';
    guessesUsed: number;
    guesses?: string[];
    solution?: string;
    fromFinishedPuzzle?: boolean;
    gameDate?: string;
  };
  FinishedPuzzle: {
    outcome: 'win' | 'lose';
    guessesUsed: number;
    guesses?: string[];
    solution?: string;
  };
  Games: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNavigatorProps = {
  initialRouteName?: 'Home' | 'Username';
};

export function RootNavigator({ initialRouteName = 'Home' }: RootNavigatorProps = {}) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text
      }}
    >
      <Stack.Screen
        name="Username"
        component={UsernameScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="FinishedPuzzle"
        component={FinishedPuzzleScreen}
        options={{
          headerShown: true,
          header: () => <SafeAreaHeader title="" showBack />
        }}
      />
      <Stack.Screen
        name="Games"
        component={GamesScreen}
        options={{
          headerShown: true,
          header: () => <SafeAreaHeader title="Games" showBack />
        }}
      />
    </Stack.Navigator>
  );
}
