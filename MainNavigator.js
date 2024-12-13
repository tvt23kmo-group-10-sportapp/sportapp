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
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setShowFooter(true);
      } else {
        setIsAuthenticated(false);
        setShowFooter(false); 
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
          options={{ headerShown: false }}
        >
          {props => (
            <RegisterLoginScreen {...props}
              onShowFooter={() => setShowFooter(true)}/>
          )}
        </Stack.Screen>
        <Stack.Screen name="Profile" options={{ headerShown: false }}>
          {props => (
            isAuthenticated ? (
              <ProfileScreen {...props} />
            ) : (
              <RegisterLoginScreen {...props}
                onShowFooter={() => setShowFooter(false)}/>
            )
          )}
        </Stack.Screen>
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }}/>
      </Stack.Navigator>
      {showFooter && <Footer />}
    </>
  );
};

export default MainNavigator;
