import React, { useState } from 'react';
import { ImageBackground, View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ToastAndroid, ActivityIndicator, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { getAccessToken } from '../components/FatSecretAPI';
import { collection, addDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../database/databaseConfig';
import { getAuth } from "firebase/auth";

const SearchScreen = () => {
  const [selectedMeal, setSelectedMeal] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [calculatedMacros, setCalculatedMacros] = useState(null);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const searchFood = async (text) => {
    console.log('Search query:', text);
    setQuery(text);

    if (!text) {
      setResults([]);
      console.log('Search query is empty.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await delay(2000);
      let token = accessToken;

      if (!token) {
        console.log('Fetching access token...');
        token = await getAccessToken();
        setAccessToken(token);
      }

      console.log('Access token retrieved:', token);

      const response = await fetch(
        `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(
          text
        )}&format=json`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search API response:', data);

      if (data && data.foods && data.foods.food) {
        const foodItems = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];
        const detailedDataPromises = foodItems.map(async (food) => {
          const detailsResponse = await fetch(
            `https://platform.fatsecret.com/rest/server.api?method=food.get&food_id=${food.food_id}&format=json`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!detailsResponse.ok) {
            throw new Error(`Details API error: ${detailsResponse.status}`);
          }

          const detailsData = await detailsResponse.json();
          console.log(`Details for food_id ${food.food_id}:`, detailsData);

          const serving = Array.isArray(detailsData?.food?.servings?.serving)
            ? detailsData.food.servings.serving[0]
            : detailsData?.food?.servings?.serving || {};

          return {
            id: food.food_id,
            name: food.food_name,
            food_brand: detailsData?.food?.brand_name || 'Generic',
            calories: serving.calories || 0,
            protein: serving.protein || 0,
            carbohydrate: serving.carbohydrate || 0,
            fat: serving.fat || 0,
            serving_size: serving.serving_size || 100,
            serving_description: serving.serving_description || 'N/A',
          };
        });

        const detailedData = await Promise.all(detailedDataPromises);
        setResults(detailedData);
      } else {
        setResults([]);
        console.log('No results found for the query.');
      }
    } catch (error) {
      console.error('Error during food search:', error);
      setError('Failed to fetch food data. Please try again.');
      ToastAndroid.show('Failed to fetch data', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  const selectItem = (item) => {
    console.log('Selected item:', item);
    setSelectedItem(item);
    setQuery(item.name);
    setResults([]);
    setCalculatedMacros(null);
    Keyboard.dismiss();
  };

  const calculateMacros = (amount) => {
    if (!selectedItem || !amount) {
      console.log('Invalid input for macro calculation.');
      return;
    }

    const servingSize = selectedItem.serving_size || 100;
    const multiplier = amount / servingSize;

    const totalCalories = (selectedItem.calories * multiplier).toFixed(2);
    const totalProtein = (selectedItem.protein * multiplier).toFixed(2);
    const totalCarbs = (selectedItem.carbohydrate * multiplier).toFixed(2);
    const totalFat = (selectedItem.fat * multiplier).toFixed(2);

    const macros = {
      calories: totalCalories,
      protein: totalProtein,
      carbohydrates: totalCarbs,
      fat: totalFat,
    };

    console.log('Calculated macros:', macros);
    setCalculatedMacros(macros);
  };

  const addMeal = async () => {
    if (!selectedMeal) {
      ToastAndroid.show('Please select a meal type!', ToastAndroid.SHORT);
      console.log('Meal type not selected.');
      return;
    }
  
    if (selectedItem && calculatedMacros) {
      const mealDate = new Date().toLocaleDateString();
      const newMeal = {
        name: selectedItem.name,
        calories: calculatedMacros.calories,
        protein: calculatedMacros.protein,
        carbohydrates: calculatedMacros.carbohydrates,
        fat: calculatedMacros.fat,
        mealType: selectedMeal,
        date: mealDate,
        amount: amount,
        userId: getAuth().currentUser.uid,
      };
  
      try {
        const mealsCollectionRef = collection(FIRESTORE_DB, 'meals');
        await addDoc(mealsCollectionRef, newMeal);
        ToastAndroid.show(`${selectedItem.name} added to your ${selectedMeal}!`, ToastAndroid.SHORT);
        console.log('Meal added successfully:', newMeal);
  
        setQuery('');
        setSelectedItem(null);
        setAmount('');
        setCalculatedMacros(null);
      } catch (error) {
        console.error('Error adding meal:', error);
        ToastAndroid.show('Failed to add meal. Please try again.', ToastAndroid.SHORT);
      }
    } else {
      ToastAndroid.show('Please select a food item and enter the amount!', ToastAndroid.SHORT);
    }
  };

  const clearAllMeals = async () => {
    try {
      await AsyncStorage.removeItem('meals');
      ToastAndroid.show('All meals cleared!', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error clearing all meals:', error);
      ToastAndroid.show('Failed to clear all meals.', ToastAndroid.SHORT);
    }
  };

  return (
    <ImageBackground
    source={require('../assets/background.jpg')} 
    style={styles.background}
    >

    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="search" size={30} color="#000" style={styles.icon} />
        <Text style={styles.title}>Search foods or drinks</Text>
      </View>

      <View style={styles.mealPickerContainer}>
        <Text style={styles.mealLabel}>Meal</Text>
        <Picker
          selectedValue={selectedMeal}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedMeal(itemValue)}
        >
          <Picker.Item label="Select meal" value="" />
          <Picker.Item label="Breakfast" value="Breakfast" />
          <Picker.Item label="Lunch" value="Lunch" />
          <Picker.Item label="Dinner" value="Dinner" />
          <Picker.Item label="Snack" value="Snack" />
        </Picker>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search..."
          value={query}
          onChangeText={(text) => setQuery(text)}
          onSubmitEditing={() => searchFood(query)} 
          returnKeyType="search" 
        />
      </View>

      {loading && <ActivityIndicator size="small" color="#0000ff" style={styles.loader} />}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {query.length > 0 && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => selectItem(item)} style={styles.resultItem}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodBrand}>{item.food_brand}</Text>
              <Text style={styles.foodDetails}>
                Description: {item.serving_description} | Calories: {item.calories} kcal | Protein: {item.protein} g | Carbs: {item.carbohydrate} g | Fat: {item.fat} g
              </Text>
            </TouchableOpacity>
          )}
          style={styles.resultList}
        />
      )}

      {selectedItem && (
        <View style={styles.amountContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter amount (grams)"
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              calculateMacros(text);
            }}
          />
        </View>
      )}

      {calculatedMacros && (
        <View style={styles.macroContainer}>
          <Text>Calculated Macros:</Text>
          <Text>Calories: {calculatedMacros.calories} kcal</Text>
          <Text>Protein: {calculatedMacros.protein} g</Text>
          <Text>Carbs: {calculatedMacros.carbohydrates} g</Text>
          <Text>Fat: {calculatedMacros.fat} g</Text>
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={addMeal}>
        <Text style={styles.addButtonText}>Add meal</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.clearButton} onPress={clearAllMeals}>
        <Text style={styles.clearButtonText}>Clear All Meals</Text>
      </TouchableOpacity>
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  mealPickerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  mealLabel: {
    fontSize: 16,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  searchContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  loader: {
    marginTop: 10,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  foodName: {
    fontWeight: 'bold',
  },
  foodBrand: {
    fontStyle: 'italic',
    color: '#555',
  },
  foodDetails: {
    fontSize: 12,
    color: '#777',
  },
  resultList: {
    marginTop: 10,
  },
  amountContainer: {
    marginBottom: 20,
  },
  macroContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f8f8f8',
  },
  addButton: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  clearButton: {
    padding: 10,
    backgroundColor: '#f44336',
    borderRadius: 5,
    marginTop: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  background: {
    flex: 1,  
    resizeMode: 'cover',  
    justifyContent: 'center', 
  },
});

export default SearchScreen;
