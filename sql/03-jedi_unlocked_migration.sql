-- Idempotent migration: adds jedi_unlocked column if the running database
-- predates the schema change in 01-swgemu.sql. Safe to re-run.
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'swgemu'
    AND TABLE_NAME = 'accounts'
    AND COLUMN_NAME = 'jedi_unlocked'
);

SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE `swgemu`.`accounts` ADD COLUMN `jedi_unlocked` tinyint(1) NOT NULL DEFAULT 0 AFTER `salt`',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
