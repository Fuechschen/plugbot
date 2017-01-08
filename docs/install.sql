/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

CREATE TABLE IF NOT EXISTS `channels` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `cid` varchar(161) NOT NULL DEFAULT '',
  `isBanned` tinyint(1) DEFAULT '0',
  `ban_reason` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`cid`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `channels_id_unique` (`id`),
  UNIQUE KEY `cid` (`cid`),
  UNIQUE KEY `channels_cid_unique` (`cid`)
) ENGINE=InnoDB AUTO_INCREMENT=1037 DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `customcommands` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `trigger` varchar(191) NOT NULL,
  `message` varchar(255) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `senderinfo` tinyint(1) NOT NULL DEFAULT '1',
  `allowMention` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `trigger` (`trigger`),
  UNIQUE KEY `customcommands_id_unique` (`id`),
  UNIQUE KEY `customcommands_trigger_unique` (`trigger`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `plays` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `woots` int(10) unsigned DEFAULT '0',
  `grabs` int(10) unsigned DEFAULT '0',
  `mehs` int(10) unsigned DEFAULT '0',
  `listeners` int(10) unsigned DEFAULT '0',
  `time` datetime DEFAULT NULL,
  `skipped` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `song_plug_id` int(10) unsigned DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `plays_id_unique` (`id`),
  KEY `song_plug_id` (`song_plug_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `plays_ibfk_1` FOREIGN KEY (`song_plug_id`) REFERENCES `songs` (`plug_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `plays_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3999 DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `songs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `format` int(10) unsigned NOT NULL,
  `cid` varchar(20) NOT NULL,
  `plug_id` int(10) unsigned NOT NULL,
  `duration` int(10) unsigned DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `isBanned` tinyint(1) DEFAULT '0',
  `ban_reason` text,
  `tskip` int(10) unsigned DEFAULT NULL,
  `autovote` enum('n','w','m') NOT NULL DEFAULT 'n',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`plug_id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `cid` (`cid`),
  UNIQUE KEY `plug_id` (`plug_id`),
  UNIQUE KEY `songs_id_unique` (`id`),
  UNIQUE KEY `songs_cid_unique` (`cid`),
  UNIQUE KEY `songs_plug_id_unique` (`plug_id`)
) ENGINE=InnoDB AUTO_INCREMENT=442 DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) unsigned NOT NULL DEFAULT '0',
  `username` varchar(255) NOT NULL,
  `language` varchar(255) DEFAULT 'en',
  `avatar_id` varchar(255) DEFAULT NULL,
  `badge` varchar(255) DEFAULT NULL,
  `blurb` text,
  `global_role` int(10) unsigned DEFAULT '0',
  `role` int(10) unsigned DEFAULT '0',
  `super_user` tinyint(1) DEFAULT '0',
  `s_role` int(10) unsigned DEFAULT '0',
  `level` int(10) unsigned DEFAULT '0',
  `custom_points` int(10) unsigned DEFAULT '0',
  `joined` datetime DEFAULT NULL,
  `birthday` datetime DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `afk_msg` text,
  `last_seen` datetime DEFAULT NULL,
  `last_active` datetime DEFAULT NULL,
  `afk_level` enum('active','afk','warned','warned2') NOT NULL DEFAULT 'active',
  `wl_removes` int(10) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
