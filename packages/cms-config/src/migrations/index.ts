import * as migration_20260409_213110 from './20260409_213110';

export const migrations = [
  {
    up: migration_20260409_213110.up,
    down: migration_20260409_213110.down,
    name: '20260409_213110'
  },
];
