// src/components/DetailPanels/PrescriptionPanel.jsx
import React, { useState, useEffect } from 'react';
import { getIrrigationPrescription } from '../../services/mockApi';
import { FARM_PLOTS } from '../../utils/constants';

function PrescriptionPanel() {
  const [prescription, setPrescription] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    loadPrescription(today);
  }, []);

  const loadPrescription = async (date) => {
    const data = await getIrrigationPrescription('F001', date);
    setPrescription(data);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    loadPrescription(date);
  };

  const getWaterColor = (water) => {
    const minWater = 6, maxWater = 22;
    const normalized = (water - minWater) / (maxWater - minWater);
    if (normalized < 0.33) return '#BBDEFB';
    if (normalized < 0.66) return '#64B5F6';
    return '#0D47A1';
  };

  const getNitrogenColor = (nitrogen) => {
    const minN = 2.0, maxN = 6.0;
    const normalized = (nitrogen - minN) / (maxN - minN);
    if (normalized < 0.33) return '#FFE082';
    if (normalized < 0.66) return '#FFB74D';
    return '#E65100';
  };

  if (!prescription) return <div style={{ padding: 20 }}>加载中...</div>;

  const zoneMap = {};
  (prescription.prescriptionMap?.zones || []).forEach(zone => {
    zoneMap[zone.zoneId] = zone;
  });

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px', background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #e8f5e9' }}>
          <h3 style={{ color: '#2e7d32', margin: 0 }}>灌溉处方图</h3>
          <input type="date" value={selectedDate} onChange={handleDateChange} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>

        {/* 网格容器：固定宽度并居中，减小整体尺寸 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          marginBottom: '20px',
          maxWidth: '500px',      // 固定最大宽度，使网格变小
          margin: '0 auto',       // 居中显示
          width: '100%'
        }}>
          {FARM_PLOTS.map(plotNumber => {
            const zone = zoneMap[plotNumber] || { recommendedWater: 10, fertilizerAmount: 3.0 };
            const water = zone.recommendedWater;
            const nitrogen = zone.fertilizerAmount;
            return (
              <div key={plotNumber} style={{
                aspectRatio: '1',
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${getWaterColor(water)} 50%, ${getNitrogenColor(nitrogen)} 50%)`,
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
                  <div>💧{water}m³</div>
                  <div>🌱{nitrogen}kg</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '12px' }}>
          <div><span style={{ display: 'inline-block', width: '20px', height: '12px', borderRadius: '2px', background: 'linear-gradient(90deg, #BBDEFB, #0D47A1)', marginRight: '5px' }}></span> 灌水量 (低→高)</div>
          <div><span style={{ display: 'inline-block', width: '20px', height: '12px', borderRadius: '2px', background: 'linear-gradient(90deg, #FFE082, #E65100)', marginRight: '5px' }}></span> 施氮量 (低→高)</div>
        </div>
      </div>
    </div>
  );
}

export default PrescriptionPanel;