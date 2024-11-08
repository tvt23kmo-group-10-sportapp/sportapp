import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, Modal } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { BarChart } from 'react-native-gifted-charts';

const HomeScreen = (props) => {
  const [calories, setCalories] = useState('')
  const [mealType, setMealtype] = useState('')
  const [water, setWater] = useState('')
  const [totalWater, setTotalWater] = useState(0)
  const [show, setShow] = useState(false)
  const widthAndHeight = 200
  const series = [123, 321, 123, 789, 537]
  const sliceColor = ['#fbd203', '#ffb300', '#ff9100', '#ff6c00', '#ff3c00']
  const barData = [
    {
      value: totalWater,
      frontColor: '#0E87CC'
    }
  ]

  const clickWaterButton = () => {
    setShow(true)
  }

  const saveWater = () => {
    const waterIntake = parseInt(water, 10)
    if(!isNaN(waterIntake)) {
      setTotalWater(totalWater + waterIntake)
    }
    setShow(false)
    setWater('')
  }

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
          <BarChart data={barData} style={styles.water} />
          <Pressable style={styles.waterButton} onPress={clickWaterButton}>
            <Text style={styles.buttonText}>Add water</Text>
          </Pressable>
          <Modal
            transparent={false}
            visible={show}
            onRequestClose={() => {
              setShow(!show);
            }}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Enter amount</Text>
                <TextInput 
                  placeholder='ml'
                  value={water}
                  onChangeText={setWater}
                />
                <Pressable onPress={saveWater}>
                  <Text>Save</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => {
                    setShow(!show);
                  }}>
                  <Text></Text>
                  <Text style={styles.textStyle}>Close</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>
      </View>
      <View style={styles.meals}>
        <Text style={styles.mealsTitle}>Your meals</Text>
        <Pressable style={styles.mealButton} onPress={() => {/* opens add foods or drinks page */ }}>
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
    marginTop: 10,
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
    flexDirection: 'row',
    marginTop: 20,
    padding: 10,
    justifyContent:'space-between',
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
    paddingHorizontal: 10,
    borderRadius: 5,
    width: 100,    
  },
  waterButton: {
    backgroundColor: 'grey',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', 
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  water: {
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent:'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    width: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
  
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
},
});

export default HomeScreen;
 