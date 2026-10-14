import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return <div className="mx-auto w-full max-w-6xl px-5 pt-6 lg:px-10 lg:pt-8">{children}</div>;
}