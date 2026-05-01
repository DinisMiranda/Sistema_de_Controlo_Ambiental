import { sequelize } from "../../lib/sequelize.js";
import { initTiposModel } from "./tipos.model.js";
import { initUtilizadoresModel } from "./utilizadores.model.js";
import { initSensoresModel } from "./sensores.model.js";
import { initAtuadoresModel } from "./atuadores.model.js";
import { initLeiturasSensorModel } from "./leituras-sensor.model.js";
import { initAcoesSistemaModel } from "./acoes-sistema.model.js";
import { initRegistosConsumoModel } from "./registos-consumo.model.js";
import { initParametrosAutomaticosModel } from "./parametros-automaticos.model.js";

const Tipo = initTiposModel(sequelize);
const Utilizador = initUtilizadoresModel(sequelize);
const Sensor = initSensoresModel(sequelize);
const Atuador = initAtuadoresModel(sequelize);
const LeituraSensor = initLeiturasSensorModel(sequelize);
const AcaoSistema = initAcoesSistemaModel(sequelize);
const RegistoConsumo = initRegistosConsumoModel(sequelize);
const ParametroAutomatico = initParametrosAutomaticosModel(sequelize);

LeituraSensor.belongsTo(Sensor, { foreignKey: "id_sensor" });
Sensor.hasMany(LeituraSensor, { foreignKey: "id_sensor" });

AcaoSistema.belongsTo(Atuador, { foreignKey: "id_atuador" });
Atuador.hasMany(AcaoSistema, { foreignKey: "id_atuador" });

ParametroAutomatico.belongsTo(Atuador, { foreignKey: "atuadores_id_atuador" });
Atuador.hasMany(ParametroAutomatico, { foreignKey: "atuadores_id_atuador" });

RegistoConsumo.belongsTo(LeituraSensor, { foreignKey: "leituras_sensor_id_leitura" });
LeituraSensor.hasMany(RegistoConsumo, { foreignKey: "leituras_sensor_id_leitura" });

export const models = {
  Tipo,
  Utilizador,
  Sensor,
  Atuador,
  LeituraSensor,
  AcaoSistema,
  RegistoConsumo,
  ParametroAutomatico,
};
