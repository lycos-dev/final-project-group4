import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    weight: '',
    height: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { name, email, password, age, weight, height } = form;

    if (!name || !email || !password || !age || !weight || !height) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with real registration logic (store to local DB)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
      Alert.alert('Success', 'Account created! Please log in.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Registration Failed', 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields: {
    key: keyof typeof form;
    label: string;
    placeholder: string;
    keyboardType?: any;
    secure?: boolean;
  }[] = [
    { key: 'name', label: 'Full Name', placeholder: 'Juan Dela Cruz' },
    {
      key: 'email',
      label: 'Email',
      placeholder: 'you@example.com',
      keyboardType: 'email-address',
    },
    {
      key: 'password',
      label: 'Password',
      placeholder: '••••••••',
      secure: true,
    },
    {
      key: 'age',
      label: 'Age',
      placeholder: 'e.g. 22',
      keyboardType: 'numeric',
    },
    {
      key: 'weight',
      label: 'Weight (kg)',
      placeholder: 'e.g. 70',
      keyboardType: 'numeric',
    },
    {
      key: 'height',
      label: 'Height (cm)',
      placeholder: 'e.g. 175',
      keyboardType: 'numeric',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>NEXA</Text>
            <Text style={styles.tagline}>Start your fitness journey.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.form}>
            <Text style={styles.title}>Create Account</Text>

            {fields.map(({ key, label, placeholder, keyboardType, secure }) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                {secure ? (
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[styles.input, { flex: 1, borderWidth: 0 }]}
                      placeholder={placeholder}
                      placeholderTextColor="#888"
                      secureTextEntry={!showPassword}
                      value={form[key]}
                      onChangeText={(val) => handleChange(key, val)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.toggleText}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#888"
                    keyboardType={keyboardType || 'default'}
                    autoCapitalize={key === 'email' ? 'none' : 'words'}
                    value={form[key]}
                    onChangeText={(val) => handleChange(key, val)}
                  />
                )}
              </View>
            ))}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0D0D0D" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#C8FF00',
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    letterSpacing: 1,
  },
  form: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFF',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  toggleText: {
    color: '#C8FF00',
    fontWeight: '600',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#C8FF00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  linkText: {
    color: '#C8FF00',
    fontWeight: '700',
    fontSize: 14,
  },
});