import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './screens/HomeScreen';
import RegisterLoginScreen from './screens/RegisterLoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen'; 
import Footer from './components/Footer';
import SearchScreen from './screens/SearchScreen';
import LogsScreen from './screens/LogsScreen';
import SetupComponent from './components/SetupComponent';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const [isRegistered, setIsRegistered] = useState(null);
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const registered = await AsyncStorage.getItem('isRegistered');
        setIsRegistered(registered === 'true');
      } catch (e) {
        console.error('Failed to load registration status', e);
      }
    };
    checkRegistrationStatus();
  }, []);
  if (isRegistered === null) return null;
  return (
    <>
      <Stack.Navigator initialRouteName={isRegistered ? 'Home' : 'RegisterLogin'}>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="UserSetup" 
          component={SetupComponent} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Log" 
          component={LogsScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="RegisterLogin" 
          component={RegisterLoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ headerShown: false }}
        />
       <Stack.Screen 
         name="Settings" 
         component={SettingsScreen} 
         options={{ headerShown: false }}
        />
      </Stack.Navigator>
      <Footer />
    </>
  );
};

export default MainNavigator;
