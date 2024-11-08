import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';

const Header = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('RegisterLogin')} 
        style={styles.iconContainer}
      >
        <Image 
          source={require('../assets/user-icon.png')} 
          style={styles.icon} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('Settings')} 
        style={styles.iconContainer}
      >
        <Image 
          source={require('../assets/settings-icon.png')}
          style={styles.icon} 
        />
      </TouchableOpacity>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  iconContainer: {
    marginLeft: 15,
    width: 40,
    height: 40,
  },
  icon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default Header;
