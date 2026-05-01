import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validateName, validateAge } from '../../utils/validation';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

// ─── Field validators ─────────────────────────────────────────────────────────

const vEmail = (v: string): string | null => {
  if (!v.trim()) return 'Email is required';
  if (!validateEmail(v)) return 'Enter a valid email address';
  return null;
};

const vPassword = (v: string): string | null => {
  if (!v) return 'Password is required';
  if (v.length < 6) return 'Must be at least 6 characters';
  return null;
};

const vConfirm = (v: string, pw: string): string | null => {
  if (!v) return 'Please confirm your password';
  if (v !== pw) return 'Passwords do not match';
  return null;
};

const vWeight = (v: string, unit: 'kg' | 'lbs'): string | null => {
  const n = Number(v);
  if (!v.trim() || isNaN(n)) return 'Enter a valid weight';
  const [lo, hi] = unit === 'kg' ? [1, 500] : [2, 1100];
  if (n < lo || n > hi) return `Weight must be ${lo}–${hi} ${unit}`;
  return null;
};

const vHeight = (v: string): string | null => {
  const n = Number(v);
  if (!v.trim() || isNaN(n)) return 'Enter a valid height';
  if (n < 50 || n > 272) return 'Height must be 50–272 cm';
  return null;
};

// ─── Password strength ────────────────────────────────────────────────────────

type Strength = 0 | 1 | 2 | 3;

const passwordStrength = (pw: string): Strength => {
  if (pw.length < 6) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9!@#$%^&*]/.test(pw)) score++;
  return Math.min(score, 3) as Strength;
};

const STRENGTH_LABELS: Record<Strength, string> = {
  0: 'Too short',
  1: 'Weak',
  2: 'Good',
  3: 'Strong',
};

const STRENGTH_COLORS: Record<Strength, string> = {
  0: '#FF4D5E',
  1: '#FF9500',
  2: '#FFD60A',
  3: '#C6FF3D',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormErrors {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
  age: string | null;
  weight: string | null;
  height: string | null;
}

const emptyErrors = (): FormErrors => ({
  firstName: null, lastName: null, email: null,
  password: null, confirmPassword: null,
  age: null, weight: null, height: null,
});

// ─── Component ────────────────────────────────────────────────────────────────

export const RegisterScreen = ({ navigation }: Props) => {
  const { signup } = useAuth();
  const { theme } = useTheme(); // ← reactive theme (light or dark)

  const [firstName, setFirstName]             = useState('');
  const [lastName, setLastName]               = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge]                         = useState('');
  const [weight, setWeight]                   = useState('');
  const [weightUnit, setWeightUnit]           = useState<'kg' | 'lbs'>('kg');
  const [height, setHeight]                   = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [serverError, setServerError]         = useState<string | null>(null);
  const [errors, setErrors]                   = useState<FormErrors>(emptyErrors());

  const pwStrength = passwordStrength(password);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const setFieldError = useCallback((field: keyof FormErrors, err: string | null) => {
    setErrors((prev) => ({ ...prev, [field]: err }));
  }, []);

  const handleSubmit = async () => {
    const next: FormErrors = {
      firstName: validateName(firstName),
      lastName:  validateName(lastName),
      email:     vEmail(email),
      password:  vPassword(password),
      confirmPassword: vConfirm(confirmPassword, password),
      age:       validateAge(age),
      weight:    vWeight(weight, weightUnit),
      height:    vHeight(height),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    setServerError(null);
    try {
      await signup({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: Number(age),
        weight: Number(weight),
        weightUnit,
        height: Number(height),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create account. Try again.';
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
      <Screen scroll forceTopSafe>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── Back ──────────────────────────────────────────────────── */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.backBtn,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
            Start your fitness journey today
          </Text>

          {/* ── Server Error ──────────────────────────────────────────── */}
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

          {/* ── Section: Identity ─────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>YOUR IDENTITY</Text>
          <Card style={styles.card}>
            <Input
              label="First Name"
              placeholder="e.g. Alex"
              value={firstName}
              onChangeText={(v) => { setFirstName(v); setFieldError('firstName', validateName(v)); }}
              error={errors.firstName}
              autoCapitalize="words"
              editable={!loading}
            />
            <Input
              label="Last Name"
              placeholder="e.g. Rivera"
              value={lastName}
              onChangeText={(v) => { setLastName(v); setFieldError('lastName', validateName(v)); }}
              error={errors.lastName}
              autoCapitalize="words"
              editable={!loading}
            />
            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => { setEmail(v); setFieldError('email', vEmail(v)); }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </Card>

          {/* ── Section: Password ─────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionGap, { color: theme.colors.muted }]}>
            PASSWORD
          </Text>
          <Card style={styles.card}>
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(v) => { setPassword(v); setFieldError('password', vPassword(v)); }}
              error={errors.password}
              secureTextEntry={!showPassword}
              editable={!loading}
              hint="Min. 6 characters"
            />

            {/* Password strength bar */}
            {password.length > 0 ? (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {([1, 2, 3] as const).map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            pwStrength >= level
                              ? STRENGTH_COLORS[pwStrength]
                              : theme.colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[pwStrength] }]}>
                  {STRENGTH_LABELS[pwStrength]}
                </Text>
              </View>
            ) : null}

            {/* Show/hide toggle */}
            <TouchableOpacity
              style={styles.showPasswordBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={theme.colors.muted}
              />
              <Text style={[styles.showPasswordText, { color: theme.colors.muted }]}>
                {showPassword ? 'Hide password' : 'Show password'}
              </Text>
            </TouchableOpacity>

            <Input
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setFieldError('confirmPassword', vConfirm(v, password)); }}
              error={errors.confirmPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
          </Card>

          {/* ── Section: Body Stats ───────────────────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionGap, { color: theme.colors.muted }]}>
            BODY STATS
          </Text>
          <Card style={styles.card}>
            <Input
              label="Age"
              placeholder="e.g. 27"
              value={age}
              onChangeText={(v) => { setAge(v); setFieldError('age', validateAge(v)); }}
              error={errors.age}
              keyboardType="number-pad"
              editable={!loading}
              hint="Must be 10–120"
            />

            {/* Weight with unit toggle */}
            <View style={styles.weightRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Weight"
                  placeholder={weightUnit === 'kg' ? 'e.g. 76' : 'e.g. 168'}
                  value={weight}
                  onChangeText={(v) => { setWeight(v); setFieldError('weight', vWeight(v, weightUnit)); }}
                  error={errors.weight}
                  keyboardType="decimal-pad"
                  editable={!loading}
                  unit={weightUnit}
                />
              </View>
              <View style={styles.unitToggle}>
                {(['kg', 'lbs'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.unitBtn,
                      { borderColor: theme.colors.border },
                      weightUnit === u && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
                    ]}
                    onPress={() => {
                      setWeightUnit(u);
                      setWeight('');
                      setFieldError('weight', null);
                    }}
                  >
                    <Text style={[
                      styles.unitBtnText,
                      { color: theme.colors.muted },
                      weightUnit === u && { color: theme.colors.accentText },
                    ]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Height"
              placeholder="e.g. 178"
              value={height}
              onChangeText={(v) => { setHeight(v); setFieldError('height', vHeight(v)); }}
              error={errors.height}
              keyboardType="decimal-pad"
              editable={!loading}
              unit="cm"
              hint="50–272 cm"
            />
          </Card>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <Button
            title="Create Account"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            style={styles.submitBtn}
          />

          {/* ── Footer ────────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.muted }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.footerLink, { color: theme.colors.accent }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Screen>
    </KeyboardAvoidingView>
  );
};

// Static layout styles only — no colors here (all colors applied inline via theme)
const styles = StyleSheet.create({
  topBar: { marginBottom: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  title: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  subtitle: { fontSize: 16, marginBottom: 24 },

  serverErrorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 12, padding: 12,
    marginBottom: 16,
  },
  serverErrorText: { fontSize: 14, flex: 1 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8,
  },
  sectionGap: { marginTop: 24 },

  card: { marginBottom: 0 },

  strengthRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: -8, marginBottom: 12,
  },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 44, textAlign: 'right' },

  showPasswordBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: -8, marginBottom: 12,
  },
  showPasswordText: { fontSize: 12 },

  weightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  unitToggle: { flexDirection: 'column', gap: 4, paddingTop: 26 },
  unitBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1,
    minWidth: 46, alignItems: 'center',
  },
  unitBtnText: { fontSize: 14, fontWeight: '500' },

  submitBtn: { marginTop: 24 },

  footer: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 24, marginBottom: 12,
  },
  footerText: { fontSize: 16 },
  footerLink: { fontSize: 16, fontWeight: '700' },
});