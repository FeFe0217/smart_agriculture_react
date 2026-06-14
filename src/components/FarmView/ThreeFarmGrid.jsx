import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// ========== 配置参数（与项目一完全一致） ==========
const ROWS = 4;
const COLS = 4;
const PLATFORM_TOP_Y = 0;
const BLOCK_WIDTH = 2.9;
const BLOCK_DEPTH = 2.35;
const BLOCK_HEIGHT = 0.16;
const BLOCK_SPACING_X = 3.75;
const BLOCK_SPACING_Z = 3.75;
const BLOCK_ROW_OFFSET_X = 0.42;
const GRID_CENTER_COL = 1.5;
const GRID_CENTER_ROW = 1.5;
const GRID_Z_OFFSET = 0;
const GRID_OFFSET_X = 0;
const GRID_OFFSET_Z = 3.7;

const COLUMN_MIN_HEIGHT = 1.1;
const COLUMN_HEIGHT_RANGE = 3.8;
const COLUMN_MODEL_WIDTH = 1.26;
const COLUMN_MODEL_DEPTH = 1.26;
const COLUMN_HEIGHT_SCALE = 1.06;
const MODEL_PATH = '/assets/column-outlined.glb';

// 颜色常量（直接取自项目一 Farm3DMap.tsx）
const BLOCK_SURFACE_COLORS = {
  blue: '#8fd2ff', green: '#9edc8c', yellow: '#d8d18b', orange: '#d9a079', red: '#d7b08b'
};

const COLUMN_FILL_COLORS = {
  blue: '#0076d9', green: '#009b4e', yellow: '#d59a00', orange: '#e9691d', red: '#d92c1f'
};

const COLUMN_EMISSIVE_COLORS = {
  blue: '#10a9ff', green: '#23d36b', yellow: '#ffc928', orange: '#ff8a2b', red: '#ff5038'
};

const COLUMN_OUTLINE_COLORS = {
  blue: '#aee6ff', green: '#a9f5c8', yellow: '#ffdf66', orange: '#ffbf7a', red: '#ffad9f'
};

const COLUMN_RIM_COLORS = {
  blue: '#004b94', green: '#075f35', yellow: '#7a5400', orange: '#8a340d', red: '#8b160f'
};

// ========== 辅助函数 ==========
function getRiskLevel(moisture) {
  if (moisture <= 20) return 'severe';
  if (moisture <= 35) return 'high';
  if (moisture <= 50) return 'medium';
  return 'low';
}

function getColorToken(moisture, risk) {
  if (risk === 'severe') return 'red';
  if (risk === 'high') return 'orange';
  if (risk === 'medium') return 'yellow';
  return 'blue';
}

function getHeightValue(moisture) {
  return Math.max(20, Math.min(100, Math.round(20 + moisture * 0.8)));
}

function getColumnHeight(moisture) {
  return COLUMN_MIN_HEIGHT + (getHeightValue(moisture) / 100) * COLUMN_HEIGHT_RANGE;
}

function createRoundedBox(w, h, d) {
  return new THREE.BoxGeometry(w, h, d, 5, 1, 5);
}

// 柱体装饰层（完全复制项目一）
function buildColumnOverlay(width, height, depth, colorToken) {
  const group = new THREE.Group();
  const fillColor = COLUMN_FILL_COLORS[colorToken];
  const outlineColor = COLUMN_OUTLINE_COLORS[colorToken];
  const glowColor = COLUMN_EMISSIVE_COLORS[colorToken];
  const rimColor = COLUMN_RIM_COLORS[colorToken];

  const shell = new THREE.Mesh(
    createRoundedBox(width * 0.92, height * 0.98, depth * 0.92),
    new THREE.MeshPhysicalMaterial({
      color: fillColor, emissive: glowColor, emissiveIntensity: 0.05, metalness: 0,
      opacity: 0.86, roughness: 0.76, transparent: true
    })
  );
  shell.renderOrder = 2;

  // 边缘线框（简化版，保留核心视觉）
  const edgePoints = [
    new THREE.Vector3(-width/2, height/2, -depth/2), new THREE.Vector3( width/2, height/2, -depth/2),
    new THREE.Vector3( width/2, height/2, -depth/2), new THREE.Vector3( width/2, height/2,  depth/2),
    new THREE.Vector3( width/2, height/2,  depth/2), new THREE.Vector3(-width/2, height/2,  depth/2),
    new THREE.Vector3(-width/2, height/2,  depth/2), new THREE.Vector3(-width/2, height/2, -depth/2),
    new THREE.Vector3(-width/2, -height/2, -depth/2), new THREE.Vector3(-width/2,  height/2, -depth/2),
    new THREE.Vector3( width/2, -height/2, -depth/2), new THREE.Vector3( width/2,  height/2, -depth/2),
    new THREE.Vector3( width/2, -height/2,  depth/2), new THREE.Vector3( width/2,  height/2,  depth/2),
    new THREE.Vector3(-width/2, -height/2,  depth/2), new THREE.Vector3(-width/2,  height/2,  depth/2),
  ];
  const edges = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(edgePoints),
    new THREE.LineBasicMaterial({ color: rimColor, transparent: true, opacity: 0.38, depthWrite: false })
  );
  edges.renderOrder = 4;

  const highlightPoints = [
    new THREE.Vector3(-width/2+0.04, height/2+0.006, -depth/2),
    new THREE.Vector3( width/2-0.04, height/2+0.006, -depth/2),
    new THREE.Vector3(-width/2, -height/2+0.08, -depth/2-0.02),
    new THREE.Vector3(-width/2,  height/2-0.04, -depth/2-0.02),
  ];
  const highlights = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(highlightPoints),
    new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.58, depthWrite: false })
  );
  highlights.renderOrder = 5;

  const sideShade = new THREE.Mesh(
    new THREE.PlaneGeometry(width*0.92, height*0.94),
    new THREE.MeshBasicMaterial({ color: rimColor, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
  );
  sideShade.position.z = depth/2 + 0.006;
  sideShade.renderOrder = 3;

  const faceLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -height/2+0.08, -depth/2-0.018),
    new THREE.Vector3(0,  height/2-0.08, -depth/2-0.018),
    new THREE.Vector3(0, -height/2+0.08,  depth/2+0.018),
    new THREE.Vector3(0,  height/2-0.08,  depth/2+0.018),
    new THREE.Vector3(-width/2-0.018, -height/2+0.08, 0),
    new THREE.Vector3(-width/2-0.018,  height/2-0.08, 0),
    new THREE.Vector3( width/2+0.018, -height/2+0.08, 0),
    new THREE.Vector3( width/2+0.018,  height/2-0.08, 0),
  ]);
  const faceLines = new THREE.LineSegments(faceLineGeometry, new THREE.LineBasicMaterial({ color: outlineColor, transparent: true, opacity: 0.16 }));
  faceLines.renderOrder = 5;

  const topSheen = new THREE.Mesh(
    new THREE.PlaneGeometry(width*0.78, depth*0.78),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  topSheen.rotation.x = -Math.PI/2;
  topSheen.position.y = height/2 + 0.012;
  topSheen.renderOrder = 3;

  const baseGlow = new THREE.Mesh(
    new THREE.TorusGeometry(Math.min(width, depth)*0.48, 0.026, 8, 52),
    new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.08 })
  );
  baseGlow.rotation.x = Math.PI/2;
  baseGlow.position.y = -height/2 + 0.045;
  baseGlow.renderOrder = 1;

  group.add(baseGlow, shell, sideShade, edges, faceLines, highlights, topSheen);
  return group;
}

// 定制 GLB 模型的材质（与项目一完全一致）
function customizeColumnModel(model, colorToken) {
  const fillColor = new THREE.Color(COLUMN_FILL_COLORS[colorToken]);
  const emissiveColor = new THREE.Color(COLUMN_EMISSIVE_COLORS[colorToken]);
  model.traverse((child) => {
    if (!child.isMesh) return;
    const name = child.name.toLowerCase();
    if (name.includes('dashboard outline') || name.includes('inner glow grid') || name.includes('top sheen') || name.includes('base contact')) {
      child.visible = false;
      return;
    }
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    child.material = materials.map(mat => {
      const newMat = mat.clone();
      if (newMat.isMeshStandardMaterial || newMat.isMeshPhysicalMaterial) {
        newMat.color.copy(fillColor);
        newMat.emissive.copy(emissiveColor);
        newMat.emissiveIntensity = 0.07;
        newMat.opacity = 0.92;
        newMat.transparent = true;
        newMat.roughness = 0.74;
        newMat.metalness = 0;
      }
      if (newMat.isMeshBasicMaterial) {
        newMat.color.copy(fillColor);
        newMat.opacity = 0.6;
        newMat.transparent = true;
      }
      return newMat;
    });
    child.renderOrder = 2;
  });
}

function getWorldPosition(row, col) {
  const offsetX = (row - GRID_CENTER_ROW) * BLOCK_ROW_OFFSET_X;
  const x = (col - GRID_CENTER_COL) * BLOCK_SPACING_X + offsetX + GRID_OFFSET_X;
  const z = (row - GRID_CENTER_ROW) * BLOCK_SPACING_Z + GRID_Z_OFFSET + GRID_OFFSET_Z;
  return { x, z };
}

// ========== React 组件 ==========
const ThreeFarmGrid = ({ fieldsData, onPlotClick }) => {
  const containerRef = useRef(null);
  const modelTemplate = useRef(null);
  const visualsMap = useRef(new Map());
  const selectables = useRef([]);
  let scene, camera, renderer, labelRenderer, frameId;

  const getMoisture = (plotNumber, fields) => {
    const field = fields?.find(f => f.fieldId === plotNumber.toString());
    return field ? field.currentMoisture : 50;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 初始化场景
    scene = new THREE.Scene();
    scene.background = null;
    camera = new THREE.OrthographicCamera();
    camera.position.set(8, 6, 12);
    camera.lookAt(0, 0, 4.3);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none';
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(labelRenderer.domElement);

    // 灯光（用户最终确认值：环境光1.0，方向光0.9）
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
    sunLight.position.set(10, 20, 8);
    const fillLight = new THREE.DirectionalLight(0xb8d4ff, 0.7);
    fillLight.position.set(-8, 8, -10);
    scene.add(ambientLight, sunLight, fillLight);

    // 阴影接收平面
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.3, color: 0x000000, transparent: true, side: THREE.DoubleSide })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // 加载 GLB 模型
    const loader = new GLTFLoader();
    loader.load(MODEL_PATH, (gltf) => {
      modelTemplate.current = gltf.scene.clone(true);
      rebuildAll(); // 模型加载完成后重建所有柱体
    }, undefined, (err) => {
      console.warn('GLB模型加载失败，使用纯几何体', err);
      rebuildAll(); // 无模型时降级
    });

    // 构建所有地块
    const rebuildAll = () => {
      // 清除旧数据
      visualsMap.current.forEach(v => {
        scene.remove(v.group, v.ground, v.label, v.hit);
      });
      visualsMap.current.clear();
      selectables.current = [];

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const plotNumber = row * COLS + col + 1;
          const moisture = getMoisture(plotNumber, fieldsData);
          const risk = getRiskLevel(moisture);
          const colorToken = getColorToken(moisture, risk);
          const columnHeight = getColumnHeight(moisture);
          const { x, z } = getWorldPosition(row, col);

          // 基底
          const groundMat = new THREE.MeshStandardMaterial({
            color: BLOCK_SURFACE_COLORS[colorToken],
            roughness: 0.9, transparent: true, opacity: 0.28
          });
          const ground = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_DEPTH), groundMat);
          ground.position.set(x, PLATFORM_TOP_Y + BLOCK_HEIGHT / 2, z);
          ground.receiveShadow = true;
          scene.add(ground);

          // 柱体组
          const group = new THREE.Group();
          group.position.set(x, PLATFORM_TOP_Y + BLOCK_HEIGHT / 2 + columnHeight / 2, z);

          if (modelTemplate.current) {
            const model = modelTemplate.current.clone(true);
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const sx = COLUMN_MODEL_WIDTH / size.x;
            const sy = (columnHeight * COLUMN_HEIGHT_SCALE) / size.y;
            const sz = COLUMN_MODEL_DEPTH / size.z;
            model.scale.set(sx, sy, sz);
            model.position.y = -columnHeight / 2;
            customizeColumnModel(model, colorToken);
            group.add(model);
          }
          // 始终叠加装饰层（确保视觉效果）
          const overlay = buildColumnOverlay(COLUMN_MODEL_WIDTH, columnHeight * COLUMN_HEIGHT_SCALE, COLUMN_MODEL_DEPTH, colorToken);
          group.add(overlay);
          scene.add(group);

          // 标签
          const div = document.createElement('div');
          div.className = 'farm3d-label';
          div.innerHTML = `<strong>${plotNumber}</strong><span>${Math.round(moisture)}%</span>`;
          const label = new CSS2DObject(div);
          label.position.set(x, group.position.y + columnHeight * 0.22, z + 0.52);
          scene.add(label);

          // 点击区域
          const hit = new THREE.Mesh(
            new THREE.BoxGeometry(COLUMN_MODEL_WIDTH, columnHeight + 0.8, COLUMN_MODEL_DEPTH),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
          );
          hit.position.set(x, group.position.y, z);
          hit.userData = { plotNumber };
          scene.add(hit);
          selectables.current.push(hit);

          visualsMap.current.set(plotNumber, { group, ground, label, hit, columnHeight, colorToken });
        }
      }
    };

    // 更新数据（不重建整个场景，只更新柱体颜色、高度等）
    const updateFields = (newFields) => {
      for (let i = 0; i < 16; i++) {
        const plotNumber = i + 1;
        const moisture = getMoisture(plotNumber, newFields);
        const risk = getRiskLevel(moisture);
        const newColorToken = getColorToken(moisture, risk);
        const newHeight = getColumnHeight(moisture);
        const visual = visualsMap.current.get(plotNumber);
        if (!visual) continue;

        const { group, ground, label, hit, columnHeight: oldHeight, colorToken: oldToken } = visual;

        // 更新标签文字
        label.element.querySelector('span').textContent = `${Math.round(moisture)}%`;

        if (Math.abs(newHeight - oldHeight) > 0.01 || newColorToken !== oldToken) {
          // 重建柱体组
          while (group.children.length) group.remove(group.children[0]);

          if (modelTemplate.current) {
            const model = modelTemplate.current.clone(true);
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const sx = COLUMN_MODEL_WIDTH / size.x;
            const sy = (newHeight * COLUMN_HEIGHT_SCALE) / size.y;
            const sz = COLUMN_MODEL_DEPTH / size.z;
            model.scale.set(sx, sy, sz);
            model.position.y = -newHeight / 2;
            customizeColumnModel(model, newColorToken);
            group.add(model);
          }
          const overlay = buildColumnOverlay(COLUMN_MODEL_WIDTH, newHeight * COLUMN_HEIGHT_SCALE, COLUMN_MODEL_DEPTH, newColorToken);
          group.add(overlay);
          group.position.y = PLATFORM_TOP_Y + BLOCK_HEIGHT / 2 + newHeight / 2;

          hit.scale.y = (newHeight + 0.8) / (oldHeight + 0.8);
          hit.position.y = group.position.y;
          label.position.y = group.position.y + newHeight * 0.22;
          ground.material.color.set(BLOCK_SURFACE_COLORS[newColorToken]);

          visual.columnHeight = newHeight;
          visual.colorToken = newColorToken;
        }
      }
    };

    // 响应窗口大小
    const handleResize = () => {
      const width = container.clientWidth, height = container.clientHeight;
      const aspect = width / Math.max(height, 1);
      const verticalSize = 8;
      camera.left = -verticalSize * aspect;
      camera.right = verticalSize * aspect;
      camera.top = verticalSize;
      camera.bottom = -verticalSize;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labelRenderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // 动画循环
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // 点击交互
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (event) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(selectables.current);
      if (hits.length) {
        const plotNumber = hits[0].object.userData.plotNumber;
        if (plotNumber && onPlotClick) onPlotClick(plotNumber);
      }
    };
    container.addEventListener('click', onClick);

    // 暴露更新函数供外部调用
    window.__updateThreeFarm = updateFields;

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', onClick);
      if (frameId) cancelAnimationFrame(frameId);
      renderer.dispose();
      labelRenderer.domElement.remove();
      renderer.domElement.remove();
      scene.clear();
    };
  }, []); // 仅初始化一次

  // 当 fieldsData 变化时，调用更新函数
  useEffect(() => {
    if (window.__updateThreeFarm) window.__updateThreeFarm(fieldsData);
  }, [fieldsData]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
};

export default ThreeFarmGrid;