import React from 'react';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';

export const RoutinesScreen = () => (
  <Screen>
    <EmptyState
      icon="list-outline"
      title="Routine Builder"
      subtitle="Compose workouts from your exercise library. Coming next round."
    />
  </Screen>
);
