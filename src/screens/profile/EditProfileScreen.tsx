import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useProfile } from '../../context/ProfileContext';
import { required, numberInRange, positiveNumber, maxLength } from '../../utils/validation';
import { theme } from '../../theme/theme';

export const EditProfileScreen = () => {
  const { profile, updateProfile } = useProfile();
  const nav = useNavigation();

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age));
  const [height, setHeight] = useState(String(profile.heightCm));
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [goal, setGoal] = useState(profile.goal);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validate = () => {
    const e: Record<string, string | null> = {
      name: required(name) || maxLength(name, 50),
      age: numberInRange(age, 10, 120, 'Age'),
      height: numberInRange(height, 50, 250, 'Height (cm)'),
      weight: positiveNumber(weight, 'Weight'),
      goal: maxLength(goal, 200),
    };
    setErrors(e);
    return Object.values(e).every((v) => !v);
  };

  const onSave = () => {
    if (!validate()) return;
    updateProfile({
      name: name.trim(),
      age: Number(age),
      heightCm: Number(height),
      weightKg: Number(weight),
      goal: goal.trim(),
    });
    nav.goBack();
  };

  return (
    <Screen scroll>
      <Input label="Name" value={name} onChangeText={setName} error={errors.name} placeholder="Your name" />
      <Input label="Age" value={age} onChangeText={setAge} keyboardType="numeric" error={errors.age} />
      <Input label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" error={errors.height} />
      <Input label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" error={errors.weight} />
      <Input
        label="Fitness Goal"
        value={goal}
        onChangeText={setGoal}
        error={errors.goal}
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />
      <Button title="Save Changes" onPress={onSave} style={{ marginTop: theme.spacing.md }} />
      <Button title="Cancel" variant="ghost" onPress={() => nav.goBack()} style={{ marginTop: theme.spacing.sm }} />
    </Screen>
  );
};
