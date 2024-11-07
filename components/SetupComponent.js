import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserSetupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [sex, setSex] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !sex || !height || !weight || !activityLevel) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isNaN(height) || isNaN(weight)) {
      Alert.alert('Error', 'Height and Weight must be numeric');
      return;
    }

    setLoading(true);

    try {
      const user = FIREBASE_AUTH.currentUser;
      if (user) {
        const userRef = doc(FIRESTORE_DB, "users", user.uid); 
        await setDoc(userRef, {username,sex,height,weight,activityLevel},{ merge: true });
        await AsyncStorage.setItem('userName', username);
        Alert.alert('Profile Setup', 'Your profile has been successfully updated!');
        setLoading(false);
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', 'User not found.');
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'There was an issue saving your data: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Height (in cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Weight (in kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
      />

      <View style={styles.pickerContainer}>
        <Text>Sex</Text>
        <Picker
          selectedValue={sex}
          style={styles.picker}
          onValueChange={itemValue => setSex(itemValue)}
        >
          <Picker.Item label="Select Sex" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Text>Activity Level</Text>
        <Picker
          selectedValue={activityLevel}
          style={styles.picker}
          onValueChange={itemValue => setActivityLevel(itemValue)}
        >
          <Picker.Item label="Select Activity Level" value="" />
          <Picker.Item label="Sedentary" value="sedentary" />
          <Picker.Item label="Lightly Active" value="lightly_active" />
          <Picker.Item label="Moderately Active" value="moderately_active" />
          <Picker.Item label="Very Active" value="very_active" />
        </Picker>
      </View>

      <Button title="Save Profile" onPress={handleSubmit} />

      {loading && <ActivityIndicator size="large" color="#0000ff" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  pickerContainer: {
    width: '100%',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 50,
  },
});
