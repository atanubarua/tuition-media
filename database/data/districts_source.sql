-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 25, 2019 at 07:40 PM
-- Server version: 10.3.16-MariaDB
-- PHP Version: 7.3.7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_bloodlagbe_bd`
--

-- --------------------------------------------------------

--
-- Table structure for table `districts`
--

CREATE TABLE `districts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `district_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `districts`
--

INSERT INTO `districts` (`id`, `district_name`, `created_at`, `updated_at`) VALUES
(1, 'Bagerhat', '2019-07-25 07:32:30', NULL),
(2, 'Bandarban', '2019-07-25 07:32:44', NULL),
(3, 'Barguna', '2019-07-25 07:33:23', NULL),
(4, 'Barisal', '2019-07-25 07:33:30', NULL),
(5, 'Bhola', '2019-07-25 07:33:34', NULL),
(6, 'Bogra', '2019-07-25 07:33:39', NULL),
(7, 'Brahmanbaria', '2019-07-25 07:33:48', NULL),
(8, 'Chandpur', '2019-07-25 07:33:56', NULL),
(9, 'Chapai', '2019-07-25 07:34:04', NULL),
(10, 'Chittagong', '2019-07-25 07:34:09', NULL),
(11, 'Chuadanga', '2019-07-25 07:34:15', NULL),
(12, 'Comilla', '2019-07-25 07:34:25', NULL),
(13, 'Cox\'s Bazar', '2019-07-25 07:34:31', NULL),
(14, 'Dhaka', '2019-07-25 07:34:37', NULL),
(15, 'Dinajpur', '2019-07-25 07:34:42', NULL),
(16, 'Faridpur', '2019-07-25 07:34:49', NULL),
(17, 'Feni', '2019-07-25 07:34:53', NULL),
(18, 'Gaibandha', '2019-07-25 07:34:59', NULL),
(19, 'Gazipur', '2019-07-25 07:35:06', NULL),
(20, 'Gopalganj', '2019-07-25 07:35:10', NULL),
(21, 'Habiganj', '2019-07-25 07:35:20', NULL),
(22, 'Jaipurhat', '2019-07-25 07:35:25', NULL),
(23, 'Jamalpur', '2019-07-25 07:35:30', NULL),
(24, 'Jessore', '2019-07-25 07:35:34', NULL),
(25, 'Jhalakati', '2019-07-25 07:35:39', NULL),
(26, 'Jhenaidah', '2019-07-25 07:35:46', NULL),
(27, 'Khagrachhari', '2019-07-25 07:35:52', NULL),
(28, 'Khulna', '2019-07-25 07:35:58', NULL),
(29, 'Kishoreganj', '2019-07-25 07:36:05', NULL),
(30, 'Kurigram', '2019-07-25 07:36:10', NULL),
(31, 'Kushtia', '2019-07-25 07:36:15', NULL),
(32, 'Lakshmipur', '2019-07-25 07:36:20', NULL),
(33, 'Lalmonirhat', '2019-07-25 07:36:26', NULL),
(34, 'Madaripur', '2019-07-25 07:36:32', NULL),
(35, 'Magura', '2019-07-25 07:36:40', NULL),
(36, 'Manikganj', '2019-07-25 07:36:44', NULL),
(37, 'Moulvi Bazar', '2019-07-25 07:36:59', NULL),
(38, 'Meherpur', '2019-07-25 07:37:04', NULL),
(39, 'Munshiganj', '2019-07-25 07:37:09', NULL),
(40, 'Mymensingh', '2019-07-25 07:37:14', NULL),
(41, 'Naogaon', '2019-07-25 07:37:24', NULL),
(42, 'Narayanganj', '2019-07-25 07:37:29', NULL),
(43, 'Narsingdi', '2019-07-25 07:37:33', NULL),
(44, 'Natore', '2019-07-25 07:37:38', NULL),
(45, 'Netrakona', '2019-07-25 07:37:51', NULL),
(46, 'Nilphamari', '2019-07-25 07:37:57', NULL),
(47, 'Noakhali', '2019-07-25 07:38:01', NULL),
(48, 'Pabna', '2019-07-25 07:38:05', NULL),
(49, 'Panchagarh', '2019-07-25 07:38:10', NULL),
(50, 'Patuakhali', '2019-07-25 07:38:14', NULL),
(51, 'Pirojpur', '2019-07-25 07:38:19', NULL),
(52, 'Rajbari', '2019-07-25 07:38:29', NULL),
(53, 'Rajshahi', '2019-07-25 07:38:34', NULL),
(54, 'Rangamati', '2019-07-25 07:38:40', NULL),
(55, 'Rangpur', '2019-07-25 07:38:46', NULL),
(56, 'Sherpur', '2019-07-25 07:38:50', NULL),
(57, 'Sirajganj', '2019-07-25 07:38:55', NULL),
(58, 'Sunamganj', '2019-07-25 07:38:59', NULL),
(59, 'Sylhet', '2019-07-25 07:39:04', NULL),
(60, 'Tangail', '2019-07-25 07:39:09', NULL),
(61, 'Thakurgaon', '2019-07-25 07:39:16', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `districts`
--
ALTER TABLE `districts`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
