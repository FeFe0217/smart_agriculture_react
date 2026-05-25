import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { getPredictionModels, runMoisturePrediction, getPredictionTaskResult, BUILTIN_DATASETS } from '../../services/mockApi';
import './PredictionView.css';

function PredictionView() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [depth, setDepth] = useState('20');
  const [predictionDate, setPredictionDate] = useState('2024-05-15');
  const [predictionTime, setPredictionTime] = useState('14:00');
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [dataSource, setDataSource] = useState('summer2021');
  const chartRef = useRef(null);
  let chartInstance = useRef(null);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (result && chartRef.current) {
      initChart();
    }
  }, [result, dataSource]);

  const loadModels = async () => {
    const data = await getPredictionModels();
    setModels(data.models);
    if (data.models.length > 0) {
      setSelectedModel(data.models[0].modelId);
    }
  };

  const initChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    const ctx = chartRef.current.getContext('2d');
    const labels = ['D-3', 'D-2', 'D-1', 'D', 'D+1', 'D+2', 'D+3'];
    const dataset = BUILTIN_DATASETS[dataSource] || BUILTIN_DATASETS.summer2021;
    const baseValue = dataset.data[0];
    const historicalData = [baseValue + 0.3, baseValue + 0.2, baseValue + 0.1, baseValue];
    const predictedData = result?.moistureCurve?.map(p => p.predictedMoisture) || dataset.data;
    
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '历史数据', data: [...historicalData, null, null, null], borderColor: '#4caf50', borderWidth: 3, fill: false, tension: 0.3, pointRadius: 6 },
          { label: '预测数据', data: [null, null, null, ...predictedData], borderColor: '#2196f3', borderWidth: 3, borderDash: [5, 5], fill: false, tension: 0.3, pointRadius: 6 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 30, max: 50, title: { display: true, text: '土壤湿度 (%)' } } } }
    });
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const task = await runMoisturePrediction({
        fieldId: 'F001',
        modelId: selectedModel,
        predictionRange: { start: `${predictionDate}T00:00:00Z`, end: `${predictionDate}T23:59:59Z` },
        interval: '1h'
      });
      setTimeout(async () => {
        const taskResult = await getPredictionTaskResult(task.taskId);
        setResult(taskResult.result);
        setPredicting(false);
      }, 1500);
    } catch (error) {
      console.error(error);
      setPredicting(false);
    }
  };

  return (
    <div className="prediction-view-container">
      <div className="prediction-main">
        <div className="prediction-controls">
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            {models.map(m => <option key={m.modelId} value={m.modelId}>{m.modelName}</option>)}
          </select>
          <select value={depth} onChange={(e) => setDepth(e.target.value)}>
            {[10,20,30,40,50,60,70,80].map(d => <option key={d} value={d}>{d}cm</option>)}
          </select>
          <input type="date" value={predictionDate} onChange={(e) => setPredictionDate(e.target.value)} />
          <input type="time" value={predictionTime} onChange={(e) => setPredictionTime(e.target.value)} />
          <button onClick={handlePredict} disabled={predicting}>{predicting ? '预测中...' : '运行预测'}</button>
        </div>
        <div className="prediction-chart">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
      <div className="prediction-sidebar">
        <div className="info-card">
          <h4>当前模型</h4>
          <p>{models.find(m => m.modelId === selectedModel)?.modelName || 'LSTM'}</p>
        </div>
        <div className="info-card">
          <h4>预测统计</h4>
          <p>当前湿度: 40%</p>
          <p>最低湿度: 35%</p>
          <p>最高湿度: 78%</p>
        </div>
        <div className="info-card">
          <h4>预测建议</h4>
          <p>最佳灌溉时间: {predictionDate} {predictionTime}</p>
          <p>预计需水量: 15m³</p>
        </div>
      </div>
    </div>
  );
}

export default PredictionView;