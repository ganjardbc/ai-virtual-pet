CREATE TABLE "pet_personalities" (
	"pet_id" text PRIMARY KEY NOT NULL,
	"playful" double precision NOT NULL,
	"curious" double precision NOT NULL,
	"shy" double precision NOT NULL,
	"independent" double precision NOT NULL,
	"clingy" double precision NOT NULL,
	"daily_delta_date" date,
	"playful_daily_delta" double precision DEFAULT 0 NOT NULL,
	"curious_daily_delta" double precision DEFAULT 0 NOT NULL,
	"shy_daily_delta" double precision DEFAULT 0 NOT NULL,
	"independent_daily_delta" double precision DEFAULT 0 NOT NULL,
	"clingy_daily_delta" double precision DEFAULT 0 NOT NULL,
	"independent_signal_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pet_personalities_trait_range_check" CHECK ("pet_personalities"."playful" between 0.05 and 0.95
        and "pet_personalities"."curious" between 0.05 and 0.95
        and "pet_personalities"."shy" between 0.05 and 0.95
        and "pet_personalities"."independent" between 0.05 and 0.95
        and "pet_personalities"."clingy" between 0.05 and 0.95),
	CONSTRAINT "pet_personalities_independent_clingy_check" CHECK ("pet_personalities"."independent" + "pet_personalities"."clingy" <= 1.400001)
);
--> statement-breakpoint
ALTER TABLE "pet_personalities" ADD CONSTRAINT "pet_personalities_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;