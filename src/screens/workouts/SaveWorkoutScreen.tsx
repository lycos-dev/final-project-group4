import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Theme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SaveWorkout'>;

const trimToMax = (value: string, max: number) => value.slice(0, max);
const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const SaveWorkoutScreen = ({ navigation, route }: Props) => {
  const { theme: appTheme } = useTheme();
  const styles = createStyles(appTheme);
  const { saveWorkout, discardWorkout } = useWorkout();

  const [workoutName, setWorkoutName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const completedDate = new Date(route.params.completedAt);
  const summaryDateLabel = completedDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to attach an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take a workout photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const validate = () => {
    if (!workoutName.trim()) {
      Alert.alert('Workout name required', 'Please enter a workout name before saving.');
      return null;
    }

    return true;
  };

  const handleSave = () => {
    const isValid = validate();
    if (!isValid) return;

    saveWorkout({
      routineName: workoutName,
      completedAt: route.params.completedAt,
      durationSeconds: route.params.durationSeconds,
      durationMinutes: Math.floor(route.params.durationSeconds / 60),
      totalVolumeKg: route.params.totalVolumeKg,
      totalSets: route.params.totalSets,
      description,
      photoUri,
    });

    navigation.popToTop();
  };

  const handleDiscard = () => {
    Alert.alert('Discard workout?', 'This will delete the workout and all logged sets.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          discardWorkout();
          navigation.popToTop();
        },
      },
    ]);
  };

  return (
    <Screen padded={false} forceTopSafe>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={appTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Save Workout</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveAction} hitSlop={8}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Input
          label="Workout Name"
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Workout name"
        />

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryRowLabel}>Duration</Text>
          <Text style={styles.summaryRowValue}>{formatDuration(route.params.durationSeconds)}</Text>
          <Text style={styles.summaryRowLabel}>Volume</Text>
          <Text style={styles.summaryRowValue}>{route.params.totalVolumeKg.toLocaleString()} kg</Text>
          <Text style={styles.summaryRowLabel}>Completed Sets</Text>
          <Text style={styles.summaryRowValue}>{route.params.totalSets}</Text>
          <Text style={styles.summaryRowLabel}>Date Completed</Text>
          <Text style={styles.summaryRowValue}>{summaryDateLabel}</Text>
        </View>

        <Text style={styles.sectionTitle}>Workout Photo (Optional)</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={24} color={appTheme.colors.muted} />
            <Text style={styles.photoPlaceholderText}>No photo selected</Text>
          </View>
        )}

        <View style={styles.photoActions}>
          <Button title="From Gallery" variant="secondary" onPress={openGallery} style={styles.photoButton} />
          <Button title="Use Camera" variant="secondary" onPress={openCamera} style={styles.photoButton} />
        </View>

        <Input
          label="Description (Optional)"
          value={description}
          onChangeText={(value) => setDescription(trimToMax(value, 240))}
          placeholder="How did this workout feel?"
          multiline
          textAlignVertical="top"
          style={styles.descriptionInput}
          hint={`${description.length}/240`}
        />

        <Button title="Discard Workout" variant="destructive" onPress={handleDiscard} fullWidth />
      </ScrollView>
    </Screen>
  );
};

const createStyles = (appTheme: Theme) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: appTheme.spacing.lg,
      paddingVertical: appTheme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: appTheme.colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: appTheme.colors.bg,
    },
    title: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeLg,
      fontWeight: appTheme.font.weightBold,
    },
    saveAction: {
      minWidth: 52,
      alignItems: 'flex-end',
    },
    saveText: {
      color: appTheme.colors.accent,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightBold,
    },
    content: {
      paddingHorizontal: appTheme.spacing.lg,
      paddingTop: appTheme.spacing.lg,
      paddingBottom: appTheme.spacing.xxl,
    },
    sectionTitle: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightBold,
      marginBottom: appTheme.spacing.sm,
    },
    summaryCard: {
      borderWidth: 1,
      borderColor: appTheme.colors.border,
      backgroundColor: appTheme.colors.surface,
      borderRadius: appTheme.radius.md,
      padding: appTheme.spacing.md,
      marginBottom: appTheme.spacing.lg,
      gap: appTheme.spacing.xs,
    },
    summaryRowLabel: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
      marginTop: appTheme.spacing.xs,
    },
    summaryRowValue: {
      color: appTheme.colors.text,
      fontSize: appTheme.font.sizeMd,
      fontWeight: appTheme.font.weightBold,
    },
    photoPlaceholder: {
      height: 160,
      borderRadius: appTheme.radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: appTheme.colors.border,
      backgroundColor: appTheme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      gap: appTheme.spacing.xs,
      marginBottom: appTheme.spacing.md,
    },
    photoPlaceholderText: {
      color: appTheme.colors.muted,
      fontSize: appTheme.font.sizeSm,
    },
    photoPreview: {
      width: '100%',
      height: 220,
      borderRadius: appTheme.radius.lg,
      marginBottom: appTheme.spacing.md,
      backgroundColor: appTheme.colors.surfaceAlt,
    },
    photoActions: {
      flexDirection: 'row',
      gap: appTheme.spacing.sm,
      marginBottom: appTheme.spacing.md,
    },
    photoButton: {
      flex: 1,
    },
    descriptionInput: {
      minHeight: 110,
      paddingTop: appTheme.spacing.md,
    },
  });
