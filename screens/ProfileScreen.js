import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Modal, TextInput, Alert, ImageBackground, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import VerifiedIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../database/databaseConfig'; 
import { signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword, deleteUser, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [isNameModalVisible, setNameModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false); 
  const [name, setName] = useState('');
  const [newName, setNewName] = useState('');
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);  
  const [actionType, setActionType] = useState('');  

  const user = FIREBASE_AUTH.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(FIRESTORE_DB, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setName(userData.name || (userData.email ? extractNameFromEmail(userData.email) : 'Add your name'));
          setUsername(userData.username || '');
        }
        setIsEmailVerified(user.emailVerified);
      }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      await signOut(FIREBASE_AUTH);
      navigation.reset({
        index: 0,
        routes: [{ name: 'RegisterLogin' }],
      });
    } catch (error) {
      console.error('Logout error: ', error.message);
    }
  };

  const handleUpdateName = async () => {
    if (user) {
      const userRef = doc(FIRESTORE_DB, 'users', user.uid);
      await updateDoc(userRef, { name: newName });
      setName(newName);
      setNewName('');
      setNameModalVisible(false);
      const updatedUser = await getDoc(userRef);
      const updatedData = updatedUser.data();
      setName(updatedData.name);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    if (user && currentPassword && newPassword) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Your password has been updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error) {
        console.error('Error changing password: ', error);
        Alert.alert('Error', 'Failed to change password. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  const deleteAccount = async () => {
    if (user && currentPassword) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      try {
        await reauthenticateWithCredential(user, credential);
        await deleteUser(user);
        Alert.alert('Success', 'Your account has been deleted successfully.');
        await AsyncStorage.clear();
        await signOut(FIREBASE_AUTH);
        navigation.reset({
          index: 0,
          routes: [{ name: 'RegisterLogin' }],
        });

      } catch (error) {
        console.error('Error deleting account: ', error);
        Alert.alert('Error', 'Failed to delete account. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please enter your password to confirm account deletion.');
    }
  };

  const handleActionRequest = (action) => {
    setActionType(action);
    setPasswordModalVisible(true);
  };

  const extractNameFromEmail = (email) => {
    const namePart = email.split('@')[0];
    const nameParts = namePart.split('.'); 
    
    return nameParts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const sendVerificationEmail = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        Alert.alert('Verification', 'Verification email has been sent! Please check your inbox.');
      } catch (error) {
        console.error('Error sending verification email: ', error);
        Alert.alert('Error', 'Failed to send verification email. Please try again.');
      }
    }
  };

  const menuItems = [
    ...(isEmailVerified ? [] : [
      { id: '1', title: 'Verify Email', icon: 'check-circle', onPress: sendVerificationEmail },
    ]),
    { id: '2', title: 'Settings', icon: 'cog', onPress: () => navigation.navigate('Settings') },
    { id: '3', title: 'Logs', icon: 'note', onPress: () => navigation.navigate('Log') },
    { id: '4', title: 'Change password', icon: 'lock', onPress: () => handleActionRequest('change-password') },
    { id: '5', title: 'Delete Account', icon: 'delete', onPress: () => handleActionRequest('delete-account') },
  ];

  return (
    <ImageBackground
      source={require('../assets/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Image source={require('../assets/avatar.png')} style={styles.avatar} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>@{username}</Text>

          {isEmailVerified ? (
            <VerifiedIcon name="verified" size={24} color="#1ab4e8" style={styles.verifiedIcon} />
          ) : (
            <Text style={styles.unverifiedText}>Email not verified</Text>
          )}

          <Pressable style={styles.editButton} onPress={() => setNameModalVisible(true)}>
            <Text style={styles.editButtonText}>Edit Name</Text>
          </Pressable>
        </View>

        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <Icon name={item.icon} size={24} color="#4F4F4F" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#BDBDBD" />
            </Pressable>
          )}
          contentContainerStyle={styles.menuList}
        />
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={28} color="#4F4F4F" />
        </Pressable>

        <Modal visible={isPasswordModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{actionType === 'change-password' ? 'Change Password' : 'Confirm Account Deletion'}</Text>

              {actionType === 'change-password' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Old Password"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Enter Password"
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
              )}

              <Pressable
                style={styles.modalButton}
                onPress={() => {
                  if (actionType === 'change-password') {
                    handleChangePassword();
                  } else if (actionType === 'delete-account') {
                    deleteAccount();
                  }
                  setPasswordModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={isNameModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new name"
                value={newName}
                onChangeText={setNewName}
              />
              <Pressable style={styles.modalButton} onPress={handleUpdateName}>
                <Text style={styles.modalButtonText}>Save</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setNameModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  editButtonText: {
    color: '#4F4F4F',
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#4F4F4F',
  },
  logoutButton: {
    position: 'absolute',
    right: 25,
    marginTop: 25,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    marginBottom: 10,
  },
  modalCancelButton: {
    backgroundColor: 'black',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  verifiedIcon: {
    position: 'absolute',
    right: 150,
  },
  unverifiedText: {
    color: '#FF6347',
    fontSize: 14,
  },
});

export default ProfileScreen;
