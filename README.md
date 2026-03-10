# Sistema de Controlo Ambiental – Base de Dados

Este repositório contém o modelo de base de dados para um **Sistema de Controlo Ambiental**, que gere:

- Sensores (temperatura, humidade, etc.) e as suas leituras ao longo do tempo;
- Atuadores (ex.: aquecedores, ventoinhas) e as ações realizadas;
- Parâmetros automáticos de funcionamento;
- Registos de consumo energético;
- Alertas gerados pelo sistema;
- Administradores responsáveis pela configuração e supervisão.

---

## Objetivo

Fornecer um **modelo relacional claro e normalizado**, adequado a sistemas como **PostgreSQL** ou **MySQL**, que:

- garanta integridade referencial entre entidades;
- permita armazenar histórico detalhado de leituras, ações e consumos;
- suporte funcionalidades de monitorização, controlo e auditoria;
- seja simples de explicar e evoluir em contexto académico.

---

## Entidades principais

- **Administradores** – utilizadores com permissões de gestão e configuração.
- **Sensores** – dispositivos que recolhem dados ambientais.
- **Leituras de Sensores** – valores lidos pelos sensores ao longo do tempo.
- **Atuadores** – dispositivos que executam ações físicas (ex.: ligar/desligar).
- **Parâmetros Automáticos** – limiares e regras de configuração.
- **Ações do Sistema** – ações executadas automaticamente ou manualmente.
- **Registos de Consumo** – consumos energéticos associados a atuadores.
- **Alertas** – eventos de alerta (falhas, consumos anómalos, valores fora de intervalo, etc.).

---

## Tecnologias alvo

O modelo foi pensado para ser implementado num **SGBD relacional**, como:

- PostgreSQL
- MySQL / MariaDB

Nesta fase, o repositório foca-se apenas na **definição do modelo** (sem dados de exemplo, nem scripts de população).

---

## Próximos passos (planeado)

- Adicionar esquema SQL completo (criação de tabelas e chaves).
- Incluir restrições (chaves primárias, estrangeiras, `NOT NULL`, `UNIQUE`, índices).
- (Opcional) Disponibilizar configuração para execução rápida com Docker.
