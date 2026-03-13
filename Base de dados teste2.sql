CREATE DATABASE IF NOT EXISTS sistema_controlo_ambiental2;
USE sistema_controlo_ambiental2;

-- =========================================================
-- Tabela: administradores
-- =========================================================
CREATE TABLE administradores (
    id_administrador INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    palavra_passe_hash VARCHAR(255) NOT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Tabela: sensores
-- =========================================================
CREATE TABLE sensores (
    id_sensor INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo_sensor VARCHAR(50) NOT NULL,
    localizacao VARCHAR(100) NOT NULL,
    estado VARCHAR(30) NOT NULL,
    data_instalacao DATE
);

-- =========================================================
-- Tabela: atuadores
-- =========================================================
CREATE TABLE atuadores (
    id_atuador INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo_atuador VARCHAR(50) NOT NULL,
    localizacao VARCHAR(100) NOT NULL,
    estado VARCHAR(30) NOT NULL
);

-- =========================================================
-- Tabela: leituras_sensor
-- =========================================================
CREATE TABLE leituras_sensor (
    id_leitura INT AUTO_INCREMENT PRIMARY KEY,
    id_sensor INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    unidade VARCHAR(20) NOT NULL,
    timestamp_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leituras_sensor_sensor
        FOREIGN KEY (id_sensor)
        REFERENCES sensores(id_sensor)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabela: parametros_automaticos
-- (sem ligação a administradores)
-- =========================================================
CREATE TABLE parametros_automaticos (
    id_parametro INT AUTO_INCREMENT PRIMARY KEY,
    nome_parametro VARCHAR(100) NOT NULL,
    valor_parametro VARCHAR(100) NOT NULL,
    descricao TEXT,
    data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Tabela: acoes_sistema
-- =========================================================
CREATE TABLE acoes_sistema (
    id_acao INT AUTO_INCREMENT PRIMARY KEY,
    id_atuador INT NOT NULL,
    tipo_acao VARCHAR(50) NOT NULL,
    valor_aplicado VARCHAR(50) NOT NULL,
    motivo TEXT,
    timestamp_acao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_acoes_atuador
        FOREIGN KEY (id_atuador)
        REFERENCES atuadores(id_atuador)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabela: registos_consumo
-- (ligada a sensores em vez de atuadores)
-- =========================================================
CREATE TABLE registos_consumo (
    id_registo INT AUTO_INCREMENT PRIMARY KEY,
    id_sensor INT NOT NULL,
    consumo DECIMAL(10,2) NOT NULL,
    unidade VARCHAR(20) NOT NULL,
    periodo_inicio DATETIME NOT NULL,
    periodo_fim DATETIME NOT NULL,
    CONSTRAINT fk_consumo_sensor
        FOREIGN KEY (id_sensor)
        REFERENCES sensores(id_sensor)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Índices úteis
-- =========================================================
CREATE INDEX idx_leituras_sensor_timestamp
    ON leituras_sensor(timestamp_leitura);

CREATE INDEX idx_leituras_sensor_id_sensor
    ON leituras_sensor(id_sensor);

CREATE INDEX idx_acoes_sistema_timestamp
    ON acoes_sistema(timestamp_acao);

CREATE INDEX idx_registos_consumo_periodo
    ON registos_consumo(periodo_inicio, periodo_fim);