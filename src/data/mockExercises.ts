import { Exercise } from '../types';

export const MOCK_EXERCISES: Exercise[] = [
  {
    id: '1',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    equipment: 'Barbell',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=Bench+Press',
    steps: [
      'Lie flat, grip bar just outside shoulder width.',
      'Unrack and lower the bar to mid-chest, elbows ~45°.',
      'Drive the bar up explosively until arms are fully extended.',
      'Re-rack under control. Breathe out on the push.',
    ],
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    id: '2',
    name: 'Pull Up',
    muscleGroup: 'Back',
    equipment: 'Bodyweight',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=Pull+Up',
    steps: [
      'Hang with arms fully extended, overhand grip.',
      'Depress your shoulder blades, then pull chest toward the bar.',
      'Pause briefly at the top, chin over bar.',
      'Lower slowly back to a dead hang.',
    ],
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: '3',
    name: 'Squat',
    muscleGroup: 'Legs',
    equipment: 'Barbell',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=Squat',
    steps: [
      'Bar on traps, feet shoulder-width apart, toes slightly out.',
      'Brace core, take a big breath, break at hips and knees together.',
      'Descend until thighs are at least parallel to the floor.',
      'Drive through your heels to stand. Keep chest tall.',
    ],
    defaultSets: 4,
    defaultReps: 5,
  },
  {
    id: '4',
    name: 'Overhead Press',
    muscleGroup: 'Shoulders',
    equipment: 'Barbell',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=OHP',
    steps: [
      'Hold bar at collarbone, grip just outside shoulders.',
      'Brace abs and glutes, press bar straight overhead.',
      'Lock elbows at the top — bar should be over your ears.',
      'Lower the bar back to collarbone in a controlled arc.',
    ],
    defaultSets: 3,
    defaultReps: 6,
  },
  {
    id: '5',
    name: 'Deadlift',
    muscleGroup: 'Back',
    equipment: 'Barbell',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=Deadlift',
    steps: [
      'Stand with bar over mid-foot, hip-width stance.',
      'Hinge at hips, grip bar just outside legs. Neutral spine.',
      'Push the floor away — hips and chest rise at the same rate.',
      'Lock out at the top. Hinge back down to reset.',
    ],
    defaultSets: 3,
    defaultReps: 5,
  },
  {
    id: '6',
    name: 'Bicep Curl',
    muscleGroup: 'Arms',
    equipment: 'Dumbbell',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=Bicep+Curl',
    steps: [
      'Stand tall, dumbbells at sides, palms facing forward.',
      'Pin elbows to your sides — they should not swing.',
      'Curl the weight up and squeeze hard at the top.',
      'Lower slowly over 2–3 seconds. Repeat.',
    ],
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: '7',
    name: 'Plank',
    muscleGroup: 'Core',
    equipment: 'Bodyweight',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=Plank',
    steps: [
      'Forearms on the floor, elbows directly under shoulders.',
      'Form a straight line from head to heels. No sagging hips.',
      'Squeeze glutes and brace abs as if bracing for a punch.',
      'Breathe steadily. Hold for target duration.',
    ],
    defaultSets: 3,
    defaultReps: 60,
  },
  {
    id: '8',
    name: 'Treadmill Run',
    muscleGroup: 'Cardio',
    equipment: 'Treadmill',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=Treadmill',
    steps: [
      'Start at a comfortable warm-up pace for 2 minutes.',
      'Increase to your working pace — conversational effort.',
      'Maintain upright posture, relaxed shoulders.',
      'Cool down at a slow walk for the final 2 minutes.',
    ],
    defaultSets: 1,
    defaultReps: 20,
  },
  {
    id: '9',
    name: 'Lunge',
    muscleGroup: 'Legs',
    equipment: 'Dumbbell',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=Lunge',
    steps: [
      'Stand tall, dumbbells at sides.',
      'Step forward, lower until both knees reach ~90°.',
      'Front knee stays directly above ankle — don\'t let it cave.',
      'Push through front heel to return to start. Alternate legs.',
    ],
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: '10',
    name: 'Burpee',
    muscleGroup: 'Full Body',
    equipment: 'Bodyweight',
    // TODO: Insert real photo/GIF link here
    imageUrl: 'https://via.placeholder.com/400x300/16161D/C6FF3D?text=Burpee',
    steps: [
      'From standing, squat and place hands on the floor.',
      'Jump both feet back into a high plank. Perform a push-up.',
      'Jump feet back to hands, then explode upward.',
      'Land softly and immediately go into the next rep.',
    ],
    defaultSets: 3,
    defaultReps: 15,
  },
];