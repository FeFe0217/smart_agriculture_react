// src/components/DetailPanels/YieldQualityPanel.jsx
import React, { useState, useEffect } from 'react';
import { getYieldQualityPrediction } from '../../services/mockApi';
import { FARM_PLOTS } from '../../utils/constants';

function YieldQualityPanel() {
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [displayMode, setDisplayMode] = useState('both'); // 'both', 'yield', 'quality' 可选，暂时只实现both

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    loadData();
  }, []);

  const loadData = async () => {
    const result = await getYieldQualityPrediction('F001');
    setData(result);
  };

  // 产量颜色（绿）
  const getYieldColor = (yieldVal) => {
    const minYield = 650, maxYield = 940;
    const normalized = (yieldVal - minYield) / (maxYield - minYield);
    if (normalized < 0.33) return '#BBDEFB';
    if (normalized < 0.66) return '#64B5F6';
    return '#0D47A1';
  };

  // 糖度颜色（红紫）
  const getSugarColor = (sugar) => {
    const minSugar = 9.8, maxSugar = 14.5;
    const normalized = (sugar - minSugar) / (maxSugar - minSugar);
    if (normalized < 0.33) return '#FFE082';
    if (normalized < 0.66) return '#FFB74D';
    return '#E65100';
  };

  if (!data) return <div style={{ padding: 20 }}>加载中...</div>;

  const fieldDataMap = {};
  (data.fieldDetails || []).forEach(d => {
    fieldDataMap[d.fieldId] = d;
  });

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px', background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #e8f5e9' }}>
          <h3 style={{ color: '#2e7d32', margin: 0 }}>产量/品质预测</h3>
          <div style={{ fontSize: '12px', color: '#666' }}>基于当前生长模型</div>
        </div>

        {/* 网格：固定最大宽度，居中，每个地块同时显示产量和糖度 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          marginBottom: '20px',
          maxWidth: '500px',
          margin: '0 auto',
          width: '100%'
        }}>
          {FARM_PLOTS.map(plotNumber => {
            const plotData = fieldDataMap[plotNumber] || { estimatedYield: 800, qualityScore: 12.0 };
            const yieldVal = plotData.estimatedYield;
            const sugarVal = plotData.qualityScore;
            const yieldColor = getYieldColor(yieldVal);
            const sugarColor = getSugarColor(sugarVal);
            return (
              <div key={plotNumber} style={{
                aspectRatio: '1',
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${yieldColor} 50%, ${sugarColor} 50%)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: '1px solid #ddd',
                overflow: 'hidden'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  fontSize: '10px',
                  padding: '0 4px',
                  borderRadius: '4px'
                }}>{plotNumber}</span>
                <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                  <div>{yieldVal} kg/亩</div>
                  <div>{sugarVal.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 图例 */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '12px' }}>
          <div><span style={{ display: 'inline-block', width: '20px', height: '12px', borderRadius: '2px', background: 'linear-gradient(90deg, #C8E6C9, #1B5E20)', marginRight: '5px' }}></span> 产量 (低→高)</div>
          <div><span style={{ display: 'inline-block', width: '20px', height: '12px', borderRadius: '2px', background: 'linear-gradient(90deg, #FFCDD2, #B71C1C)', marginRight: '5px' }}></span> 糖度 (低→高)</div>
        </div>

        {/* 总结信息（可选） */}
        <div style={{ marginTop: '20px', padding: '10px', background: '#e3f2fd', borderRadius: '8px', fontSize: '12px', textAlign: 'center' }}>
          平均产量: {data.averageYield} kg/亩 | 总产量: {data.totalYield} kg | 高品质地块: {data.highYieldFields?.slice(0,3).join(',')}
        </div>
      </div>
    </div>
  );
}

export default YieldQualityPanel;