import React, { useState, useEffect } from 'react';
import { ImageBackground, View, Text, TextInput, Button, Modal, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const SettingsPage = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState('low');
  const [sex, setSex] = useState('male');
  const [dailyCalories, setDailyCalories] = useState('');
  const [dailyWater, setDailyWater] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = FIREBASE_AUTH.currentUser;
      if (user) {
        const userRef = doc(FIRESTORE_DB, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setHeight(userData.height || '');
          setWeight(userData.weight || '');
          setAge(userData.age || '');
          setActivity(userData.activityLevel || 'low');
          setSex(userData.sex || 'male');
          setDailyCalories(userData.dailyCalories || '404');
          setDailyWater(userData.dailyWater || '');
        } else {
          Alert.alert('Error', 'No user data found!');
        }
      }
    };

    fetchUserData();
  }, []);

  const calculateCalorieGoal = async () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age);

    if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum)) {
      alert('Please enter valid numbers for height, weight, and age.');
      return;
    }

    let bmr;
    if (sex === 'male') {
      bmr = 88.362 + 13.397 * weightNum + 4.799 * heightNum - 5.677 * ageNum;
    } else {
      bmr = 447.593 + 9.247 * weightNum + 3.098 * heightNum - 4.33 * ageNum;
    }

    let calorieGoal;
    switch (activity) {
      case 'low':
        calorieGoal = bmr * 1.2;
        break;
      case 'moderate':
        calorieGoal = bmr * 1.55;
        break;
      case 'high':
        calorieGoal = bmr * 1.725;
        break;
      default:
        calorieGoal = bmr;
    }

    setDailyCalories(calorieGoal.toFixed(0));
    const waterGoal = (weightNum * 35).toFixed(0);
    setDailyWater(waterGoal);  

    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      const userRef = doc(FIRESTORE_DB, "users", user.uid);
      await updateDoc(userRef, { dailyCalories: calorieGoal.toFixed(0), dailyWater: waterGoal });
    }
  };

  const saveChanges = async () => {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      const userRef = doc(FIRESTORE_DB, "users", user.uid);
      await updateDoc(userRef, { height, weight, age, activityLevel: activity, sex });
    } else {
      Alert.alert('Error', 'User not found.');
    }
  };

  const activityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'High', value: 'high' },
  ];

  return (
    <ImageBackground
    source={require('../assets/background.jpg')} 
    style={styles.background}
  >
    <View style={styles.container}>
      <Text style={styles.label}>Daily calorie goal: {dailyCalories}</Text>
      <Text style={styles.label}>Daily water goal: {dailyWater} ml</Text>

      <Text style={styles.label}>Height (cm):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
        placeholder="Enter height"
      />

      <Text style={styles.label}>Weight (kg):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
        placeholder="Enter weight"
      />

      <Text style={styles.label}>Age:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
        placeholder="Enter age"
      />

      <Text style={styles.label}>Activity Level:</Text>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.dropdownButton}>
        <Text style={styles.dropdownText}>
          {activityOptions.find(option => option.value === activity)?.label || 'Select Activity Level'}
        </Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {['low', 'moderate', 'high'].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => {
                  setActivity(level);
                  setModalVisible(false);
                }}
              >
                <Text>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Text style={styles.label}>Sex:</Text>
      <View style={styles.genderContainer}>
        <Text
          onPress={() => setSex('male')}
          style={sex === 'male' ? styles.selected : styles.unselected}
        >
          Male
        </Text>
        <Text
          onPress={() => setSex('female')}
          style={sex === 'female' ? styles.selected : styles.unselected}
        >
          Female
        </Text>
      </View>

      <Button title="Save Changes" onPress={saveChanges} />
      <Button title="Calculate" onPress={calculateCalorieGoal} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    padding: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: '#black'
  },
  input: {
    height: 40,
    borderColor: '#fff',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  dropdownButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 5,
    marginBottom: 15,
  },
  dropdownText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 250,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  
  selected: {
    fontWeight: 'bold',
    color: 'blue',
  },
  
  unselected: {
    color: 'grey',
  },
  background: {
    flex: 1,  
    resizeMode: 'cover',  
    justifyContent: 'center', 
  },
});

export default SettingsPage;
