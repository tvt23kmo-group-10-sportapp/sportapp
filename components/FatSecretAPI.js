import AsyncStorage from '@react-native-async-storage/async-storage';
import base64 from 'react-native-base64';
import { clientID, clientSecret } from '@env';

const encodeClientCredentials = () => {
  return base64.encode(`${clientID}:${clientSecret}`);
};

const storeToken = async (token, expiresIn) => {
  const expirationTimestamp = Date.now() + expiresIn * 1000;
  await AsyncStorage.multiSet([
    ['access_token', token],
    ['expires_in', expirationTimestamp.toString()],
  ]);
};

const getStoredToken = async () => {
  const [token, expiration] = await AsyncStorage.multiGet(['access_token', 'expires_in']);

  if (token[1] && expiration[1] && Date.now() < parseInt(expiration[1], 10)) {
    return token[1];
  }

  await AsyncStorage.multiRemove(['access_token', 'expires_in']);
  return null;
};

export const getAccessToken = async () => {
  const storedToken = await getStoredToken();
  if (storedToken) return storedToken;

  const url = 'https://oauth.fatsecret.com/connect/token';
  const credentials = encodeClientCredentials();
  const body = 'grant_type=client_credentials&scope=basic';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to retrieve access token');
    }

    const { access_token, expires_in } = await response.json();
    if (!access_token) throw new Error('Access token not found in response');

    await storeToken(access_token, expires_in);
    return access_token;
  } catch (error) {
    console.error('Error fetching token:', error.message);
    throw error;
  }
};