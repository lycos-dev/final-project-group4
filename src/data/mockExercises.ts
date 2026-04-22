import { Exercise } from '../types';

export const MOCK_EXERCISES: Exercise[] = [
  { id: '1', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', instructions: 'Lower the bar to your chest, then press up explosively. Keep elbows at ~45°.', defaultSets: 1, defaultReps: 0 },
  { id: '2', name: 'Pull Up', muscleGroup: 'Back', equipment: 'Bodyweight', instructions: 'Hang with arms extended, pull chest to bar, lower under control.', defaultSets: 1, defaultReps: 0 },
  { id: '3', name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell', instructions: 'Brace your core, descend until thighs are parallel, drive up through your heels.', defaultSets: 1, defaultReps: 0 },
  { id: '4', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', instructions: 'Press the bar overhead while keeping your core tight. Lock out the elbows.', defaultSets: 1, defaultReps: 0 },
  { id: '5', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', instructions: 'Hip hinge to grip the bar, drive hips forward to lift. Keep a neutral spine.', defaultSets: 1, defaultReps: 0 },
  { id: '6', name: 'Bicep Curl', muscleGroup: 'Arms', equipment: 'Dumbbell', instructions: 'Curl weight up while keeping elbows pinned. Squeeze at the top.', defaultSets: 1, defaultReps: 0 },
  { id: '7', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', instructions: 'Hold a straight body line on your forearms. Do not let hips sag.', defaultSets: 1, defaultReps: 0 },
  { id: '8', name: 'Treadmill Run', muscleGroup: 'Cardio', equipment: 'Treadmill', instructions: 'Steady pace at conversational effort. Maintain upright posture.', defaultSets: 1, defaultReps: 0 },
  { id: '9', name: 'Lunge', muscleGroup: 'Legs', equipment: 'Dumbbell', instructions: 'Step forward, bend both knees to 90°, push back to start.', defaultSets: 1, defaultReps: 0 },
  { id: '10', name: 'Burpee', muscleGroup: 'Full Body', equipment: 'Bodyweight', instructions: 'Squat, kick back to plank, push-up, jump up. Repeat continuously.', defaultSets: 1, defaultReps: 0 },
];
