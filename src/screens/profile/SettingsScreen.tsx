import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';

export const SettingsScreen = () => {
  const { settings, updateSettings } = useProfile();
  const { logout } = useAuth();
  const { isDark, setMode, theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);

  return (
    <Screen scroll>
      <Text style={styles.section}>Preferences</Text>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Appearance</Text>
            <Text style={styles.sub}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
          </View>
          <ThemeToggle
            value={isDark}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Units</Text>
            <Text style={styles.sub}>{settings.units === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lb, in)'}</Text>
          </View>
          <Switch
            value={settings.units === 'imperial'}
            onValueChange={(v) => updateSettings({ units: v ? 'imperial' : 'metric' })}
            trackColor={{ false: appTheme.colors.border, true: appTheme.colors.accent }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Notifications</Text>
            <Text style={styles.sub}>Workout reminders & tips</Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(v) => updateSettings({ notifications: v })}
            trackColor={{ false: appTheme.colors.border, true: appTheme.colors.accent }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      <Text style={styles.section}>About</Text>
      <Card style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.label}>App</Text>
          <Text style={styles.sub}>NEXA</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.sub}>1.0.0</Text>
        </View>
      </Card>

      <Button title="Log Out" variant="destructive" onPress={logout} style={{ marginTop: theme.spacing.lg }} />
    </Screen>
  );
};

const createStyles = (appTheme: typeof theme) =>
  StyleSheet.create({
    section: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeXs,
      fontWeight: appTheme.font.weightBold,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: appTheme.spacing.md,
      marginBottom: appTheme.spacing.sm,
    },
    card: { marginBottom: appTheme.spacing.md },
    row: { flexDirection: 'row', alignItems: 'center' },
    aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: appTheme.spacing.xs },
    label: { color: appTheme.colors.text, fontSize: appTheme.font.sizeMd, fontWeight: appTheme.font.weightMedium },
    sub: { color: appTheme.colors.muted, fontSize: appTheme.font.sizeSm, marginTop: 2 },
  });
