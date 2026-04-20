import db from './client';

/**
 * Seeds the exercise library with preset exercises.
 * Only runs if the library is empty (safe to call on every launch).
 */
export const seedExercises = (): void => {
  const existing = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises WHERE is_preset = 1'
  );

  if (existing && existing.count > 0) return; // Already seeded

  const presets = [
    // Strength
    { name: 'Bench Press',       category: 'strength',    muscle: 'Chest',      instructions: 'Lie flat on a bench. Lower the bar to your chest, then press it back up.' },
    { name: 'Squat',             category: 'strength',    muscle: 'Legs',       instructions: 'Stand with feet shoulder-width apart. Lower your hips until thighs are parallel, then stand up.' },
    { name: 'Deadlift',          category: 'strength',    muscle: 'Back, Legs', instructions: 'Hinge at the hips and grip the bar. Drive through your heels to stand upright.' },
    { name: 'Overhead Press',    category: 'strength',    muscle: 'Shoulders',  instructions: 'Press the barbell overhead from shoulder height until arms are fully extended.' },
    { name: 'Barbell Row',       category: 'strength',    muscle: 'Back',       instructions: 'Hinge forward, grip the bar, and pull it toward your lower chest.' },
    { name: 'Pull-up',           category: 'strength',    muscle: 'Back, Arms', instructions: 'Hang from a bar and pull your chin above it using your lats.' },
    { name: 'Dumbbell Curl',     category: 'strength',    muscle: 'Biceps',     instructions: 'Hold dumbbells at your sides and curl them toward your shoulders.' },
    { name: 'Tricep Dip',        category: 'strength',    muscle: 'Triceps',    instructions: 'Lower yourself between parallel bars and push back up.' },
    { name: 'Leg Press',         category: 'strength',    muscle: 'Legs',       instructions: 'Push the platform away using your legs on the machine.' },
    { name: 'Lat Pulldown',      category: 'strength',    muscle: 'Back',       instructions: 'Pull the bar down to your upper chest while seated on the machine.' },
    // Cardio
    { name: 'Running',           category: 'cardio',      muscle: 'Full Body',  instructions: 'Maintain a steady pace. Focus on breathing and posture.' },
    { name: 'Jump Rope',         category: 'cardio',      muscle: 'Full Body',  instructions: 'Skip the rope at a consistent rhythm, staying on the balls of your feet.' },
    { name: 'Cycling',           category: 'cardio',      muscle: 'Legs',       instructions: 'Pedal at a moderate cadence. Keep your back straight.' },
    { name: 'Rowing Machine',    category: 'cardio',      muscle: 'Full Body',  instructions: 'Drive with your legs first, then pull the handle to your lower chest.' },
    { name: 'Burpee',            category: 'cardio',      muscle: 'Full Body',  instructions: 'Drop to a push-up, jump feet forward, then jump with arms overhead.' },
    // Flexibility
    { name: 'Hamstring Stretch', category: 'flexibility', muscle: 'Legs',       instructions: 'Sit on the floor and reach toward your toes, keeping legs straight.' },
    { name: 'Hip Flexor Stretch',category: 'flexibility', muscle: 'Hips',       instructions: 'Kneel on one knee and push your hips forward gently.' },
    { name: 'Shoulder Stretch',  category: 'flexibility', muscle: 'Shoulders',  instructions: 'Pull one arm across your chest and hold with the other arm.' },
    { name: 'Cat-Cow Stretch',   category: 'flexibility', muscle: 'Back',       instructions: 'On all fours, alternate between arching and rounding your back.' },
    { name: 'Child\'s Pose',     category: 'flexibility', muscle: 'Back, Hips', instructions: 'Sit back on your heels and extend your arms forward on the floor.' },
  ];

  for (const ex of presets) {
    db.runSync(
      `INSERT INTO exercises (name, category, muscle_group, instructions, is_preset)
       VALUES (?, ?, ?, ?, 1)`,
      [ex.name, ex.category, ex.muscle, ex.instructions]
    );
  }
};