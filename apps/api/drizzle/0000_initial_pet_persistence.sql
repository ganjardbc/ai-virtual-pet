CREATE TABLE "events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"pet_id" text NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_states" (
	"pet_id" text PRIMARY KEY NOT NULL,
	"hunger" double precision NOT NULL,
	"energy" double precision NOT NULL,
	"happiness" double precision NOT NULL,
	"bond" double precision NOT NULL,
	"current_activity" text NOT NULL,
	"last_interaction_at" timestamp with time zone,
	"last_simulated_at" timestamp with time zone NOT NULL,
	"sleep_started_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pet_states_hunger_range_check" CHECK ("pet_states"."hunger" between 0 and 100),
	CONSTRAINT "pet_states_energy_range_check" CHECK ("pet_states"."energy" between 0 and 100),
	CONSTRAINT "pet_states_happiness_range_check" CHECK ("pet_states"."happiness" between 0 and 100),
	CONSTRAINT "pet_states_bond_range_check" CHECK ("pet_states"."bond" between 0 and 100),
	CONSTRAINT "pet_states_activity_check" CHECK ("pet_states"."current_activity" in ('IDLE', 'SLEEPING', 'PLAYING_ALONE', 'RESTING', 'LOOKING_AROUND', 'WAITING')),
	CONSTRAINT "pet_states_sleep_consistency_check" CHECK (("pet_states"."current_activity" = 'SLEEPING') = ("pet_states"."sleep_started_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"species" text DEFAULT 'DEFAULT' NOT NULL,
	"stage" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"hatched_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "pets_stage_check" CHECK ("pets"."stage" in ('EGG', 'BABY')),
	CONSTRAINT "pets_stage_lifecycle_check" CHECK (("pets"."stage" = 'EGG' and "pets"."hatched_at" is null and "pets"."name" is null)
        or ("pets"."stage" <> 'EGG' and "pets"."hatched_at" is not null)),
	CONSTRAINT "pets_name_length_check" CHECK ("pets"."name" is null or char_length("pets"."name") between 1 and 30),
	CONSTRAINT "pets_version_check" CHECK ("pets"."version" >= 0)
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_states" ADD CONSTRAINT "pet_states_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_pet_occurred_at_idx" ON "events" USING btree ("pet_id","occurred_at");--> statement-breakpoint
CREATE INDEX "events_pet_type_occurred_at_idx" ON "events" USING btree ("pet_id","type","occurred_at");