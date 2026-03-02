CREATE TABLE `agent_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitor_id` varchar(100) NOT NULL,
	`visitor_email` varchar(320),
	`visitor_name` varchar(255),
	`messages` text,
	`status` enum('active','closed','transferred') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbot_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `code_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repository_url` varchar(255) NOT NULL,
	`file_path` varchar(255) NOT NULL,
	`suggestion` text NOT NULL,
	`severity` enum('low','medium','high') NOT NULL,
	`category` varchar(100) NOT NULL,
	`status` enum('pending','reviewed','implemented','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `code_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`site_url` varchar(255) NOT NULL,
	`lcp` int,
	`fid` int,
	`cls` int,
	`ttfb` int,
	`score` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seo_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`site_url` varchar(255) NOT NULL,
	`score` int,
	`has_meta_description` int NOT NULL DEFAULT 0,
	`has_open_graph` int NOT NULL DEFAULT 0,
	`has_schema_org` int NOT NULL DEFAULT 0,
	`has_sitemap` int NOT NULL DEFAULT 0,
	`has_robots_txt` int NOT NULL DEFAULT 0,
	`issues` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seo_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uptime_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`site_url` varchar(255) NOT NULL,
	`status_code` int,
	`response_time` int,
	`is_online` int NOT NULL DEFAULT 1,
	`error_message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uptime_checks_id` PRIMARY KEY(`id`)
);
