-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: staynest_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `staynest_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `staynest_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ ;

USE `staynest_db`;

--
-- Table structure for table `amenities`
--

DROP TABLE IF EXISTS `amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `amenities` (
  `amenity_id` int NOT NULL AUTO_INCREMENT,
  `amenity_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`amenity_id`),
  UNIQUE KEY `amenity_name` (`amenity_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amenities`
--

LOCK TABLES `amenities` WRITE;
/*!40000 ALTER TABLE `amenities` DISABLE KEYS */;
INSERT INTO `amenities` VALUES (1,'WiFi','High-speed wireless internet'),(2,'Air Conditioning','Air conditioning available'),(3,'Swimming Pool','Access to swimming pool'),(4,'Kitchen','Fully equipped kitchen'),(5,'Parking','Free parking available'),(6,'TV','Smart television'),(7,'Washing Machine','Washing machine available'),(8,'Workspace','Dedicated workspace'),(9,'Balcony','Private balcony'),(10,'Breakfast','Breakfast included');
/*!40000 ALTER TABLE `amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `availability`
--

DROP TABLE IF EXISTS `availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `availability` (
  `availability_id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `available_from` date NOT NULL,
  `available_to` date NOT NULL,
  `status` enum('AVAILABLE','BLOCKED') NOT NULL DEFAULT 'AVAILABLE',
  PRIMARY KEY (`availability_id`),
  KEY `fk_availability_property` (`property_id`),
  CONSTRAINT `fk_availability_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_availability_dates` CHECK ((`available_to` > `available_from`))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `availability`
--

LOCK TABLES `availability` WRITE;
/*!40000 ALTER TABLE `availability` DISABLE KEYS */;
INSERT INTO `availability` VALUES (1,1,'2026-11-01','2026-12-31','AVAILABLE'),(2,2,'2026-11-01','2026-12-31','AVAILABLE'),(3,3,'2026-11-01','2026-12-15','AVAILABLE'),(4,3,'2026-12-20','2026-12-31','AVAILABLE'),(5,4,'2026-11-01','2026-12-31','AVAILABLE'),(6,5,'2026-11-01','2026-12-31','AVAILABLE');
/*!40000 ALTER TABLE `availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `property_id` int NOT NULL,
  `check_in` date NOT NULL,
  `check_out` date NOT NULL,
  `guests` int NOT NULL,
  `number_of_nights` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `booking_status` enum('PENDING','CONFIRMED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`booking_id`),
  KEY `idx_bookings_user` (`user_id`),
  KEY `idx_bookings_property` (`property_id`),
  KEY `idx_bookings_dates` (`check_in`,`check_out`),
  CONSTRAINT `fk_booking_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_booking_amount` CHECK ((`total_amount` > 0)),
  CONSTRAINT `chk_booking_dates` CHECK ((`check_out` > `check_in`)),
  CONSTRAINT `chk_booking_guests` CHECK ((`guests` > 0)),
  CONSTRAINT `chk_booking_nights` CHECK ((`number_of_nights` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,1,1,'2026-09-10','2026-09-13',2,3,9000.00,'COMPLETED','2026-10-11 12:13:30'),(2,2,3,'2026-09-20','2026-09-23',4,3,19500.00,'COMPLETED','2026-10-11 12:13:30'),(3,1,2,'2026-11-10','2026-11-13',2,3,7500.00,'CONFIRMED','2026-10-11 12:13:30'),(4,2,4,'2026-11-18','2026-11-21',3,3,10500.00,'PENDING','2026-10-11 12:13:30');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `location_id` int NOT NULL AUTO_INCREMENT,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'India',
  `address` varchar(255) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  PRIMARY KEY (`location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,'Chennai','Tamil Nadu','India','Besant Nagar, Chennai',13.0007000,80.2668000),(2,'Bengaluru','Karnataka','India','Koramangala, Bengaluru',12.9352000,77.6245000),(3,'Goa','Goa','India','Calangute, Goa',15.5440000,73.7550000),(4,'Kochi','Kerala','India','Fort Kochi, Kochi',9.9658000,76.2421000),(5,'Hyderabad','Telangana','India','Banjara Hills, Hyderabad',17.4126000,78.4071000);
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('UPI','CARD','NET_BANKING') NOT NULL,
  `payment_status` enum('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  `transaction_id` varchar(100) DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `booking_id` (`booking_id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `fk_payment_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_payment_amount` CHECK ((`amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,9000.00,'UPI','SUCCESS','TXN-SN-10001','2026-10-11 12:13:30'),(2,2,19500.00,'CARD','SUCCESS','TXN-SN-10002','2026-10-11 12:13:30'),(3,3,7500.00,'NET_BANKING','SUCCESS','TXN-SN-10003','2026-10-11 12:13:30'),(4,4,10500.00,'UPI','PENDING',NULL,'2026-10-11 12:13:30');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_payment_success_confirms_booking` AFTER INSERT ON `payments` FOR EACH ROW BEGIN
    IF NEW.payment_status = 'SUCCESS' THEN
        UPDATE bookings
        SET booking_status = 'CONFIRMED'
        WHERE booking_id = NEW.booking_id
          AND booking_status = 'PENDING';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `properties`
--

DROP TABLE IF EXISTS `properties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `properties` (
  `property_id` int NOT NULL AUTO_INCREMENT,
  `host_id` int NOT NULL,
  `location_id` int NOT NULL,
  `property_name` varchar(150) NOT NULL,
  `description` text,
  `property_type` enum('APARTMENT','HOUSE','VILLA','ROOM','COTTAGE') NOT NULL,
  `price_per_night` decimal(10,2) NOT NULL,
  `max_guests` int NOT NULL,
  `bedrooms` int NOT NULL DEFAULT '1',
  `bathrooms` int NOT NULL DEFAULT '1',
  `status` enum('ACTIVE','INACTIVE','PENDING') NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`property_id`),
  KEY `idx_properties_host` (`host_id`),
  KEY `idx_properties_location` (`location_id`),
  KEY `idx_properties_type` (`property_type`),
  KEY `idx_properties_price` (`price_per_night`),
  CONSTRAINT `fk_property_host` FOREIGN KEY (`host_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_property_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`location_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_property_bathrooms` CHECK ((`bathrooms` > 0)),
  CONSTRAINT `chk_property_bedrooms` CHECK ((`bedrooms` > 0)),
  CONSTRAINT `chk_property_guests` CHECK ((`max_guests` > 0)),
  CONSTRAINT `chk_property_price` CHECK ((`price_per_night` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `properties`
--

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
INSERT INTO `properties` VALUES (1,3,1,'Modern Beach Apartment','A modern apartment located near Besant Nagar Beach with comfortable rooms and city views.','APARTMENT',3000.00,4,2,2,'ACTIVE','2026-10-11 12:13:30'),(2,3,2,'Cozy Koramangala Home','A stylish and peaceful home located in the heart of Bengaluru.','HOUSE',2500.00,4,2,2,'ACTIVE','2026-10-11 12:13:30'),(3,4,3,'Goa Beach Villa','A spacious luxury villa near Calangute Beach with a private pool.','VILLA',6500.00,6,3,3,'ACTIVE','2026-10-11 12:13:30'),(4,4,4,'Fort Kochi Heritage Cottage','Traditional Kerala-style cottage located near the historic Fort Kochi area.','COTTAGE',3500.00,4,2,2,'ACTIVE','2026-10-11 12:13:30'),(5,3,5,'Hyderabad City Room','Affordable private room suitable for business and short city stays.','ROOM',1800.00,2,1,1,'ACTIVE','2026-10-11 12:13:30');
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `property_amenities`
--

DROP TABLE IF EXISTS `property_amenities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_amenities` (
  `property_id` int NOT NULL,
  `amenity_id` int NOT NULL,
  PRIMARY KEY (`property_id`,`amenity_id`),
  KEY `fk_pa_amenity` (`amenity_id`),
  CONSTRAINT `fk_pa_amenity` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`amenity_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pa_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_amenities`
--

LOCK TABLES `property_amenities` WRITE;
/*!40000 ALTER TABLE `property_amenities` DISABLE KEYS */;
INSERT INTO `property_amenities` VALUES (1,1),(2,1),(3,1),(4,1),(5,1),(1,2),(2,2),(3,2),(4,2),(5,2),(3,3),(1,4),(2,4),(3,4),(4,4),(1,5),(2,5),(3,5),(4,5),(5,5),(1,6),(3,6),(5,6),(2,7),(2,8),(5,8),(1,9),(3,9),(4,9),(3,10),(4,10);
/*!40000 ALTER TABLE `property_amenities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `property_images`
--

DROP TABLE IF EXISTS `property_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `property_id` int NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`image_id`),
  KEY `fk_image_property` (`property_id`),
  CONSTRAINT `fk_image_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `property_images`
--

LOCK TABLES `property_images` WRITE;
/*!40000 ALTER TABLE `property_images` DISABLE KEYS */;
INSERT INTO `property_images` VALUES (1,1,'https://images.example.com/properties/chennai-apartment-1.jpg',1),(2,1,'https://images.example.com/properties/chennai-apartment-2.jpg',0),(3,2,'https://images.example.com/properties/bangalore-home-1.jpg',1),(4,2,'https://images.example.com/properties/bangalore-home-2.jpg',0),(5,3,'https://images.example.com/properties/goa-villa-1.jpg',1),(6,3,'https://images.example.com/properties/goa-villa-2.jpg',0),(7,4,'https://images.example.com/properties/kochi-cottage-1.jpg',1),(8,4,'https://images.example.com/properties/kochi-cottage-2.jpg',0),(9,5,'https://images.example.com/properties/hyderabad-room-1.jpg',1);
/*!40000 ALTER TABLE `property_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `property_id` int NOT NULL,
  `booking_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `booking_id` (`booking_id`),
  KEY `fk_review_user` (`user_id`),
  KEY `idx_reviews_property` (`property_id`),
  CONSTRAINT `fk_review_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_review_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_review_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,1,1,1,5,'Excellent apartment and very close to the beach.','2026-10-11 12:13:30'),(2,2,3,2,5,'Beautiful villa with great facilities. Highly recommended.','2026-10-11 12:13:30');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('GUEST','HOST','ADMIN') NOT NULL DEFAULT 'GUEST',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Arun Kumar','arun@staynest.com','$2y$10$azIkNP.me6VRi2/A8B2MQecGrugXNot6ABskyLqdcuT03KFSM9lGq','9876543210','GUEST','2026-10-11 12:13:30'),(2,'Priya Sharma','priya@staynest.com','$2y$12$c4pFKpSNMYMtQj.aaW/w7.FR9T5XRV.MTJ6zOgZHc68g8qiwFnoSe','9876543211','GUEST','2026-10-11 12:13:30'),(3,'Rahul Mehta','rahul@staynest.com','$2y$12$c4pFKpSNMYMtQj.aaW/w7.FR9T5XRV.MTJ6zOgZHc68g8qiwFnoSe','9876543212','HOST','2026-10-11 12:13:30'),(4,'Sneha Reddy','sneha@staynest.com','$2y$12$c4pFKpSNMYMtQj.aaW/w7.FR9T5XRV.MTJ6zOgZHc68g8qiwFnoSe','9876543213','HOST','2026-10-11 12:13:30'),(5,'StayNest Admin','admin@staynest.com','$2y$12$c4pFKpSNMYMtQj.aaW/w7.FR9T5XRV.MTJ6zOgZHc68g8qiwFnoSe','9876543214','ADMIN','2026-10-11 12:13:30'),(6,'Test User','realtest@staynest.com','$2y$10$UDylh9DM/bg7KLkxxieBpOHCWhLIcGGpRL8uwyr3GIO0X.70oJnNy',NULL,'GUEST','2026-10-25 17:52:47'),(7,'StayNest Test','test2@staynest.com','$2y$10$fVYBNZYBGnj./jEOChifWu7Olgfr/j3nRfBQb8FflMNjhEEtG.ynG','9876500000','GUEST','2026-10-25 18:02:36');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_booking_details`
--

DROP TABLE IF EXISTS `vw_booking_details`;
/*!50001 DROP VIEW IF EXISTS `vw_booking_details`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_booking_details` AS SELECT 
 1 AS `booking_id`,
 1 AS `guest_name`,
 1 AS `property_name`,
 1 AS `host_name`,
 1 AS `check_in`,
 1 AS `check_out`,
 1 AS `guests`,
 1 AS `number_of_nights`,
 1 AS `total_amount`,
 1 AS `booking_status`,
 1 AS `created_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_property_overview`
--

DROP TABLE IF EXISTS `vw_property_overview`;
/*!50001 DROP VIEW IF EXISTS `vw_property_overview`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_property_overview` AS SELECT 
 1 AS `property_id`,
 1 AS `property_name`,
 1 AS `property_type`,
 1 AS `price_per_night`,
 1 AS `max_guests`,
 1 AS `bedrooms`,
 1 AS `bathrooms`,
 1 AS `status`,
 1 AS `host_name`,
 1 AS `city`,
 1 AS `state`,
 1 AS `country`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_property_performance`
--

DROP TABLE IF EXISTS `vw_property_performance`;
/*!50001 DROP VIEW IF EXISTS `vw_property_performance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_property_performance` AS SELECT 
 1 AS `property_id`,
 1 AS `property_name`,
 1 AS `total_bookings`,
 1 AS `completed_bookings`,
 1 AS `total_revenue`,
 1 AS `total_reviews`,
 1 AS `average_rating`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'staynest_db'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_get_property_bookings` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_property_bookings`(IN p_property_id INT)
BEGIN
    SELECT
        b.booking_id,
        u.name AS guest_name,
        p.property_name,
        b.check_in,
        b.check_out,
        b.guests,
        b.number_of_nights,
        b.total_amount,
        b.booking_status
    FROM bookings b
    JOIN users u
        ON b.user_id = u.user_id
    JOIN properties p
        ON b.property_id = p.property_id
    WHERE b.property_id = p_property_id
    ORDER BY b.check_in;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Current Database: `staynest_db`
--

USE `staynest_db`;

--
-- Final view structure for view `vw_booking_details`
--

/*!50001 DROP VIEW IF EXISTS `vw_booking_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_booking_details` AS select `b`.`booking_id` AS `booking_id`,`guest`.`name` AS `guest_name`,`p`.`property_name` AS `property_name`,`host`.`name` AS `host_name`,`b`.`check_in` AS `check_in`,`b`.`check_out` AS `check_out`,`b`.`guests` AS `guests`,`b`.`number_of_nights` AS `number_of_nights`,`b`.`total_amount` AS `total_amount`,`b`.`booking_status` AS `booking_status`,`b`.`created_at` AS `created_at` from (((`bookings` `b` join `users` `guest` on((`b`.`user_id` = `guest`.`user_id`))) join `properties` `p` on((`b`.`property_id` = `p`.`property_id`))) join `users` `host` on((`p`.`host_id` = `host`.`user_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_property_overview`
--

/*!50001 DROP VIEW IF EXISTS `vw_property_overview`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_property_overview` AS select `p`.`property_id` AS `property_id`,`p`.`property_name` AS `property_name`,`p`.`property_type` AS `property_type`,`p`.`price_per_night` AS `price_per_night`,`p`.`max_guests` AS `max_guests`,`p`.`bedrooms` AS `bedrooms`,`p`.`bathrooms` AS `bathrooms`,`p`.`status` AS `status`,`u`.`name` AS `host_name`,`l`.`city` AS `city`,`l`.`state` AS `state`,`l`.`country` AS `country` from ((`properties` `p` join `users` `u` on((`p`.`host_id` = `u`.`user_id`))) join `locations` `l` on((`p`.`location_id` = `l`.`location_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_property_performance`
--

/*!50001 DROP VIEW IF EXISTS `vw_property_performance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_property_performance` AS select `p`.`property_id` AS `property_id`,`p`.`property_name` AS `property_name`,coalesce(`b`.`total_bookings`,0) AS `total_bookings`,coalesce(`b`.`completed_bookings`,0) AS `completed_bookings`,coalesce(`b`.`total_revenue`,0.00) AS `total_revenue`,coalesce(`r`.`total_reviews`,0) AS `total_reviews`,coalesce(`r`.`average_rating`,0.00) AS `average_rating` from ((`properties` `p` left join (select `bookings`.`property_id` AS `property_id`,count(0) AS `total_bookings`,sum((case when (`bookings`.`booking_status` = 'COMPLETED') then 1 else 0 end)) AS `completed_bookings`,sum((case when (`bookings`.`booking_status` = 'COMPLETED') then `bookings`.`total_amount` else 0 end)) AS `total_revenue` from `bookings` group by `bookings`.`property_id`) `b` on((`p`.`property_id` = `b`.`property_id`))) left join (select `reviews`.`property_id` AS `property_id`,count(0) AS `total_reviews`,round(avg(`reviews`.`rating`),2) AS `average_rating` from `reviews` group by `reviews`.`property_id`) `r` on((`p`.`property_id` = `r`.`property_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-27 17:25:55

