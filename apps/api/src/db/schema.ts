import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
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

// Personality evolves slowly, so one row per pet holds current traits plus today's applied
// deltas for the daily cap. No history table (plan Task 2.1).
export const petPersonalities = pgTable(
  'pet_personalities',
  {
    petId: text('pet_id')
      .primaryKey()
      .references(() => pets.id, { onDelete: 'cascade' }),
    playful: doublePrecision('playful').notNull(),
    curious: doublePrecision('curious').notNull(),
    shy: doublePrecision('shy').notNull(),
    independent: doublePrecision('independent').notNull(),
    clingy: doublePrecision('clingy').notNull(),
    dailyDeltaDate: date('daily_delta_date', { mode: 'string' }),
    playfulDailyDelta: doublePrecision('playful_daily_delta').notNull().default(0),
    curiousDailyDelta: doublePrecision('curious_daily_delta').notNull().default(0),
    shyDailyDelta: doublePrecision('shy_daily_delta').notNull().default(0),
    independentDailyDelta: doublePrecision('independent_daily_delta').notNull().default(0),
    clingyDailyDelta: doublePrecision('clingy_daily_delta').notNull().default(0),
    independentSignalDate: date('independent_signal_date', { mode: 'string' }),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (table) => [
    check(
      'pet_personalities_trait_range_check',
      sql`${table.playful} between 0.05 and 0.95
        and ${table.curious} between 0.05 and 0.95
        and ${table.shy} between 0.05 and 0.95
        and ${table.independent} between 0.05 and 0.95
        and ${table.clingy} between 0.05 and 0.95`,
    ),
    // Tiny tolerance: traits are rounded to 6 decimals, so the sum can carry float noise.
    check('pet_personalities_independent_clingy_check', sql`${table.independent} + ${table.clingy} <= 1.400001`),
  ],
);

// One default conversation per pet (plan Task 3.1). Chat history is not Memory.
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  petId: text('pet_id')
    .notNull()
    .unique()
    .references(() => pets.id, { onDelete: 'cascade' }),
  createdAt: timestamptz('created_at').notNull(),
  updatedAt: timestamptz('updated_at').notNull(),
});

export const messages = pgTable(
  'messages',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    // Idempotency key of a player turn: a retry resends the same value (plan Task 3.8).
    clientMessageId: text('client_message_id'),
    // The player message an assistant message answers.
    replyToMessageId: bigint('reply_to_message_id', { mode: 'number' }).references((): AnyPgColumn => messages.id, {
      onDelete: 'cascade',
    }),
    // Turn observability for debugging (intent, provider, latency…). Never prompts or reasoning.
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamptz('created_at').notNull(),
  },
  (table) => [
    index('messages_conversation_created_at_idx').on(table.conversationId, table.createdAt, table.id),
    uniqueIndex('messages_client_message_id_unique')
      .on(table.conversationId, table.clientMessageId)
      .where(sql`${table.clientMessageId} is not null`),
    // At most one reply per player turn.
    uniqueIndex('messages_reply_to_message_id_unique')
      .on(table.replyToMessageId)
      .where(sql`${table.replyToMessageId} is not null`),
    check('messages_role_check', sql`${table.role} in ('USER', 'ASSISTANT')`),
    check('messages_content_check', sql`char_length(${table.content}) > 0`),
    check(
      'messages_turn_link_check',
      sql`(${table.role} = 'USER' and ${table.clientMessageId} is not null and ${table.replyToMessageId} is null)
        or (${table.role} = 'ASSISTANT' and ${table.clientMessageId} is null and ${table.replyToMessageId} is not null)`,
    ),
  ],
);
