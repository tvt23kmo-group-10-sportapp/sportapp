import React, { useState } from 'react';
import { ImageBackground, View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function RegisterLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      const userRef = doc(FIRESTORE_DB, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
      });

      await AsyncStorage.setItem('isRegistered', 'true');
      setEmail('');
      setPassword('');
      navigation.navigate('UserSetup');
    } catch (error) {
      Alert.alert('Registration failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      setEmail('');
      setPassword('');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutLogin = async () => {
    await AsyncStorage.setItem('isRegistered', 'false');
    navigation.navigate('Home');
  };

  return (
    <ImageBackground
    source={require('../assets/background.jpg')} 
    style={styles.background}  
    >
    <View style={styles.container}>
      <Text style={styles.title}>Register / Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <Button title="Login" onPress={handleLogin} disabled={loading} />
        </View>
        <View style={styles.button}>
          <Button title="Register" onPress={handleRegister} disabled={loading} />
        </View>
      </View>
      <Pressable style={styles.continueButton} onPress={handleContinueWithoutLogin}>
        <Text style={styles.buttonText}>Continue Without Registering</Text>
      </Pressable>
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    marginHorizontal: 10,
  },
  loader: {
    marginTop: 20,
  },
  continueButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
  },
  background: {
    flex: 1,  
    resizeMode: 'cover',  
    justifyContent: 'center', 
  },
});
