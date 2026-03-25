ALTER TABLE "message_request" ADD COLUMN "client_abort_outcome" varchar(32);--> statement-breakpoint
ALTER TABLE "message_request" ADD COLUMN "client_abort_long_running" boolean;--> statement-breakpoint
ALTER TABLE "message_request" ADD COLUMN "client_abort_continued_by_request_id" integer;--> statement-breakpoint
ALTER TABLE "message_request" ADD COLUMN "client_abort_continued_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_message_request_client_abort_outcome_active" ON "message_request" USING btree ("client_abort_outcome") WHERE "message_request"."deleted_at" IS NULL AND "message_request"."client_abort_outcome" IS NOT NULL;
