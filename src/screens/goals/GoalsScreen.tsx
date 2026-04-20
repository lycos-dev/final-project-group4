import React from 'react';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';

export const GoalsScreen = () => (
  <Screen>
    <EmptyState
      icon="trophy-outline"
      title="Goals coming soon"
      subtitle="Track weekly workout targets, weight goals, and personal records."
    />
  </Screen>
);
