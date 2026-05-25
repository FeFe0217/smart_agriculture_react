// 土壤参数模拟数据
export const SOIL_PARAMS = {
  '1': { temperature: 22.5, humidity: 85, deficiency: 15 },
  '2': { temperature: 23.1, humidity: 65, deficiency: 35 },
  '3': { temperature: 21.8, humidity: 70, deficiency: 30 },
  '4': { temperature: 22.9, humidity: 60, deficiency: 40 },
  '5': { temperature: 23.5, humidity: 55, deficiency: 45 },
  '6': { temperature: 22.2, humidity: 75, deficiency: 25 },
  '7': { temperature: 21.5, humidity: 80, deficiency: 20 },
  '8': { temperature: 23.8, humidity: 30, deficiency: 70 },
  '9': { temperature: 22.1, humidity: 50, deficiency: 50 },
  '10': { temperature: 23.2, humidity: 65, deficiency: 35 },
  '11': { temperature: 21.9, humidity: 72, deficiency: 28 },
  '12': { temperature: 22.7, humidity: 68, deficiency: 32 },
  '13': { temperature: 23.4, humidity: 58, deficiency: 42 },
  '14': { temperature: 22.0, humidity: 63, deficiency: 37 },
  '15': { temperature: 23.6, humidity: 45, deficiency: 55 },
  '16': { temperature: 22.4, humidity: 77, deficiency: 23 },
  '17': { temperature: 21.7, humidity: 82, deficiency: 18 },
  '18': { temperature: 23.0, humidity: 40, deficiency: 60 },
  '19': { temperature: 22.3, humidity: 53, deficiency: 47 },
  '20': { temperature: 23.3, humidity: 48, deficiency: 52 }
};

// 灌溉处方数据
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
  '17': { water: 6, fertilizer: 2.0 },
  '18': { water: 22, fertilizer: 6.0 },
  '19': { water: 17, fertilizer: 4.5 },
  '20': { water: 13, fertilizer: 3.6 }
};

// 产量品质数据
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
  '17': { yield: 940, sugar: 14.4 },
  '18': { yield: 650, sugar: 9.8 },
  '19': { yield: 770, sugar: 11.5 },
  '20': { yield: 800, sugar: 12.2 }
};

export const FARM_PLOTS = Array.from({ length: 20 }, (_, i) => (i + 1).toString());