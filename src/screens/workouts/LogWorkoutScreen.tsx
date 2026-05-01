import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Keyboard,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useTheme } from "../../context/ThemeContext";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { Theme } from "../../theme/theme";
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
    body: "Normal sets refer to working sets used for your main effort.",
  },
  warmup: {
    title: "Warm-Up Set",
    body: 'Warm-up sets refer to lighter prep sets before working sets.',
  },
  failure: {
    title: "Failure Set",
    body: "Failure sets refer to max-effort sets performed near muscular failure.",
  },
  remove: {
    title: "Remove Set",
    body: "Remove set deletes this set from the exercise.",
  },
};

const getSetTypeOptions = (theme: Theme): { key: SetType | "remove"; label: string; color: string }[] => [
  { key: "normal",  label: "Normal Set",  color: theme.colors.text },
  { key: "warmup",  label: "Warm-Up Set", color: "#F5C518" },
  { key: "failure", label: "Failure Set", color: theme.colors.danger },
  { key: "remove",  label: "Remove Set",  color: theme.colors.muted },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Formats raw seconds into a human-readable workout duration string.
 *   45      → "0m 45s"
 *   60      → "1m 0s"
 *   90      → "1m 30s"
 *   3600    → "1h 0m 0s"
 *   3665    → "1h 1m 5s"
 */
const formatDuration = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
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

/* ─── WheelPicker ───────────────────────────────────────────────────────────────── */
const ITEM_HEIGHT = 48;
const VISIBLE     = 5;
const WHEEL_PAD   = Math.floor(VISIBLE / 2);

const WheelPicker = ({
  value,
  onChange,
  count,
  suffix,
  pickStyles,
}: {
  value: number;
  onChange: (v: number) => void;
  count: number;
  suffix: string;
  pickStyles: ReturnType<typeof createPickStyles>;
}) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: value * ITEM_HEIGHT, animated: false });
    }, 60);
    return () => clearTimeout(t);
  }, [value]);

  const commit = (y: number) => {
    const i = Math.round(y / ITEM_HEIGHT) - WHEEL_PAD;
    const clamped = Math.max(0, Math.min(count - 1, i));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <View style={pickStyles.column}>
      <View style={pickStyles.selectionBand} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        directionalLockEnabled
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * WHEEL_PAD }}
        onScrollEndDrag={(e) => commit(e.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(e) => commit(e.nativeEvent.contentOffset.y)}
      >
        {Array.from({ length: count }).map((_, item) => {
          const isActive = item === value;
          return (
            <View key={`${suffix}-${item}`} style={pickStyles.row}>
              <Text
                style={[
                  pickStyles.numText,
                  isActive ? pickStyles.numTextActive : pickStyles.numTextInactive,
                ]}
              >
                {String(item).padStart(2, "0")}
              </Text>
              <Text
                style={[
                  pickStyles.suffixText,
                  isActive ? pickStyles.suffixTextActive : pickStyles.suffixTextInactive,
                ]}
              >
                {suffix}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createPickStyles = (theme: Theme) =>
  StyleSheet.create({
    column: {
      flex: 1,
      minWidth: 120,
      maxWidth: 180,
      position: "relative",
      height: ITEM_HEIGHT * VISIBLE,
    },
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
    row: {
      height: ITEM_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    },
    numText: {
      color: theme.colors.muted,
      fontSize: 18,
      fontWeight: "700",
      minWidth: 28,
      textAlign: "right",
    },
    numTextActive: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: "900",
    },
    numTextInactive: {
      color: theme.colors.muted,
      opacity: 0.85,
    },
    suffixText: {
      color: theme.colors.muted,
      fontSize: 14,
      fontWeight: "600",
      minWidth: 28,
    },
    suffixTextActive: {
      color: theme.colors.accent,
      fontSize: 15,
      fontWeight: "800",
    },
    suffixTextInactive: {
      color: theme.colors.muted,
      opacity: 0.9,
    },
  });

/* ─── Main screen ──────────────────────────────────────────────────────────── */

export const LogWorkoutScreen = ({ navigation, route }: Props) => {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const pickStyles = useMemo(() => createPickStyles(theme), [theme]);
  const setTypeOptions = useMemo(() => getSetTypeOptions(theme), [theme]);

  const {
    exercises,
    setExercises,
    addExercises,
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
  const [restTimerPaused,    setRestTimerPaused]    = useState(false);
  const [showExerciseMenu,   setShowExerciseMenu]   = useState<string | null>(null);
  const [reorderOpen,        setReorderOpen]        = useState(false);
  const [reorderTargetId,    setReorderTargetId]    = useState<string | null>(null);

  // Duration edit modal
  const [durationOpen,  setDurationOpen]  = useState(false);
  const [draftStart,    setDraftStart]    = useState<Date>(new Date());
  const [showDate,      setShowDate]      = useState(false);
  const [showTime,      setShowTime]      = useState(false);
  const [inputH, setInputH] = useState('0');
  const [inputM, setInputM] = useState('0');
  const [inputS, setInputS] = useState('0');

  // Set-type modal
  const [setTypeTarget, setSetTypeTarget] = useState<{ exerciseId: string; setId: string } | null>(null);

  // Settings modal
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [restPickerOpen, setRestPickerOpen] = useState(false);

  // Sync duration inputs when modal opens
  useEffect(() => {
    if (durationOpen) {
      const s = getElapsedSeconds();
      setInputH(String(Math.floor(s / 3600)));
      setInputM(String(Math.floor((s % 3600) / 60)));
      setInputS(String(s % 60));
    }
  }, [durationOpen]);

  const applyTypedDuration = () => {
    const h = Math.max(0, parseInt(inputH, 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(inputM, 10) || 0));
    const s = Math.max(0, Math.min(59, parseInt(inputS, 10) || 0));
    const total = h * 3600 + m * 60 + s;
    setElapsedSeconds(total);
    setDraftStart(new Date(Date.now() - total * 1000));
  };

  const handleHourChange = (text: string) => {
    setInputH(text.replace(/[^0-9]/g, ''));
  };

  const handleMinuteChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10);
    if (cleaned === '' || isNaN(num) || num <= 59) {
      setInputM(cleaned);
    }
  };

  const handleSecondChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10);
    if (cleaned === '' || isNaN(num) || num <= 59) {
      setInputS(cleaned);
    }
  };

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
    if (!activeRestTimer || restTimerPaused) return;
    const id = setInterval(() => {
      setActiveRestTimer((prev) => {
        if (!prev) return null;
        if (prev.remainingTime <= 1) return null;
        return { ...prev, remainingTime: prev.remainingTime - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [activeRestTimer, restTimerPaused]);

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

  const areAllSetsCompleted = (exercise: LogExercise) =>
    exercise.sets.length > 0 && exercise.sets.every((set) => set.completed);

  const toggleExerciseCompletion = (exerciseId: string) => {
    setExercises((prev: LogExercise[]) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const shouldCompleteAll = !areAllSetsCompleted(exercise);
        return {
          ...exercise,
          sets: exercise.sets.map((set) => ({ ...set, completed: shouldCompleteAll })),
        };
      }),
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
        setRestTimerPaused(false);
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

  const moveExercise = (exerciseId: string, direction: "up" | "down") => {
    setExercises((prev: LogExercise[]) => {
      const index = prev.findIndex((exercise) => exercise.id === exerciseId);
      if (index < 0) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.splice(target, 0, picked);
      return next;
    });
  };

  const handleReorderExercise = (exerciseId: string) => {
    setReorderTargetId(exerciseId);
    setReorderOpen(true);
  };

  const handleReplaceExercise = (exerciseId: string) => {
    navigation.navigate("AddExercise", { replaceExerciseId: exerciseId });
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

  const closeSetTypeModal = () => {
    setSetTypeTarget(null);
  };

  const updateRestTimerDuration = (exerciseId: string, duration: number) => {
    setExercises((prev: LogExercise[]) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, restTimerDuration: duration } : ex)),
    );
    setShowRestTimerModal(null);
  };

  const skipRestTimer   = () => { setActiveRestTimer(null); setRestTimerPaused(false); };
  const toggleRestTimerPause = () => setRestTimerPaused((p) => !p);
  const adjustRestTimer = (delta: number) =>
    setActiveRestTimer((prev) =>
      prev ? { ...prev, remainingTime: Math.max(0, prev.remainingTime + delta) } : null,
    );

  // ── Navigation actions ────────────────────────────────────────────────────
  const handleAddExercise = () => navigation.navigate("AddExercise");

  const validateBeforeFinish = () => {
    if (exercises.length === 0) {
      return "Add at least one exercise before finishing.";
    }

    const completedCount = exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0,
    );

    if (completedCount === 0) {
      return "Complete at least one set before finishing.";
    }

    const hasInvalidCompletedSet = exercises.some((ex) =>
      ex.sets.some((set) => {
        if (!set.completed) return false;
        const reps = Number(set.reps);
        const weight = Number(set.weight);
        return !Number.isFinite(reps) || reps <= 0 || !Number.isFinite(weight) || weight < 0;
      }),
    );

    if (hasInvalidCompletedSet) {
      return "Completed sets must have valid reps (> 0) and weight (>= 0).";
    }

    return null;
  };

  const proceedToSaveWorkout = () => {
    const completedCount = exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0,
    );
    const routineName = route.params?.routineName?.trim() || "Custom Workout";
    navigation.navigate("SaveWorkout", {
      routineName,
      durationSeconds: elapsed,
      totalVolumeKg: totalVolume,
      totalSets: completedCount,
      completedAt: Date.now(),
    });
  };

  const handleFinish = () => {
    const validationError = validateBeforeFinish();
    if (validationError) {
      Alert.alert("Workout not ready", validationError);
      return;
    }

    proceedToSaveWorkout();
  };

  const doDiscard = () => {
    discardWorkout();       // reset without saving to history
    const sourceScreen = route.params?.sourceScreen;
    if (sourceScreen === 'ExploreRoutines') {
      navigation.navigate('Tabs', { screen: 'Library' });
    } else {
      navigation.goBack();
    }
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
      const sourceScreen = route.params?.sourceScreen;
      if (sourceScreen === 'ExploreRoutines') {
        navigation.navigate('Tabs', { screen: 'Library' });
      } else {
        navigation.goBack();
      }
    });
  };
  const backTranslateY = backBounce.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });

  // ── Duration modal helpers ────────────────────────────────────────────────
  const openDurationModal = () => {
    setDraftStart(startTime ? new Date(startTime) : new Date());
    setDurationOpen(true);
  };

  const saveDurationModal = () => {
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
        <View style={styles.headerRight}>
          {/* Settings icon beside Finish */}
          <TouchableOpacity onPress={() => setSettingsOpen(true)} activeOpacity={0.7} style={styles.headerSettingsBtn}>
            <Ionicons name="settings-outline" size={22} color={theme.colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
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
                    <TouchableOpacity
                      style={[styles.setCheckbox, areAllSetsCompleted(exercise) && styles.setCheckboxChecked]}
                      onPress={() => toggleExerciseCompletion(exercise.id)}
                    >
                      {areAllSetsCompleted(exercise) && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.accentText} />
                      )}
                    </TouchableOpacity>
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
                            <Ionicons name="checkmark" size={16} color={theme.colors.accentText} />
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
        {/* ── Inline rest timer banner ────────────────────────────────────── */}
        {activeRestTimer && (
          <View style={styles.inlineRestTimer}>
            {/* Progress bar */}
            <View style={styles.restProgressTrack}>
              <View
                style={[
                  styles.restProgressFill,
                  {
                    width: `${(activeRestTimer.remainingTime / activeRestTimer.duration) * 100}%`,
                  },
                ]}
              />
            </View>

            {/* Timer row */}
            <View style={styles.inlineRestRow}>
              {/* Label + exercise name */}
              <View style={{ flex: 1 }}>
                <Text style={styles.inlineRestLabel}>REST</Text>
                <Text style={styles.inlineRestExercise} numberOfLines={1}>
                  {exercises.find((ex) => ex.id === activeRestTimer.exerciseId)?.name}
                </Text>
              </View>

              {/* Controls */}
              <View style={styles.inlineRestControls}>
                <TouchableOpacity style={styles.inlineAdjustBtn} onPress={() => adjustRestTimer(-15)}>
                  <Text style={styles.inlineAdjustText}>−15</Text>
                </TouchableOpacity>

                <Text style={styles.inlineTimerDisplay}>
                  {String(Math.floor(activeRestTimer.remainingTime / 60)).padStart(2, "0")}:
                  {String(activeRestTimer.remainingTime % 60).padStart(2, "0")}
                </Text>

                <TouchableOpacity style={styles.inlineAdjustBtn} onPress={() => adjustRestTimer(15)}>
                  <Text style={styles.inlineAdjustText}>+15</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.inlinePauseBtn} onPress={toggleRestTimerPause}>
                  <Ionicons
                    name={restTimerPaused ? "play" : "pause"}
                    size={16}
                    color={theme.colors.accentText}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.inlineSkipBtn} onPress={skipRestTimer}>
                  <Ionicons name="play-skip-forward" size={16} color={theme.colors.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <Button title="+ Add Exercise" onPress={handleAddExercise} fullWidth style={styles.addButton} />
        <Button
          title="Discard"
          onPress={handleDiscard}
          fullWidth
          variant="destructive"
        />
      </View>

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
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                const exId = showExerciseMenu;
                setShowExerciseMenu(null);
                if (exId) handleReorderExercise(exId);
              }}
            >
              <Ionicons name="swap-vertical" size={20} color={theme.colors.accent} />
              <Text style={styles.menuItemText}>Reorder Exercises</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                const exId = showExerciseMenu;
                setShowExerciseMenu(null);
                if (exId) handleReplaceExercise(exId);
              }}
            >
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
              <Ionicons name="trash" size={20} color={theme.colors.danger} />
              <Text style={[styles.menuItemText, { color: theme.colors.danger }]}>Remove Exercise</Text>
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

      {/* Duration / start-time / pause modal */}
      <Modal
        visible={durationOpen}
        transparent
        animationType="fade"
        onRequestClose={() => { Keyboard.dismiss(); setDurationOpen(false); }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); setDurationOpen(false); }}>
          <Pressable style={[styles.modalContent, styles.durationModalContent]} onPress={(e) => { e.stopPropagation(); Keyboard.dismiss(); }}>
            <View style={{ paddingBottom: theme.spacing.sm }}>
            <Text style={styles.modalTitle}>Workout time</Text>

            <Text style={styles.fieldLabel}>DURATION</Text>
            <View style={styles.durationValuePill}>
              <Text style={styles.durationValueText}>
                {formatDuration(elapsed)}
              </Text>
            </View>

            {/* Live elapsed time display - keeps updating */}
            <View style={styles.liveTimeContainer}>
              <Text style={styles.liveTimeLabel}>LIVE TIMER</Text>
              <View style={styles.liveTimeDisplay}>
                {(() => {
                  const h = Math.floor(elapsed / 3600);
                  const m = Math.floor((elapsed % 3600) / 60);
                  const s = elapsed % 60;
                  return (
                    <>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeValue}>{String(h).padStart(2, "0")}</Text>
                        <Text style={styles.timeUnit}>h</Text>
                      </View>
                      <Text style={styles.timeSeparator}>:</Text>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeValue}>{String(m).padStart(2, "0")}</Text>
                        <Text style={styles.timeUnit}>m</Text>
                      </View>
                      <Text style={styles.timeSeparator}>:</Text>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeValue}>{String(s).padStart(2, "0")}</Text>
                        <Text style={styles.timeUnit}>s</Text>
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>

            {/* Duration input fields */}
            <View style={styles.adjustSection}>
              <Text style={styles.liveTimeLabel}>SET DURATION</Text>
              <View style={styles.inputRow}>
                <View style={styles.durationInputWrap}>
                  <TextInput
                    style={styles.durationInput}
                    value={inputH}
                    onChangeText={handleHourChange}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="0"
                    placeholderTextColor={theme.colors.muted}
                  />
                  <Text style={styles.inputUnit}>h</Text>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.durationInputWrap}>
                  <TextInput
                    style={styles.durationInput}
                    value={inputM}
                    onChangeText={handleMinuteChange}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor={theme.colors.muted}
                  />
                  <Text style={styles.inputUnit}>m</Text>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.durationInputWrap}>
                  <TextInput
                    style={styles.durationInput}
                    value={inputS}
                    onChangeText={handleSecondChange}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor={theme.colors.muted}
                  />
                  <Text style={styles.inputUnit}>s</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.applyBtn} onPress={applyTypedDuration} activeOpacity={0.7}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

             <Text style={[styles.fieldLabel, { marginTop: theme.spacing.lg }]}>START TIME</Text>
             <View style={styles.startRow}>
               <TouchableOpacity
                 style={styles.startBtn}
                 onPress={() => { Keyboard.dismiss(); setDurationOpen(false); setShowDate(true); }}
                 activeOpacity={0.7}
               >
                 <Ionicons name="calendar-outline" size={16} color={theme.colors.accent} />
                 <Text style={styles.startBtnText}>
                   {draftStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                 </Text>
               </TouchableOpacity>
               <Text style={styles.startSeparator}>,</Text>
               <TouchableOpacity
                 style={styles.startBtn}
                 onPress={() => { Keyboard.dismiss(); setDurationOpen(false); setShowTime(true); }}
                 activeOpacity={0.7}
               >
                 <Ionicons name="time-outline" size={16} color={theme.colors.accent} />
                 <Text style={styles.startBtnText}>
                   {draftStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                 </Text>
               </TouchableOpacity>
             </View>

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

            <TouchableOpacity
              style={[styles.closeBtn]}
              onPress={() => setDurationOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>


      {/* Date picker modal with backdrop so user can dismiss it */}
      {showDate && (
        <Modal transparent animationType="fade" onRequestClose={() => { setShowDate(false); setDurationOpen(true); }}>
          <Pressable style={styles.modalOverlay} onPress={() => { setShowDate(false); setDurationOpen(true); }}>
            <View style={[styles.modalContent, styles.pickerModalContent]}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => { setShowDate(false); setDurationOpen(true); }}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={draftStart}
                mode="date"
                maximumDate={new Date()}
                display={Platform.OS === "ios" ? "inline" : "default"}
                themeVariant={isDark ? "dark" : "light"}
                onChange={(_e, d) => {
                  if (d) {
                    const next = new Date(draftStart);
                    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                    if (next.getTime() > Date.now()) {
                      Alert.alert('Invalid Date', 'You cannot select a future date.');
                      return;
                    }
                    setDraftStart(next);
                  }
                }}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Time picker modal with backdrop so user can dismiss it */}
      {showTime && (
        <Modal transparent animationType="fade" onRequestClose={() => { setShowTime(false); setDurationOpen(true); }}>
          <Pressable style={styles.modalOverlay} onPress={() => { setShowTime(false); setDurationOpen(true); }}>
            <View style={[styles.modalContent, styles.pickerModalContent]}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => { setShowTime(false); setDurationOpen(true); }}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={draftStart}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                themeVariant={isDark ? "dark" : "light"}
                onChange={(_e, d) => {
                  if (d) {
                    const next = new Date(draftStart);
                    next.setHours(d.getHours(), d.getMinutes());
                    if (next.getTime() > Date.now()) {
                      Alert.alert('Invalid Time', 'You cannot select a future time.');
                      return;
                    }
                    setDraftStart(next);
                  }
                }}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {/* ── Set-type picker ─────────────────────────────────────────────────── */}
      <Modal
        visible={setTypeTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={closeSetTypeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeSetTypeModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Set Type</Text>
            {setTypeOptions.map((opt) => (
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
                  onPress={() => Alert.alert(SET_TYPE_INFO[opt.key].title, SET_TYPE_INFO[opt.key].body)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="help-circle-outline" size={20} color={theme.colors.muted} />
                </TouchableOpacity>
              </View>
            ))}
            <Button
              title="Cancel"
              variant="ghost"
              onPress={closeSetTypeModal}
              fullWidth
              style={{ marginTop: theme.spacing.sm }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={reorderOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReorderOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setReorderOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Reorder Exercises</Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {exercises.map((exercise, index) => {
                const selected = reorderTargetId === exercise.id;
                return (
                  <TouchableOpacity
                    key={exercise.id}
                    style={[styles.reorderRow, selected && styles.reorderRowSelected]}
                    onPress={() => setReorderTargetId(exercise.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.reorderName, selected && { color: theme.colors.accent }]}>
                      {exercise.name}
                    </Text>
                    {selected && (
                      <View style={styles.reorderButtons}>
                        <TouchableOpacity
                          style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                          onPress={() => moveExercise(exercise.id, "up")}
                          disabled={index === 0}
                        >
                          <Ionicons name="arrow-up" size={16} color={theme.colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.reorderBtn,
                            index === exercises.length - 1 && styles.reorderBtnDisabled,
                          ]}
                          onPress={() => moveExercise(exercise.id, "down")}
                          disabled={index === exercises.length - 1}
                        >
                          <Ionicons name="arrow-down" size={16} color={theme.colors.text} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Done"
              onPress={() => setReorderOpen(false)}
              fullWidth
              style={{ marginTop: theme.spacing.md }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Workout Settings modal ──────────────────────────────────────────── */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setRestPickerOpen(false);
          setSettingsOpen(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setRestPickerOpen(false);
            setSettingsOpen(false);
          }}
        >
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
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => {
                  // Avoid stacked transparent modals that can trap touches on Android.
                  setSettingsOpen(false);
                  setTimeout(() => setRestPickerOpen(true), 120);
                }}
              >
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
                <View style={styles.settingMain}>
                  <Text style={styles.settingTitle}>Auto-start rest timer</Text>
                  <Text style={styles.settingHint}>Begin countdown when a set is completed</Text>
                </View>
                <View style={styles.settingSwitchWrap}>
                  <Switch
                    value={settings.autoStartRestTimer}
                    onValueChange={(v) => updateSettings({ autoStartRestTimer: v })}
                    trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                    thumbColor={Platform.OS === "android" ? (settings.autoStartRestTimer ? theme.colors.accent : theme.colors.muted) : undefined}
                    ios_backgroundColor={theme.colors.border}
                    style={Platform.OS === "ios" ? styles.iosSwitch : undefined}
                  />
                </View>
              </View>

              {/* Count warm-ups in volume */}
              <View style={styles.settingRow}>
                <View style={styles.settingMain}>
                  <Text style={styles.settingTitle}>Count warm-ups in volume</Text>
                  <Text style={styles.settingHint}>Include W sets in total volume</Text>
                </View>
                <View style={styles.settingSwitchWrap}>
                  <Switch
                    value={settings.countWarmupInVolume}
                    onValueChange={(v) => updateSettings({ countWarmupInVolume: v })}
                    trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                    thumbColor={Platform.OS === "android" ? (settings.countWarmupInVolume ? theme.colors.accent : theme.colors.muted) : undefined}
                    ios_backgroundColor={theme.colors.border}
                    style={Platform.OS === "ios" ? styles.iosSwitch : undefined}
                  />
                </View>
              </View>

              {/* Vibrate on set complete */}
              <View style={styles.settingRow}>
                <View style={styles.settingMain}>
                  <Text style={styles.settingTitle}>Vibrate on set complete</Text>
                  <Text style={styles.settingHint}>Short haptic when you tick a set</Text>
                </View>
                <View style={styles.settingSwitchWrap}>
                  <Switch
                    value={settings.vibrateOnSetComplete}
                    onValueChange={(v) => updateSettings({ vibrateOnSetComplete: v })}
                    trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                    thumbColor={Platform.OS === "android" ? (settings.vibrateOnSetComplete ? theme.colors.accent : theme.colors.muted) : undefined}
                    ios_backgroundColor={theme.colors.border}
                    style={Platform.OS === "ios" ? styles.iosSwitch : undefined}
                  />
                </View>
              </View>

              {/* Confirm before discard */}
              <View style={styles.settingRow}>
                <View style={styles.settingMain}>
                  <Text style={styles.settingTitle}>Confirm before discard</Text>
                  <Text style={styles.settingHint}>Ask before clearing the workout</Text>
                </View>
                <View style={styles.settingSwitchWrap}>
                  <Switch
                    value={settings.confirmBeforeDiscard}
                    onValueChange={(v) => updateSettings({ confirmBeforeDiscard: v })}
                    trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
                    thumbColor={Platform.OS === "android" ? (settings.confirmBeforeDiscard ? theme.colors.accent : theme.colors.muted) : undefined}
                    ios_backgroundColor={theme.colors.border}
                    style={Platform.OS === "ios" ? styles.iosSwitch : undefined}
                  />
                </View>
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
const createStyles = (theme: Theme) => StyleSheet.create({
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  headerSettingsBtn: {
    padding: theme.spacing.sm,
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

  /* Inline rest timer banner */
  inlineRestTimer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    overflow: "hidden",
    marginBottom: theme.spacing.sm,
  },
  restProgressTrack: {
    height: 3,
    backgroundColor: theme.colors.border,
    width: "100%",
  },
  restProgressFill: {
    height: 3,
    backgroundColor: theme.colors.accent,
  },
  inlineRestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  inlineRestLabel: {
    fontSize: 10,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accent,
    letterSpacing: 1.2,
  },
  inlineRestExercise: {
    fontSize: theme.font.sizeXs,
    color: theme.colors.muted,
    marginTop: 1,
  },
  inlineRestControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  inlineAdjustBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inlineAdjustText: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
  },
  inlineTimerDisplay: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: theme.font.weightBlack,
    minWidth: 58,
    textAlign: "center",
  },
  inlinePauseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineSkipBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

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
  durationModalContent: {
    maxHeight: "88%",
  },
  durationValuePill: {
    alignSelf: "center",
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  durationValueText: {
    color: theme.colors.accent,
    fontWeight: theme.font.weightBold,
    fontSize: theme.font.sizeSm,
    letterSpacing: 0.4,
  },
  liveTimeContainer: {
    alignItems: "center",
    marginVertical: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  liveTimeLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
  },
  liveTimeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  timeBlock: {
    alignItems: "center",
  },
  timeValue: {
    color: theme.colors.accent,
    fontSize: 32,
    fontWeight: theme.font.weightBold,
    fontVariant: ["tabular-nums"],
  },
  timeUnit: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: theme.font.weightBold,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  timeSeparator: {
    color: theme.colors.accent,
    fontSize: 28,
    fontWeight: theme.font.weightBold,
    marginHorizontal: 4,
  },
  adjustSection: {
    marginTop: theme.spacing.md,
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  durationInputWrap: {
    alignItems: "center",
  },
  durationInput: {
    width: 60,
    height: 44,
    textAlign: "center",
    color: theme.colors.accent,
    fontSize: 20,
    fontWeight: theme.font.weightBold,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    fontVariant: ["tabular-nums"],
  },
  inputUnit: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: theme.font.weightBold,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  applyBtn: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    minWidth: 100,
    alignItems: "center",
  },
  applyBtnText: {
    color: theme.colors.accentText,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
  },
  fieldLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
  },
  wheelCard: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  wheelRow: { flexDirection: "row", gap: theme.spacing.md, justifyContent: "center" },
  startRow: { flexDirection: "row", gap: theme.spacing.sm, alignItems: "center" },
  startSeparator: { color: theme.colors.muted, fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold },
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
  closeBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  closeBtnText: {
    color: theme.colors.accentText,
    fontSize: theme.font.sizeMd,
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
  reorderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderRadius: theme.radius.sm,
  },
  reorderRowSelected: {
    backgroundColor: "rgba(198, 255, 61, 0.08)",
  },
  reorderName: {
    color: theme.colors.text,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  reorderButtons: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  reorderBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reorderBtnDisabled: {
    opacity: 0.35,
  },
  pickerModalContent: {
    padding: theme.spacing.md,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  pickerTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  pickerDoneText: {
    color: theme.colors.accent,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
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
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingMain: {
    flex: 1,
    minWidth: 0,
    paddingRight: theme.spacing.sm,
  },
  settingSwitchWrap: {
    marginLeft: "auto",
    flexShrink: 0,
    alignSelf: "center",
    minWidth: 68,
    alignItems: "flex-end",
  },
  iosSwitch: {
    transform: [{ scaleX: 0.92 }, { scaleY: 0.92 }],
  },
  settingTitle: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
  },
  settingHint: { color: theme.colors.muted, fontSize: theme.font.sizeXs, marginTop: 2 },
  settingValue: { color: theme.colors.accent, fontWeight: theme.font.weightBold },
});