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
import { theme } from '../../theme/theme';
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
  0: theme.colors.danger,
  1: '#FF9500',
  2: '#FFD60A',
  3: theme.colors.accent,
};

// ─── Component ────────────────────────────────────────────────────────────────

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

export const RegisterScreen = ({ navigation }: Props) => {
  const { signup } = useAuth();

  const [firstName, setFirstName]           = useState('');
  const [lastName, setLastName]             = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge]                       = useState('');
  const [weight, setWeight]                 = useState('');
  const [weightUnit, setWeightUnit]         = useState<'kg' | 'lbs'>('kg');
  const [height, setHeight]                 = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [loading, setLoading]               = useState(false);
  const [serverError, setServerError]       = useState<string | null>(null);
  const [errors, setErrors]                 = useState<FormErrors>(emptyErrors());

  const pwStrength = passwordStrength(password);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Real-time per-field validation
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
      style={styles.kav}
    >
      <Screen scroll>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── Back + Header ─────────────────────────────────────────── */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start your fitness journey today</Text>

          {/* ── Server Error ──────────────────────────────────────────── */}
          {serverError ? (
            <View style={styles.serverErrorBanner}>
              <Ionicons name="warning-outline" size={15} color={theme.colors.danger} />
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* ── Section: Identity ─────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>YOUR IDENTITY</Text>
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
          <Text style={[styles.sectionLabel, styles.sectionGap]}>PASSWORD</Text>
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
              <Text style={styles.showPasswordText}>
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
          <Text style={[styles.sectionLabel, styles.sectionGap]}>BODY STATS</Text>
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
                  label={`Weight`}
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
                    style={[styles.unitBtn, weightUnit === u && styles.unitBtnActive]}
                    onPress={() => {
                      setWeightUnit(u);
                      setWeight('');
                      setFieldError('weight', null);
                    }}
                  >
                    <Text style={[styles.unitBtnText, weightUnit === u && styles.unitBtnTextActive]}>
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
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Screen>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  kav: { flex: 1, backgroundColor: theme.colors.bg },

  topBar: { marginBottom: theme.spacing.md },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },

  title: {
    color: theme.colors.text,
    fontSize: theme.font.sizeXxl,
    fontWeight: theme.font.weightBlack,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeMd,
    marginBottom: theme.spacing.xl,
  },

  serverErrorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs,
    backgroundColor: `${theme.colors.danger}18`,
    borderWidth: 1, borderColor: `${theme.colors.danger}55`,
    borderRadius: theme.radius.md, padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  serverErrorText: { color: theme.colors.danger, fontSize: theme.font.sizeSm, flex: 1 },

  sectionLabel: {
    color: theme.colors.muted, fontSize: 11,
    fontWeight: theme.font.weightBold, letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
  },
  sectionGap: { marginTop: theme.spacing.xl },

  card: { marginBottom: 0 },

  // Strength
  strengthRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    marginTop: -theme.spacing.sm, marginBottom: theme.spacing.md,
  },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: theme.font.weightBold, minWidth: 44, textAlign: 'right' },

  showPasswordBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: -theme.spacing.sm, marginBottom: theme.spacing.md,
  },
  showPasswordText: { color: theme.colors.muted, fontSize: theme.font.sizeXs },

  // Weight row
  weightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  unitToggle: {
    flexDirection: 'column', gap: theme.spacing.xs,
    paddingTop: 26, // align with the input visually (label height approx)
  },
  unitBtn: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
    minWidth: 46, alignItems: 'center',
  },
  unitBtnActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  unitBtnText: { color: theme.colors.muted, fontSize: theme.font.sizeSm, fontWeight: theme.font.weightMedium },
  unitBtnTextActive: { color: theme.colors.accentText },

  submitBtn: { marginTop: theme.spacing.xl },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  footerText: { color: theme.colors.muted, fontSize: theme.font.sizeMd },
  footerLink: { color: theme.colors.accent, fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold },
});