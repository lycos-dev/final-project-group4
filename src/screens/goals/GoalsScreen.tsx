import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { Goal, GoalType } from '../../types';
import { Theme } from '../../theme/theme';

const GOAL_TYPES: GoalType[] = ['Weight Loss', 'Weight Gain'];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getProgress = (goal: Goal) => {
  const range = goal.targetValue - goal.startingValue;
  if (range === 0) return goal.currentValue >= goal.targetValue ? 100 : 0;
  const raw = ((goal.currentValue - goal.startingValue) / range) * 100;
  return clamp(raw, 0, 100);
};

const isGoalCompleted = (goal: Goal) => {
  if (goal.type === 'Weight Loss') return goal.currentValue <= goal.targetValue;
  return goal.currentValue >= goal.targetValue;
};

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const GoalsScreen = () => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const theme = appTheme;
  const { goals, createGoal, updateGoalProgress, deleteGoal } = useProfile();

  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('Weight Loss');
  const [targetValue, setTargetValue] = useState('');
  const [startingValue, setStartingValue] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [iosDateDraft, setIosDateDraft] = useState(new Date());

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [updateGoalId, setUpdateGoalId] = useState<string | null>(null);
  const [updateValue, setUpdateValue] = useState('');

  const [nameError, setNameError] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const goalsSorted = useMemo(
    () =>
      [...goals].sort((a, b) => {
        const aDone = isGoalCompleted(a) ? 1 : 0;
        const bDone = isGoalCompleted(b) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return b.createdAt - a.createdAt;
      }),
    [goals]
  );

  const resetCreateForm = () => {
    setGoalName('');
    setGoalType('Weight Loss');
    setTargetValue('');
    setStartingValue('');
    setDeadline(new Date());
    setNameError(null);
    setTargetError(null);
    setStartError(null);
    setShowTypePicker(false);
    setShowDatePicker(false);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setShowTypePicker(false);
    setShowDatePicker(false);
  };

  const onCreateGoal = () => {
    const name = goalName.trim();
    const targetRaw = targetValue.trim();
    const startRaw = startingValue.trim();
    const targetNum = Number(targetRaw);
    const startNum = Number(startRaw);

    let hasError = false;
    if (!name) {
      setNameError('Goal name is required.');
      hasError = true;
    } else {
      setNameError(null);
    }

    if (!targetRaw) {
      setTargetError('Target value is required.');
      hasError = true;
    } else if (!Number.isFinite(targetNum)) {
      setTargetError('Enter a valid target value.');
      hasError = true;
    } else {
      setTargetError(null);
    }

    if (!startRaw) {
      setStartError('Starting value is required.');
      hasError = true;
    } else if (!Number.isFinite(startNum)) {
      setStartError('Enter a valid starting value.');
      hasError = true;
    } else {
      setStartError(null);
    }

    if (!hasError) {
      if (goalType === 'Weight Loss' && !(targetNum < startNum)) {
        setTargetError('For Weight Loss, target must be less than starting value.');
        hasError = true;
      }

      if (goalType === 'Weight Gain' && !(targetNum > startNum)) {
        setTargetError('For Weight Gain, target must be greater than starting value.');
        hasError = true;
      }
    }

    if (hasError) return;

    createGoal({
      name,
      type: goalType,
      targetValue: targetNum,
      startingValue: startNum,
      deadline: deadline.toISOString(),
    });

    resetCreateForm();
    setShowCreateModal(false);
  };

  const openDatePicker = () => {
    setShowTypePicker(false);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: deadline,
        mode: 'date',
        minimumDate: new Date(),
        onChange: onAndroidDateChange,
      });
      return;
    }
    setIosDateDraft(deadline);
    setShowDatePicker(true);
  };

  const onAndroidDateChange = (event: any, selectedDate?: Date) => {
    if (event?.type === 'set' && selectedDate) {
      setDeadline(selectedDate);
    }
    setShowDatePicker(false);
  };

  const applyIosDate = () => {
    setDeadline(iosDateDraft);
    setShowDatePicker(false);
  };

  const openUpdateModal = (goal: Goal) => {
    setUpdateGoalId(goal.id);
    setUpdateValue(String(goal.currentValue));
    setUpdateError(null);
  };

  const closeUpdateModal = () => {
    setUpdateGoalId(null);
    setUpdateValue('');
    setUpdateError(null);
  };

  const onSaveProgress = () => {
    if (!updateGoalId) return;
    const num = Number(updateValue);
    if (!Number.isFinite(num)) {
      setUpdateError('Enter a valid current value.');
      return;
    }
    updateGoalProgress(updateGoalId, num);
    closeUpdateModal();
  };

  const onDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Delete goal?',
      `This will remove "${goal.name}" from your tracker.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
      ]
    );
  };

  const activeUpdateGoal = goals.find((g) => g.id === updateGoalId) ?? null;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Goal Tracker</Text>
        <Text style={styles.subtitle}>Create goals, then tap a goal card to update its current value anytime.</Text>
      </View>

      <Button title="Create Goal" onPress={openCreateModal} fullWidth style={styles.createLaunchBtn} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Goals</Text>
        <Text style={styles.goalCount}>{goals.length}</Text>
      </View>

      {goalsSorted.length === 0 ? (
        <EmptyState
          icon="flag-outline"
          title="No goals yet"
          subtitle="Create your first goal above and start tracking progress manually."
        />
      ) : (
        goalsSorted.map((goal) => {
          const completed = isGoalCompleted(goal);
          const progress = getProgress(goal);

          return (
            <Card
              key={goal.id}
              onPress={completed ? undefined : () => openUpdateModal(goal)}
              style={[
                styles.goalCard,
                ...(completed ? [styles.goalCardCompleted] : []),
              ]}
            >
              <View style={styles.goalTopRow}>
                <View style={styles.goalTitleWrap}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <View style={styles.goalMetaRow}>
                    <Chip label={goal.type} active />
                    <Text style={styles.deadline}>Due {formatDate(goal.deadline)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => onDeleteGoal(goal)} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={theme.colors.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.valueRow}>
                <Text style={styles.valueText}>Start: {goal.startingValue}</Text>
                <Text style={styles.valueText}>Current: {goal.currentValue}</Text>
                <Text style={styles.valueText}>Target: {goal.targetValue}</Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }, completed && styles.progressFillCompleted]} />
              </View>

              <View style={styles.bottomRow}>
                <Text style={styles.progressLabel}>{Math.round(progress)}% complete</Text>
                {completed ? (
                  <View style={styles.completedBadge}>
                    <Ionicons name="sparkles" size={14} color={theme.colors.accentText} />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                ) : (
                  <Button title="Update Progress" onPress={() => openUpdateModal(goal)} variant="secondary" />
                )}
              </View>
              {!completed ? <Text style={styles.tapHint}>Tap card or button to update value</Text> : null}
            </Card>
          );
        })
      )}

      <Modal transparent visible={showCreateModal} animationType="fade" onRequestClose={closeCreateModal}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Create Goal</Text>
              <TouchableOpacity onPress={closeCreateModal} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
                <Ionicons name="close" size={20} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Goal Name"
              placeholder="Lose Weight"
              value={goalName}
              onChangeText={setGoalName}
              error={nameError}
            />

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Goal Type</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowTypePicker((prev) => !prev)}>
                <Text style={styles.dropdownText}>{goalType}</Text>
                <Ionicons name={showTypePicker ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.muted} />
              </TouchableOpacity>
              {showTypePicker && (
                <View style={styles.dropdownMenu}>
                  {GOAL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.dropdownItem, type === goalType && styles.dropdownItemActive]}
                      onPress={() => {
                        setGoalType(type);
                        setShowTypePicker(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, type === goalType && styles.dropdownItemTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Input
              label="Target Value"
              placeholder="0"
              keyboardType="numeric"
              value={targetValue}
              onChangeText={setTargetValue}
              error={targetError}
            />

            <Input
              label="Starting Value"
              placeholder="0"
              keyboardType="numeric"
              value={startingValue}
              onChangeText={setStartingValue}
              error={startError}
            />

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Deadline</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={openDatePicker}>
                <Text style={styles.dropdownText}>{formatDate(deadline.toISOString())}</Text>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.muted} />
              </TouchableOpacity>

              {showDatePicker && Platform.OS === 'ios' ? (
                <View style={styles.iosDatePickerWrap}>
                  <DateTimePicker
                    value={iosDateDraft}
                    mode="date"
                    display="inline"
                    minimumDate={new Date()}
                    onChange={(_event, selectedDate) => {
                      if (selectedDate) setIosDateDraft(selectedDate);
                    }}
                  />
                  <View style={styles.modalActions}>
                    <Button title="Cancel" onPress={() => setShowDatePicker(false)} variant="ghost" />
                    <Button title="Save Date" onPress={applyIosDate} />
                  </View>
                </View>
              ) : null}
            </View>

            <Button title="Create Goal" onPress={onCreateGoal} fullWidth />
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal transparent visible={!!activeUpdateGoal} animationType="fade" onRequestClose={closeUpdateModal}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
                <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Progress</Text>
            <Text style={styles.modalSub}>{activeUpdateGoal?.name}</Text>
            <Input
              label="Current Value"
              value={updateValue}
              onChangeText={setUpdateValue}
              keyboardType="numeric"
              error={updateError}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={closeUpdateModal} variant="ghost" />
              <Button title="Save" onPress={onSaveProgress} />
            </View>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
};

const createStyles = (appTheme: Theme) => {
  const theme = appTheme;

  return StyleSheet.create({
  header: { marginBottom: theme.spacing.lg },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.sizeXxl,
    fontWeight: theme.font.weightBold,
  },
  subtitle: {
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
    fontSize: theme.font.sizeSm,
    lineHeight: 20,
  },

  createLaunchBtn: { marginBottom: theme.spacing.xl },

  fieldBlock: { marginBottom: theme.spacing.lg },
  fieldLabel: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightMedium,
    marginBottom: theme.spacing.xs,
  },
  dropdownBtn: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
  },
  dropdownMenu: {
    marginTop: theme.spacing.xs,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(198, 255, 61, 0.14)',
  },
  dropdownItemText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeSm,
  },
  dropdownItemTextActive: {
    color: theme.colors.accent,
    fontWeight: theme.font.weightBold,
  },
  iosDatePickerWrap: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
  },
  goalCount: {
    color: theme.colors.accent,
    fontWeight: theme.font.weightBold,
    fontSize: theme.font.sizeMd,
  },

  goalCard: { marginBottom: theme.spacing.md },
  goalCardCompleted: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surfaceAlt,
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  goalTitleWrap: { flex: 1 },
  goalName: {
    color: theme.colors.text,
    fontWeight: theme.font.weightBold,
    fontSize: theme.font.sizeLg,
    marginBottom: theme.spacing.sm,
  },
  goalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  deadline: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
  },

  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  valueText: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
  },

  progressTrack: {
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  progressFillCompleted: {
    backgroundColor: theme.colors.success,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  progressLabel: {
    color: theme.colors.text,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightMedium,
  },
  tapHint: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeXs,
    marginTop: theme.spacing.sm,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.success,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
  },
  completedText: {
    color: theme.colors.accentText,
    fontWeight: theme.font.weightBold,
    fontSize: theme.font.sizeSm,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  modalSub: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  });
};
