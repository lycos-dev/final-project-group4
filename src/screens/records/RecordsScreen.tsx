import React from 'react';
import { Screen } from '../../components/ui/Screen';
import { EmptyState } from '../../components/ui/EmptyState';

export const RecordsScreen = () => (
  <Screen>
    <EmptyState
      icon="medal-outline"
      title="Personal Records"
      subtitle="Your PRs per exercise will appear here."
    />
  </Screen>
);
