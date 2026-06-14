// 土壤参数（与项目一完全一致，共16块）
export const SOIL_PARAMS = {
  '1': { temperature: 22.5, humidity: 62, deficiency: 15 },
  '2': { temperature: 23.1, humidity: 58, deficiency: 35 },
  '3': { temperature: 21.8, humidity: 47, deficiency: 30 },
  '4': { temperature: 22.9, humidity: 39, deficiency: 40 },
  '5': { temperature: 23.5, humidity: 71, deficiency: 45 },
  '6': { temperature: 22.2, humidity: 52, deficiency: 25 },
  '7': { temperature: 21.5, humidity: 45, deficiency: 20 },
  '8': { temperature: 23.8, humidity: 31, deficiency: 70 },
  '9': { temperature: 22.1, humidity: 36, deficiency: 50 },
  '10': { temperature: 23.2, humidity: 49, deficiency: 35 },
  '11': { temperature: 21.9, humidity: 24, deficiency: 28 },
  '12': { temperature: 22.7, humidity: 44, deficiency: 32 },
  '13': { temperature: 23.4, humidity: 28, deficiency: 42 },
  '14': { temperature: 22.0, humidity: 33, deficiency: 37 },
  '15': { temperature: 23.6, humidity: 18, deficiency: 55 },
  '16': { temperature: 22.4, humidity: 41, deficiency: 23 },
};

// 灌溉处方数据（16块）
export const IRRIGATION_PRESCRIPTION = {
  '1': { water: 8, fertilizer: 2.5 },
  '2': { water: 12, fertilizer: 3.2 },
  '3': { water: 10, fertilizer: 3.0 },
  '4': { water: 14, fertilizer: 3.8 },
  '5': { water: 11, fertilizer: 3.1 },
  '6': { water: 9, fertilizer: 2.8 },
  '7': { water: 7, fertilizer: 2.3 },
  '8': { water: 20, fertilizer: 5.5 },
  '9': { water: 15, fertilizer: 4.0 },
  '10': { water: 12, fertilizer: 3.3 },
  '11': { water: 10, fertilizer: 2.9 },
  '12': { water: 13, fertilizer: 3.5 },
  '13': { water: 16, fertilizer: 4.2 },
  '14': { water: 14, fertilizer: 3.9 },
  '15': { water: 18, fertilizer: 4.8 },
  '16': { water: 8, fertilizer: 2.6 },
};

// 产量品质数据（16块）
export const YIELD_QUALITY_DATA = {
  '1': { yield: 920, sugar: 14.5 },
  '2': { yield: 850, sugar: 13.2 },
  '3': { yield: 880, sugar: 13.8 },
  '4': { yield: 810, sugar: 12.5 },
  '5': { yield: 870, sugar: 13.5 },
  '6': { yield: 900, sugar: 14.0 },
  '7': { yield: 930, sugar: 14.3 },
  '8': { yield: 680, sugar: 10.2 },
  '9': { yield: 780, sugar: 11.8 },
  '10': { yield: 820, sugar: 12.7 },
  '11': { yield: 860, sugar: 13.3 },
  '12': { yield: 840, sugar: 12.9 },
  '13': { yield: 790, sugar: 11.9 },
  '14': { yield: 830, sugar: 12.6 },
  '15': { yield: 720, sugar: 10.8 },
  '16': { yield: 910, sugar: 14.1 },
};

export const FARM_PLOTS = Array.from({ length: 16 }, (_, i) => (i + 1).toString());