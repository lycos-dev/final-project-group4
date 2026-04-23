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
  Switch,
  Vibration,
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
  WeightUnit,
} from "../../context/WorkoutContext";

type Props = NativeStackScreenProps<RootStackParamList, "LogWorkout">;

interface ActiveRestTimer {
  exerciseId: string;
  setId: string;
  remainingTime: number;
  duration: number;
}

const REST_TIMER_OPTIONS = [
  { label: "Off",   value: 0   },
  { label: "5s",    value: 5   },
  { label: "10s",   value: 10  },
  { label: "15s",   value: 15  },
  { label: "30s",   value: 30  },
  { label: "45s",   value: 45  },
  { label: "60s",   value: 60  },
  { label: "1m 30s",value: 90  },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
];

const SET_TYPE_INFO: Record<SetType | "remove", { title: string; body: string }> = {
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

const SET_TYPE_OPTIONS: { key: SetType | "remove"; label: string; color: string }[] = [
  { key: "normal",  label: "Normal Set",  color: theme.colors.text   },
  { key: "warmup",  label: "Warm-Up Set", color: "#F5C518"           },
  { key: "failure", label: "Failure Set", color: theme.colors.danger },
  { key: "remove",  label: "Remove Set",  color: theme.colors.muted  },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Formats raw seconds into a human-readable workout duration string.
 *   45      → "0m 45s"
 *   60      → "1m 0s"
 *   90      → "1m 30s"
 *   3600    → "1h 0m"
 *   3665    → "1h 1m"
 */
const formatDuration = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
};

/**
 * Formats a rest-timer duration (seconds) into a compact label.
 *   30  → "30s"
 *   90  → "1m 30s"
 *   120 → "2m"
 *   180 → "3m"
 */
const formatRestLabel = (seconds: number): string => {
  if (seconds === 0) return "OFF";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

/* ─── WheelPicker ──────────────────────────────────────────────────────────── */
const ITEM_HEIGHT = 44;
const VISIBLE     = 5;

const WheelPicker = ({
  value,
  onChange,
  count,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  count: number;
  suffix: string;
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
    <View style={{ flex: 1, height: ITEM_HEIGHT * VISIBLE }}>
      <View style={pickStyles.selectionBand} pointerEvents="none" />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          onChange(Math.max(0, Math.min(count - 1, i)));
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={pickStyles.row}>
            <Text style={[pickStyles.rowText, i === value && pickStyles.rowTextActive]}>
              {i} {suffix}
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
  rowText:       { color: theme.colors.muted,   fontSize: 16, fontWeight: "600" },
  rowTextActive: { color: theme.colors.accent,   fontSize: 22, fontWeight: "800" },
});

/* ─── Main screen ──────────────────────────────────────────────────────────── */

export const LogWorkoutScreen = ({ navigation, route }: Props) => {
  const {
    exercises,
    setExercises,
    addExercises,
    clearWorkout,
    discardWorkout,
    startTime,
    setStartTime,
    isPaused,
    togglePause,
    ensureStarted,
    getElapsedSeconds,
    setElapsedSeconds,
    setMinimized,
    settings,
    updateSettings,
  } = useWorkout();

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    ensureStarted();
    setMinimized(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const toAdd = route.params?.exercisesToAdd;
    if (toAdd && toAdd.length > 0) addExercises(toAdd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Local state ───────────────────────────────────────────────────────────
  const [, tick] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets,   setTotalSets]   = useState(0);

  const [showRestTimerModal, setShowRestTimerModal] = useState<string | null>(null);
  const [activeRestTimer,    setActiveRestTimer]    = useState<ActiveRestTimer | null>(null);
  const [showExerciseMenu,   setShowExerciseMenu]   = useState<string | null>(null);

  // Duration edit modal
  const [durationOpen,  setDurationOpen]  = useState(false);
  const [draftHours,    setDraftHours]    = useState(0);
  const [draftMinutes,  setDraftMinutes]  = useState(0);
  const [draftStart,    setDraftStart]    = useState<Date>(new Date());
  const [showDate,      setShowDate]      = useState(false);
  const [showTime,      setShowTime]      = useState(false);

  // Set-type modal
  const [setTypeTarget, setSetTypeTarget] = useState<{ exerciseId: string; setId: string } | null>(null);
  const [setTypeInfo,   setSetTypeInfo]   = useState<SetType | "remove" | null>(null);

  // Settings modal
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [restPickerOpen, setRestPickerOpen] = useState(false);

  // ── Tick every second ─────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let volume = 0;
    let sets   = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        const isWarmup = set.type === "warmup";
        if (set.completed && (settings.countWarmupInVolume || !isWarmup)) {
          sets++;
          volume += (Number(set.weight) || 0) * (Number(set.reps) || 0);
        }
      });
    });
    setTotalVolume(volume);
    setTotalSets(sets);
  }, [exercises, settings.countWarmupInVolume]);

  // ── Rest-timer countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (!activeRestTimer) return;
    const id = setInterval(() => {
      setActiveRestTimer((prev) => {
        if (!prev) return null;
        if (prev.remainingTime <= 1) return null;
        return { ...prev, remainingTime: prev.remainingTime - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [activeRestTimer]);

  // ── Exercise helpers ──────────────────────────────────────────────────────
  const elapsed = getElapsedSeconds();

  const updateSet = (exerciseId: string, setId: string, field: "reps" | "weight", value: string) => {
    setExercises((prev: LogExercise[]) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)) }
          : ex,
      ),
    );
  };

  const toggleSetCompletion = (exerciseId: string, setId: string) => {
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    const set      = exercise?.sets.find((s) => s.id === setId);

    setExercises((prev: LogExercise[]) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)) }
          : ex,
      ),
    );

    // Triggered when marking a set as COMPLETE (set.completed is still false at this point)
    if (set && !set.completed) {
      if (settings.vibrateOnSetComplete) Vibration.vibrate(60);
      if (exercise && exercise.restTimerDuration > 0 && settings.autoStartRestTimer) {
        setActiveRestTimer({
          exerciseId,
          setId,
          remainingTime: exercise.restTimerDuration,
          duration:      exercise.restTimerDuration,
        });
      }
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
                  id:        `${exerciseId}-set-${ex.sets.length}-${Date.now()}`,
                  reps:      String(ex.defaultReps ?? ""),
                  weight:    "0",
                  completed: false,
                  type:      "normal" as SetType,
                },
              ],
            }
          : ex,
      ),
    );
  };

  const setSetType = (exerciseId: string, setId: string, type: SetType | "remove") => {
    if (type === "remove") {
      setExercises((prev: LogExercise[]) =>
        prev.map((ex) =>
          ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex,
        ),
      );
    } else {
      setExercises((prev: LogExercise[]) =>
        prev.map((ex) =>
          ex.id === exerciseId
            ? { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, type } : s)) }
            : ex,
        ),
      );
    }
    setSetTypeTarget(null);
  };

  const updateRestTimerDuration = (exerciseId: string, duration: number) => {
    setExercises((prev: LogExercise[]) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, restTimerDuration: duration } : ex)),
    );
    setShowRestTimerModal(null);
  };

  const skipRestTimer   = () => setActiveRestTimer(null);
  const adjustRestTimer = (delta: number) =>
    setActiveRestTimer((prev) =>
      prev ? { ...prev, remainingTime: Math.max(0, prev.remainingTime + delta) } : null,
    );

  // ── Navigation actions ────────────────────────────────────────────────────
  const handleAddExercise = () => navigation.navigate("AddExercise");

  const handleFinish = () => {
    if (settings.showFinishSummary && exercises.length > 0) {
      const completedCount = exercises.reduce(
        (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
        0,
      );
      Alert.alert(
        "Finish Workout? 🎉",
        `${completedCount} set${completedCount !== 1 ? "s" : ""} completed · ${formatDuration(elapsed)}`,
        [
          { text: "Keep going", style: "cancel" },
          {
            text: "Finish",
            onPress: () => {
              clearWorkout(route.params?.routineName);
              navigation.goBack();
            },
          },
        ],
      );
    } else {
      clearWorkout(route.params?.routineName);
      navigation.goBack();
    }
  };

  const doDiscard = () => {
    discardWorkout();       // reset without saving to history
    navigation.goBack();
  };

  const handleDiscard = () => {
    if (!settings.confirmBeforeDiscard) {
      doDiscard();
      return;
    }
    Alert.alert(
      "Discard workout?",
      "All progress will be lost. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: doDiscard },
      ],
    );
  };

  /**
   * Navigate to ExerciseDetail using the ORIGINAL library exercise id,
   * not the unique workout-instance id.
   */
  const openExerciseDetail = (exercise: LogExercise) => {
    const libId = exercise.originalExerciseId ?? exercise.id;
    navigation.navigate("ExerciseDetail", { exerciseId: libId });
  };

  // ── Minimize animation ────────────────────────────────────────────────────
  const backBounce = useRef(new Animated.Value(0)).current;
  const handleMinimize = () => {
    Animated.sequence([
      Animated.timing(backBounce, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(backBounce, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setMinimized(true);
      navigation.goBack();
    });
  };
  const backTranslateY = backBounce.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });

  // ── Duration modal helpers ────────────────────────────────────────────────
  const openDurationModal = () => {
    const total = Math.max(0, elapsed);
    setDraftHours(Math.floor(total / 3600));
    setDraftMinutes(Math.floor((total % 3600) / 60));
    setDraftStart(startTime ? new Date(startTime) : new Date());
    setDurationOpen(true);
  };

  const saveDurationModal = () => {
    // Always use setElapsedSeconds so elapsed is predictable and never negative
    const totalSec = draftHours * 3600 + draftMinutes * 60;
    setElapsedSeconds(totalSec);
    setDurationOpen(false);
  };

  /* ────────────────────────── RENDER ─────────────────────────────────────── */
  return (
    <Screen padded={false}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleMinimize}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Animated.View style={{ transform: [{ translateY: backTranslateY }] }}>
            <Ionicons name="chevron-down" size={28} color={theme.colors.text} />
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Workout</Text>
        <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <View style={styles.statsSection}>
        {/* Duration — tap to edit */}
        <TouchableOpacity style={styles.statItem} onPress={openDurationModal} activeOpacity={0.6}>
          <Text style={styles.statLabel}>Duration{isPaused ? " · paused" : ""}</Text>
          <Text style={[styles.statValue, isPaused && { color: theme.colors.muted }]}>
            {formatDuration(elapsed)}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>{totalVolume} {settings.weightUnit}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Sets</Text>
          <Text style={styles.statValue}>{totalSets}</Text>
        </View>

        <View style={styles.divider} />

        {/* Settings icon — tap to open workout settings */}
        <TouchableOpacity style={styles.statItem} onPress={() => setSettingsOpen(true)} activeOpacity={0.6}>
          <Ionicons name="settings-outline" size={22} color={theme.colors.accent} />
          <Text style={styles.statLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* ── Exercise list ───────────────────────────────────────────────────── */}
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

                {/* Exercise header row */}
                <View style={styles.exerciseHeader}>
                  {/* Tap name → ExerciseDetail (How To, History, Overview) */}
                  <TouchableOpacity
                    style={styles.exerciseHeaderContent}
                    activeOpacity={0.7}
                    onPress={() => openExerciseDetail(exercise)}
                  >
                    <View style={styles.exerciseIcon}>
                      <Ionicons name="barbell" size={32} color={theme.colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                      <Text style={styles.exerciseSubLink}>TAP FOR DETAILS</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setShowExerciseMenu(exercise.id)}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.muted} />
                  </TouchableOpacity>
                </View>

                {/* Notes */}
                <TextInput
                  placeholder="Add notes here..."
                  style={styles.notesInput}
                  placeholderTextColor={theme.colors.muted}
                />

                {/* Rest timer row */}
                <TouchableOpacity
                  style={styles.restTimerButton}
                  onPress={() => setShowRestTimerModal(exercise.id)}
                >
                  <Ionicons name="timer" size={20} color={theme.colors.accent} />
                  <Text style={styles.restTimerText}>
                    Rest Timer: {formatRestLabel(exercise.restTimerDuration)}
                  </Text>
                </TouchableOpacity>

                {/* Sets */}
                <View style={styles.setsContainer}>
                  <View style={styles.setsHeaderRow}>
                    <Text style={[styles.setGridCell, styles.setLabel]}>SET</Text>
                    <Text style={[styles.setGridCell, styles.setLabel]}>PREVIOUS</Text>
                    <Text style={[styles.setGridCell, styles.setLabel]}>
                      {settings.weightUnit.toUpperCase()}
                    </Text>
                    <Text style={[styles.setGridCell, styles.setLabel]}>REPS</Text>
                    <View style={styles.setCheckbox} />
                  </View>

                  {exercise.sets.map((set, index) => {
                    const numColor =
                      set.type === "warmup"   ? "#F5C518"          :
                      set.type === "failure"  ? theme.colors.danger :
                      theme.colors.text;
                    const numLabel =
                      set.type === "warmup"   ? "W" :
                      set.type === "failure"  ? "F" :
                      String(index + 1);

                    return (
                      <View key={set.id} style={styles.setRow}>
                        <TouchableOpacity
                          style={styles.setGridCell}
                          onPress={() => setSetTypeTarget({ exerciseId: exercise.id, setId: set.id })}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={[styles.setNumber, { color: numColor }]}>{numLabel}</Text>
                        </TouchableOpacity>
                        <Text style={[styles.setGridCell, styles.previousValue]}>-</Text>
                        <TextInput
                          style={[styles.setGridCell, styles.setInput]}
                          value={set.weight}
                          onChangeText={(val) => updateSet(exercise.id, set.id, "weight", val)}
                          keyboardType="decimal-pad"
                          placeholderTextColor={theme.colors.muted}
                        />
                        <TextInput
                          style={[styles.setGridCell, styles.setInput]}
                          value={set.reps}
                          onChangeText={(val) => updateSet(exercise.id, set.id, "reps", val)}
                          keyboardType="number-pad"
                          placeholderTextColor={theme.colors.muted}
                        />
                        <TouchableOpacity
                          style={[styles.setCheckbox, set.completed && styles.setCheckboxChecked]}
                          onPress={() => toggleSetCompletion(exercise.id, set.id)}
                        >
                          {set.completed && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(exercise.id)}>
                  <Text style={styles.addSetButtonText}>+ Add Set</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Bottom actions ──────────────────────────────────────────────────── */}
      <View style={styles.actionsSection}>
        <Button title="+ Add Exercise" onPress={handleAddExercise} fullWidth style={styles.addButton} />
        <View style={styles.bottomButtons}>
          <Button
            title="Discard"
            onPress={handleDiscard}
            style={styles.halfButton}
            variant="destructive"
          />
          <Button
            title={isPaused ? "Resume" : "Pause"}
            onPress={togglePause}
            style={styles.halfButton}
            variant="secondary"
          />
        </View>
      </View>

      {/* ── Active rest timer overlay ───────────────────────────────────────── */}
      {activeRestTimer && (
        <View style={styles.restTimerOverlay}>
          <View style={styles.restTimerDisplay}>
            <Text style={styles.restTimerDisplayTitle}>Rest Timer</Text>
            <Text style={styles.restTimerDisplayExercise}>
              {exercises.find((ex) => ex.id === activeRestTimer.exerciseId)?.name}
            </Text>
            <View style={styles.restTimerContent}>
              <TouchableOpacity style={styles.timerAdjustButton} onPress={() => adjustRestTimer(-15)}>
                <Text style={styles.timerAdjustText}>-15</Text>
              </TouchableOpacity>
              <Text style={styles.timerDisplay}>
                {String(Math.floor(activeRestTimer.remainingTime / 60)).padStart(2, "0")}:
                {String(activeRestTimer.remainingTime % 60).padStart(2, "0")}
              </Text>
              <TouchableOpacity style={styles.timerAdjustButton} onPress={() => adjustRestTimer(15)}>
                <Text style={styles.timerAdjustText}>+15</Text>
              </TouchableOpacity>
            </View>
            <Button title="Skip" onPress={skipRestTimer} fullWidth style={styles.skipButton} />
          </View>
        </View>
      )}

      {/* ── Exercise context menu ───────────────────────────────────────────── */}
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
              onPress={() => {
                const ex = exercises.find((e) => e.id === showExerciseMenu);
                setShowExerciseMenu(null);
                if (ex) openExerciseDetail(ex);
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.accent} />
              <Text style={styles.menuItemText}>View Exercise Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowExerciseMenu(null)}>
              <Ionicons name="swap-vertical" size={20} color={theme.colors.accent} />
              <Text style={styles.menuItemText}>Reorder Exercises</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowExerciseMenu(null)}>
              <MaterialCommunityIcons name="sync" size={20} color={theme.colors.accent} />
              <Text style={styles.menuItemText}>Replace Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                if (showExerciseMenu) {
                  setExercises((prev: LogExercise[]) =>
                    prev.filter((ex) => ex.id !== showExerciseMenu),
                  );
                }
                setShowExerciseMenu(null);
              }}
            >
              <Ionicons name="trash" size={20} color="#ff6b6b" />
              <Text style={[styles.menuItemText, { color: "#ff6b6b" }]}>Remove Exercise</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Rest-timer picker ───────────────────────────────────────────────── */}
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
            <ScrollView style={{ maxHeight: 320 }}>
              {REST_TIMER_OPTIONS.map((option) => {
                const selected =
                  showRestTimerModal != null &&
                  exercises.find((ex) => ex.id === showRestTimerModal)?.restTimerDuration ===
                    option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.timerOption, selected && styles.timerOptionSelected]}
                    onPress={() =>
                      showRestTimerModal &&
                      updateRestTimerDuration(showRestTimerModal, option.value)
                    }
                  >
                    <Text style={[styles.timerOptionText, selected && { color: theme.colors.accent }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Done"
              onPress={() => setShowRestTimerModal(null)}
              fullWidth
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* ── Duration / start-time / pause modal ────────────────────────────── */}
      <Modal
        visible={durationOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDurationOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDurationOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Workout time</Text>

            <Text style={styles.fieldLabel}>DURATION</Text>
            <View style={styles.wheelRow}>
              <WheelPicker value={draftHours}   onChange={setDraftHours}   count={24} suffix="hr"  />
              <WheelPicker value={draftMinutes} onChange={setDraftMinutes} count={60} suffix="min" />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: theme.spacing.lg }]}>START TIME</Text>
            <View style={styles.startRow}>
              <TouchableOpacity style={styles.startBtn} onPress={() => setShowDate(true)}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.accent} />
                <Text style={styles.startBtnText}>{draftStart.toDateString()}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startBtn} onPress={() => setShowTime(true)}>
                <Ionicons name="time-outline" size={16} color={theme.colors.accent} />
                <Text style={styles.startBtnText}>
                  {draftStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDate && (
              <DateTimePicker
                value={draftStart}
                mode="date"
                maximumDate={new Date()}
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(_e, d) => {
                  setShowDate(Platform.OS === "ios");
                  if (d) {
                    const next = new Date(draftStart);
                    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                    if (next.getTime() > Date.now()) next.setTime(Date.now());
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
                    if (next.getTime() > Date.now()) next.setTime(Date.now());
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
              <Text style={[styles.pauseBtnText, isPaused && { color: theme.colors.accentText }]}>
                {isPaused ? "Resume Workout Timer" : "Pause Workout Timer"}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <Button title="Cancel" variant="ghost" onPress={() => setDurationOpen(false)} style={{ flex: 1 }} />
              <Button title="Save"   onPress={saveDurationModal}                             style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Set-type picker ─────────────────────────────────────────────────── */}
      <Modal
        visible={setTypeTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSetTypeTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSetTypeTarget(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Set Type</Text>
            {SET_TYPE_OPTIONS.map((opt) => (
              <View key={opt.key} style={styles.setTypeRow}>
                <TouchableOpacity
                  style={styles.setTypeMain}
                  onPress={() =>
                    setTypeTarget && setSetType(setTypeTarget.exerciseId, setTypeTarget.setId, opt.key)
                  }
                >
                  <Text style={[styles.setTypeLabel, { color: opt.color }]}>{opt.label}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.helpBtn}
                  onPress={() => setSetTypeInfo(opt.key)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="help-circle-outline" size={20} color={theme.colors.muted} />
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

      {/* ── Set-type info ───────────────────────────────────────────────────── */}
      <Modal
        visible={setTypeInfo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSetTypeInfo(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSetTypeInfo(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {setTypeInfo && (
              <>
                <Text style={styles.modalTitle}>{SET_TYPE_INFO[setTypeInfo].title}</Text>
                <Text style={styles.modalBody}>{SET_TYPE_INFO[setTypeInfo].body}</Text>
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

      {/* ── Workout Settings modal ──────────────────────────────────────────── */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSettingsOpen(false)}>
          <Pressable style={[styles.modalContent, { maxHeight: "90%" }]} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Workout Settings</Text>

              {/* Weight unit */}
              <Text style={styles.settingLabel}>WEIGHT UNIT</Text>
              <View style={styles.segment}>
                {(["kg", "lb"] as WeightUnit[]).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.segmentBtn, settings.weightUnit === u && styles.segmentBtnActive]}
                    onPress={() => updateSettings({ weightUnit: u })}
                  >
                    <Text style={[styles.segmentText, settings.weightUnit === u && styles.segmentTextActive]}>
                      {u.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Default rest timer */}
              <TouchableOpacity style={styles.settingRow} onPress={() => setRestPickerOpen(true)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Default rest timer</Text>
                  <Text style={styles.settingHint}>Applied to new exercises you add</Text>
                </View>
                <Text style={styles.settingValue}>
                  {settings.defaultRestSeconds > 0 ? formatRestLabel(settings.defaultRestSeconds) : "Off"}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
              </TouchableOpacity>

              {/* Auto-start rest timer */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Auto-start rest timer</Text>
                  <Text style={styles.settingHint}>Begin countdown when a set is completed</Text>
                </View>
                <Switch
                  value={settings.autoStartRestTimer}
                  onValueChange={(v) => updateSettings({ autoStartRestTimer: v })}
                  trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                  thumbColor={Platform.OS === "android" ? theme.colors.accent : undefined}
                />
              </View>

              {/* Count warm-ups in volume */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Count warm-ups in volume</Text>
                  <Text style={styles.settingHint}>Include W sets in total volume</Text>
                </View>
                <Switch
                  value={settings.countWarmupInVolume}
                  onValueChange={(v) => updateSettings({ countWarmupInVolume: v })}
                  trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                  thumbColor={Platform.OS === "android" ? theme.colors.accent : undefined}
                />
              </View>

              {/* Vibrate on set complete */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Vibrate on set complete</Text>
                  <Text style={styles.settingHint}>Short haptic when you tick a set</Text>
                </View>
                <Switch
                  value={settings.vibrateOnSetComplete}
                  onValueChange={(v) => updateSettings({ vibrateOnSetComplete: v })}
                  trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                  thumbColor={Platform.OS === "android" ? theme.colors.accent : undefined}
                />
              </View>

              {/* Show finish summary */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Show finish summary</Text>
                  <Text style={styles.settingHint}>Confirm dialog with stats when finishing</Text>
                </View>
                <Switch
                  value={settings.showFinishSummary}
                  onValueChange={(v) => updateSettings({ showFinishSummary: v })}
                  trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                  thumbColor={Platform.OS === "android" ? theme.colors.accent : undefined}
                />
              </View>

              {/* Confirm before discard */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingTitle}>Confirm before discard</Text>
                  <Text style={styles.settingHint}>Ask before clearing the workout</Text>
                </View>
                <Switch
                  value={settings.confirmBeforeDiscard}
                  onValueChange={(v) => updateSettings({ confirmBeforeDiscard: v })}
                  trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                  thumbColor={Platform.OS === "android" ? theme.colors.accent : undefined}
                />
              </View>

              <Button
                title="Done"
                onPress={() => setSettingsOpen(false)}
                fullWidth
                style={{ marginTop: theme.spacing.md }}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Default-rest picker (nested inside Settings) ────────────────────── */}
      <Modal
        visible={restPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRestPickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setRestPickerOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Default rest timer</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {REST_TIMER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timerOption,
                    settings.defaultRestSeconds === option.value && styles.timerOptionSelected,
                  ]}
                  onPress={() => {
                    updateSettings({ defaultRestSeconds: option.value });
                    setRestPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.timerOptionText,
                      settings.defaultRestSeconds === option.value && { color: theme.colors.accent },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setRestPickerOpen(false)}
              fullWidth
              style={{ marginTop: theme.spacing.sm }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
};

/* ─── Styles ───────────────────────────────────────────────────────────────── */
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
    fontSize: theme.font.sizeXs,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
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
  exerciseSubLink: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
    fontWeight: "600",
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

  /* Modal common */
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
    top: 0, left: 0, right: 0, bottom: 0,
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
  timerAdjustText: { color: theme.colors.accent, fontWeight: theme.font.weightBold },
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

  /* Duration modal */
  fieldLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
  },
  wheelRow: { flexDirection: "row", gap: theme.spacing.md },
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
  pauseBtnActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  pauseBtnText: {
    color: theme.colors.text,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
  },

  /* Set-type modal */
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
  setTypeLabel: { fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold },
  helpBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },

  /* Settings modal */
  settingLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    borderRadius: theme.radius.sm,
  },
  segmentBtnActive:   { backgroundColor: theme.colors.accent },
  segmentText:        { color: theme.colors.muted,      fontWeight: theme.font.weightBold },
  segmentTextActive:  { color: theme.colors.accentText },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  settingHint: { color: theme.colors.muted, fontSize: theme.font.sizeXs, marginTop: 2 },
  settingValue: { color: theme.colors.accent, fontWeight: theme.font.weightBold },
});
