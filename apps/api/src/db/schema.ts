import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const pets = pgTable(
  'pets',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    species: text('species').notNull().default('DEFAULT'),
    stage: text('stage').notNull(),
    createdAt: timestamptz('created_at').notNull(),
    hatchedAt: timestamptz('hatched_at'),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
    version: integer('version').notNull().default(0),
  },
  (table) => [
    check('pets_stage_check', sql`${table.stage} in ('EGG', 'BABY')`),
    check(
      'pets_stage_lifecycle_check',
      sql`(${table.stage} = 'EGG' and ${table.hatchedAt} is null and ${table.name} is null)
        or (${table.stage} <> 'EGG' and ${table.hatchedAt} is not null)`,
    ),
    check('pets_name_length_check', sql`${table.name} is null or char_length(${table.name}) between 1 and 30`),
    check('pets_version_check', sql`${table.version} >= 0`),
  ],
);

export const petStates = pgTable(
  'pet_states',
  {
    petId: text('pet_id')
      .primaryKey()
      .references(() => pets.id, { onDelete: 'cascade' }),
    hunger: doublePrecision('hunger').notNull(),
    energy: doublePrecision('energy').notNull(),
    happiness: doublePrecision('happiness').notNull(),
    bond: doublePrecision('bond').notNull(),
    currentActivity: text('current_activity').notNull(),
    lastInteractionAt: timestamptz('last_interaction_at'),
    lastSimulatedAt: timestamptz('last_simulated_at').notNull(),
    sleepStartedAt: timestamptz('sleep_started_at'),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    check('pet_states_hunger_range_check', sql`${table.hunger} between 0 and 100`),
    check('pet_states_energy_range_check', sql`${table.energy} between 0 and 100`),
    check('pet_states_happiness_range_check', sql`${table.happiness} between 0 and 100`),
    check('pet_states_bond_range_check', sql`${table.bond} between 0 and 100`),
    check(
      'pet_states_activity_check',
      sql`${table.currentActivity} in ('IDLE', 'SLEEPING', 'PLAYING_ALONE', 'RESTING', 'LOOKING_AROUND', 'WAITING')`,
    ),
    check(
      'pet_states_sleep_consistency_check',
      sql`(${table.currentActivity} = 'SLEEPING') = (${table.sleepStartedAt} is not null)`,
    ),
  ],
);

export const events = pgTable(
  'events',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    petId: text('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    occurredAt: timestamptz('occurred_at').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
    schemaVersion: integer('schema_version').notNull().default(1),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('events_pet_occurred_at_idx').on(table.petId, table.occurredAt),
    index('events_pet_type_occurred_at_idx').on(table.petId, table.type, table.occurredAt),
  ],
);
