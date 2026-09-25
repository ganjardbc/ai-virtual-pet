CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"pet_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "conversations_pet_id_unique" UNIQUE("pet_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"conversation_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"client_message_id" text,
	"reply_to_message_id" bigint,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "messages_role_check" CHECK ("messages"."role" in ('USER', 'ASSISTANT')),
	CONSTRAINT "messages_content_check" CHECK (char_length("messages"."content") > 0),
	CONSTRAINT "messages_turn_link_check" CHECK (("messages"."role" = 'USER' and "messages"."client_message_id" is not null and "messages"."reply_to_message_id" is null)
        or ("messages"."role" = 'ASSISTANT' and "messages"."client_message_id" is null and "messages"."reply_to_message_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_messages_id_fk" FOREIGN KEY ("reply_to_message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_conversation_created_at_idx" ON "messages" USING btree ("conversation_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_client_message_id_unique" ON "messages" USING btree ("conversation_id","client_message_id") WHERE "messages"."client_message_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "messages_reply_to_message_id_unique" ON "messages" USING btree ("reply_to_message_id") WHERE "messages"."reply_to_message_id" is not null;