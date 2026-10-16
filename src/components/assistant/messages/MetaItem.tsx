import React from 'react';

interface MetaItemProps {
  label: string;
  value: string;
}

export function MetaItem({ label, value }: MetaItemProps) {
  return (
    <div>
      <dt className="text-xs text-ink/45">{label}</dt>
      <dd className="mt-0.5 text-body">{value}</dd>
    </div>);

}