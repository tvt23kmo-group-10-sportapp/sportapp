import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';

const Header = ({ navigation }) => {
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('RegisterLogin')} 
      style={styles.userLogo}
    >
    <Image 
        source={require('../assets/user-icon.png')} 
        style={styles.logoImage} 
    />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userLogo: {
    marginRight: 20,
    width: 40,
    height: 40,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default Header;
