import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/theme';

export const SettingsScreen = () => {
  const { settings, updateSettings } = useProfile();
  const { logout } = useAuth();

  return (
    <Screen scroll>
      <Text style={styles.section}>Preferences</Text>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Units</Text>
            <Text style={styles.sub}>{settings.units === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lb, in)'}</Text>
          </View>
          <Switch
            value={settings.units === 'imperial'}
            onValueChange={(v) => updateSettings({ units: v ? 'imperial' : 'metric' })}
            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
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
            trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
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

const styles = StyleSheet.create({
  section: { color: theme.colors.muted, fontSize: theme.font.sizeXs, fontWeight: theme.font.weightBold, textTransform: 'uppercase', letterSpacing: 1, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  card: { marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.xs },
  label: { color: theme.colors.text, fontSize: theme.font.sizeMd, fontWeight: theme.font.weightMedium },
  sub: { color: theme.colors.muted, fontSize: theme.font.sizeSm, marginTop: 2 },
});
