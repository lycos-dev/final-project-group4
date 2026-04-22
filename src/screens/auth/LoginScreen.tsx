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
import { theme } from '../../theme/theme';
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
    // Force full validation before submit
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
      style={styles.kav}
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
            <Text style={styles.logoText}>NEXA</Text>
            <Text style={styles.logoTagline}>Track. Progress. Dominate.</Text>
          </View>

          {/* ── Heading ───────────────────────────────────────────────── */}
          <View style={styles.heading}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* ── Server Error Banner ───────────────────────────────────── */}
          {serverError ? (
            <View style={styles.serverErrorBanner}>
              <Ionicons name="warning-outline" size={15} color={theme.colors.danger} />
              <Text style={styles.serverErrorText}>{serverError}</Text>
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
              // Password visibility toggle via the unit slot
              unit={undefined}
              // We render the toggle as a right element by wrapping
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
              <Text style={styles.showPasswordText}>
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

          {/* ── Demo hint ─────────────────────────────────────────────── */}
          <View style={styles.demoHint}>
            <Text style={styles.demoText}>
              Demo: <Text style={styles.demoValue}>admin@gmail.com</Text> /{' '}
              <Text style={styles.demoValue}>password</Text>
            </Text>
          </View>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Screen>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: theme.colors.bg },

  inner: { flex: 1, paddingBottom: theme.spacing.xxl },

  // Logo
  logoSection: { alignItems: 'center', paddingTop: theme.spacing.xxl, marginBottom: theme.spacing.xl },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  logoText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeDisplay,
    fontWeight: theme.font.weightBlack,
    letterSpacing: 6,
  },
  logoTagline: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeXs,
    letterSpacing: 2,
    fontWeight: theme.font.weightMedium,
    marginTop: 4,
  },

  // Heading
  heading: { marginBottom: theme.spacing.xl },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.sizeXxl,
    fontWeight: theme.font.weightBlack,
    marginBottom: theme.spacing.xs,
  },
  subtitle: { color: theme.colors.muted, fontSize: theme.font.sizeMd },

  // Server error
  serverErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: `${theme.colors.danger}18`,
    borderWidth: 1,
    borderColor: `${theme.colors.danger}55`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  serverErrorText: { color: theme.colors.danger, fontSize: theme.font.sizeSm, flex: 1 },

  // Form
  form: { marginBottom: theme.spacing.md },
  showPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginTop: -theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  showPasswordText: { color: theme.colors.muted, fontSize: theme.font.sizeXs },
  submitBtn: { marginTop: theme.spacing.sm },

  // Demo hint
  demoHint: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  demoText: { color: theme.colors.muted, fontSize: theme.font.sizeXs },
  demoValue: { color: theme.colors.accent, fontWeight: theme.font.weightMedium },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.sm },
  footerText: { color: theme.colors.muted, fontSize: theme.font.sizeMd },
  footerLink: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
});