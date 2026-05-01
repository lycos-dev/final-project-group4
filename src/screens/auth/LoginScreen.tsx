import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validation';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// ─── Field-level validators ───────────────────────────────────────────────────

const validateLoginEmail = (v: string): string | null => {
  if (!v.trim()) return 'Email is required';
  if (!validateEmail(v)) return 'Enter a valid email address';
  return null;
};

const validateLoginPassword = (v: string): string | null => {
  if (!v) return 'Password is required';
  if (v.length < 6) return 'Password must be at least 6 characters';
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuth();
  const { theme } = useTheme(); // ← reactive theme (light or dark)

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // Real-time validation
  const handleEmailChange = (v: string) => {
    setEmail(v);
    setServerError(null);
    setEmailError(validateLoginEmail(v));
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    setServerError(null);
    setPasswordError(validateLoginPassword(v));
  };

  const handleLogin = async () => {
    const eErr = validateLoginEmail(email);
    const pErr = validateLoginPassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    setServerError(null);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
    >
      <Screen scroll>
        <Animated.View
          style={[
            styles.inner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* ── Logo ──────────────────────────────────────────────────── */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={[theme.colors.accent, '#7EE800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Ionicons name="barbell-outline" size={32} color={theme.colors.accentText} />
            </LinearGradient>
            <Text style={[styles.logoText, { color: theme.colors.text }]}>NEXA</Text>
            <Text style={[styles.logoTagline, { color: theme.colors.muted }]}>
              Track. Progress. Dominate.
            </Text>
          </View>

          {/* ── Heading ───────────────────────────────────────────────── */}
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
              Sign in to continue your journey
            </Text>
          </View>

          {/* ── Server Error Banner ───────────────────────────────────── */}
          {serverError ? (
            <View style={[
              styles.serverErrorBanner,
              {
                backgroundColor: `${theme.colors.danger}18`,
                borderColor: `${theme.colors.danger}55`,
              },
            ]}>
              <Ionicons name="warning-outline" size={15} color={theme.colors.danger} />
              <Text style={[styles.serverErrorText, { color: theme.colors.danger }]}>
                {serverError}
              </Text>
            </View>
          ) : null}

          {/* ── Form ──────────────────────────────────────────────────── */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={handleEmailChange}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={handlePasswordChange}
              error={passwordError}
              secureTextEntry={!showPassword}
              editable={!loading}
              unit={undefined}
            />

            {/* Password show/hide toggle */}
            <TouchableOpacity
              style={styles.showPasswordBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={theme.colors.muted}
              />
              <Text style={[styles.showPasswordText, { color: theme.colors.muted }]}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.submitBtn}
            />
          </View>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.muted }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.footerLink, { color: theme.colors.accent }]}>Create one</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Screen>
    </KeyboardAvoidingView>
  );
};

// Static layout styles only — no colors here (all colors applied inline via theme)
const styles = StyleSheet.create({
  inner: { flex: 1, paddingBottom: 32 },

  logoSection: { alignItems: 'center', paddingTop: 32, marginBottom: 24 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 6,
  },
  logoTagline: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '500',
    marginTop: 4,
  },

  heading: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  subtitle: { fontSize: 16 },

  serverErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  serverErrorText: { fontSize: 14, flex: 1 },

  form: { marginBottom: 12 },
  showPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginTop: -12,
    marginBottom: 16,
  },
  showPasswordText: { fontSize: 12 },
  submitBtn: { marginTop: 8 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { fontSize: 16 },
  footerLink: { fontSize: 16, fontWeight: '700' },
});