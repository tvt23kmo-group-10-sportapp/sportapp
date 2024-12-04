import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, TextInput, View, Pressable, Modal, ActivityIndicator, FlatList } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { BarChart } from 'react-native-gifted-charts';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig'; 
import { getDoc, doc, updateDoc } from 'firebase/firestore'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native'; // navigointi 

const HomeScreen = () => {
  const [totalCalories, setTotalCalories] = useState({});
  const [totalProtein, setTotalProtein] = useState(0)
  const [totalFat, setTotalFat] = useState(0)
  const [totalCarbs, setTotalCarbs] = useState(0)
  const [water, setWater] = useState('');
  const [totalWater, setTotalWater] = useState(0);
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState('User');
  const [user, setUser] = useState(null);  
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]); 
  const [series, setSeries] = useState([])
  const [sliceColor, setSliceColor] = useState(['#FF6384', '#36A2EB', '#FFCE56'])
  const today = new Date().toISOString().split('T')[0];

  const standardizeDate = (dateString) => {
    const [day, month, year] = dateString.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };
  
  const widthAndHeight = 200;
  const barData = [
    {
      value: totalWater,
      frontColor: '#0E87CC'
    }
  ];

  const navigation = useNavigation(); // navigointikontrolli

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
          await calculateRemainingCalories(groupedMeals)
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
      const standardizedDate = standardizeDate(meal.date);
      if (!mealsByDay[standardizedDate]) {
        mealsByDay[standardizedDate] = [];
      }
      mealsByDay[standardizedDate].push(...meal.meals);
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
        fetchUsername(currentUser)
      } else {
        console.log('No user logged in');
        setUser(null);
        setUsername('User')
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
   
  const calculateRemainingCalories = async (loadedMeals) => {
    console.log("Loaded Meals: ", loadedMeals);
  
    const user = FIREBASE_AUTH.currentUser;
    if (!user) {
      console.error('No authenticated user found.');
      return;
    }
  
    const userRef = doc(FIRESTORE_DB, 'user_settings', user.uid);
    const userSnap = await getDoc(userRef);
  
    if (!userSnap.exists()) {
      console.error('User settings not found in Firebase.');
      return;
    }
  
    const userSettings = userSnap.data();
    const dailyCalories = parseFloat(userSettings.dailyCalories) || 0;
    const todayMeals = loadedMeals.filter(meal => meal.date === today);
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
  
    todayMeals.forEach((meal) => {
      meal.meals.forEach((item) => {
        totalProtein += parseFloat(item.protein) || 0;
        totalCarbs += parseFloat(item.carbohydrates) || 0;
        totalFat += parseFloat(item.fat) || 0;
      });
    });

    const totalMealCalories = todayMeals.reduce((total, meal) => {
      return (
        total +
        meal.meals.reduce((mealTotal, item) => {
          const itemCalories = parseFloat(item.calories) || 0;
          return mealTotal + itemCalories;
        }, 0)
      );
    }, 0);

    const totalMacros = totalProtein + totalCarbs + totalFat;

    if (totalMacros > 0) {
    const proteinPercentage = totalMacros > 0 ? ((totalProtein / totalMacros) * 100).toFixed(1) : 0;
    const carbsPercentage = totalMacros > 0 ? ((totalCarbs / totalMacros) * 100).toFixed(1) : 0;
    const fatPercentage = totalMacros > 0 ? ((totalFat / totalMacros) * 100).toFixed(1) : 0;
    setSeries([parseFloat(proteinPercentage), parseFloat(carbsPercentage), parseFloat(fatPercentage)]);
    } else {
      setSeries([1, 1, 1]);
    }
  
    const remainingCalories = Math.max(dailyCalories - totalMealCalories, 0);
    console.log('Remaining Calories by Date:', remainingCalories);
    setTotalCalories({[today]: remainingCalories});
    setTotalProtein(totalProtein);
    setTotalCarbs(totalCarbs);
    setTotalFat(totalFat);
    await updateCaloriesInFirebase(remainingCalories);
  };
    calculateRemainingCalories(meals);

  

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
        const userRef = doc(FIRESTORE_DB, 'user_settings', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const usernameToStore = userData.username || 'User';
          setUsername(usernameToStore);
          await AsyncStorage.setItem('username', usernameToStore);
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
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
      setUsername('User');
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        await fetchUsername();
        await calculateRemainingCalories();
        setLoading(false);
      };

      fetchData();
    }, [])
  );
  
  useEffect(() => {
    calculateRemainingCalories(meals);
  }, [meals]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Funktio navigointiin Search-näyttöön
  const handleNavigateToSearch = () => {
    navigation.navigate('Search'); // Navigoi Search-näyttöön
  };

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
          Protein: {totalProtein ? parseFloat(totalProtein).toFixed(2) : '0.00'} g 
          ({series[0] ? Math.round(series[0]) : 0}%) {'\n'}
          Carbs: {totalCarbs ? parseFloat(totalCarbs).toFixed(2) : '0.00'} g 
          ({series[1] ? Math.round(series[1]) : 0}%) {'\n'}
          Fat: {totalFat ? parseFloat(totalFat).toFixed(2) : '0.00'} g 
          ({series[2] ? Math.round(series[2]) : 0}%) {'\n'}
          {totalCalories[today]} calories {'\n'} remaining
          </Text>
        </View>
        <View style={styles.chart}>
          <BarChart data={barData} style={styles.water} />
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
                <Pressable onPress={saveWater} style={styles.button}>
                  <Text style={styles.buttonText}>Save</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => {
                    setShow(!show);
                  }}>
                  <Text style={styles.buttonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>
      </View>
  
      <View style={styles.buttonsContainer}>
        <Pressable style={styles.button} onPress={handleNavigateToSearch}>
          <Text style={styles.buttonText}>Add meal</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={clickWaterButton}>
          <Text style={styles.buttonText}>Add water</Text>
        </Pressable>
      </View>
  
      <View style={styles.meals}>
        <Text style={styles.mealsTitle}>Your meals</Text>
        <View>
          {meals.length === 0 ? (
            <Text style={styles.noLogsText}>You have no saved meals yet</Text>
          ) : (
            <FlatList
              data={meals.filter((meal) => meal.date === today)}
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
    top: '25%',
  },
  meals: {
    flexDirection: 'column',
    marginTop: 20,
    padding: 10,
    justifyContent: 'space-between',
  },
  mealsTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    width: '45%',
    backgroundColor: '#0E87CC',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  water: {
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  dayContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
});

export default HomeScreen;