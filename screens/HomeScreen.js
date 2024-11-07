import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { BarChart } from 'react-native-gifted-charts';

const HomeScreen = () => {
  const [calories, setCalories] = useState('')
  const [mealType, setMealtype] = useState('')
  const [water, setWater] = useState('')
  const widthAndHeight = 250
  const series = [123, 321, 123, 789, 537]
  const sliceColor = ['#fbd203', '#ffb300', '#ff9100', '#ff6c00', '#ff3c00']
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome,.</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          <PieChart
            widthAndHeight={widthAndHeight}
            series={series}
            sliceColor={sliceColor}
            coverFill={'#FFF'}
          />
          <Text style={styles.caloriesText}>
            {calories} calories {'\n'} remaining
          </Text>
        </View>
        <View style={styles.chart}>
          <BarChart water={water} style={styles.water} />
        </View>
      </View>
      <View style={styles.meals}>
        <Text style={styles.mealsTitle}>Your meals</Text>
        <Pressable style={styles.mealButton} onPress={() => {/* handle button press */ }}>
          <Text style={styles.buttonText}>Add meal</Text>
        </Pressable>
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
    marginTop: 20,
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
    top: '40%',
  },
  meals: {
    marginTop: 20,
    padding: 10,
  },
  mealsTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  mealButton: {
    backgroundColor: 'grey',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: 100,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  water: {
    marginTop: 20,
  },
});

export default HomeScreen;
