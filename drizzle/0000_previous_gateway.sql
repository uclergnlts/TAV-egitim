CREATE TABLE `attendances` (
	`id` text PRIMARY KEY NOT NULL,
	`personel_id` text NOT NULL,
	`training_id` text NOT NULL,
	`training_topic_id` text,
	`trainer_id` text,
	`sicil_no` text NOT NULL,
	`ad_soyad` text NOT NULL,
	`tc_kimlik_no` text NOT NULL,
	`gorevi` text NOT NULL,
	`proje_adi` text NOT NULL,
	`grup` text NOT NULL,
	`personel_durumu` text NOT NULL,
	`egitim_kodu` text NOT NULL,
	`egitim_alt_basligi` text,
	`baslama_tarihi` text NOT NULL,
	`bitis_tarihi` text NOT NULL,
	`baslama_saati` text NOT NULL,
	`bitis_saati` text NOT NULL,
	`egitim_suresi_dk` integer NOT NULL,
	`egitim_yeri` text NOT NULL,
	`ic_dis_egitim` text NOT NULL,
	`sonuc_belgesi_turu` text NOT NULL,
	`egitim_detayli_aciklama` text,
	`veri_giren_sicil` text NOT NULL,
	`veri_giren_ad_soyad` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`personel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`training_id`) REFERENCES `trainings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`training_topic_id`) REFERENCES `training_topics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendances_unique_idx` ON `attendances` (`personel_id`,`training_id`,`year`);--> statement-breakpoint
CREATE INDEX `idx_att_year_month` ON `attendances` (`year`,`month`);--> statement-breakpoint
CREATE INDEX `idx_att_training_year` ON `attendances` (`training_id`,`year`);--> statement-breakpoint
CREATE INDEX `idx_att_personel_year` ON `attendances` (`personel_id`,`year`);--> statement-breakpoint
CREATE INDEX `idx_att_sicil` ON `attendances` (`sicil_no`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`user_role` text NOT NULL,
	`action_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`action_time` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`old_value` text,
	`new_value` text,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `import_errors` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`row_number` integer NOT NULL,
	`error_message` text NOT NULL,
	`raw_data` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `imports` (
	`id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`row_count` integer NOT NULL,
	`success_count` integer NOT NULL,
	`fail_count` integer NOT NULL,
	`imported_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`imported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personnel` (
	`id` text PRIMARY KEY NOT NULL,
	`sicil_no` text NOT NULL,
	`full_name` text NOT NULL,
	`tc_kimlik_no` text NOT NULL,
	`gorevi` text NOT NULL,
	`proje_adi` text NOT NULL,
	`grup` text NOT NULL,
	`personel_durumu` text DEFAULT 'CALISAN' NOT NULL,
	`cinsiyet` text,
	`telefon` text,
	`dogum_tarihi` text,
	`adres` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personnel_sicil_no_idx` ON `personnel` (`sicil_no`);--> statement-breakpoint
CREATE TABLE `personnel_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trainers` (
	`id` text PRIMARY KEY NOT NULL,
	`sicil_no` text NOT NULL,
	`full_name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trainers_sicil_no_idx` ON `trainers` (`sicil_no`);--> statement-breakpoint
CREATE TABLE `training_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `training_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`training_id` text NOT NULL,
	`title` text NOT NULL,
	`order_no` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`training_id`) REFERENCES `trainings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `training_topics_unique_idx` ON `training_topics` (`training_id`,`title`);--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`duration_min` integer NOT NULL,
	`category` text DEFAULT 'TEMEL' NOT NULL,
	`default_location` text,
	`default_document_type` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trainings_code_idx` ON `trainings` (`code`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`sicil_no` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_sicil_no_idx` ON `users` (`sicil_no`);