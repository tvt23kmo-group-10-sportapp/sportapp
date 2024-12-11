import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View, Pressable, SectionList, ActivityIndicator, ImageBackground, TouchableOpacity } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { BarChart } from 'react-native-gifted-charts';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig';
import { getDoc, doc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
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

  const sliceColor = ['#e31814', '#a0e39a', '#e6b412'];

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
          setUsername(userData.username);
          console.log(userData)
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
        const formattedDate = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;
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
        setRemainingCalories(calorieGoal - meals.reduce((sum, meal) => sum + meal.calories, 0));
      } catch (error) {
        console.error('Error fetching meals data:', error);
      }
    };
    const loadWater = async () => {
      try {
        const savedWater = await AsyncStorage.getItem('water');
        if (savedWater !== null) {
          setWater(Number(savedWater));
        }
      } catch (error) {
        console.error('Failed to load water data:', error);
      }
    };
    loadWater();
    fetchMealsData();
  }, [calorieGoal, meals]);

  const handleNavigateToSearch = () => navigation.navigate('Search');

  const handleWaterPress = async () => {
    try {
      const newWater = water + 250;
      setWater(newWater);
      await AsyncStorage.setItem('water', newWater.toString());
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                  Remaining: {remainingCalories} kcal
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
              <SectionList
                sections={groupedMeals
                  ? Object.keys(groupedMeals).map((mealType) => ({
                      title: mealType,
                      data: groupedMeals[mealType],
                    }))
                  : []}
                renderItem={({ item }) => (
                  <View style={styles.mealItem}>
                    <Text style={styles.mealText}>
                      {item.name} - {item.calories} kcal / {item.amount} g
                    </Text>
                    <TouchableOpacity
                      style={[styles.trashButton, { backgroundColor: 'transparent' }]}
                      onPress={() => handleDeleteMeal(item.id)}
                    >
                      <Icon name="trash-can-outline" size={20} />
                    </TouchableOpacity>
                  </View>
                )}
                renderSectionHeader={({ section: { title } }) => (
                  <Text style={styles.mealType}>{title}</Text>
                )}
                keyExtractor={(item) => item.id}
              />
            )}
          </View>
        </View>
      </ScrollView>
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
    marginTop: 30,
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
  }
});

export default HomeScreen;
