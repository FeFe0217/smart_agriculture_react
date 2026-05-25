import React from 'react';

function FarmCards({ onCardClick, activeDetail }) {
  const cards = [
    { id: 'prediction', title: '📊 水分预测', color: '#2196f3', position: 'top-left' },
    { id: 'alert', title: '⚠️ 缺水预警', color: '#ff9800', position: 'bottom-left' },
    { id: 'prescription', title: '💧 灌溉处方图', color: '#4caf50', position: 'top-right' },
    { id: 'yieldQuality', title: '🌾 产量/品质', color: '#9c27b0', position: 'bottom-right' },
  ];

  return (
    <>
      <div className="card card-top-left" style={{ borderLeftColor: '#2196f3' }}>
        <div className="card-title">📊 水分预测</div>
        <div className="card-value">LSTM模型</div>
        <button className="card-btn" onClick={() => onCardClick('prediction')}>
          查看详情 →
        </button>
      </div>

      <div className="card card-bottom-left" style={{ borderLeftColor: '#ff9800' }}>
        <div className="card-title">⚠️ 缺水预警</div>
        <div className="card-value">3个田块需关注</div>
        <button className="card-btn" onClick={() => onCardClick('alert')}>
          查看详情 →
        </button>
      </div>

      <div className="card card-top-right" style={{ borderLeftColor: '#4caf50' }}>
        <div className="card-title">💧 灌溉处方图</div>
        <div className="card-value">推荐今日灌溉</div>
        <button className="card-btn" onClick={() => onCardClick('prescription')}>
          查看详情 →
        </button>
      </div>

      <div className="card card-bottom-right" style={{ borderLeftColor: '#9c27b0' }}>
        <div className="card-title">🌾 产量/品质</div>
        <div className="card-value">预计增产8%</div>
        <button className="card-btn" onClick={() => onCardClick('yieldQuality')}>
          查看详情 →
        </button>
      </div>
    </>
  );
}

export default FarmCards;