import { PresetRoutine } from '../types';
import { MOCK_EXERCISES } from './mockExercises';

// Convenience references
const [
  benchPress,  // id 1 – Chest / Barbell
  pullUp,      // id 2 – Back / Bodyweight
  squat,       // id 3 – Legs / Barbell
  ohp,         // id 4 – Shoulders / Barbell
  deadlift,    // id 5 – Back / Barbell
  bicepCurl,   // id 6 – Arms / Dumbbell
  plank,       // id 7 – Core / Bodyweight
  treadmill,   // id 8 – Cardio / Treadmill
  lunge,       // id 9 – Legs / Dumbbell
  burpee,      // id 10 – Full Body / Bodyweight
] = MOCK_EXERCISES;

export const PRESET_ROUTINES: PresetRoutine[] = [
  {
    id: 'pr-1',
    name: 'Beginner Full Body',
    level: 'Beginner',
    category: 'Full Body',
    exercises: [squat, benchPress, pullUp, plank, treadmill],
  },
  {
    id: 'pr-2',
    name: 'Beginner Cardio Burn',
    level: 'Beginner',
    category: 'Cardio',
    exercises: [treadmill, burpee, lunge, plank],
  },
  {
    id: 'pr-3',
    name: 'Intermediate Push Day',
    level: 'Intermediate',
    category: 'Push',
    exercises: [benchPress, ohp, bicepCurl, plank],
  },
  {
    id: 'pr-4',
    name: 'Intermediate Pull Day',
    level: 'Intermediate',
    category: 'Pull',
    exercises: [deadlift, pullUp, bicepCurl, plank],
  },
  {
    id: 'pr-5',
    name: 'Intermediate Lower Body',
    level: 'Intermediate',
    category: 'Legs',
    exercises: [squat, lunge, deadlift, plank],
  },
  {
    id: 'pr-6',
    name: 'Advanced Power Complex',
    level: 'Advanced',
    category: 'Full Body',
    exercises: [deadlift, squat, benchPress, ohp, pullUp, burpee],
  },
];