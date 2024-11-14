import React, { useState } from 'react'; 
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ToastAndroid, ScrollView } from 'react-native'; 
import Icon from 'react-native-vector-icons/FontAwesome'; 
import { Picker } from '@react-native-picker/picker'; 

const SearchScreen = () => {
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('g');
  const [dailyMeals, setDailyMeals] = useState([]);

  //Simuloidaan API-vastausta
  const mockData = [
    { id: '1', name: 'Apple' },
    { id: '2', name: 'Banana' },
    { id: '3', name: 'Orange' },
    { id: '4', name: 'Mehukatti'}
  ];

  //Funktio haun suorittamiseksi
  const searchFood = (text) => {
    setQuery(text);

    /*Esimerkkikoodi, kun API on käytössä:
    try {
      const response = await fetch(https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${text}&format=json, {
        headers: {
          Authorization: Bearer YOUR_ACCESS_TOKEN,
        },
      });
      const data = await response.json();
      setResults(data.foods);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    */

    if (text) {
      const filteredResults = mockData.filter((item) =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setResults(filteredResults);
    } else {
      setResults([]);
    }
  };

  //Valitun ruoan asettaminen hakukenttään
  const selectItem = (item) => {
    setSelectedItem(item);
    setQuery(item.name);
    setResults([]);
  };

  //Funktio aterian lisäämiseksi (kutsutaan Add meal -painikkeesta)
  const addMeal = () => {
    if (selectedItem && amount) {
      const meal = {
        mealType: selectedMeal,
        name: selectedItem.name,
        amount,
        unit,
      };      
      setDailyMeals([...dailyMeals, meal]); // Lisätään uusi ruoka dailyMeals-listaan
      ToastAndroid.show(
        `${selectedItem.name} (${amount} ${unit}) added to your meal!`, 
        ToastAndroid.SHORT
      );
      setQuery('');
      setSelectedItem(null);
      setAmount('');
    }
  };

   // Funktio ruokien ryhmittelyyn aterian mukaan
   const groupMealsByType = () => {
    const grouped = {};
    dailyMeals.forEach((meal) => {
      if (!grouped[meal.mealType]) {
        grouped[meal.mealType] = [];
      }
      grouped[meal.mealType].push(meal);
    });
    return grouped;
  };

    // Funktio aterian poistamiseksi
  const removeMeal = (mealToRemove) => {
    setDailyMeals(dailyMeals.filter((meal) => meal !== mealToRemove));
    ToastAndroid.show(`${mealToRemove.name} removed from your meal!`, ToastAndroid.SHORT);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="search" size={30} color="#000" style={styles.icon} />
        <Text style={styles.title}>Search foods or drinks</Text>
      </View>

      <View style={styles.mealPickerContainer}>
        <Text style={styles.mealLabel}>Meal:</Text>
        <Picker
          selectedValue={selectedMeal}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedMeal(itemValue)}
        >
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
          onChangeText={searchFood}
        />
      </View>

      {query.length > 0 && results.length > 0 && (
        <View style={styles.resultListContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectItem(item)}>
                <Text style={styles.resultItem}>{item.name}</Text>
              </TouchableOpacity>
            )}
            style={styles.resultList}
          />
        </View>
      )}

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount:</Text>
        <TextInput
          style={styles.amountInput}
          placeholder={"Enter amount"}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Picker
          selectedValue={unit}
          style={styles.unitPicker}
          onValueChange={(itemValue) => setUnit(itemValue)}
        >
          <Picker.Item label="g" value="g" />
          <Picker.Item label="ml" value="ml" />
        </Picker>
      </View>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={addMeal}>
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add meal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dailyMealsContainer}>
        <Text style={styles.dailyMealsTitle}>Meals of the day</Text>
        <ScrollView style={styles.scrollView}>
          {Object.entries(groupMealsByType()).map(([mealType, meals]) => (
            <View key={mealType} style={styles.mealSection}>
              <Text style={styles.mealType}>{mealType}</Text>
              {meals.map((meal, index) => (
                <View key={index} style={styles.mealItemContainer}>
                  <Text style={styles.mealItem}>
                    • {meal.name} ({meal.amount} {meal.unit})
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMeal(meal)}
                  >
                    <Icon name="trash" size={20} color="black" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
    {dailyMeals.length === 0 && (
      <Text style={styles.noMealsText}>No meals added yet.</Text>
    )}
        </ScrollView>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  mealPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mealLabel: {
    fontSize: 18,
    marginRight: 10,
  },
  picker: {
    height: 50,
    width: 200,
  },
  searchContainer: {
    width: '90%',
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  resultListContainer: {
    width: '90%',
    maxHeight: 150,
    marginBottom: 10,
  },
  resultList: {
    width: '80%',
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
  },
  resultItem: {
    padding: 5,
    fontSize: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '90%',
  },
  amountLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  unitPicker: {
    height: 50,
    width: 100,
  },
  addButtonContainer: {
    width: '90%',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'grey',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
  dailyMealsContainer: {
    width: '90%',
    marginTop: 20,
  },
  dailyMealsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mealSection: {
    marginBottom: 10,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  mealItem: {
    fontSize: 16,
    paddingVertical: 2,
  },
  mealItemContainer: {
    flexDirection: 'row',  
    alignItems: 'center',  
    marginBottom: 10,
  },
  noMealsText: {
    fontSize: 16,
    color: '#888',
  },
  removeButton: {
    marginLeft: 10,
    padding: 5,
    borderRadius: 5,
  },
  scrollView: {
    width: '100%',
    maxHeight: 270,
  },
});

export default SearchScreen;