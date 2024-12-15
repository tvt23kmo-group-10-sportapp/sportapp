import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH } from '../database/databaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const Footer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setIsLoggedIn(!!user);  
    });

    return () => unsubscribe(); 
  }, []);

  return (
    <View style={styles.footer}>
      <Pressable style={styles.button} onPress={() => navigation.navigate('Home')}>
        <Icon name="home" size={24} color="#fff" />
        <Text style={styles.buttonText}>Home</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate('Search')}>
        <Icon name="magnify" size={24} color="#fff" />
        <Text style={styles.buttonText}>Search</Text>
      </Pressable>
      <Pressable 
        style={styles.button} 
        onPress={() => navigation.navigate(isLoggedIn ? 'Profile' : 'RegisterLogin')}
      >
        <Icon name="account" size={24} color="#fff" />
        <Text style={styles.buttonText}>{isLoggedIn ? 'Profile' : 'Login'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'black',
    paddingVertical: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
});

export default Footer;
