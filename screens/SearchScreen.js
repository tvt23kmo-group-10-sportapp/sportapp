import React, { useState } from 'react'; 
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native'; 
import Icon from 'react-native-vector-icons/FontAwesome'; 
import { Picker } from '@react-native-picker/picker'; 
import { ToastAndroid } from 'react-native'; 

const SearchScreen = () => {
  const [selectedMeal, setSelectedMeal] = useState(''); 
  const [query, setQuery] = useState(''); 
  const [results, setResults] = useState([]); 
  const [selectedItem, setSelectedItem] = useState(null); 

  //Simuloidaan API-vastausta
  const mockData = [
    { id: '1', name: 'Apple' },
    { id: '2', name: 'Banana' },
    { id: '3', name: 'Orange' },
  ];

  //Funktio haun suorittamiseksi
  const searchFood = (text) => {
    setQuery(text);

    /*Esimerkkikoodi, kun API on käytössä:
    try {
      const response = await fetch(`https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${text}&format=json`, {
        headers: {
          Authorization: `Bearer YOUR_ACCESS_TOKEN`,
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
    if (selectedItem) {
      ToastAndroid.show(`${selectedItem.name} added to your meal!`, ToastAndroid.SHORT);
      setQuery('');
      setSelectedItem(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon 
          name="search" 
          size={30} 
          color="#000" 
          style={styles.icon} 
        />
        <Text style={styles.title}>Search foods or drinks</Text>
      </View>

      <View style={styles.mealPickerContainer}>
        <Text style={styles.mealLabel}>Meal</Text>
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
      )}

      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={addMeal}>
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add meal</Text>
        </TouchableOpacity>
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
});

export default SearchScreen;