import React, { Suspense } from 'react';
import { CommunityPage } from '../../views/Community';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CommunityPage />
    </Suspense>
  );
}
