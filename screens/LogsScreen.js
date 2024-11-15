import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LogsScreen = () => {
  const [meals, setMeals] = useState([]);

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

  return (
    <View style={styles.container}>
      {meals.length === 0 ? (
        <Text style={styles.noLogsText}>You have no logs yet</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  mealList: {
    marginTop: 10,
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
