import React from 'react';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';

export const MeasurementsScreen = () => (
  <Screen>
    <EmptyState
      icon="resize-outline"
      title="Body Measurements"
      subtitle="Log weight, chest, waist, arms, and more over time."
    />
  </Screen>
);
