import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../database/databaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const SettingsPage = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState('low');
  const [sex, setSex] = useState('male');
  const [dailyCalories, setDailyCalories] = useState('');
  const [dailyWater, setDailyWater] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  const [userId, setUserId] = useState(null);
  
  // Fetch authenticated user's ID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch user data from Firestore
  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(FIRESTORE_DB, 'user_settings', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHeight(data.height || '');
          setWeight(data.weight || '');
          setAge(data.age || '');
          setActivity(data.activity || 'low');
          setSex(data.sex || 'male');
          setDailyCalories(data.dailyCalories || '');
          setDailyWater(data.dailyWater || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  // Calculate calorie and water goals
  const calculateCalorieGoal = () => {
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
    setDailyWater((weightNum * 35).toFixed(0)); // in ml
  };

  // Save or update user data in database
  const saveToFirebase = async () => {
    if (!userId) {
      alert('No user logged in!');
      return;
    }

    try {
      await setDoc(doc(FIRESTORE_DB, 'user_settings', userId), {
        height,
        weight,
        age,
        activity,
        sex,
        dailyCalories,
        dailyWater,
        timestamp: new Date(),
      });
      alert('Data saved successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data.');
    }
  };

  return (
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
        <Text style={styles.dropdownText}>{activity}</Text>
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

      <Button title="Calculate" onPress={calculateCalorieGoal} />
      <Button title="Save changes" onPress={saveToFirebase} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  dropdownButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
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
  modalItem: {
    paddingVertical: 10,
  },
  modalItemText: {
    fontSize: 18,
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  selected: {
    fontWeight: 'bold',
    color: 'blue',
  },
  unselected: {
    color: 'grey',
  },
});

export default SettingsPage;
