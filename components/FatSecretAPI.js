import AsyncStorage from '@react-native-async-storage/async-storage';
import base64 from 'react-native-base64';
import { clientID, clientSecret} from '@env';

const encodeClientCredentials = (id, secret) => {
  return base64.encode(`${id}:${secret}`);
};

const storeToken = async (token, expiresIn) => {
  const expirationTimestamp = new Date().getTime() + expiresIn * 1000;
  await AsyncStorage.setItem('access_token', token);
  await AsyncStorage.setItem('expires_in', expirationTimestamp.toString());
};

const getStoredToken = async () => {
  const token = await AsyncStorage.getItem('access_token');
  const expirationTimestamp = await AsyncStorage.getItem('expires_in');
  
  if (token && expirationTimestamp) {
    const currentTime = new Date().getTime();
    if (currentTime < parseInt(expirationTimestamp, 10)) {
      return token;
    } else {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('expires_in');
    }
  }
  
  return null;
};

export const getAccessToken = async () => {
  let token = await getStoredToken();

  if (token) {
    return token; 
  }

  const url = 'https://oauth.fatsecret.com/connect/token';
  const credentials = encodeClientCredentials(clientID, clientSecret);
  const body = 'grant_type=client_credentials&scope=basic';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to retrieve access token:', data);
      throw new Error(data.error || 'Failed to retrieve access token');
    }

    if (!data.access_token) {
      throw new Error('Access token not found in the response');
    }

    await storeToken(data.access_token, data.expires_in);

    return data.access_token;

  } catch (error) {
    console.error('Error fetching token:', error);
    throw new Error(`Error fetching token: ${error.message}`);
  }
};