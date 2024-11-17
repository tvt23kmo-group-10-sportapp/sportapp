import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, Modal, ActivityIndicator } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { BarChart } from 'react-native-gifted-charts';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig'; 
import { getDoc, doc } from 'firebase/firestore'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth'; 

const HomeScreen = () => {
  const [calories, setCalories] = useState('');
  const [mealType, setMealtype] = useState('');
  const [water, setWater] = useState('');
  const [totalWater, setTotalWater] = useState(0);
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState('User');
  const [user, setUser] = useState(null);  
  const [loading, setLoading] = useState(true); 

  const widthAndHeight = 200;
  const series = [123, 321, 123, 789, 537];
  const sliceColor = ['#fbd203', '#ffb300', '#ff9100', '#ff6c00', '#ff3c00'];
  const barData = [
    {
      value: totalWater,
      frontColor: '#0E87CC'
    }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      if (currentUser) {
        console.log('User logged in:', currentUser.uid);
        setUser(currentUser);
      } else {
        console.log('No user logged in');
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const clickWaterButton = () => {
    setShow(true);
  }

  const saveWater = () => {
    const waterIntake = parseInt(water, 10);
    if(!isNaN(waterIntake)) {
      setTotalWater(totalWater + waterIntake);
    }
    setShow(false);
    setWater('');
  }

  useEffect(() => {
    const fetchUsername = async () => {
      const user = FIREBASE_AUTH.currentUser; 
      if (user) {
        try {
          const userRef = doc(FIRESTORE_DB, 'users', user.uid);  
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUsername(userData.username); 
            await AsyncStorage.setItem('userName', userData.username); 
          } else {
            setUsername('User'); 
          }
        } catch (error) {
          console.error("Error getting user data: ", error);
          setUsername('User');
        } finally {
          setLoading(false);
        }
      } else {
        const storedUsername = await AsyncStorage.getItem('userName');
        if (storedUsername) {
          setUsername(storedUsername);
        }
        setLoading(false);
      }
    };

    fetchUsername();
  }, []);
  
  useEffect(() => {
    const fetchCalories = async () => {
      if (user) {
        try {
          const settingsRef = doc(FIRESTORE_DB, 'user_settings', user.uid);
          const settingsSnap = await getDoc(settingsRef);
  
          if (settingsSnap.exists()) {
            const settingsData = settingsSnap.data();
            if (settingsData.dailyCalories) {
              setCalories(settingsData.dailyCalories);
              await AsyncStorage.setItem('dailyCalories', settingsData.dailyCalories.toString());
            } else {
              setCalories(0);
              console.warn('No daily calorie goal set for the user.');
            }
          } else {
            console.error('Settings document does not exist.');
            setCalories(0);
          }
        } catch (error) {
          console.error('Error fetching calories:', error);
          setCalories(0);
        }
      } else {
        const storedCalories = parseInt(await AsyncStorage.getItem('dailyCalories'), 10);
        if (!isNaN(storedCalories)) {
          setCalories(storedCalories);
        } else {
          setCalories(0);
        }
      }
      setLoading(false);
    };
  
    fetchCalories();
  }, [user]);
  

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {username}!</Text>
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
        <Pressable style={styles.mealButton} onPress={() => props.navigation.navigate('Add Meal')}>
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
