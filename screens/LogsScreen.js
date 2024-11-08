import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

const LogsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>LogsScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: 18,
    },
});

export default LogsScreen