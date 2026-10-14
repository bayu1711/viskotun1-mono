import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Registers custom font-size tokens so they aren't mistaken for text colors when merging. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
      {
        text: [
        '3xs',
        '2xs',
        'body',
        'title',
        'display-sm',
        'display',
        'metric',
        'hero',
        'jumbo',
        'hero-lg',
        'jumbo-lg',
        'giant']

      }]

    }
  }
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}