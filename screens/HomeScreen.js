import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View, Pressable, FlatList, ActivityIndicator, ImageBackground, TouchableOpacity } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { BarChart } from 'react-native-gifted-charts';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig';
import { setDoc, getDoc, doc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
  const [remainingCalories, setRemainingCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [water, setWater] = useState(0);
  const [calorieGoal, setDailyCalories] = useState(0); 
  const [waterGoal, setWaterGoal] = useState(2000);
  const [username, setUsername] = useState('User');
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [groupedMeals, setGroupedMeals] = useState({});
  const [series, setSeries] = useState([1, 1, 1]);
  const [isCaloriesUpdated, setIsCaloriesUpdated] = useState(false);
  const navigation = useNavigation();
  const widthAndHeight = 200;

  const sliceColor = ['#e31814', '#a0e39a', '#e6b412']; // PROTEIN, CARBS, FAT

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const userRef = doc(FIRESTORE_DB, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const dailyCalories = userData.dailyCalories || 2000;  
          const dailyWater = userData.dailyWater || 2000;
          setDailyCalories(dailyCalories);
          setWaterGoal(dailyWater);
          setUsername(userData.username || 'User');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); 

  useEffect(() => {
    const fetchMealsData = async () => {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) return;

      try {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const mealsRef = collection(FIRESTORE_DB, 'meals');
        const q = query(mealsRef, where('userId', '==', currentUser.uid), where('date', '==', formattedDate));
        const mealsSnap = await getDocs(q);
        let protein = 0, carbs = 0, fat = 0, totalCalories = 0;
        const mealsData = [];
        mealsSnap.forEach((doc) => {
          const meal = doc.data();
          const mealProtein = parseFloat(meal.protein) || 0;
          const mealCarbs = parseFloat(meal.carbohydrates) || 0;
          const mealFat = parseFloat(meal.fat) || 0;
          const mealCalories = parseFloat(meal.calories) || 0;

          mealsData.push({
            id: doc.id,
            ...meal,
            protein: mealProtein,
            carbohydrates: mealCarbs,
            fat: mealFat,
            calories: mealCalories,
          });

          protein += mealProtein;
          carbs += mealCarbs;
          fat += mealFat;
          totalCalories += mealCalories;
        });

        setMeals(mealsData); 
        setTotalProtein(protein); 
        setTotalCarbs(carbs); 
        setTotalFat(fat); 

        if (!isCaloriesUpdated) {
          setRemainingCalories(calorieGoal - totalCalories);
          setIsCaloriesUpdated(true);
        }

        const totalMacros = protein + carbs + fat;
        setSeries(
          totalMacros > 0
            ? [
                ((protein / totalMacros) * 100).toFixed(1),
                ((carbs / totalMacros) * 100).toFixed(1),
                ((fat / totalMacros) * 100).toFixed(1),
              ]
            : [1, 1, 1]
        );

        const grouped = mealsData.reduce((acc, meal) => {
          const type = meal.mealType || 'Other';
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(meal);
          return acc;
        }, {});
        setGroupedMeals(grouped);
        setRemainingCalories(calorieGoal - totalCalories);
      } catch (error) {
        console.error('Error fetching meals data:', error);
      }
    };

    const loadWater = async () => {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) return;
  
      try {
        const currentDate = new Date().toLocaleDateString();
        const waterRef = doc(FIRESTORE_DB, 'users', currentUser.uid);
        
        const userSnap = await getDoc(waterRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const lastUpdatedDate = userData.lastUpdatedDate;
          const savedWater = userData.waterProgress;

          if (lastUpdatedDate !== currentDate) {
            await setDoc(waterRef, {
              waterProgress: 0,
              lastUpdatedDate: currentDate,
            }, { merge: true });
            setWater(0); 
          } else {
            setWater(savedWater || 0);
          }
        }
      } catch (error) {
        console.error('Failed to load water data:', error);
      }
    };

    loadWater();
    fetchMealsData();
  }, [meals]); 

  const handleNavigateToSearch = () => navigation.navigate('Search');

  const handleWaterPress = async () => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) return;
  
    try {
      const currentDate = new Date().toLocaleDateString();
      const newWater = water + 250;
      const waterRef = doc(FIRESTORE_DB, 'users', currentUser.uid);
  
      await setDoc(waterRef, {
        waterProgress: newWater,
        lastUpdatedDate: currentDate,
      }, { merge: true });
  
      setWater(newWater);

    } catch (error) {
      console.error('Failed to save water data:', error);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    try {
      await deleteDoc(doc(FIRESTORE_DB, 'meals', mealId));
      setMeals((prevMeals) => prevMeals.filter(meal => meal.id !== mealId));
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Welcome, {username}!</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chart}>
            <PieChart
              widthAndHeight={widthAndHeight}
              series={series}
              sliceColor={sliceColor}
              doughnut={true}
              coverRadius={0.95}
              coverFill={'transparent'}
            />
            <View style={styles.chartText}>
              <Text style={styles.caloriesText}>
                Protein: {totalProtein.toFixed(1)} g (
                <Text style={{ color: sliceColor[0] }}>
                  {Math.round(series[0])}%
                </Text>
                )
              </Text>
              <Text style={styles.caloriesText}>
                Carbs: {totalCarbs.toFixed(1)} g (
                <Text style={{ color: sliceColor[1] }}>
                  {Math.round(series[1])}%
                </Text>
                )
              </Text>
              <Text style={styles.caloriesText}>
                Fat: {totalFat.toFixed(1)} g (
                <Text style={{ color: sliceColor[2] }}>
                  {Math.round(series[2])}%
                </Text>
                )
              </Text>
              <Text style={styles.caloriesText}>
                Remaining: {remainingCalories} cal
              </Text>
            </View>
          </View>
          <View style={styles.chart}>
          <Text style={styles.consumedWaterText}>Consumed water (ml)</Text>
            <BarChart
              data={[{ value: water, frontColor: '#0E87CC' }]}
              maxValue={waterGoal}
            />
            <Text style={styles.waterText}>{water} ml / {waterGoal} ml</Text>
          </View>
        </View>
        <View style={styles.buttonsContainer}>
          <Pressable style={styles.button} onPress={handleNavigateToSearch}>
            <Text style={styles.buttonText}>Add Meal</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={handleWaterPress}>
            <Text style={styles.buttonText}>Add Water</Text>
          </Pressable>
        </View>

        <View style={styles.meals}>
        <Text style={styles.mealsTitle}>Your Meals</Text>
          {Object.keys(groupedMeals).length === 0 ? (
            <Text style={styles.noLogsText}>No meals added today!</Text>
          ) : (
            Object.keys(groupedMeals).map((mealType) => (
              <View key={mealType}>
                <Text style={styles.mealType}>{mealType}</Text>
                <FlatList
                  data={groupedMeals[mealType]}
                  renderItem={({ item }) => (
                    <View style={styles.mealItem}>
                      <Text style={styles.mealText}>
                        {item.name} - {item.calories} cal / {item.amount} g
                      </Text>
                      <TouchableOpacity
                        style={[styles.trashButton, { backgroundColor: 'transparent' }]}
                        onPress={() => handleDeleteMeal(item.id)}
                        >
                        <Icon name="trash-can-outline" size={20}/> 
                       </TouchableOpacity>
                    </View>
                  )}
                  style={styles.mealList}
                />
              </View>
            ))
          )}
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 10,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
  },
  chart: {
    alignItems: 'center',
    position: 'relative',
  },
  chartText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '23%',
  },
  caloriesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
  },
  mealCategory: {
    marginBottom: 20,
  },
  mealCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  mealItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    position: 'relative',
  },
  trashButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#e31814',
    borderRadius: 15,
    padding: 5,
  },
  trashButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  mealText: {
    fontSize: 16,
  },
  noLogsText: {
    textAlign: 'center',
    fontSize: 16,
  },
  meals: {
    marginBottom: 60,
  },
  mealsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  waterText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  consumedWaterText: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: 'bold'
  },
});

export default HomeScreen;