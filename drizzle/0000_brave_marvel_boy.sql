CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"stored_path" varchar(500) NOT NULL,
	"mime_type" varchar(100),
	"size_bytes" integer,
	"uploaded_by" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"author" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'open',
	"severity" varchar(50) DEFAULT 'minor',
	"group" varchar(50) DEFAULT 'incoming_control',
	"assigned_to" varchar(255),
	"root_cause" text,
	"corrective_action" text,
	"preventive_action" text,
	"due_date" date,
	"created_at" timestamp DEFAULT now(),
	"workflow_template_key" varchar(50),
	"product_name" varchar(255),
	"order_number" varchar(100),
	"batch_number" varchar(100),
	"estimated_cost" integer,
	"actual_cost" integer,
	"currency" varchar(3) DEFAULT 'EUR',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entry_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7) NOT NULL,
	"order" integer NOT NULL,
	CONSTRAINT "statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7),
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workflow_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"template_step_id" integer,
	"step_order" integer NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"assigned_to" varchar(255),
	"due_date" date,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_template_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"step_order" integer NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"default_assignee" varchar(255),
	"default_due_days" integer
);
--> statement-breakpoint
CREATE TABLE "workflow_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"template_key" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "workflow_templates_template_key_unique" UNIQUE("template_key")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "entry_tag_unique" ON "entry_tags" USING btree ("entry_id","tag_id");