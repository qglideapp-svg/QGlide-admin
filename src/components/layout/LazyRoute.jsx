import React, { Suspense } from 'react';
import LazyLoader from '../common/LazyLoader.jsx';

export default function LazyRoute({ children }) {
  return (
    <Suspense fallback={<LazyLoader variant="page" fullScreen />}>
      {children}
    </Suspense>
  );
}
