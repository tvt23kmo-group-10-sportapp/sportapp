import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from './database/databaseConfig'; 
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
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) return null;

  return (
    <>
      <Stack.Navigator initialRouteName={isAuthenticated ? 'Home' : 'RegisterLogin'}>
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
