// src/components/DetailPanels/PredictionPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { getPredictionModels, runMoisturePrediction, getPredictionTaskResult, BUILTIN_DATASETS } from '../../services/mockApi';

function PredictionPanel() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('lstm');
  const [depth, setDepth] = useState('20');
  const [predictionDate, setPredictionDate] = useState('2024-05-15');
  const [predictionTime, setPredictionTime] = useState('14:00');
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState(null);
  const [dataSource, setDataSource] = useState('summer2021');
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const moistureChartRef = useRef(null);
  const deficitChartRef = useRef(null);
  let moistureChart = useRef(null);
  let deficitChart = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadModels();
    setTimeout(() => {
      initChartsWithDataset(dataSource);
    }, 100);
  }, []);

  const loadModels = async () => {
    const data = await getPredictionModels();
    setModels(data.models);
    if (data.models.length > 0 && !selectedModel) {
      setSelectedModel(data.models[0].modelId);
    }
  };

  const initChartsWithDataset = (datasetKey) => {
    if (moistureChart.current) moistureChart.current.destroy();
    if (deficitChart.current) deficitChart.current.destroy();

    const labels = ['D-3', 'D-2', 'D-1', 'D', 'D+1', 'D+2', 'D+3'];
    let historicalMoisture, predictedMoisture;
    if (dataSource === 'upload' && uploadedFileData) {
      historicalMoisture = uploadedFileData.historical;
      predictedMoisture = uploadedFileData.predicted;
    } else {
      const dataset = BUILTIN_DATASETS[datasetKey] || BUILTIN_DATASETS.summer2021;
      const baseValue = dataset.data[0];
      historicalMoisture = [baseValue + 0.3, baseValue + 0.2, baseValue + 0.1, baseValue];
      predictedMoisture = dataset.data;
    }
    // 水分曲线
    const moistureCtx = moistureChartRef.current.getContext('2d');
    moistureChart.current = new Chart(moistureCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '历史湿度', data: [...historicalMoisture, null, null, null], borderColor: '#4caf50', borderWidth: 3, fill: false, tension: 0.3, pointRadius: 6 },
          { label: '预测湿度', data: [null, null, null, ...predictedMoisture], borderColor: '#2196f3', borderWidth: 3, borderDash: [5, 5], fill: false, tension: 0.3, pointRadius: 6 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 30, max: 50, title: { display: true, text: '土壤湿度 (%)' } } } }
    });
    // 缺水度曲线
    const threshold = 75;
    const deficitHistorical = historicalMoisture.map(h => Math.min(1, Math.max(0, (threshold - h) / threshold)));
    const deficitPredicted = predictedMoisture.map(p => Math.min(1, Math.max(0, (threshold - p) / threshold)));
    const deficitCtx = deficitChartRef.current.getContext('2d');
    deficitChart.current = new Chart(deficitCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '历史缺水度', data: [...deficitHistorical, null, null, null], borderColor: '#ff9800', borderWidth: 3, fill: false, tension: 0.3, pointRadius: 6 },
          { label: '预测缺水度', data: [null, null, null, ...deficitPredicted], borderColor: '#f44336', borderWidth: 3, borderDash: [5, 5], fill: false, tension: 0.3, pointRadius: 6 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 1, title: { display: true, text: '缺水度 (0~1)' } } } }
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
        const predictedMoisture = taskResult.result.moistureCurve.map(p => p.predictedMoisture);
        const threshold = 75;
        const deficitPredicted = predictedMoisture.map(p => Math.min(1, Math.max(0, (threshold - p) / threshold)));
        moistureChart.current.data.datasets[1].data = [null, null, null, ...predictedMoisture];
        moistureChart.current.update();
        deficitChart.current.data.datasets[1].data = [null, null, null, ...deficitPredicted];
        deficitChart.current.update();
        setPredicting(false);
      }, 1500);
    } catch (error) {
      console.error(error);
      setPredicting(false);
    }
  };

  const exportAsPNG = () => {
    if (!moistureChart.current) return;
    const canvas = moistureChartRef.current;
    const link = document.createElement('a');
    link.download = `土壤湿度预测_${predictionDate}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportAsExcel = () => {
    const labels = ['D-3', 'D-2', 'D-1', 'D', 'D+1', 'D+2', 'D+3'];
    const moistureData = moistureChart.current.data.datasets[1].data;
    const deficitData = deficitChart.current.data.datasets[1].data;
    let csv = '\uFEFF时间点,预测湿度(%),预测缺水度\n';
    labels.forEach((label, idx) => {
      const moist = moistureData[idx] !== null ? moistureData[idx].toFixed(1) : '--';
      const deficit = deficitData[idx] !== null ? deficitData[idx].toFixed(3) : '--';
      csv += `${label},${moist},${deficit}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `预测数据_${predictionDate}.csv`;
    link.click();
  };

  const exportAsPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.text('土壤湿度与缺水度预测报告', 105, 20, { align: 'center' });
    doc.text(`预测日期: ${predictionDate}`, 20, 40);
    const canvas = moistureChartRef.current;
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 20, 50, 170, 70);
    const deficitCanvas = deficitChartRef.current;
    const deficitImg = deficitCanvas.toDataURL('image/png');
    doc.addImage(deficitImg, 'PNG', 20, 130, 170, 70);
    doc.save(`预测报告_${predictionDate}.pdf`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target.result;
        const lines = content.split('\n');
        const values = [];
        for (let i = 1; i < lines.length && values.length < 4; i++) {
          const num = parseFloat(lines[i].split(',')[0]);
          if (!isNaN(num)) values.push(num);
        }
        if (values.length >= 4) {
          const baseValue = values[0];
          const historical = [baseValue + 0.3, baseValue + 0.2, baseValue + 0.1, baseValue];
          const predicted = values;
          setUploadedFileData({ historical, predicted });
          setDataSource('upload');
          initChartsWithDataset('upload');
          setUploadStatus({ type: 'success', msg: '文件上传成功' });
        } else {
          setUploadStatus({ type: 'error', msg: '需要至少4行数据' });
        }
      } catch (err) {
        setUploadStatus({ type: 'error', msg: '解析失败' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const switchBuiltin = (key) => {
    setDataSource(key);
    setUploadedFileData(null);
    initChartsWithDataset(key);
    setUploadStatus(null);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px', background: '#fafafa' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3>土壤湿度与缺水度预测</h3>
      </div>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
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
      <div style={{ height: '280px', marginBottom: '20px' }}>
        <canvas ref={moistureChartRef}></canvas>
      </div>
      <div style={{ height: '280px', marginBottom: '20px' }}>
        <canvas ref={deficitChartRef}></canvas>
      </div>
      <div style={{ background: 'white', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>数据源</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => switchBuiltin('summer2021')}>夏季2021</button>
            <button onClick={() => switchBuiltin('spring2022')}>春季2022</button>
            <button onClick={() => switchBuiltin('winter2021')}>冬季2021</button>
            <input type="file" ref={fileInputRef} accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current.click()}>上传CSV</button>
          </div>
        </div>
        {uploadStatus && <div style={{ marginTop: '10px', color: uploadStatus.type === 'success' ? 'green' : 'red' }}>{uploadStatus.msg}</div>}
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={exportAsPNG}>导出PNG</button>
        <button onClick={exportAsExcel}>导出Excel</button>
        <button onClick={exportAsPDF}>导出PDF</button>
      </div>
      {result && (
        <div style={{ marginTop: '20px', background: '#e8f5e9', padding: '12px', borderRadius: '8px' }}>
          <p><strong>建议灌水量：</strong> {result.waterAmount} m³</p>
          <p><strong>预测依据：</strong> {result.reason}</p>
          <p><strong>风险等级：</strong> {result.riskLevel === 'danger' ? '严重缺水' : '注意'}</p>
        </div>
      )}
    </div>
  );
}

export default PredictionPanel;