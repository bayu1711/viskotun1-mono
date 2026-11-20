import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    // eslint-config-next 16 ships eslint-plugin-react-hooks 7, whose React Compiler rules flag
    // patterns that predate the Next 16 upgrade (setState in effects, refs read during render).
    // The app does not run the React Compiler, so report them as warnings until they are refactored.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn'
    }
  },
  globalIgnores(['.next/**', '.next*/**', 'out/**', 'build/**', 'dist/**', 'next-env.d.ts'])
]);
