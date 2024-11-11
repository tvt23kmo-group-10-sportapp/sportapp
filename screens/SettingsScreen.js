import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, TouchableOpacity, StyleSheet } from 'react-native';

const SettingsPage = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState('low');
  const [gender, setGender] = useState('male');
  const [dailyCalories, setDailyCalories] = useState('');
  const [dailyWater, setDailyWater] = useState('');
  const [isModalVisible, setModalVisible] = useState(false); // for Modal visibility

  const calculateCalorieGoal = () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age);

    if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum)) {
      alert("Please enter valid numbers for height, weight, and age.");
      return;
    }

    // Calculate BMR based on gender
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
    } else {
      bmr = 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * ageNum);
    }

    // Adjust BMR based on activity level
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

    // Setting daily calorie goal
    setDailyCalories(calorieGoal.toFixed(0));

    // Setting daily water goal
    setDailyWater((weightNum * 35).toFixed(0)); // in ml
  };

  const activityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'High', value: 'high' }
  ];

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
        <Text style={styles.dropdownText}>{activityOptions.find(option => option.value === activity).label}</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalItem}
                onPress={() => {
                  setActivity(option.value);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <View style={styles.genderContainer}>
        <Text style={styles.label}>Gender:</Text>
        <View style={styles.radioContainer}>
          <Text onPress={() => setGender('male')} style={gender === 'male' ? styles.selected : styles.unselected}>Male</Text>
          <Text onPress={() => setGender('female')} style={gender === 'female' ? styles.selected : styles.unselected}>Female</Text>
        </View>
      </View>

      <Button title="Calculate" onPress={calculateCalorieGoal} />
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
  radioContainer: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  selected: {
    fontWeight: 'bold',
    marginRight: 10,
    color: 'blue',
  },
  unselected: {
    marginRight: 10,
    color: 'grey',
  },
});

export default SettingsPage;