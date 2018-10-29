DROP DATABASE IF EXISTS node_bankDB;

CREATE DATABASE node_bankDB;

USE node_bankDB;

CREATE TABLE users (
id INTEGER(11) AUTO_INCREMENT NOT NULL,
`user_name` VARCHAR(100) NOT NULL,
`pin` INT(5) zerofill NOT NULL,
`checking_opened` BOOLEAN DEFAULT 0,
`saving_opened` BOOLEAN DEFAULT 0,
`checking` DECIMAL(10,2) NULL DEFAULT 0,
`savings` DECIMAL(10,2) NULL DEFAULT 0,
PRIMARY KEY (id)
);

INSERT INTO users (`user_name`, `pin`, `checking_opened`, `saving_opened`, `checking`, `savings`)
values ("tlukens", 12345, true, true, 5000, 10000);

INSERT INTO users (`user_name`, `pin`, `checking`, `savings`)
values ("shan123", 10101, 333, 1052);