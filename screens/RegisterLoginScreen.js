import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

export default function RegisterLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;
      
      await addDoc(collection(FIRESTORE_DB, "users"), {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
      });

      alert('User registered successfully!');
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      alert('User logged in successfully!');
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Register / Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
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
          <Button title="Login" onPress={handleLogin} />
        </View>
        <View style={styles.button}>
          <Button title="Register" onPress={handleRegister} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
});
