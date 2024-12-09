import React from 'react';
import { ImageBackground, View, Text, StyleSheet, Button } from 'react-native';
import { FIREBASE_AUTH } from '../database/databaseConfig';
import { signOut } from 'firebase/auth'; 
import { useNavigation } from '@react-navigation/native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      await signOut(FIREBASE_AUTH); 
      navigation.reset({
        index: 0,
        routes: [{ name: 'RegisterLogin' }],
      });
    } catch (error) {
      console.error("Logout error: ", error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/background.jpg')} 
      style={styles.background}  
    >
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Profile Screen</Text>
      <Button title="Logout" onPress={handleLogout} color="#FF6347" />
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
  background: {
    flex: 1,  
    resizeMode: 'cover',  
    justifyContent: 'center', 
  },
});

export default ProfileScreen;
