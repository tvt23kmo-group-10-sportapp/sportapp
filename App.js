import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import RegisterLoginScreen from './screens/RegisterLoginScreen';
import SettingsScreen from './screens/SettingsScreen';
import Header from './components/Header'; 

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" component={HomeScreen} options={({ navigation }) => ({headerRight: () => <Header navigation={navigation} />, })}
        />
        <Stack.Screen 
          name="RegisterLogin" 
          component={RegisterLoginScreen} 
        />
        <Stack.Screen 
          name="Settings" component={SettingsScreen} options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
