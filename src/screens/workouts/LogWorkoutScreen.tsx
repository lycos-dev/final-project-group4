import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { theme } from "../../theme/theme";
import {
  useWorkout,
  LogExercise,
  WorkoutSet,
  SetType,
} from "../../context/WorkoutContext";

type Props = NativeStackScreenProps<RootStackParamList, "LogWorkout">;

interface ActiveRestTimer {
  exerciseId: string;
  setId: string;
  remainingTime: number;
  duration: number;
}

const REST_TIMER_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "5s", value: 5 },
  { label: "10s", value: 10 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
];

const SET_TYPE_INFO: Record<
  SetType | "remove",
  { title: string; body: string }
> = {
  normal: {
    title: "Normal Set",
    body: "A standard working set. Counted as a regular numbered set in your workout volume.",
  },
  warmup: {
    title: "Warm-Up Set",
    body: 'A lighter prep set used to ready your muscles. Marked with a yellow "W" and not counted as a working set.',
  },
  failure: {
    title: "Failure Set",
    body: 'A set taken to (or near) muscular failure. Marked with a red "F" so you can spot maximum-effort sets.',
  },
  remove: {
    title: "Remove Set",
    body: "Deletes this set entirely from the exercise.",
  },
};

const SET_TYPE_OPTIONS: {
  key: SetType | "remove";
  label: string;
  color: string;
}[] = [
  { key: "normal", label: "Normal Set", color: theme.colors.text },
  { key: "warmup", label: "Warm-Up Set", color: "#F5C518" },
  { key: "failure", label: "Failure Set", color: theme.colors.danger },
  { key: "remove", label: "Remove Set", color: theme.colors.muted },
];

// ── Scrollable minute picker ───────────────────────────────────────────
const ITEM_HEIGHT = 44;
const VISIBLE = 5;
const MAX_MIN = 600;

const MinutePicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    setTimeout(
      () => ref.current?.scrollTo({ y: value * ITEM_HEIGHT, animated: false }),
      0,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE }}>
      <View style={pickStyles.selectionBand} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          onChange(Math.max(0, Math.min(MAX_MIN, i)));
        }}
      >
        {Array.from({ length: MAX_MIN + 1 }).map((_, i) => (
          <View key={i} style={pickStyles.row}>
            <Text
              style={[
                pickStyles.rowText,
                i === value && pickStyles.rowTextActive,
              ]}
            >
              {i} min
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const pickStyles = StyleSheet.create({
  selectionBand: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(198, 255, 61, 0.06)",
  },
  row: { height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" },
  rowText: { color: theme.colors.muted, fontSize: 16, fontWeight: "600" },
  rowTextActive: {
    color: theme.colors.accent,
    fontSize: 22,
    fontWeight: "800",
  },
});

export const LogWorkoutScreen = ({ navigation, route }: Props) => {
  const {
    exercises,
    setExercises,
    addExercises,
    clearWorkout,
    startTime,
    setStartTime,
    isPaused,
    togglePause,
    ensureStarted,
    getElapsedSeconds,
    setMinimized,
  } = useWorkout();

  // Make sure a workout is "started" when this screen mounts
  useEffect(() => {
    ensureStarted();
    setMinimized(false); // expanding from mini-bar lands here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed exercises from route param
  useEffect(() => {
    const toAdd = route.params?.exercisesToAdd;
    if (toAdd && toAdd.length > 0) addExercises(toAdd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [, tick] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  const [showRestTimerModal, setShowRestTimerModal] = useState<string | null>(
    null,
  );
  const [activeRestTimer, setActiveRestTimer] =
    useState<ActiveRestTimer | null>(null);
  const [showExerciseMenu, setShowExerciseMenu] = useState<string | null>(null);

  // Duration / start-time edit modal
  const [durationOpen, setDurationOpen] = useState(false);
  const [draftMinutes, setDraftMinutes] = useState(0);
  const [draftStart, setDraftStart] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // Set-type modal
  const [setTypeTarget, setSetTypeTarget] = useState<{
    exerciseId: string;
    setId: string;
  } | null>(null);
  const [setTypeInfo, setSetTypeInfo] = useState<SetType | "remove" | null>(
    null,
  );

  // Tick every second to drive the duration label
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Calculate stats
  useEffect(() => {
    let volume = 0;
    let completedSets = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed && set.type !== "warmup") {
          completedSets++;
          volume += Number(set.weight) * Number(set.reps);
        }
      });
    });
    setTotalVolume(volume);
    setTotalSets(completedSets);
  }, [exercises]);

  // Rest timer countdown
  useEffect(() => {
    if (!activeRestTimer) return;
    const interval = setInterval(() => {
      setActiveRestTimer((prev) => {
        if (!prev) return null;
        if (prev.remainingTime <= 1) return null;
        return { ...prev, remainingTime: prev.remainingTime - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRestTimer]);

  // ── helpers ────────────────────────────────────────────────────────
  const elapsed = getElapsedSeconds();
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: "reps" | "weight",
    value: string,
  ) => {
    setExercises((prev: LogExercise[]) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, [field]: value } : s,
              ),
            }
          : ex,
      ),
    );
  };

  const toggleSetCompletion = (exerciseId: string, setId: string) => {
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    const set = exercise?.sets.find((s) => s.id === setId);

    setExercises((prev: LogExercise[]) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, completed: !s.completed } : s,
              ),
            }
          : ex,
      ),
    );

    if (set && !set.completed && exercise && exercise.restTimerDuration > 0) {
      setActiveRestTimer({
        exerciseId,
        setId,
        remainingTime: exercise.restTimerDuration,
        duration: exercise.restTimerDuration,
      });
    }
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev: LogExercise[]) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: `${exerciseId}-set-${ex.sets.length}-${Date.now()}`,
                  reps: String(ex.defaultReps),
                  weight: "0",
                  completed: false,
                  type: "normal" as SetType,
                },
              ],
            }
          : ex,
      ),
    );
  };

  const setSetType = (
    exerciseId: string,
    setId: string,
    type: SetType | "remove",
  ) => {
    if (type === "remove") {
      setExercises((prev: LogExercise[]) =>
        prev.map((ex) =>
          ex.id === exerciseId
            ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
            : ex,
        ),
      );
    } else {
      setExercises((prev: LogExercise[]) =>
        prev.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((s) => (s.id === setId ? { ...s, type } : s)),
              }
            : ex,
        ),
      );
    }
    setSetTypeTarget(null);
  };

  const updateRestTimerDuration = (exerciseId: string, duration: number) => {
    setExercises((prev: LogExercise[]) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, restTimerDuration: duration } : ex,
      ),
    );
    setShowRestTimerModal(null);
  };

  const skipRestTimer = () => setActiveRestTimer(null);
  const adjustRestTimer = (delta: number) =>
    setActiveRestTimer((prev) =>
      prev
        ? { ...prev, remainingTime: Math.max(0, prev.remainingTime + delta) }
        : null,
    );

  const handleAddExercise = () => navigation.navigate("AddExercise");
  const handleFinish = () => {
    clearWorkout(route.params?.routineName);
    navigation.goBack();
  };
  const handleDiscard = () =>
    Alert.alert("Discard workout?", "You will lose your in-progress sets.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          clearWorkout();
          navigation.goBack();
        },
      },
    ]);

  // ── Back chevron animation: rotate down when minimizing ──
  const backRotate = useRef(new Animated.Value(0)).current;
  const handleMinimize = () => {
    Animated.sequence([
      Animated.timing(backRotate, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(backRotate, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMinimized(true);
      navigation.goBack();
    });
  };
  const backTranslateY = backRotate.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  // ── Duration modal helpers ──
  const openDurationModal = () => {
    setDraftMinutes(Math.floor(elapsed / 60));
    setDraftStart(startTime ? new Date(startTime) : new Date());
    setDurationOpen(true);
  };
  const saveDurationModal = () => {
    const startedAtChanged = !startTime || draftStart.getTime() !== startTime;
    if (startedAtChanged) {
      setStartTime(draftStart.getTime());
    } else {
      setStartTime(Date.now() - draftMinutes * 60_000);
    }
    setDurationOpen(false);
  };

  return (
    <Screen padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleMinimize}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.View
            style={{ transform: [{ translateY: backTranslateY }] }}
          >
            <Ionicons name="chevron-down" size={28} color={theme.colors.text} />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Workout</Text>
        <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <TouchableOpacity
          style={styles.statItem}
          onPress={openDurationModal}
          activeOpacity={0.6}
        >
          <Text style={styles.statLabel}>
            Duration {isPaused ? "· paused" : ""}
          </Text>
          <Text
            style={[
              styles.statValue,
              isPaused && { color: theme.colors.muted },
            ]}
          >
            {formatDuration(elapsed)}
          </Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>{totalVolume} kg</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Sets</Text>
          <Text style={styles.statValue}>{totalSets}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="human-male"
            size={24}
            color={theme.colors.accent}
          />
          <MaterialCommunityIcons
            name="human-male"
            size={24}
            color={theme.colors.accent}
            style={{ marginLeft: theme.spacing.xs }}
          />
        </View>
      </View>

      {/* Exercises List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <EmptyState
            icon="fitness"
            title="Get started"
            subtitle="Add an exercise to start your workout"
          />
        ) : (
          <View style={styles.exercisesList}>
            {exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseHeaderContent}>
                    <View style={styles.exerciseIcon}>
                      <Ionicons
                        name="barbell"
                        size={32}
                        color={theme.colors.accent}
                      />
                    </View>
                    <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setShowExerciseMenu(exercise.id)}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={20}
                      color={theme.colors.muted}
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Add notes here..."
                  style={styles.notesInput}
                  placeholderTextColor={theme.colors.muted}
                />

                <TouchableOpacity
                  style={styles.restTimerButton}
                  onPress={() => setShowRestTimerModal(exercise.id)}
                >
                  <Ionicons
                    name="timer"
                    size={20}
                    color={theme.colors.accent}
                  />
                  <Text style={styles.restTimerText}>
                    Rest Timer:{" "}
                    {exercise.restTimerDuration > 0
                      ? `${exercise.restTimerDuration}s`
                      : "OFF"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.setsContainer}>
                  <View style={styles.setsHeaderRow}>
                    <Text style={[styles.setGridCell, styles.setLabel]}>
                      SET
                    </Text>
                    <Text style={[styles.setGridCell, styles.setLabel]}>
                      PREVIOUS
                    </Text>
                    <Text style={[styles.setGridCell, styles.setLabel]}>
                      KG
                    </Text>
                    <Text style={[styles.setGridCell, styles.setLabel]}>
                      REPS
                    </Text>
                    <View style={styles.setCheckbox} />
                  </View>

                  {exercise.sets.map((set, index) => {
                    const numColor =
                      set.type === "warmup"
                        ? "#F5C518"
                        : set.type === "failure"
                          ? theme.colors.danger
                          : theme.colors.text;
                    const numLabel =
                      set.type === "warmup"
                        ? "W"
                        : set.type === "failure"
                          ? "F"
                          : String(index + 1);

                    return (
                      <View key={set.id} style={styles.setRow}>
                        <TouchableOpacity
                          style={styles.setGridCell}
                          onPress={() =>
                            setSetTypeTarget({
                              exerciseId: exercise.id,
                              setId: set.id,
                            })
                          }
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={[styles.setNumber, { color: numColor }]}>
                            {numLabel}
                          </Text>
                        </TouchableOpacity>
                        <Text
                          style={[styles.setGridCell, styles.previousValue]}
                        >
                          -
                        </Text>
                        <TextInput
                          style={[styles.setGridCell, styles.setInput]}
                          value={set.weight}
                          onChangeText={(val) =>
                            updateSet(exercise.id, set.id, "weight", val)
                          }
                          keyboardType="decimal-pad"
                          placeholderTextColor={theme.colors.muted}
                        />
                        <TextInput
                          style={[styles.setGridCell, styles.setInput]}
                          value={set.reps}
                          onChangeText={(val) =>
                            updateSet(exercise.id, set.id, "reps", val)
                          }
                          keyboardType="number-pad"
                          placeholderTextColor={theme.colors.muted}
                        />
                        <TouchableOpacity
                          style={[
                            styles.setCheckbox,
                            set.completed && styles.setCheckboxChecked,
                          ]}
                          onPress={() =>
                            toggleSetCompletion(exercise.id, set.id)
                          }
                        >
                          {set.completed && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => addSet(exercise.id)}
                >
                  <Text style={styles.addSetButtonText}>+ Add Set</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <Button
          title="+ Add Exercise"
          onPress={handleAddExercise}
          fullWidth
          style={styles.addButton}
        />
        <View style={styles.bottomButtons}>
          <Button
            title="Settings"
            onPress={() => {}}
            style={styles.halfButton}
            variant="secondary"
          />
          <Button
            title="Discard Workout"
            onPress={handleDiscard}
            style={styles.halfButton}
            variant="destructive"
          />
        </View>
      </View>

      {/* ── Rest Timer Modal ────────────────────────────────────────── */}
      <Modal
        visible={showRestTimerModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRestTimerModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rest Timer</Text>
            {showRestTimerModal && (
              <Text style={styles.modalSubtitle}>
                {exercises.find((ex) => ex.id === showRestTimerModal)?.name}
              </Text>
            )}
            {REST_TIMER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timerOption,
                  showRestTimerModal &&
                    exercises.find((ex) => ex.id === showRestTimerModal)
                      ?.restTimerDuration === option.value &&
                    styles.timerOptionSelected,
                ]}
                onPress={() =>
                  showRestTimerModal &&
                  updateRestTimerDuration(showRestTimerModal, option.value)
                }
              >
                <Text style={styles.timerOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <Button
              title="Done"
              onPress={() => setShowRestTimerModal(null)}
              fullWidth
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* ── Active Rest Display ─────────────────────────────────────── */}
      {activeRestTimer && (
        <View style={styles.restTimerOverlay}>
          <View style={styles.restTimerDisplay}>
            <Text style={styles.restTimerDisplayTitle}>Rest Timer</Text>
            <Text style={styles.restTimerDisplayExercise}>
              {
                exercises.find((ex) => ex.id === activeRestTimer.exerciseId)
                  ?.name
              }
            </Text>
            <View style={styles.restTimerContent}>
              <TouchableOpacity
                style={styles.timerAdjustButton}
                onPress={() => adjustRestTimer(-15)}
              >
                <Text style={styles.timerAdjustText}>-15</Text>
              </TouchableOpacity>
              <Text style={styles.timerDisplay}>
                {String(
                  Math.floor(activeRestTimer.remainingTime / 60),
                ).padStart(2, "0")}
                :{String(activeRestTimer.remainingTime % 60).padStart(2, "0")}
              </Text>
              <TouchableOpacity
                style={styles.timerAdjustButton}
                onPress={() => adjustRestTimer(15)}
              >
                <Text style={styles.timerAdjustText}>+15</Text>
              </TouchableOpacity>
            </View>
            <Button
              title="Skip"
              onPress={skipRestTimer}
              fullWidth
              style={styles.skipButton}
            />
          </View>
        </View>
      )}

      {/* ── Exercise Menu Modal ─────────────────────────────────────── */}
      <Modal
        visible={showExerciseMenu !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseMenu(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowExerciseMenu(null)}
        >
          <View style={styles.menuContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowExerciseMenu(null)}
            >
              <Ionicons
                name="swap-vertical"
                size={20}
                color={theme.colors.accent}
              />
              <Text style={styles.menuItemText}>Reorder Exercises</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowExerciseMenu(null)}
            >
              <MaterialCommunityIcons
                name="sync"
                size={20}
                color={theme.colors.accent}
              />
              <Text style={styles.menuItemText}>Replace Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowExerciseMenu(null)}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color={theme.colors.accent}
              />
              <Text style={styles.menuItemText}>Add To Superset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                if (showExerciseMenu)
                  setExercises((prev: LogExercise[]) =>
                    prev.filter((ex) => ex.id !== showExerciseMenu),
                  );
                setShowExerciseMenu(null);
              }}
            >
              <Ionicons name="trash" size={20} color="#ff6b6b" />
              <Text style={[styles.menuItemText, { color: "#ff6b6b" }]}>
                Remove Exercise
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Duration / Start time / Pause modal ─────────────────────── */}
      <Modal
        visible={durationOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDurationOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDurationOpen(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Workout time</Text>

            <Text style={styles.fieldLabel}>DURATION</Text>
            <MinutePicker value={draftMinutes} onChange={setDraftMinutes} />

            <Text style={[styles.fieldLabel, { marginTop: theme.spacing.lg }]}>
              START TIME
            </Text>
            <View style={styles.startRow}>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => setShowDate(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={theme.colors.accent}
                />
                <Text style={styles.startBtnText}>
                  {draftStart.toDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => setShowTime(true)}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={theme.colors.accent}
                />
                <Text style={styles.startBtnText}>
                  {draftStart.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDate && (
              <DateTimePicker
                value={draftStart}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(_e, d) => {
                  setShowDate(Platform.OS === "ios");
                  if (d) {
                    const next = new Date(draftStart);
                    next.setFullYear(
                      d.getFullYear(),
                      d.getMonth(),
                      d.getDate(),
                    );
                    setDraftStart(next);
                  }
                }}
              />
            )}
            {showTime && (
              <DateTimePicker
                value={draftStart}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_e, d) => {
                  setShowTime(Platform.OS === "ios");
                  if (d) {
                    const next = new Date(draftStart);
                    next.setHours(d.getHours(), d.getMinutes());
                    setDraftStart(next);
                  }
                }}
              />
            )}

            <TouchableOpacity
              style={[styles.pauseBtn, isPaused && styles.pauseBtnActive]}
              onPress={togglePause}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPaused ? "play" : "pause"}
                size={18}
                color={isPaused ? theme.colors.accentText : theme.colors.text}
              />
              <Text
                style={[
                  styles.pauseBtnText,
                  isPaused && { color: theme.colors.accentText },
                ]}
              >
                {isPaused ? "Resume Workout Timer" : "Pause Workout Timer"}
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                gap: theme.spacing.sm,
                marginTop: theme.spacing.md,
              }}
            >
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setDurationOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save"
                onPress={saveDurationModal}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Set type modal ──────────────────────────────────────────── */}
      <Modal
        visible={setTypeTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSetTypeTarget(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSetTypeTarget(null)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Select Set Type</Text>
            {SET_TYPE_OPTIONS.map((opt) => (
              <View key={opt.key} style={styles.setTypeRow}>
                <TouchableOpacity
                  style={styles.setTypeMain}
                  onPress={() =>
                    setTypeTarget &&
                    setSetType(
                      setTypeTarget.exerciseId,
                      setTypeTarget.setId,
                      opt.key,
                    )
                  }
                >
                  <Text style={[styles.setTypeLabel, { color: opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.helpBtn}
                  onPress={() => setSetTypeInfo(opt.key)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={20}
                    color={theme.colors.muted}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setSetTypeTarget(null)}
              fullWidth
              style={{ marginTop: theme.spacing.sm }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Set type info modal ─────────────────────────────────────── */}
      <Modal
        visible={setTypeInfo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSetTypeInfo(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSetTypeInfo(null)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {setTypeInfo && (
              <>
                <Text style={styles.modalTitle}>
                  {SET_TYPE_INFO[setTypeInfo].title}
                </Text>
                <Text style={styles.modalBody}>
                  {SET_TYPE_INFO[setTypeInfo].body}
                </Text>
                <Button
                  title="Got it"
                  onPress={() => setSetTypeInfo(null)}
                  fullWidth
                  style={{ marginTop: theme.spacing.md }}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  finishButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  finishButtonText: {
    color: theme.colors.accentText,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },

  statsSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLabel: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accent,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },

  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  exercisesList: { gap: theme.spacing.md, paddingBottom: theme.spacing.lg },
  exerciseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  exerciseHeaderContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.bg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  exerciseTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accent,
  },
  menuButton: { padding: theme.spacing.sm },

  notesInput: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.font.sizeSm,
    marginBottom: theme.spacing.md,
  },
  restTimerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  restTimerText: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
    marginLeft: theme.spacing.sm,
  },

  setsContainer: { marginBottom: theme.spacing.md },
  setsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  setGridCell: {
    flex: 1,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    fontSize: theme.font.sizeSm,
    color: theme.colors.text,
  },
  setLabel: {
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
    textAlign: "center",
  },
  setNumber: {
    fontWeight: theme.font.weightBold,
    fontSize: theme.font.sizeMd,
    textAlign: "center",
  },
  previousValue: { color: theme.colors.muted },
  setInput: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.sm,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  setCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  setCheckboxChecked: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  addSetButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bg,
  },
  addSetButtonText: {
    color: theme.colors.muted,
    fontWeight: theme.font.weightBold,
  },

  actionsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  addButton: {},
  bottomButtons: { flexDirection: "row", gap: theme.spacing.sm },
  halfButton: { flex: 1 },

  /* ── Modal common ─────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  modalSubtitle: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  modalBody: {
    color: theme.colors.text,
    fontSize: theme.font.sizeSm,
    lineHeight: 20,
  },
  modalButton: { marginTop: theme.spacing.md },

  timerOption: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderRadius: theme.radius.sm,
    marginBottom: 4,
  },
  timerOptionSelected: { backgroundColor: "rgba(198, 255, 61, 0.12)" },
  timerOptionText: {
    color: theme.colors.text,
    fontWeight: theme.font.weightBold,
  },

  restTimerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  restTimerDisplay: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: "100%",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  restTimerDisplayTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    textAlign: "center",
  },
  restTimerDisplayExercise: {
    color: theme.colors.muted,
    fontSize: theme.font.sizeSm,
    textAlign: "center",
    marginTop: 4,
  },
  restTimerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: theme.spacing.lg,
  },
  timerAdjustButton: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
  },
  timerAdjustText: {
    color: theme.colors.accent,
    fontWeight: theme.font.weightBold,
  },
  timerDisplay: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: theme.font.weightBlack,
  },
  skipButton: {},

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  menuItemDanger: {
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  menuItemText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightMedium,
  },

  /* ── Duration modal extras ─────────────────────────────────────── */
  fieldLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
  },
  startRow: { flexDirection: "row", gap: theme.spacing.sm },
  startBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
  },
  startBtnText: {
    color: theme.colors.text,
    fontWeight: theme.font.weightBold,
    fontSize: theme.font.sizeSm,
  },
  pauseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.lg,
  },
  pauseBtnActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  pauseBtnText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
  },

  /* ── Set type modal extras ─────────────────────────────────────── */
  setTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  setTypeMain: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  setTypeLabel: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  helpBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
});
