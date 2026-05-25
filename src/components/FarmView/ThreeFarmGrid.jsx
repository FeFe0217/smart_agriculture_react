import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

const ROWS = 4;
const COLS = 5;
const PLOT_WIDTH = 1.4;
const PLOT_DEPTH = 1.4;
const GAP_WIDTH = 0.12;
const SOIL_WIDTH = PLOT_WIDTH - GAP_WIDTH;
const SOIL_DEPTH = PLOT_DEPTH - GAP_WIDTH;
const BOX_WIDTH = 0.7;
const BOX_DEPTH = 0.7;
const MIN_HEIGHT = 0.2;
const MAX_HEIGHT = 2.5;
const GROUND_Y = 0;
const EXTRA_RINGS = 12;

// ==================== 核心改进：密集植被与严格边界控制 ====================
const VegetationAndSoil = ({ mainPlots, extraPlots }) => {
  const soilCount = mainPlots.length + extraPlots.length;
  
  // 改进点 2：显著提高作物行列数量，使其更加密集茂盛
  const ROWS_PER_PLOT = 8;    
  const BUSHES_PER_ROW = 12;  
  const vegCount = soilCount * ROWS_PER_PLOT * BUSHES_PER_ROW;

  const baseMeshRef = useRef();
  const vegMeshRef = useRef();

  useEffect(() => {
    if (!baseMeshRef.current || !vegMeshRef.current) return;

    const dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();
    
    // 改进点 3：地块的初始底色变更为自然的深草绿色
    const BASE_SOIL_COLOR = new THREE.Color('#0a2302'); 

    // 改进点 4：将作物颜色严格统一为两大核心自然绿（嫩绿与深绿）
    const CROP_COLOR_1 = new THREE.Color('#011904'); // 颜色一：鲜嫩翠绿
    const CROP_COLOR_2 = new THREE.Color('#022104'); // 颜色二：浓郁油绿

    let baseIdx = 0;
    let vegIdx = 0;

    const addPlot = (plot, isMain) => {
      const width = isMain ? SOIL_WIDTH : PLOT_WIDTH;
      const depth = isMain ? SOIL_DEPTH : PLOT_DEPTH;

      // 1. 生成初始绿色地块基底
      dummy.position.set(plot.x, GROUND_Y - 0.02, plot.z);
      dummy.scale.set(width, 0.05, depth);
      dummy.updateMatrix();
      baseMeshRef.current.setMatrixAt(baseIdx, dummy.matrix);
      
      // 让地块底色有极微弱的明暗错落，显得更有真实土地的质感
      colorObj.copy(BASE_SOIL_COLOR).offsetHSL(0, 0, (Math.random() - 0.5) * 0.03);
      baseMeshRef.current.setColorAt(baseIdx, colorObj);
      baseIdx++;

      // 2. 生成密集的 3D 作物（严格控制边界，绝不越界到路基上）
      // 改进点 1：设置 0.12 的安全边距，确保边缘的作物加上自身半径后也绝不碰触白色路基或水渠
      const MARGIN = 0.12; 
      const safeWidth = width - 2 * MARGIN;
      const safeDepth = depth - 2 * MARGIN;

      for (let r = 0; r < ROWS_PER_PLOT; r++) {
        const zPercent = ROWS_PER_PLOT > 1 ? r / (ROWS_PER_PLOT - 1) : 0.5;
        const zOffset = -safeDepth / 2 + zPercent * safeDepth;

        for (let b = 0; b < BUSHES_PER_ROW; b++) {
          const xPercent = BUSHES_PER_ROW > 1 ? b / (BUSHES_PER_ROW - 1) : 0.5;
          const xOffset = -safeWidth / 2 + xPercent * safeWidth;

          // 微小自然的有机抖动，但严格控制在安全防线内
          const randX = (Math.random() - 0.5) * 0.02;
          const randZ = (Math.random() - 0.5) * 0.02;
          const randScale = 0.5 + Math.random() * 0.5; // 产生高低有致的生长视觉

          const finalLocalX = xOffset + randX;
          const finalLocalZ = zOffset + randZ;

          dummy.position.set(
            plot.x + finalLocalX,
            GROUND_Y + 0.01 + randScale * 0.05, // 根据缩放微调高度，使其错落站立
            plot.z + finalLocalZ
          );
          
          // 缩放压扁成长条形或低矮灌木状，模拟真实的作物形态
          dummy.scale.set(randScale * 0.08, randScale * 0.06, randScale * 0.08);
          dummy.updateMatrix();
          vegMeshRef.current.setMatrixAt(vegIdx, dummy.matrix);

          // 改进点 4：二选一随机着色，保证地块内只有两大作物色系
          const chosenColor = Math.random() > 0.5 ? CROP_COLOR_1 : CROP_COLOR_2;
          vegMeshRef.current.setColorAt(vegIdx, chosenColor);
          vegIdx++;
        }
      }
    };

    mainPlots.forEach((p) => addPlot(p, true));
    extraPlots.forEach((p) => addPlot(p, false));

    baseMeshRef.current.instanceMatrix.needsUpdate = true;
    if (baseMeshRef.current.instanceColor) baseMeshRef.current.instanceColor.needsUpdate = true;
    vegMeshRef.current.instanceMatrix.needsUpdate = true;
    if (vegMeshRef.current.instanceColor) vegMeshRef.current.instanceColor.needsUpdate = true;
  }, [mainPlots, extraPlots]);

  return (
    <group>
      {/* 绿色地块基底网格：完全哑光 (roughness=1.0) */}
      <instancedMesh ref={baseMeshRef} args={[null, null, soilCount]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={1.0} metalness={0.0} />
      </instancedMesh>
      
      {/* 高密度 3D 农作物：完全哑光，无任何反光倒影 */}
      <instancedMesh ref={vegMeshRef} args={[null, null, vegCount]} receiveShadow>
        <sphereGeometry args={[1, 7, 7]} />
        <meshStandardMaterial roughness={1.0} metalness={0.0} />
      </instancedMesh>
    </group>
  );
};
// ====================================================================

// 数据测量柱体组件
const PlotBox = ({ plotNumber, humidity, position, onClick }) => {
  const meshRef = useRef();
  const height = MIN_HEIGHT + (humidity / 100) * (MAX_HEIGHT - MIN_HEIGHT);
  const color = humidity < 30 ? '#af170c' : (humidity <= 60 ? '#a08b12' : '#0861aa');
  const [isHovered, setIsHovered] = useState(false);

  useFrame(({ clock }) => {
    if (meshRef.current && humidity < 30) {
      const offset = Math.sin(clock.elapsedTime * 8) * 0.02;
      meshRef.current.position.y = GROUND_Y + height / 2 + offset;
    } else if (meshRef.current) {
      meshRef.current.position.y = GROUND_Y + height / 2;
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    onClick(plotNumber);
  };

  return (
    <group position={[position.x, GROUND_Y, position.z]}>
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BOX_WIDTH, height, BOX_DEPTH]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.6} 
          metalness={0.0} 
          emissive={humidity < 30 ? '#330000' : '#000000'} 
          emissiveIntensity={humidity < 30 ? 0.3 : 0} 
        />
      </mesh>
      <Text position={[0, height + 0.15, 0]} fontSize={0.22} color="#333333" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#ffffff">
        {`${plotNumber}`}
      </Text>
      <Text position={[0, height * 0.65, 0]} fontSize={0.18} color="#333333" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#ffffff">
        {`${humidity.toFixed(0)}%`}
      </Text>
      {humidity < 30 && (
        <Text position={[0, height + 0.35, 0]} fontSize={0.16} color="#cc0000" anchorX="center" anchorY="middle" fontWeight="bold">
          ⚠️
        </Text>
      )}
      {isHovered && (
        <Html position={[0, height + 0.55, 0]} center distanceFactor={10}>
          <div style={{ background: 'rgba(0,0,0,0.85)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            湿度: {humidity.toFixed(1)}%<br/>
            {humidity < 30 ? '⚠️ 严重缺水' : humidity <= 60 ? '⚠️ 缺水风险' : '✓ 水分正常'}
          </div>
        </Html>
      )}
    </group>
  );
};

// 蓝色灌溉水渠
const WaterGap = ({ position, width, depth, height = 0.02 }) => {
  return (
    <mesh position={[position.x, GROUND_Y - 0.01, position.z]} receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color="#1990d4" roughness={0.9} metalness={0.0} />
    </mesh>
  );
};

// 白色路基边框
const RoadBaseBorder = () => {
  const totalWidth = COLS * PLOT_WIDTH;
  const totalDepth = ROWS * PLOT_DEPTH;
  const borderWidth = 0.18;
  const borderHeight = 0.12;
  const borderY = GROUND_Y - 0.01;

  const pieces = [
    { position: { x: 0, z: -totalDepth / 2 - borderWidth / 2 }, width: totalWidth + borderWidth, depth: borderWidth },
    { position: { x: 0, z: totalDepth / 2 + borderWidth / 2 }, width: totalWidth + borderWidth, depth: borderWidth },
    { position: { x: -totalWidth / 2 - borderWidth / 2, z: 0 }, width: borderWidth, depth: totalDepth + borderWidth },
    { position: { x: totalWidth / 2 + borderWidth / 2, z: 0 }, width: borderWidth, depth: totalDepth + borderWidth },
  ];

  return (
    <>
      {pieces.map((piece, idx) => (
        <mesh key={`border-${idx}`} position={[piece.position.x, borderY, piece.position.z]} castShadow receiveShadow>
          <boxGeometry args={[piece.width, borderHeight, piece.depth]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.7} metalness={0.0} />
        </mesh>
      ))}
      {[
        { x: -totalWidth / 2 - borderWidth / 2, z: -totalDepth / 2 - borderWidth / 2 },
        { x:  totalWidth / 2 + borderWidth / 2, z: -totalDepth / 2 - borderWidth / 2 },
        { x: -totalWidth / 2 - borderWidth / 2, z:  totalDepth / 2 + borderWidth / 2 },
        { x:  totalWidth / 2 + borderWidth / 2, z:  totalDepth / 2 + borderWidth / 2 },
      ].map((pos, idx) => (
        <mesh key={`corner-${idx}`} position={[pos.x, borderY, pos.z]} castShadow receiveShadow>
          <boxGeometry args={[borderWidth, borderHeight, borderWidth]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.7} metalness={0.0} />
        </mesh>
      ))}
    </>
  );
};

// 环境渲染配置
const SceneSetup = () => {
  const { camera, gl } = useThree();
  useEffect(() => {
    camera.position.set(5, 7, 6);
    camera.lookAt(0, 0.01, 0);
    gl.setClearColor('#033403', 1); // 稳定的实体沙盘底色
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [camera, gl]);
  
  return (
    <>
      <OrbitControls
        enablePan={true}
        enableZoom={false}
        enableRotate={false}
        target={[0, 0, 0]}
      />
      <ambientLight intensity={0.75} />
      <directionalLight 
        position={[6, 15, 5]} 
        intensity={0.85} 
        castShadow 
        shadow-mapSize-width={2048} // 提高阴影分辨率，让细密植物的阴影更清晰
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0003}
      />
    </>
  );
};

const getPositionByRowCol = (row, col, width = PLOT_WIDTH, depth = PLOT_DEPTH) => {
  const x = (col - COLS / 2 + 0.5) * width;
  const z = (row - ROWS / 2 + 0.5) * depth;
  return { x, z };
};

const ThreeFarmGrid = ({ fieldsData, onPlotClick }) => {
  const getHumidity = (plotNumber) => {
    const field = fieldsData.find(f => f.fieldId === plotNumber.toString());
    return field ? field.currentMoisture : 50;
  };

  const mainPlots = useMemo(() => {
    const plots = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const plotNumber = row * COLS + col + 1;
        const { x, z } = getPositionByRowCol(row, col, PLOT_WIDTH, PLOT_DEPTH);
        const humidity = getHumidity(plotNumber);
        plots.push({ plotNumber, x, z, humidity });
      }
    }
    return plots;
  }, [fieldsData]);

  const extraPlots = useMemo(() => {
    const plots = [];
    const startRow = -EXTRA_RINGS;
    const endRow = ROWS - 1 + EXTRA_RINGS;
    const startCol = -EXTRA_RINGS;
    const endCol = COLS - 1 + EXTRA_RINGS;
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) continue;
        const { x, z } = getPositionByRowCol(row, col, PLOT_WIDTH, PLOT_DEPTH);
        plots.push({ x, z });
      }
    }
    return plots;
  }, []);

  const waterGaps = useMemo(() => {
    const gaps = [];
    for (let col = 0; col < COLS - 1; col++) {
      const x = (col - COLS / 2 + 1) * PLOT_WIDTH;
      for (let row = 0; row < ROWS; row++) {
        const z = (row - ROWS / 2 + 0.5) * PLOT_DEPTH;
        gaps.push({ position: { x, z }, width: GAP_WIDTH, depth: PLOT_DEPTH - GAP_WIDTH * 0.8 });
      }
    }
    for (let row = 0; row < ROWS - 1; row++) {
      const z = (row - ROWS / 2 + 1) * PLOT_DEPTH;
      for (let col = 0; col < COLS; col++) {
        const x = (col - COLS / 2 + 0.5) * PLOT_WIDTH;
        gaps.push({ position: { x, z }, width: PLOT_WIDTH - GAP_WIDTH * 0.8, depth: GAP_WIDTH });
      }
    }
    return gaps;
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#c8d6c8' }}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 12, 15], fov: 45 }}>
        <SceneSetup />

        {/* 全局大平地底盘（彻底杜绝虚无感） */}
        <mesh position={[0, GROUND_Y - 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#d5ecd5" roughness={1.0} metalness={0.0} />
        </mesh>

        {/* 高性能、边界严苛的高密度 3D 农田植被层 */}
        <VegetationAndSoil mainPlots={mainPlots} extraPlots={extraPlots} />

        {/* 蓝色的灌溉水渠 */}
        {waterGaps.map((gap, idx) => (
          <WaterGap key={`water-${idx}`} position={gap.position} width={gap.width} depth={gap.depth} />
        ))}

        {/* 白色高耸的田垄路基 */}
        <RoadBaseBorder />

        {/* 交互柱体 */}
        {mainPlots.map((plot) => (
          <PlotBox key={`bar-${plot.plotNumber}`} plotNumber={plot.plotNumber} humidity={plot.humidity} position={{ x: plot.x, z: plot.z }} onClick={onPlotClick} />
        ))}
      </Canvas>
    </div>
  );
};

export default ThreeFarmGrid;