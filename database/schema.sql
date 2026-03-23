-- MySQL Workbench Forward Engineering
-- Schema: sistema_controlo_ambiental2

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema sistema_controlo_ambiental2
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sistema_controlo_ambiental2` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `sistema_controlo_ambiental2` ;

-- -----------------------------------------------------
-- Table `sistema_controlo_ambiental2`.`Tipos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_controlo_ambiental2`.`Tipos` (
  `classe` VARCHAR(100) NOT NULL,
  `tipo` VARCHAR(150) NOT NULL,
  `descrição` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`classe`, `tipo`),
  UNIQUE INDEX `email` (`tipo` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sistema_controlo_ambiental2`.`Utilizadores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_controlo_ambiental2`.`Utilizadores` (
  `id_administrador` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `palavra_passe_hash` VARCHAR(255) NOT NULL,
  `data_criacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `admin` TINYINT NOT NULL,
  PRIMARY KEY (`id_administrador`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sistema_controlo_ambiental2`.`atuadores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_controlo_ambiental2`.`atuadores` (
  `id_atuador` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `tipo_atuador` VARCHAR(50) NOT NULL,
  `localizacao` VARCHAR(100) NOT NULL,
  `estado` VARCHAR(30) NOT NULL,
  `Tipos_id_administrador` INT NOT NULL,
  `Tipos_classe` VARCHAR(100) NOT NULL,
  `Tipos_tipo` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id_atuador`),
  INDEX `fk_atuadores_Tipos1_idx` (`Tipos_classe` ASC, `Tipos_tipo` ASC) VISIBLE,
  CONSTRAINT `fk_atuadores_Tipos1`
    FOREIGN KEY (`Tipos_classe` , `Tipos_tipo`)
    REFERENCES `sistema_controlo_ambiental2`.`Tipos` (`classe` , `tipo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sistema_controlo_ambiental2`.`acoes_sistema`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_controlo_ambiental2`.`acoes_sistema` (
  `id_acao` INT NOT NULL AUTO_INCREMENT,
  `id_atuador` INT NOT NULL,
  `tipo_acao` VARCHAR(50) NOT NULL,
  `valor_aplicado` VARCHAR(50) NOT NULL,
  `motivo` TEXT NULL DEFAULT NULL,
  `timestamp_acao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Tipos_id_administrador` INT NOT NULL,
  `Tipos_classe` VARCHAR(100) NOT NULL,
  `Tipos_tipo` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id_acao`),
  INDEX `fk_acoes_atuador` (`id_atuador` ASC) VISIBLE,
  INDEX `idx_acoes_sistema_timestamp` (`timestamp_acao` ASC) VISIBLE,
  INDEX `fk_acoes_sistema_Tipos1_idx` (`Tipos_classe` ASC, `Tipos_tipo` ASC) VISIBLE,
  CONSTRAINT `fk_acoes_atuador`
    FOREIGN KEY (`id_atuador`)
    REFERENCES `sistema_controlo_ambiental2`.`atuadores` (`id_atuador`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_acoes_sistema_Tipos1`
    FOREIGN KEY (`Tipos_classe` , `Tipos_tipo`)
    REFERENCES `sistema_controlo_ambiental2`.`Tipos` (`classe` , `tipo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sistema_controlo_ambiental2`.`administradores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_controlo_ambiental2`.`administradores` (
  `id_administrador` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `palavra_passe_hash` VARCHAR(255) NOT NULL,
  `data_criacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_administrador`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sistema_controlo_ambiental2`.`sensores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_controlo_ambiental2`.`sensores` (
  `id_sensor` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `tipo_sensor` VARCHAR(50) NOT NULL,
  `localizacao` VARCHAR(100) NOT NULL,
  `estado` VARCHAR(30) NOT NULL,
  `data_instalacao` DATE NULL DEFAULT NULL,
  `Tipos_id_administrador` INT NOT NULL,
  `Tipos_classe` VARCHAR(100) NOT NULL,
  `Tipos_tipo` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id_sensor`),
  INDEX `fk_sensores_Tipos1_idx` (`Tipos_classe` ASC, `Tipos_tipo` ASC) VISIBLE,
  CONSTRAINT `fk_sensores_Tipos1`
    FOREIGN KEY (`Tipos_classe` , `Tipos_tipo`)
    REFERENCES `sistema_controlo_ambiental2`.`Tipos` (`classe` , `tipo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sistema_controlo_ambiental2`.`leituras_sensor`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_controlo_ambiental2`.`leituras_sensor` (
  `id_leitura` INT NOT NULL AUTO_INCREMENT,
  `id_sensor` INT NOT NULL,
  `valor` DECIMAL(10,2) NOT NULL,
  `unidade` VARCHAR(20) NOT NULL,
  `timestamp_leitura` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_leitura`),
  INDEX `idx_leituras_sensor_timestamp` (`timestamp_leitura` ASC) VISIBLE,
  INDEX `idx_leituras_sensor_id_sensor` (`id_sensor` ASC) VISIBLE,
  CONSTRAINT `fk_leituras_sensor_sensor`
    FOREIGN KEY (`id_sensor`)
    REFERENCES `sistema_controlo_ambiental2`.`sensores` (`id_sensor`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sistema_controlo_ambiental2`.`parametros_automaticos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_controlo_ambiental2`.`parametros_automaticos` (
  `id_parametro` INT NOT NULL AUTO_INCREMENT,
  `nome_parametro` VARCHAR(100) NOT NULL,
  `valor_parametro` VARCHAR(100) NOT NULL,
  `descricao` TEXT NULL DEFAULT NULL,
  `data_atualizacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acoes_sistema_id_acao` INT NOT NULL,
  PRIMARY KEY (`id_parametro`),
  INDEX `fk_parametros_automaticos_acoes_sistema1_idx` (`acoes_sistema_id_acao` ASC) VISIBLE,
  CONSTRAINT `fk_parametros_automaticos_acoes_sistema1`
    FOREIGN KEY (`acoes_sistema_id_acao`)
    REFERENCES `sistema_controlo_ambiental2`.`acoes_sistema` (`id_acao`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `sistema_controlo_ambiental2`.`registos_consumo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sistema_controlo_ambiental2`.`registos_consumo` (
  `id_registo` INT NOT NULL AUTO_INCREMENT,
  `id_sensor` INT NOT NULL,
  `consumo` DECIMAL(10,2) NOT NULL,
  `unidade` VARCHAR(20) NOT NULL,
  `periodo_inicio` DATETIME NOT NULL,
  `periodo_fim` DATETIME NOT NULL,
  PRIMARY KEY (`id_registo`),
  INDEX `fk_consumo_sensor` (`id_sensor` ASC) VISIBLE,
  INDEX `idx_registos_consumo_periodo` (`periodo_inicio` ASC, `periodo_fim` ASC) VISIBLE,
  CONSTRAINT `fk_consumo_sensor`
    FOREIGN KEY (`id_sensor`)
    REFERENCES `sistema_controlo_ambiental2`.`sensores` (`id_sensor`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
