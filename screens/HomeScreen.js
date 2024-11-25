import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, TextInput, View, Pressable, Modal, ActivityIndicator, FlatList } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { BarChart } from 'react-native-gifted-charts';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig'; 
import { getDoc, doc, updateDoc } from 'firebase/firestore'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth'; 

const HomeScreen = () => {
  const [calories, setCalories] = useState('');
  const [totalCalories, setTotalCalories] = useState('');
  const [water, setWater] = useState('');
  const [totalWater, setTotalWater] = useState(0);
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState('User');
  const [user, setUser] = useState(null);  
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]); 

  const widthAndHeight = 200;
  const series = [123, 321, 123, 789, 537];
  const sliceColor = ['#fbd203', '#ffb300', '#ff9100', '#ff6c00', '#ff3c00'];
  const barData = [
    {
      value: totalWater,
      frontColor: '#0E87CC'
    }
  ];



  useEffect(() => {
    const loadMeals = async () => {
      try {
        const storedMeals = await AsyncStorage.getItem('meals');
        if (storedMeals) {
          const parsedMeals = JSON.parse(storedMeals);
          const groupedMeals = groupMealsByDay(parsedMeals);
          parsedMeals.forEach((meal) => {
            console.log("Meal for date:", meal.date);
            meal.meals.forEach((mealItem) => {
              console.log("Meal item details:", mealItem);
            });
          });
          setMeals(groupedMeals);
          calculateRemainingCalories(groupedMeals)
        }
      } catch (error) {
        console.error("Error loading meals from storage", error);
      }
    };
  
    loadMeals();
  }, []);

  const groupMealsByDay = (meals) => {
    const mealsByDay = {};

    meals.forEach((meal) => {
      const date = meal.date;
      if (!mealsByDay[date]) {
        mealsByDay[date] = [];
      }
      mealsByDay[date].push(...meal.meals);
    });

    return Object.keys(mealsByDay).map((date) => ({
      date,
      meals: mealsByDay[date],
    }));
  };

  const renderMealItem = ({ item }) => (
    <View style={styles.mealItem}>
      <Text style={styles.mealText}>
        <Text style={styles.boldText}>{item.mealType}</Text> | {item.name}
        <Text style={styles.boldText}> Calories: {item.calories} kcal</Text> | 
        Protein: {item.protein} g | 
        Carbs: {item.carbohydrates} g | 
        Fat: {item.fat} g
      </Text>
    </View>
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      if (currentUser) {
        console.log('User logged in:', currentUser.uid);
        setUser(currentUser);
      } else {
        console.log('No user logged in');
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const clickWaterButton = () => {
    setShow(true);
  }

  const saveWater = async  () => {
    const waterIntake = parseInt(water, 10);
    if(!isNaN(waterIntake)) {
      const newTotalWater = totalWater + waterIntake;
      setTotalWater(newTotalWater);
      await AsyncStorage.setItem('totalWater', newTotalWater.toString());
    }
    setShow(false);
    setWater('');
  }

  const calculateRemainingCalories = (loadedMeals) => {
    const totalMealCalories = loadedMeals.reduce((total, meal) => {
      return total + meal.meals.reduce((mealTotal, item) => {
        const itemCalories = parseFloat(item.calories) || 0;
        return mealTotal + itemCalories;
      }, 0);
    }, 0);
    
    const remainingCalories = parseFloat(calories) - totalMealCalories

    setTotalCalories(remainingCalories);
    updateCaloriesInFirebase(remainingCalories);
  };

  useEffect(() => {
    calculateRemainingCalories(meals);
  }, [meals, calories]);

  const updateCaloriesInFirebase = async (remainingCalories) => {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      try {
        const userRef = doc(FIRESTORE_DB, 'user_settings', user.uid);
        await updateDoc(userRef, { remainingCalories });
        console.log('Calorie information updated in Firebase successfully!');
      } catch (error) {
        console.error('Error updating calorie information in Firebase:', error);
      }
    } else {
      console.warn('No user is logged in. Cannot update calorie information.');
    }
  };

  const fetchUsername = async () => {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      try {
        const userRef = doc(FIRESTORE_DB, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUsername(userData.username);
          await AsyncStorage.setItem('userName', userData.username);
        } else {
          setUsername('User');
        }
      } catch (error) {
        console.error("Error getting user data: ", error);
        setUsername('User');
      } finally {
        setLoading(false);
      }
    } else {
      const storedUsername = await AsyncStorage.getItem('userName');
      if (storedUsername) {
        setUsername(storedUsername);
      }
      setLoading(false);
    }
  };

  const fetchCalories = async () => {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      try {
        const userRef = doc(FIRESTORE_DB, 'user_settings', user.uid);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const dailyCalories = parseInt(userData.remainingCalories, 10) || 0;
          setCalories(dailyCalories);
          calculateRemainingCalories(meals)
  
          setTotalCalories(dailyCalories);
          await AsyncStorage.setItem('dailyCalories', remainingCalories.toString());
        } else {
          setCalories(0);
        }
      } catch (error) {
        console.error('Error fetching calories:', error);
        setCalories(0);
      }
    } else {
      const storedCalories = parseInt(await AsyncStorage.getItem('dailyCalories'), 10);
      if (!isNaN(storedCalories)) {
        setCalories(storedCalories);
      } else {
        setCalories(0);
      }
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        await fetchUsername();
        await fetchCalories();
        setLoading(false);
      };

      fetchData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {username}!</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          <PieChart
            widthAndHeight={widthAndHeight}
            series={series}
            sliceColor={sliceColor}
            coverFill={'#FFF'}
          />
          <Text style={styles.caloriesText}>
            {totalCalories} calories {'\n'} remaining
          </Text>
        </View>
        <View style={styles.chart}>
          <BarChart data={barData} style={styles.water} />
          <Pressable style={styles.waterButton} onPress={clickWaterButton}>
            <Text style={styles.buttonText}>Add water</Text>
          </Pressable>
          <Modal
            transparent={false}
            visible={show}
            onRequestClose={() => {
              setShow(!show);
            }}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Enter amount</Text>
                <TextInput
                  placeholder='ml'
                  value={water}
                  onChangeText={setWater}
                />
                <Pressable onPress={saveWater}>
                  <Text>Save</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => {
                    setShow(!show);
                  }}>
                  <Text></Text>
                  <Text style={styles.textStyle}>Close</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>
      </View>
      <View style={styles.meals}>
        <Text style={styles.mealsTitle}>Your meals</Text>
        <View>
        {meals.length === 0 ? (
          <Text style={styles.noLogsText}>You have no saved meals yet</Text>
        ) : (
          <FlatList
            data={meals}
            keyExtractor={(item) => item.date}
            renderItem={({ item }) => (
              <View style={styles.dayContainer}>
                <FlatList
                  data={item.meals}
                  keyExtractor={(meal, index) => index.toString()}
                  renderItem={renderMealItem}
                />
              </View>
            )}
            style={styles.mealList}
          />
        )}
        </View>
        <Pressable style={styles.mealButton} onPress={() => props.navigation.navigate('Add Meal')}>
          <Text style={styles.buttonText}>Add meal</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 30,
    textAlign: 'center',
    marginVertical: 10,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  chart: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  caloriesText: {
    position: 'absolute',
    textAlign: 'center',
    fontSize: 18,
    color: '#000',
    top: '40%',
  },
  meals: {
    flexDirection: 'column',
    marginTop: 20,
    padding: 10,
    justifyContent:'space-between',
  },
  mealsTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  mealButton: {
    backgroundColor: 'grey',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', 
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: 100,    
  },
  waterButton: {
    backgroundColor: 'grey',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', 
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  water: {
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent:'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    width: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default HomeScreen;
