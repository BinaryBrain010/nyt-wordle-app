import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { FinishedPuzzleScreen } from '../screens/FinishedPuzzleScreen';
import { GameScreen } from '../screens/GameScreen';
import { GamesScreen } from '../screens/GamesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  Result: { outcome: 'win' | 'lose'; guessesUsed: number };
  FinishedPuzzle: { outcome: 'win' | 'lose'; guessesUsed: number };
  Games: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: '', headerBackTitleVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="FinishedPuzzle"
        component={FinishedPuzzleScreen}
        options={{ title: '', headerBackTitleVisible: false }}
      />
      <Stack.Screen name="Games" component={GamesScreen} options={{ title: 'Games' }} />
    </Stack.Navigator>
  );
}
