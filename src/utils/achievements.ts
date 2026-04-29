import { CompletedWorkout, WeightUnit } from '../context/WorkoutContext';

export type AchievementMetric = 'weight' | 'reps';

export interface AchievementCardData {
  id: string;
  exerciseName: string;
  metric: AchievementMetric;
  title: string;
  detail: string;
  maxValue: number;
}

const formatMaxValue = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

const parseNumber = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const buildExerciseAchievements = (
  completedWorkouts: CompletedWorkout[],
  weightUnit: WeightUnit,
): AchievementCardData[] => {
  const stats = new Map<string, { weight: number; reps: number }>();

  completedWorkouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const key = exercise.name;
      const current = stats.get(key) ?? { weight: 0, reps: 0 };

      exercise.sets.forEach((set) => {
        if (!set.completed) return;
        const reps = parseNumber(set.reps);
        const weight = parseNumber(set.weight);

        if (reps > current.reps) current.reps = reps;
        if (weight > current.weight) current.weight = weight;
      });

      stats.set(key, current);
    });
  });

  return Array.from(stats.entries())
    .flatMap(([exerciseName, values]) => {
      const unitLabel = weightUnit.toUpperCase();
      return [
        {
          id: `${exerciseName}-weight`,
          exerciseName,
          metric: 'weight' as const,
          title: `${exerciseName} ${unitLabel}`,
          detail: `Max ${weightUnit} per set: ${formatMaxValue(values.weight)}`,
          maxValue: values.weight,
        },
        {
          id: `${exerciseName}-reps`,
          exerciseName,
          metric: 'reps' as const,
          title: `${exerciseName} Reps`,
          detail: `Max Reps per set: ${formatMaxValue(values.reps)}`,
          maxValue: values.reps,
        },
      ];
    })
    .sort((a, b) => b.maxValue - a.maxValue || a.exerciseName.localeCompare(b.exerciseName) || a.metric.localeCompare(b.metric));
};