CREATE TYPE "public"."device_type" AS ENUM('mobile', 'tablet', 'desktop');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('superadmin', 'admin', 'finance');--> statement-breakpoint
CREATE TYPE "public"."attending_status" AS ENUM('present', 'absent', 'maybe');--> statement-breakpoint
CREATE TYPE "public"."blast_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video_link');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('desain', 'cetak', 'finishing', 'dikirim');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'pending_payment', 'payment_verified', 'in_production', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('digital_only', 'digital_plus_physical');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('basic', 'premium');--> statement-breakpoint
CREATE TYPE "public"."template_event_type" AS ENUM('wedding', 'engagement', 'khitan', 'aqiqah');--> statement-breakpoint
CREATE TABLE "invitation_analytics" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"invitation_id" uuid NOT NULL,
	"device_type" "device_type",
	"browser_name" varchar(100),
	"clicked_maps" boolean DEFAULT false NOT NULL,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"guest_name" varchar(255) NOT NULL,
	"guest_whatsapp" varchar(20) NOT NULL,
	"guest_slug" varchar(64) NOT NULL,
	"whatsapp_blast_status" "blast_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invitation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"event_name" varchar(100) NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" varchar(20),
	"timezone" varchar(10),
	"place_name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"maps_url" text
);
--> statement-breakpoint
CREATE TABLE "invitation_galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"media_type" "media_type" NOT NULL,
	"media_url" varchar(2048) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"music_url" varchar(2048),
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "invitations_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "invitations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "physical_invitation_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"total_quantity" integer NOT NULL,
	"shipping_address" text NOT NULL,
	"vendor_status" "vendor_status" DEFAULT 'desain' NOT NULL,
	"tracking_number" varchar(100),
	CONSTRAINT "physical_invitation_details_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "rsvp_and_wishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"guest_id" uuid,
	"name" varchar(255) NOT NULL,
	"is_attending" "attending_status",
	"total_guests_bringing" integer DEFAULT 1 NOT NULL,
	"wishes_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(30) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"client_whatsapp" varchar(20) NOT NULL,
	"template_id" uuid,
	"order_type" "order_type" NOT NULL,
	"total_price" numeric(15, 2) NOT NULL,
	"order_status" "order_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"bank_destination" varchar(50) NOT NULL,
	"sender_name" varchar(255) NOT NULL,
	"amount_paid" numeric(15, 2) NOT NULL,
	"receipt_image_url" varchar(2048) NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	CONSTRAINT "payments_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "template_category" NOT NULL,
	"event_type" "template_event_type" NOT NULL,
	"thumbnail_url" varchar(2048),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_template_code_unique" UNIQUE("template_code")
);
--> statement-breakpoint
ALTER TABLE "invitation_analytics" ADD CONSTRAINT "invitation_analytics_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_events" ADD CONSTRAINT "invitation_events_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_galleries" ADD CONSTRAINT "invitation_galleries_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_invitation_details" ADD CONSTRAINT "physical_invitation_details_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvp_and_wishes" ADD CONSTRAINT "rsvp_and_wishes_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvp_and_wishes" ADD CONSTRAINT "rsvp_and_wishes_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;