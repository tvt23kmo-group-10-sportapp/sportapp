import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const resetRegistration = async () => {
    await AsyncStorage.removeItem('isRegistered');
    await AsyncStorage.removeItem('userName');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
      <Button title="Reset Registration" onPress={resetRegistration} />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: 18,
    },
});

export default SettingsScreen;