import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_USER_KEY = '@wordle/currentUser';

/**
 * Get the current username from storage
 * Returns null if no user is set
 */
export async function getCurrentUser(): Promise<string | null> {
  return await AsyncStorage.getItem(CURRENT_USER_KEY);
}

/**
 * Set the current username
 */
export async function setCurrentUser(username: string): Promise<void> {
  const trimmed = username.trim();
  if (!trimmed) {
    throw new Error('Username cannot be empty');
  }
  await AsyncStorage.setItem(CURRENT_USER_KEY, trimmed);
}

/**
 * Clear the current user (for switching users)
 */
export async function clearCurrentUser(): Promise<void> {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * Check if a user is currently set
 */
export async function hasCurrentUser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null && user.trim().length > 0;
}
