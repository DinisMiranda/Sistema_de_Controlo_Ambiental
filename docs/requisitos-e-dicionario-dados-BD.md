# Requisitos e dicionário de dados — Base de dados `sistema_controlo_ambiental2`

> **Âmbito deste documento**  
> Aplica-se **unicamente** a **ferramentas e scripts de geração de dados sintéticos** (preencher a BD para testes, demonstrações ou ensaio de carga).  
> **Não** define requisitos funcionais ou não funcionais do **projeto de software em geral** (API, interface, regras de negócio da aplicação, deploy, etc.). Para isso deve existir documentação à parte.

A estrutura abaixo deriva do **`BD_C_Final.png`** e do **`database/schema.sql`**: serve de referência para **implementar e validar geradores**.

- **Secções 1 e 2** — requisitos **só** do processo de geração.  
- **Secção 3** — resumo estrutural mínimo (FKs) para saber **o que** gerar e **em que ordem**; não é especificação do produto.  
- **Secção 4** — dicionário de atributos para gerar valores **válidos** face ao schema.

---

## 1. Requisitos funcionais — geração de dados

Requisitos sobre **o que o gerador deve produzir** e **que restrições da BD respeitar** para inserts/cargas não falharem. Não descrevem comportamento da aplicação final.

| ID | Requisito |
|----|-----------|
| **RF01** | **Cobertura das entidades:** O gerador (ou conjunto de scripts) deve poder produzir linhas para todas as tabelas do diagrama final: `Utilizadores`, `Tipos`, `sensores`, `leituras_sensor`, `registos_consumo`, `atuadores`, `acoes_sistema`, `parametros_automaticos` — pode ser **faseado** (um script por tabela), desde que o conjunto cumpra o objetivo de carga de dados. |
| **RF02** | **Ordem de geração respeitando FKs:** Gerar primeiro entidades sem dependências ou apenas com dependências internas, depois as dependentes. Ordem lógica: `Tipos` → `Utilizadores` (para IDs válidos em `Tipos_id_administrador`, se usados) → `sensores` / `atuadores` → `leituras_sensor` / `registos_consumo` / `acoes_sistema` → `parametros_automaticos`. |
| **RF03** | **`Tipos` antes de sensores/atuadores/ações:** Cada par (`Tipos_classe`, `Tipos_tipo`) em `sensores`, `atuadores` e `acoes_sistema` deve existir previamente em `Tipos` (`classe`, `tipo`). |
| **RF04** | **Unicidade e chaves:** `Utilizadores.email` único; pares (`classe`,`tipo`) únicos em `Tipos`; PKs auto-incrementadas podem ser omitidas na geração textual e deixadas à BD, ou simuladas de forma consistente se o output for INSERT completo. |
| **RF05** | **Utilizadores:** Gerar `nome`, `email` único, `palavra_passe_hash` **já como hash** (ou placeholder de hash), `data_criacao` e `admin` (ex.: distribuição acordada, p.ex. ~1 administrador em N utilizadores). Respeitar `VARCHAR` máximos. |
| **RF06** | **Leituras e consumo:** `id_sensor` deve referenciar sensores gerados; `valor`/`consumo` como `DECIMAL(10,2)`; `unidade` coerente com o “tipo” de sensor quando aplicável; `timestamp_leitura` e `periodo_inicio`/`periodo_fim` com **instantes válidos** e `periodo_inicio` ≤ `periodo_fim`. |
| **RF07** | **Atuadores e ações:** `acoes_sistema.id_atuador` deve existir em `atuadores`; `Tipos_*` das ações alinhados com linhas de `Tipos`. |
| **RF08** | **Parâmetros automáticos:** `acoes_sistema_id_acao` deve referenciar um `id_acao` existente (gerar ações antes ou o mesmo número de parâmetros e ações em conjunto). |
| **RF09** | **Formato de saída configurável:** O gerador deve documentar o formato (SQL `INSERT`, CSV, ficheiro texto alinhado a colunas, etc.) para permitir `LOAD DATA` ou importação manual. |
| **RF10** | **Volumes parametrizáveis:** Número de linhas por tabela (ou fatores N/M) configurável por variável de ambiente, CLI ou ficheiro de configuração, para cenários de teste leve vs. carga. |

---

## 2. Requisitos não funcionais — geração de dados

Qualidade e constraints do **processo e dos artefactos gerados** (ficheiros, scripts). Não substituem RNFs da aplicação (disponibilidade da API, UX, etc.).

| ID | Requisito | Notas |
|----|-----------|--------|
| **RNF01** | **Reprodutibilidade** | Com a mesma seed (e mesmas regras de ficheiro já existente, se o gerador reservar emails/IDs), o output deve ser repetível para depuração e relatórios. |
| **RNF02** | **Privacidade** | Usar dados fictícios (ex.: Faker `pt_PT`); não usar emails, nomes ou moradas reais de pessoas identificáveis. |
| **RNF03** | **Segurança no output** | Não escrever palavras-passe em claro; apenas hashes ou placeholders compatíveis com o tamanho `VARCHAR(255)`. |
| **RNF04** | **Encoding** | Ficheiros e strings em **UTF-8** para suportar `descrição`, acentos e unidades (`°C`, etc.). |
| **RNF05** | **Desempenho do gerador** | Para grandes volumes de `leituras_sensor`, usar geração em streaming ou batches para não esgotar memória. |
| **RNF06** | **Determinismo vs. unicidade entre execuções** | Se o objetivo for acrescentar dados sem duplicar emails ou chaves naturais, o gerador deve consultar dados já existentes ou usar sufixos/sequências explícitas (como no script de utilizadores do repositório). |
| **RNF07** | **Rastreabilidade da geração** | Scripts devem estar versionados (`scripts/`, README); documentar dependências (Python/pip) e variáveis de ambiente. |
| **RNF08** | **Validação opcional** | Após gerar SQL, validar sintaxe e, se possível, aplicar numa BD de staging com `FOREIGN_KEY_CHECKS` ativo para detetar violações. |

---

## 3. Visão geral das tabelas e relações *(contexto para geradores)*

Resumo do modelo **apenas** para planear geração (dependências entre tabelas). Não define funcionalidades do sistema.

- **Utilizadores** — contas e perfis (incl. flag de admin).  
- **Tipos** — domínio de classificação (`classe` + `tipo`).  
- **sensores** — dispositivos de medição; ligados a **Tipos**.  
- **leituras_sensor** — medições ao longo do tempo (N:1 com **sensores**).  
- **registos_consumo** — consumo por período (N:1 com **sensores**).  
- **atuadores** — dispositivos de atuação; ligados a **Tipos**.  
- **acoes_sistema** — histórico do que cada atuador fez (N:1 com **atuadores**); ligado a **Tipos**.  
- **parametros_automaticos** — regras/valores associados a uma linha de **acoes_sistema** (FK `acoes_sistema_id_acao`).

---

## 4. Dicionário de dados — variáveis por tabela

Para cada atributo: **nome**, **tipo (MySQL)** e **significado** no domínio da BD. Destina-se a **quem implementa geradores** (valores plausíveis + limites de coluna). **Não** é lista de campos “expostos” ao utilizador na aplicação.

Na geração: respeitar tamanhos `VARCHAR`, `DECIMAL(10,2)` e `NOT NULL` do `schema.sql`.

### 4.1. `Utilizadores`

| Variável | Tipo | Explicação |
|----------|------|------------|
| `id_administrador` | `INT`, PK, auto-incremento | Identificador único do utilizador (no diagrama/modelo o PK mantém o nome histórico “administrador”; a tabela serve todos os utilizadores). |
| `nome` | `VARCHAR(100)` | Nome completo ou de apresentação. |
| `email` | `VARCHAR(150)`, único | Endereço de email; candidato a identificador de login. |
| `palavra_passe_hash` | `VARCHAR(255)` | Palavra-passe apenas em forma hash (ex.: bcrypt/argon2), nunca em claro. |
| `data_criacao` | `DATETIME` | Momento de criação da conta (por defeito pode ser preenchido pelo servidor). |
| `admin` | `TINYINT` | Indicador booleano (ex.: 0 = utilizador normal, 1 = administrador) para permissões elevadas. |

---

### 4.2. `Tipos`

Tabela de **look-up** com chave composta (`classe`, `tipo`).

| Variável | Tipo | Explicação |
|----------|------|------------|
| `classe` | `VARCHAR(100)`, PK (1/2) | Categoria ampla da taxonomia (ex.: família de equipamento ou domínio). |
| `tipo` | `VARCHAR(150)`, PK (2/2) | Subtipo ou variante dentro da classe. |
| `descrição` | `VARCHAR(255)` | Texto explicativo do par classe/tipo. |

> No ficheiro SQL do projeto o nome da coluna pode aparecer acentuado: **`descrição`**.

---

### 4.3. `sensores`

| Variável | Tipo | Explicação |
|----------|------|------------|
| `id_sensor` | `INT`, PK, auto-incremento | Identificador único do sensor. |
| `nome` | `VARCHAR(100)` | Nome amigável (ex.: “Sala A — temperatura”). |
| `tipo_sensor` | `VARCHAR(50)` | Tipo de grandeza ou equipamento (ex.: temperatura, humidade, CO₂). |
| `localizacao` | `VARCHAR(100)` | Local físico ou lógico do sensor. |
| `estado` | `VARCHAR(30)` | Estado operacional (ex.: ativo, manutenção, inativo). |
| `data_instalacao` | `DATE`, opcional | Data de instalação do sensor. |
| `Tipos_id_administrador` | `INT` | No modelo ER aparece como atributo de contexto; no `schema.sql` **não** existe FK explícita para `Utilizadores`. Semanticamente costuma representar o utilizador/administrador responsável ou dono do registo — deve ser tratado na aplicação ou completado com FK futura se for requisito. |
| `Tipos_classe` | `VARCHAR(100)`, FK → `Tipos.classe` | Parte da chave composta que liga o sensor à taxonomia `Tipos`. |
| `Tipos_tipo` | `VARCHAR(150)`, FK → `Tipos.tipo` | Parte da chave composta que liga o sensor à taxonomia `Tipos`. |

---

### 4.4. `leituras_sensor`

| Variável | Tipo | Explicação |
|----------|------|------------|
| `id_leitura` | `INT`, PK, auto-incremento | Identificador único da leitura. |
| `id_sensor` | `INT`, FK → `sensores.id_sensor` | Sensor que produziu a medição. |
| `valor` | `DECIMAL(10,2)` | Valor medido. |
| `unidade` | `VARCHAR(20)` | Unidade simbólica (ex.: `°C`, `%`, `ppm`). |
| `timestamp_leitura` | `DATETIME` | Data e hora da amostra. |

---

### 4.5. `registos_consumo`

| Variável | Tipo | Explicação |
|----------|------|------------|
| `id_registo` | `INT`, PK, auto-incremento | Identificador único do registo de consumo. |
| `id_sensor` | `INT`, FK → `sensores.id_sensor` | Sensor a partir do qual o consumo foi calculado ou inferido (conforme o diagrama final). |
| `consumo` | `DECIMAL(10,2)` | Quantidade consumida no período. |
| `unidade` | `VARCHAR(20)` | Unidade do consumo (ex.: `kWh`, `L`). |
| `periodo_inicio` | `DATETIME` | Início do intervalo de agregação. |
| `periodo_fim` | `DATETIME` | Fim do intervalo de agregação. |

---

### 4.6. `atuadores`

| Variável | Tipo | Explicação |
|----------|------|------------|
| `id_atuador` | `INT`, PK, auto-incremento | Identificador único do atuador. |
| `nome` | `VARCHAR(100)` | Nome do dispositivo de atuação. |
| `tipo_atuador` | `VARCHAR(50)` | Categoria (ex.: relé, válvula, iluminação). |
| `localizacao` | `VARCHAR(100)` | Localização física. |
| `estado` | `VARCHAR(30)` | Estado atual (ex.: ligado/desligado, percentagem, etc.). |
| `Tipos_id_administrador` | `INT` | Igual ao caso dos sensores: contexto de “dono”/responsável no modelo; sem FK a `Utilizadores` no `schema.sql` atual. |
| `Tipos_classe` | `VARCHAR(100)`, FK → `Tipos.classe` | Ligação à taxonomia. |
| `Tipos_tipo` | `VARCHAR(150)`, FK → `Tipos.tipo` | Ligação à taxonomia. |

---

### 4.7. `acoes_sistema`

| Variável | Tipo | Explicação |
|----------|------|------------|
| `id_acao` | `INT`, PK, auto-incremento | Identificador único da ação registada. |
| `id_atuador` | `INT`, FK → `atuadores.id_atuador` | Atuador que executou a ação. |
| `tipo_acao` | `VARCHAR(50)` | Natureza da ação (ex.: ligar, desligar, definir setpoint). |
| `valor_aplicado` | `VARCHAR(50)` | Valor ou comando aplicado (texto para flexibilidade: escalões, percentagens, etc.). |
| `motivo` | `TEXT`, opcional | Justificação ou contexto (ex.: resposta a limiar, ação manual). |
| `timestamp_acao` | `DATETIME` | Momento em que a ação ocorreu. |
| `Tipos_id_administrador` | `INT` | Atributo de contexto no modelo; sem FK explícita no `schema.sql` — alinhar com a política de auditoria na aplicação. |
| `Tipos_classe` | `VARCHAR(100)`, FK → `Tipos.classe` | Classificação da ação no domínio `Tipos`. |
| `Tipos_tipo` | `VARCHAR(150)`, FK → `Tipos.tipo` | Classificação da ação no domínio `Tipos`. |

---

### 4.8. `parametros_automaticos`

| Variável | Tipo | Explicação |
|----------|------|------------|
| `id_parametro` | `INT`, PK, auto-incremento | Identificador único do parâmetro. |
| `nome_parametro` | `VARCHAR(100)` | Nome legível da regra ou limiar (ex.: “Temperatura máxima sala A”). |
| `valor_parametro` | `VARCHAR(100)` | Valor de limiar ou configuração (texto para suportar vários formatos). |
| `descricao` | `TEXT`, opcional | Descrição detalhada da regra. |
| `data_atualizacao` | `DATETIME` | Última alteração ao parâmetro. |
| `acoes_sistema_id_acao` | `INT`, FK → `acoes_sistema.id_acao` | Associa o parâmetro a uma ação do sistema (ex.: ação modelo, ação desencadeada ou referência para automação — conforme regra de negócio implementada na aplicação). |

---

## 5. Nota sobre o script SQL do repositório

O **`database/schema.sql`** é referência **técnica para gerar dados compatíveis** (tipos, FKs). Pode incluir tabelas extra face ao **`BD_C_Final.png`** (ex.: `administradores` legada); ao gerar dados, acordar qual diagrama/script é fonte de verdade para o teu trabalho.

---

## 6. Referências

- Diagrama: `docs/BD_C_Final.png`  
- Schema físico alinhado: `database/schema.sql`  
- Base de dados: `sistema_controlo_ambiental2`  
- Exemplo de geração (utilizadores): `scripts/seed_utilizadores.py` e `scripts/README.md`
