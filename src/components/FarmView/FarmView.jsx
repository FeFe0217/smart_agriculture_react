// src/components/FarmView/FarmView.jsx
import React, { useState, useEffect } from 'react';
import SplitPane from '../Layout/SplitPane';
import ThreeFarmGrid from './ThreeFarmGrid';       // 替换原 FarmGrid
import PredictionPanel from '../DetailPanels/PredictionPanel';
import PrescriptionPanel from '../DetailPanels/PrescriptionPanel';
import YieldQualityPanel from '../DetailPanels/YieldQualityPanel';
import AlertPanel from '../DetailPanels/AlertPanel';
import { getFieldList, getSoilParams } from '../../services/mockApi';
import './FarmView.css';

// 小型预测曲线组件（保持不变）
function MiniPredictChart() {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * height / 4);
      ctx.lineTo(width, i * height / 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * width / 4, 0);
      ctx.lineTo(i * width / 4, height);
      ctx.stroke();
    }
    const points = [
      { x: 0, y: height * 0.2 },
      { x: width/3, y: height * 0.25 },
      { x: width*2/3, y: height * 0.35 },
      { x: width, y: height * 0.45 }
    ];
    ctx.beginPath();
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    const predPoints = [
      { x: width, y: height * 0.45 },
      { x: width + 40, y: height * 0.55 },
      { x: width + 80, y: height * 0.65 },
      { x: width + 120, y: height * 0.7 }
    ];
    ctx.beginPath();
    ctx.strokeStyle = '#2196f3';
    ctx.setLineDash([5, 5]);
    predPoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);
  return <canvas ref={canvasRef} width={200} height={80} style={{ width: '100%', height: '80px' }} />;
}

// 小型产量柱状图（保持不变）
function MiniYieldChart() {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const bars = [800, 850, 780, 920, 880];
    const barWidth = width / bars.length - 4;
    bars.forEach((val, idx) => {
      const barHeight = (val / 1000) * height;
      ctx.fillStyle = '#81c784';
      ctx.fillRect(idx * (barWidth + 4), height - barHeight, barWidth, barHeight);
      ctx.fillStyle = '#2e7d32';
      ctx.font = '8px sans-serif';
      ctx.fillText(val, idx * (barWidth + 4) + 2, height - barHeight - 2);
    });
  }, []);
  return <canvas ref={canvasRef} width={200} height={80} style={{ width: '100%', height: '80px' }} />;
}

function FarmView() {
  const [activeDetail, setActiveDetail] = useState(null);
  const [fields, setFields] = useState([]);
  const [popup, setPopup] = useState({ show: false, plotNumber: null, params: null });

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    const data = await getFieldList();
    setFields(data.fields);
  };

  const handlePlotClick = async (plotNumber) => {
    const params = await getSoilParams(plotNumber.toString());
    setPopup({ show: true, plotNumber, params });
  };

  const closePopup = () => {
    setPopup({ show: false, plotNumber: null, params: null });
  };

  const renderDetailPanel = () => {
    let content = null;
    switch (activeDetail) {
      case 'prediction':
        content = <PredictionPanel />;
        break;
      case 'prescription':
        content = <PrescriptionPanel />;
        break;
      case 'yieldQuality':
        content = <YieldQualityPanel />;
        break;
      case 'alert':
        content = <AlertPanel />;
        break;
      default:
        return null;
    }
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <button
          onClick={() => setActiveDetail(null)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 100,
            width: 32,
            height: 32,
            borderRadius: 16,
            background: '#f44336',
            color: 'white',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer'
          }}
        >
          ×
        </button>
        {content}
      </div>
    );
  };

  const farmContent = (
    <div className="farm-main-container">
      <ThreeFarmGrid fieldsData={fields} onPlotClick={handlePlotClick} />
      
      {/* 左侧边栏 */}
      <div className="sidebar left">
        <div className="card" onClick={() => setActiveDetail('prediction')}>
          <div className="card-header">📊 水分预测</div>
          <div className="card-content">
            <MiniPredictChart />
            <div className="card-stats">LSTM模型 | 未来3天湿度↓8%</div>
            <div className="card-stats">缺水度趋势: 0.12 → 0.35</div>
          </div>
        </div>
        <div className="card" onClick={() => setActiveDetail('alert')}>
          <div className="card-header">⚠️ 缺水预警</div>
          <div className="card-content">
            <div className="alert-summary">
              <span className="alert-count">3个田块</span>
              <span className="alert-level danger">严重: 8,15号</span>
            </div>
            <div className="alert-message">8号田缺水度72%，建议立即灌溉</div>
            <div className="alert-message">预计24小时内将新增2个预警</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">🌧️ 今日预测降水量</div>
          <div className="card-content">
            <div>降雨概率: 65%</div>
            <div>预计雨量: 12.5 mm</div>
            <div>最佳灌溉推迟至明日</div>
            <div className="card-stats">数据来源: 气象雷达</div>
          </div>
        </div>
      </div>

      {/* 右侧边栏 */}
      <div className="sidebar right">
        <div className="card" onClick={() => setActiveDetail('prescription')}>
          <div className="card-header">💧 灌溉处方图</div>
          <div className="card-content">
            <div>推荐方案：智能分区灌溉</div>
            <div>灌水时间：今日 16:00 - 18:00</div>
            <div>预计总水量：45.5 m³</div>
            <div>施氮量：按处方图分区</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">🎛️ 灌水决策控制</div>
          <div className="card-content">
            <div>自动模式 | 手动模式 (开发中)</div>
            <div>目标湿度: 75% | 当前: 42%</div>
            <div>推荐启动时间: 今日16:30</div>
            <button className="mock-btn" disabled>启动灌溉</button>
          </div>
        </div>
        <div className="card" onClick={() => setActiveDetail('yieldQuality')}>
          <div className="card-header">🌾 产量/品质</div>
          <div className="card-content">
            <MiniYieldChart />
            <div>预计增产8% | 糖度↑0.5%</div>
            <div>高品质地块: 1,7,16号</div>
          </div>
        </div>
      </div>

      {/* 点击柱体的弹窗 */}
      {popup.show && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <span className="close-popup" onClick={closePopup}>&times;</span>
            <h3>土壤参数</h3>
            <p>区域 {popup.plotNumber}</p>
            <p>温度: {popup.params?.temperature}°C</p>
            <p>湿度: {popup.params?.humidity}%</p>
            <p>缺水度: {popup.params?.deficiency}%</p>
          </div>
        </div>
      )}
    </div>
  );

  if (!activeDetail) {
    return <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>{farmContent}</div>;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SplitPane top={farmContent} bottom={renderDetailPanel()} defaultSize={500} />
    </div>
  );
}

export default FarmView;