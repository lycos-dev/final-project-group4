import { CompletedWorkout, WeightUnit } from '../context/WorkoutContext';

export type AchievementMetric = 'weight' | 'reps';

export interface AchievementCardData {
  id: string;
  exerciseName: string;
  metric: AchievementMetric;
  title: string;
  detail: string;
  maxValue: number;
  dateAchieved: number; // timestamp when this max was achieved
}

const formatMaxValue = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const parseNumber = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildExerciseAchievements = (
  completedWorkouts: CompletedWorkout[],
  weightUnit: WeightUnit,
): AchievementCardData[] => {
  // Track best values with their dates
  const stats = new Map<string, { weight: number; weightDate: number; reps: number; repsDate: number }>();

  completedWorkouts.forEach((workout) => {
    const workoutDate = workout.completedAt;

    workout.exercises.forEach((exercise) => {
      const key = exercise.name;
      const current = stats.get(key) ?? { weight: 0, weightDate: 0, reps: 0, repsDate: 0 };

      exercise.sets.forEach((set) => {
        if (!set.completed) return;
        const reps = parseNumber(set.reps);
        const weight = parseNumber(set.weight);

        if (reps > current.reps) {
          current.reps = reps;
          current.repsDate = workoutDate;
        }
        if (weight > current.weight) {
          current.weight = weight;
          current.weightDate = workoutDate;
        }
      });

      stats.set(key, current);
    });
  });

  return Array.from(stats.entries())
    .flatMap(([exerciseName, values]) => {
      const unitLabel = weightUnit.toUpperCase();
      const achievements: AchievementCardData[] = [];

      // Only add weight achievement if maxValue > 0
      if (values.weight > 0) {
        achievements.push({
          id: `${exerciseName}-weight`,
          exerciseName,
          metric: 'weight' as const,
          title: `${exerciseName} ${unitLabel}`,
          detail: `Max ${weightUnit} per set: ${formatMaxValue(values.weight)} (${formatDate(values.weightDate)})`,
          maxValue: values.weight,
          dateAchieved: values.weightDate,
        });
      }

      // Only add reps achievement if maxValue > 0
      if (values.reps > 0) {
        achievements.push({
          id: `${exerciseName}-reps`,
          exerciseName,
          metric: 'reps' as const,
          title: `${exerciseName} Reps`,
          detail: `Max Reps per set: ${formatMaxValue(values.reps)} (${formatDate(values.repsDate)})`,
          maxValue: values.reps,
          dateAchieved: values.repsDate,
        });
      }

      return achievements;
    })
    .sort((a, b) => b.maxValue - a.maxValue || a.exerciseName.localeCompare(b.exerciseName) || a.metric.localeCompare(b.metric));
};