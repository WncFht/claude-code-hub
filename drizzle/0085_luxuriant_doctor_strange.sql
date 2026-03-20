ALTER TABLE "providers" ADD COLUMN "discovered_models" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "model_discovery_status" varchar(20);--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "last_model_sync_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "last_model_sync_error" text;