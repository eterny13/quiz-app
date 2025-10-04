import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      // 実際のGoogleログイン実装はここに追加
      // デモ用にモックユーザーでログイン
      const mockUser = {
        id: '123',
        name: 'テストユーザー',
        email: 'test@example.com',
        photo: null
      };
      
      login(mockUser);
      navigation.replace('Quiz');
    } catch (error) {
      Alert.alert('ログインエラー', 'ログインに失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>クイズアプリ</Text>
      <Text style={styles.subtitle}>4択クイズで競争しよう！</Text>
      
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleGoogleLogin}
      >
        <Text style={styles.loginButtonText}>
          Googleアカウントでログイン
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 50,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});