import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ToastAndroid, ActivityIndicator, Keyboard } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccessToken } from '../components/FatSecretAPI';

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
    setQuery(text);
  
    if (!text) {
      setResults([]);
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      await delay(2000);
      let token = accessToken;
      if (!token) {
        token = await getAccessToken(); 
        setAccessToken(token);
      }
  
      const response = await fetch(`https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(text)}&format=json`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      const data = await response.json();
  
      if (data && data.foods && data.foods.food) {
        const foodItems = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food]; 
        const detailedDataPromises = foodItems.map(async (food) => {
          const detailsResponse = await fetch(`https://platform.fatsecret.com/rest/server.api?method=food.get&food_id=${food.food_id}&format=json`, { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          const detailsData = await detailsResponse.json();
          const serving = Array.isArray(detailsData?.food?.servings?.serving) ? detailsData.food.servings.serving[0] : detailsData?.food?.servings?.serving || {};
          const brandName = detailsData?.food?.brand_name || 'Generic';
  
          return {
            id: food.food_id,
            name: food.food_name,
            food_brand: brandName,
            calories: serving.calories || 'N/A',
            protein: serving.protein || 'N/A',
            carbohydrate: serving.carbohydrate || 'N/A',
            fat: serving.fat || 'N/A',
            serving_size: serving.serving_size || 100, 
            serving_description: serving.serving_description || 'N/A',
          };
        });
  
        const detailedData = await Promise.all(detailedDataPromises);
        setResults(detailedData);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      ToastAndroid.show('Failed to fetch data', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  const selectItem = (item) => {
    setSelectedItem(item);
    setQuery(item.name);
    setResults([]);
    setCalculatedMacros(null);
    Keyboard.dismiss();
  };

  const calculateMacros = (amount) => {
    if (!selectedItem || !amount) return;

    const servingSize = selectedItem.serving_size || 100;
    const caloriesPerServing = selectedItem.calories;
    const proteinPerServing = selectedItem.protein;
    const carbsPerServing = selectedItem.carbohydrate;
    const fatPerServing = selectedItem.fat;
    const multiplier = amount / servingSize;

    const totalCalories = (caloriesPerServing * multiplier).toFixed(2);
    const totalProtein = (proteinPerServing * multiplier).toFixed(2);
    const totalCarbs = (carbsPerServing * multiplier).toFixed(2);
    const totalFat = (fatPerServing * multiplier).toFixed(2);

    setCalculatedMacros({
      calories: totalCalories,
      protein: totalProtein,
      carbohydrates: totalCarbs,
      fat: totalFat,
    });
  };

  const addMeal = async () => {
    if (!selectedMeal) {
      ToastAndroid.show('Please select a meal type!', ToastAndroid.SHORT);
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
      };
  
      let storedMeals = await AsyncStorage.getItem('meals');
      storedMeals = storedMeals ? JSON.parse(storedMeals) : [];
      const mealIndex = storedMeals.findIndex(
        (meal) => meal.date === mealDate && meal.mealType === selectedMeal
      );
  
      if (mealIndex !== -1) {
        storedMeals[mealIndex].meals.push(newMeal);
      } else {
        storedMeals.push({
          date: mealDate,
          meals: [newMeal],
        });
      }
  
      await AsyncStorage.setItem('meals', JSON.stringify(storedMeals));
  
      ToastAndroid.show(`${selectedItem.name} added to your ${selectedMeal}!`, ToastAndroid.SHORT);
      setQuery('');
      setSelectedItem(null);
      setAmount('');
      setCalculatedMacros(null);
    } else {
      ToastAndroid.show('Please select a food item and enter the amount!', ToastAndroid.SHORT);
    }
  };

  return (
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
    </View>
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
});

export default SearchScreen;
