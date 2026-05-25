import React, { useState, useEffect } from 'react';
import { getAlertList } from '../../services/mockApi';

function AlertPanel() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const data = await getAlertList();
    setAlerts(data.alerts);
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'danger': return '#f44336';
      case 'warning': return '#ff9800';
      case 'notice': return '#ffc107';
      default: return '#4caf50';
    }
  };

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.level === filter);

  return (
    <div className="detail-panel alert-panel">
      <div className="panel-header">
        <h3>缺水预警</h3>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">全部</option>
          <option value="danger">严重</option>
          <option value="warning">警告</option>
          <option value="notice">注意</option>
        </select>
      </div>
      <div className="alert-list">
        {filteredAlerts.map(alert => (
          <div key={alert.alertId} className="alert-item" style={{ borderLeftColor: getLevelColor(alert.level) }}>
            <div className="alert-field">{alert.fieldName}</div>
            <div className="alert-level" style={{ color: getLevelColor(alert.level) }}>{alert.level}</div>
            <div className="alert-moisture">当前湿度: {alert.currentMoisture}%</div>
            <div className="alert-desc">{alert.description}</div>
            <button className="alert-action">标记处理</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertPanel;