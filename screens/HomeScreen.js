import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View, Pressable, FlatList, ActivityIndicator, ImageBackground } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { BarChart } from 'react-native-gifted-charts';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';

const HomeScreen = () => {
  const [calories, setCalories] = useState(0);
  const [remainingCalories, setRemainingCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [water, setWater] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [username, setUsername] = useState('User');
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [series, setSeries] = useState([1, 1, 1]);
  const navigation = useNavigation();
  const widthAndHeight = 200;

  const sliceColor = ['#e31814', '#a0e39a', '#e6b412']; // PROTEIN, CARBS, FAT

  useEffect(() => {
    const fetchData = async () => {
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
          setCalories(userData.dailyCalories || 2000);
          setRemainingCalories(userData.dailyCalories || 2000);
          setWaterGoal(userData.dailyWater || 2000);
          setUsername(userData.username || 'User');
        }

        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const mealsRef = collection(FIRESTORE_DB, 'meals');
        const q = query(mealsRef, where('userId', '==', currentUser.uid), where('date', '==', formattedDate));
        const mealsSnap = await getDocs(q);

        let protein = 0, carbs = 0, fat = 0, totalCalories = 0;
        const mealsData = [];
        mealsSnap.forEach((doc) => {
          const meal = doc.data();
          mealsData.push(meal);
          protein += parseFloat(meal.protein) || 0;
          carbs += parseFloat(meal.carbohydrates) || 0;
          fat += parseFloat(meal.fat) || 0;
          totalCalories += parseFloat(meal.calories) || 0;
        });

        setMeals(mealsData);
        setRemainingCalories(prev => prev - totalCalories);
        setTotalProtein(protein);
        setTotalCarbs(carbs);
        setTotalFat(fat);

        const totalMacros = protein + carbs + fat;
        setSeries(totalMacros > 0 ? [
          ((protein / totalMacros) * 100).toFixed(1),
          ((carbs / totalMacros) * 100).toFixed(1),
          ((fat / totalMacros) * 100).toFixed(1),
        ] : [1, 1, 1]);

      } catch (error) {
        console.error('Error fetching user or meals data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigateToSearch = () => navigation.navigate('Search');

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
                Remaining: {remainingCalories.toFixed(1)} cal
              </Text>
            </View>
          </View>
          <View style={styles.chart}>
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
          <Pressable style={styles.button} onPress={() => setWater((prev) => prev + 250)}>
            <Text style={styles.buttonText}>Add Water</Text>
          </Pressable>
        </View>

        <View style={styles.meals}>
          <Text style={styles.mealsTitle}>Your Meals Today</Text>
          {meals.length === 0 ? (
            <Text style={styles.noLogsText}>No meals logged yet</Text>
          ) : (
            <FlatList
              data={meals}
              keyExtractor={(item) => item.id || item.name}
              renderItem={({ item }) => (
                <View style={styles.mealItem}>
                  <Text style={styles.mealText}>
                    {item.name} - {parseFloat(item.calories).toFixed(2)} cal - {parseFloat(item.amount).toFixed(2)} g
                  </Text>
                </View>
              )}
              style={styles.mealList}
            />
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
    marginHorizontal: 10,
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
  mealItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  waterText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
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
  meals: {
    marginTop: 20,
  },
  mealsTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  mealText: {
    fontSize: 16,
  },
  noLogsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
});

export default HomeScreen;
