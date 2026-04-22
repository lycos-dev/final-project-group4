import React, { useLayoutEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { useRoutine } from '../../context/RoutineContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export const RoutinesScreen = () => {
  const nav = useNavigation<Nav>();
  const { routines, setCurrentRoutine } = useRoutine();

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <IconButton
          name="add"
          onPress={() => {
            setCurrentRoutine(null);
            nav.navigate('CreateRoutine' as any);
          }}
          color={theme.colors.accent}
          size={24}
        />
      ),
    });
  }, [nav]);

  const onSelectRoutine = (routineId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (routine) {
      setCurrentRoutine(routine);
      nav.navigate('CreateRoutine' as any, { routineId });
    }
  };

  const renderRoutineItem = ({ item }: { item: typeof routines[0] }) => (
    <TouchableOpacity
      onPress={() => onSelectRoutine(item.id)}
      activeOpacity={0.7}
    >
      <Card style={styles.routineCard}>
        <View style={styles.routineHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.routineName}>{item.name}</Text>
            <Text style={styles.exerciseCount}>
              {item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={theme.colors.muted}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (routines.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="barbell"
          title="Routine Builder"
          subtitle="Create custom routines to organize your workouts."
          ctaLabel="Create Routine"
          onCtaPress={() => {
            setCurrentRoutine(null);
            nav.navigate('CreateRoutine' as any);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={routines}
        renderItem={renderRoutineItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  routineCard: {
    padding: theme.spacing.md,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineName: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: theme.spacing.xs,
  },
  exerciseCount: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
  },
});
