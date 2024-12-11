import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ImageBackground } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { FIRESTORE_DB } from '../database/databaseConfig';
import { FIREBASE_AUTH } from '../database/databaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const LogsScreen = () => {
  const [meals, setMeals] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        setIsAuthenticated(true); 
      } else {
        setIsAuthenticated(false); 
      }
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const loadMeals = async () => {
      try {
        const mealsRef = collection(FIRESTORE_DB, 'meals');
        const querySnapshot = await getDocs(mealsRef);
        const fetchedMeals = [];
        querySnapshot.forEach((doc) => {
          fetchedMeals.push(doc.data());
        });

        const groupedMeals = groupMealsByDay(fetchedMeals);
        setMeals(groupedMeals);
      } catch (error) {
        console.error('Error loading meals from Firestore', error);
      }
    };

    loadMeals();
  }, [isAuthenticated]);

  const groupMealsByDay = (meals) => {
    const mealsByDay = {};

    meals.forEach((meal) => {
      const date = meal.date;
      if (!mealsByDay[date]) {
        mealsByDay[date] = [];
      }
      mealsByDay[date].push(meal);
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

  return (
    <ImageBackground
      source={require('../assets/background.jpg')} 
      style={styles.background}  
    >
      <View style={styles.container}>
        {isAuthenticated && meals.length === 0 ? (
          <Text style={styles.noLogsText}>You have no logs yet</Text>
        ) : !isAuthenticated ? (
          <Text style={styles.noLogsText}>Please log in to view your meals</Text>
        ) : (
          <FlatList
            data={meals}
            keyExtractor={(item) => item.date}
            renderItem={({ item }) => (
              <View style={styles.dayContainer}>
                <Text style={styles.dateText}>{item.date}</Text>
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  background: {
    flex: 1,  
    resizeMode: 'cover',  
    justifyContent: 'center', 
  },
  mealList: {
    marginTop: 30,
    marginBottom: 40
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
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  mealItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mealText: {
    fontSize: 16,
    color: '#555',
  },
  boldText: {
    fontWeight: 'bold',
  },
  noLogsText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default LogsScreen;
