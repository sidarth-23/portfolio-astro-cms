import * as migration_20260218_005803 from './20260218_005803';
import * as migration_20260220_000001 from './20260220_000001';

export const migrations = [
  {
    up: migration_20260218_005803.up,
    down: migration_20260218_005803.down,
    name: '20260218_005803'
  },
  {
    up: migration_20260220_000001.up,
    down: migration_20260220_000001.down,
    name: '20260220_000001'
  },
];
