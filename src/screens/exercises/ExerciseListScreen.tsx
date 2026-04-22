import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, FlatList, Modal, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';
import { useRoutine } from '../../context/RoutineContext';
import { Routine } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ExerciseListScreen = () => {
  const nav = useNavigation<Nav>();
  const { routines, setCurrentRoutine, deleteRoutine } = useRoutine();
  const [selectedMenuRoutine, setSelectedMenuRoutine] = useState<Routine | null>(null);

  const handleStartRoutine = (routineId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (routine) {
      nav.navigate('LogWorkout', { exercisesToAdd: routine.exercises });
    }
  };

  const handleNewRoutine = () => {
    setCurrentRoutine(null);
    nav.navigate('CreateRoutine' as any);
  };

  const handleShareRoutine = async (routine: Routine) => {
    try {
      await Share.share({
        message: `Check out my routine: ${routine.name}\n\nExercises: ${routine.exercises.map((e) => e.name).join(', ')}`,
        title: routine.name,
      });
    } catch (error) {
      console.error('Error sharing routine:', error);
    }
    setSelectedMenuRoutine(null);
  };

  const handleDuplicateRoutine = (routine: Routine) => {
    // Create a copy of the routine with a new ID and name
    const newRoutine: Routine = {
      ...routine,
      id: `${routine.id}-copy-${Date.now()}`,
      name: `${routine.name} (Copy)`,
      createdAt: Date.now(),
    };
    setCurrentRoutine(newRoutine);
    setSelectedMenuRoutine(null);
  };

  const handleEditRoutine = (routine: Routine) => {
    setCurrentRoutine(routine);
    nav.navigate('CreateRoutine' as any, { routineId: routine.id });
    setSelectedMenuRoutine(null);
  };

  const handleDeleteRoutine = (routineId: string) => {
    deleteRoutine(routineId);
    setSelectedMenuRoutine(null);
  };

  const renderRoutineItem = ({ item }: { item: typeof routines[0] }) => (
    <Card style={styles.routineCard}>
      <View style={styles.routineHeader}>
        <View style={styles.routineContent}>
          <Text style={styles.routineName}>{item.name}</Text>
          <Text style={styles.exerciseList}>
            {item.exercises.map((ex) => ex.name).join(', ')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSelectedMenuRoutine(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => handleStartRoutine(item.id)}
        style={styles.startButton}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>Start Routine</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
        {/* Header */}
        <View style={styles.topSection}>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Exercises</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <Button
            title="Start New Workout"
            onPress={() => nav.navigate('LogWorkout', { exercisesToAdd: [] })}
            fullWidth
            style={styles.primaryButton}
          />

          {/* Quick Action Cards */}
          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleNewRoutine}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="pencil-box-outline" size={40} color={theme.colors.accent} />
              <Text style={styles.cardTitle}>New Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={40} color={theme.colors.accent} />
              <Text style={styles.cardTitle}>Explore</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Routines Section */}
        {routines.length > 0 && (
          <View style={styles.routinesSection}>
            <Text style={styles.myRoutinesTitle}>
              My Routines ({routines.length})
            </Text>
            <FlatList
              data={routines}
              renderItem={renderRoutineItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
            />
          </View>
        )}
      </ScrollView>

      {/* Routine Menu Modal */}
      <Modal
        visible={selectedMenuRoutine !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMenuRoutine(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMenuRoutine(null)}
        >
          <View style={styles.menuModalContent}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>{selectedMenuRoutine?.name}</Text>
            </View>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => selectedMenuRoutine && handleShareRoutine(selectedMenuRoutine)}
            >
              <Ionicons name="share-social" size={24} color={theme.colors.accent} />
              <Text style={styles.menuOptionText}>Share Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => selectedMenuRoutine && handleDuplicateRoutine(selectedMenuRoutine)}
            >
              <MaterialCommunityIcons name="content-duplicate" size={24} color={theme.colors.accent} />
              <Text style={styles.menuOptionText}>Duplicate Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => selectedMenuRoutine && handleEditRoutine(selectedMenuRoutine)}
            >
              <Ionicons name="pencil" size={24} color={theme.colors.accent} />
              <Text style={styles.menuOptionText}>Edit Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuOption, styles.menuOptionDanger]}
              onPress={() => selectedMenuRoutine && handleDeleteRoutine(selectedMenuRoutine.id)}
            >
              <MaterialCommunityIcons name="delete" size={24} color="#FF4444" />
              <Text style={[styles.menuOptionText, styles.menuOptionDangerText]}>Delete Routine</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  topSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  proBadgeText: {
    color: '#000',
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  primaryButton: {
    marginBottom: theme.spacing.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  routinesSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  myRoutinesTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: theme.spacing.md,
  },
  routineCard: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  routineContent: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  routineName: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: theme.spacing.xs,
  },
  exerciseList: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    lineHeight: 18,
  },
  startButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  menuButton: {
    padding: theme.spacing.sm,
    marginRight: -theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuModalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  menuHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    textAlign: 'center',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  menuOptionText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
  },
  menuOptionDanger: {
    borderBottomWidth: 0,
  },
  menuOptionDangerText: {
    color: '#FF4444',
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
});
