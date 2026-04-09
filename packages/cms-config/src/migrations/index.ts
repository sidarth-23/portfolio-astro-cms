import * as migration_20260409_213110 from './20260409_213110';
import * as migration_20260410_044500 from './20260410_044500';
import * as migration_20260410_044501 from './20260410_044501';

export const migrations = [
  {
    up: migration_20260409_213110.up,
    down: migration_20260409_213110.down,
    name: '20260409_213110'
  },
  {
    up: migration_20260410_044500.up,
    down: migration_20260410_044500.down,
    name: '20260410_044500'
  },
  {
    up: migration_20260410_044501.up,
    down: migration_20260410_044501.down,
    name: '20260410_044501'
  },
];
