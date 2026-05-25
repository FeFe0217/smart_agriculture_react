// src/services/mockApi.js
import { SOIL_PARAMS, IRRIGATION_PRESCRIPTION, YIELD_QUALITY_DATA } from '../utils/constants';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function getFieldList() {
  await delay(300);
  const fields = Object.keys(SOIL_PARAMS).map(key => ({
    fieldId: key,
    fieldName: `${Math.floor((key-1)/5)+1}区${((key-1)%5)+1}号田`,
    area: 2.5,
    cropType: '番茄',
    currentMoisture: SOIL_PARAMS[key].humidity,
    alertLevel: SOIL_PARAMS[key].deficiency >= 50 ? 'danger' : (SOIL_PARAMS[key].deficiency >= 30 ? 'warning' : 'normal'),
    soilData: SOIL_PARAMS[key]
  }));
  return { total: fields.length, fields };
}

export async function getSoilParams(fieldId) {
  await delay(200);
  return SOIL_PARAMS[fieldId] || { temperature: 22, humidity: 65, deficiency: 35 };
}

export async function getPredictionModels() {
  await delay(200);
  return {
    models: [
      { modelId: 'lstm', modelName: 'LSTM', modelType: '循环神经网络', version: '2024.01', supportedIntervals: ['1h', '6h', '1d'] },
      { modelId: 'bilstm', modelName: 'Bi-LSTM', modelType: '双向LSTM', version: '2024.01', supportedIntervals: ['1h', '6h', '1d'] },
      { modelId: 'xgboost', modelName: 'XGBoost', modelType: '梯度提升树', version: '2024.01', supportedIntervals: ['1h', '6h'] }
    ],
    defaultModelId: 'lstm'
  };
}

export async function runMoisturePrediction(params) {
  await delay(500);
  return {
    taskId: `TASK_${Date.now()}`,
    status: 'running',
    estimatedSeconds: 30
  };
}

export async function getPredictionTaskResult(taskId) {
  await delay(800);
  const moistureCurve = [
    { time: 'D', predictedMoisture: 36.0 },
    { time: 'D+1', predictedMoisture: 35.2 },
    { time: 'D+2', predictedMoisture: 34.5 },
    { time: 'D+3', predictedMoisture: 33.8 }
  ];
  const threshold = 75;
  const deficitCurve = moistureCurve.map(item => ({
    time: item.time,
    deficitDegree: Math.min(1, Math.max(0, (threshold - item.predictedMoisture) / threshold))
  }));
  const riskLevel = deficitCurve[deficitCurve.length-1].deficitDegree > 0.5 ? 'danger' : 'notice';
  return {
    taskId,
    status: 'completed',
    result: {
      moistureCurve,
      deficitCurve,
      riskLevel,
      waterAmount: 15.5,
      reason: '基于LSTM模型，未来三天土壤湿度将持续下降，缺水度上升，建议在D+1日进行灌溉'
    }
  };
}

export async function getAlertList() {
  await delay(300);
  const alerts = [];
  Object.keys(SOIL_PARAMS).forEach(key => {
    const params = SOIL_PARAMS[key];
    if (params.deficiency >= 30) {
      alerts.push({
        alertId: `ALT_${key}`,
        fieldId: key,
        fieldName: `${Math.floor((key-1)/5)+1}区${((key-1)%5)+1}号田`,
        level: params.deficiency >= 50 ? 'danger' : 'warning',
        currentMoisture: params.humidity,
        deficitDegree: params.deficiency / 100,
        alertTime: new Date().toISOString(),
        description: params.deficiency >= 50 ? '严重缺水，需立即灌溉' : '土壤湿度偏低，建议关注'
      });
    }
  });
  return { total: alerts.length, alerts };
}

export async function getIrrigationPrescription(fieldId, date) {
  await delay(400);
  const zones = Object.keys(IRRIGATION_PRESCRIPTION).map(key => ({
    zoneId: key,
    area: 0.8,
    recommendedWater: IRRIGATION_PRESCRIPTION[key].water,
    fertilizerAmount: IRRIGATION_PRESCRIPTION[key].fertilizer,
    deficitLevel: SOIL_PARAMS[key].deficiency >= 50 ? 'danger' : 'warning'
  }));
  return {
    prescriptionId: `PRE_${date}`,
    fieldId,
    generatedAt: new Date().toISOString(),
    prescriptionMap: { zones },
    recommendedPlan: {
      totalWater: zones.reduce((sum, z) => sum + z.recommendedWater, 0),
      duration: 90,
      startTime: `${date}T06:00:00Z`,
      flowRate: 0.5
    }
  };
}

export async function getYieldQualityPrediction(fieldId) {
  await delay(400);
  const fieldDetails = Object.keys(YIELD_QUALITY_DATA).map(key => ({
    fieldId: key,
    estimatedYield: YIELD_QUALITY_DATA[key].yield,
    qualityScore: YIELD_QUALITY_DATA[key].sugar
  }));
  const yields = fieldDetails.map(d => d.estimatedYield);
  const avgYield = (yields.reduce((a,b) => a+b, 0) / yields.length).toFixed(1);
  const highYieldFields = fieldDetails.filter(d => d.estimatedYield > 900).map(d => d.fieldId);
  return {
    taskId: `YTASK_${Date.now()}`,
    status: 'completed',
    scope: 'single',
    fieldId,
    averageYield: parseFloat(avgYield),
    totalYield: yields.reduce((a,b) => a+b, 0),
    highYieldFields,
    lowYieldFields: fieldDetails.filter(d => d.estimatedYield < 750).map(d => d.fieldId),
    fieldDetails
  };
}

export const BUILTIN_DATASETS = {
  summer2021: { name: '夏季数据集 (2021)', data: [36.5, 35.8, 35.0, 34.2] },
  spring2022: { name: '春季数据集 (2022)', data: [37.0, 36.2, 35.5, 34.8] },
  winter2021: { name: '冬季数据集 (2021)', data: [36.0, 35.5, 35.0, 34.5] }
};