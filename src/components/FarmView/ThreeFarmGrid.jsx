// src/components/FarmView/ThreeFarmGrid.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// ==================== 项目一的完整常量 ====================
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
const COLUMN_MODEL_PATH = '/assets/column-outlined.glb';

// 颜色常量（从项目一精确复制）
const COLUMN_FILL_COLORS = {
  blue: '#0076d9',
  green: '#009b4e',
  yellow: '#d59a00',
  orange: '#e9691d',
  red: '#d92c1f',
};
const COLUMN_EMISSIVE_COLORS = {
  blue: '#10a9ff',
  green: '#23d36b',
  yellow: '#ffc928',
  orange: '#ff8a2b',
  red: '#ff5038',
};
const COLUMN_OUTLINE_COLORS = {
  blue: '#aee6ff',
  green: '#a9f5c8',
  yellow: '#ffdf66',
  orange: '#ffbf7a',
  red: '#ffad9f',
};
const COLUMN_RIM_COLORS = {
  blue: '#004b94',
  green: '#075f35',
  yellow: '#7a5400',
  orange: '#8a340d',
  red: '#8b160f',
};

// ==================== 项目一的映射函数 ====================
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
  const heightValue = getHeightValue(moisture);
  return COLUMN_MIN_HEIGHT + (heightValue / 100) * COLUMN_HEIGHT_RANGE;
}

// ==================== 项目一的几何辅助函数 ====================
function createRoundedBox(width, height, depth) {
  return new THREE.BoxGeometry(width, height, depth, 5, 1, 5);
}

// ==================== 项目一的装饰层 ====================
function buildColumnOverlay(width, height, depth, colorToken) {
  const group = new THREE.Group();
  const fillColor = COLUMN_FILL_COLORS[colorToken];
  const outlineColor = COLUMN_OUTLINE_COLORS[colorToken];
  const glowColor = COLUMN_EMISSIVE_COLORS[colorToken];
  const rimColor = COLUMN_RIM_COLORS[colorToken];

  const shell = new THREE.Mesh(
    createRoundedBox(width * 0.92, height * 0.98, depth * 0.92),
    new THREE.MeshPhysicalMaterial({
      color: fillColor,
      emissive: glowColor,
      emissiveIntensity: 0.05,
      metalness: 0,
      opacity: 0.86,
      roughness: 0.76,
      transparent: true,
    })
  );
  shell.renderOrder = 2;

  const edgePoints = [
    new THREE.Vector3(-width / 2, height / 2, -depth / 2),
    new THREE.Vector3( width / 2, height / 2, -depth / 2),
    new THREE.Vector3( width / 2, height / 2, -depth / 2),
    new THREE.Vector3( width / 2, height / 2,  depth / 2),
    new THREE.Vector3( width / 2, height / 2,  depth / 2),
    new THREE.Vector3(-width / 2, height / 2,  depth / 2),
    new THREE.Vector3(-width / 2, height / 2,  depth / 2),
    new THREE.Vector3(-width / 2, height / 2, -depth / 2),
    new THREE.Vector3(-width / 2, -height / 2, -depth / 2),
    new THREE.Vector3(-width / 2,  height / 2, -depth / 2),
    new THREE.Vector3( width / 2, -height / 2, -depth / 2),
    new THREE.Vector3( width / 2,  height / 2, -depth / 2),
    new THREE.Vector3( width / 2, -height / 2,  depth / 2),
    new THREE.Vector3( width / 2,  height / 2,  depth / 2),
    new THREE.Vector3(-width / 2, -height / 2,  depth / 2),
    new THREE.Vector3(-width / 2,  height / 2,  depth / 2),
  ];
  const edges = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(edgePoints),
    new THREE.LineBasicMaterial({ color: rimColor, transparent: true, opacity: 0.38, depthWrite: false })
  );
  edges.renderOrder = 4;

  const highlightPoints = [
    new THREE.Vector3(-width / 2 + 0.04, height / 2 + 0.006, -depth / 2),
    new THREE.Vector3( width / 2 - 0.04, height / 2 + 0.006, -depth / 2),
    new THREE.Vector3(-width / 2, -height / 2 + 0.08, -depth / 2 - 0.02),
    new THREE.Vector3(-width / 2,  height / 2 - 0.04, -depth / 2 - 0.02),
  ];
  const highlights = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(highlightPoints),
    new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.58, depthWrite: false })
  );
  highlights.renderOrder = 5;

  const sideShade = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.92, height * 0.94),
    new THREE.MeshBasicMaterial({ color: rimColor, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
  );
  sideShade.position.z = depth / 2 + 0.006;
  sideShade.renderOrder = 3;

  const faceLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -height / 2 + 0.08, -depth / 2 - 0.018),
    new THREE.Vector3(0,  height / 2 - 0.08, -depth / 2 - 0.018),
    new THREE.Vector3(0, -height / 2 + 0.08,  depth / 2 + 0.018),
    new THREE.Vector3(0,  height / 2 - 0.08,  depth / 2 + 0.018),
    new THREE.Vector3(-width / 2 - 0.018, -height / 2 + 0.08, 0),
    new THREE.Vector3(-width / 2 - 0.018,  height / 2 - 0.08, 0),
    new THREE.Vector3( width / 2 + 0.018, -height / 2 + 0.08, 0),
    new THREE.Vector3( width / 2 + 0.018,  height / 2 - 0.08, 0),
  ]);
  const faceLines = new THREE.LineSegments(faceLineGeometry, new THREE.LineBasicMaterial({ color: outlineColor, transparent: true, opacity: 0.16 }));
  faceLines.renderOrder = 5;

  const topSheen = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.78, depth * 0.78),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, side: THREE.DoubleSide })
  );
  topSheen.rotation.x = -Math.PI / 2;
  topSheen.position.y = height / 2 + 0.012;
  topSheen.renderOrder = 3;

  const baseGlow = new THREE.Mesh(
    new THREE.TorusGeometry(Math.min(width, depth) * 0.48, 0.026, 8, 52),
    new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.08 })
  );
  baseGlow.rotation.x = Math.PI / 2;
  baseGlow.position.y = -height / 2 + 0.045;
  baseGlow.renderOrder = 1;

  group.add(baseGlow, shell, sideShade, edges, faceLines, highlights, topSheen);
  return group;
}

// ==================== 项目一的模型材质定制 ====================
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

// ==================== 坐标计算 ====================
function getWorldPosition(row, col) {
  const offsetX = (row - GRID_CENTER_ROW) * BLOCK_ROW_OFFSET_X;
  const x = (col - GRID_CENTER_COL) * BLOCK_SPACING_X + offsetX + GRID_OFFSET_X;
  const z = (row - GRID_CENTER_ROW) * BLOCK_SPACING_Z + GRID_Z_OFFSET + GRID_OFFSET_Z;
  return { x, z };
}

// ==================== 主组件 ====================
const ThreeFarmGrid = ({ fieldsData, onPlotClick }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const labelRendererRef = useRef(null);
  const cameraRef = useRef(null);
  const columnsMapRef = useRef(new Map());
  const modelTemplateRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  const getMoisture = (plotNumber) => {
    const field = fieldsData.find(f => f.fieldId === plotNumber.toString());
    return field ? field.currentMoisture : 50;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera();
    camera.position.set(8, 6, 12);
    camera.lookAt(0, 0, 4.3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // 光照（与项目一完全一致）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(10, 20, 8);
    const fillLight = new THREE.DirectionalLight(0xb8d4ff, 0.7);
    fillLight.position.set(-8, 8, -10);
    scene.add(ambientLight, sunLight, fillLight);

    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.3, color: 0x000000, transparent: true, side: THREE.DoubleSide })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.2;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
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

    const loader = new GLTFLoader();
    loader.load(COLUMN_MODEL_PATH, (gltf) => {
      modelTemplateRef.current = gltf.scene.clone(true);
      buildColumns();
      setLoaded(true);
    }, undefined, () => {
      buildColumns();
      setLoaded(true);
    });

    const buildColumns = () => {
      columnsMapRef.current.forEach((item) => {
        scene.remove(item.group);
        scene.remove(item.ground);
        scene.remove(item.label);
        scene.remove(item.hitArea);
      });
      columnsMapRef.current.clear();

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const plotNumber = row * 4 + col + 1;
          const moisture = getMoisture(plotNumber);
          const risk = getRiskLevel(moisture);
          const colorToken = getColorToken(moisture, risk);
          const columnHeight = getColumnHeight(moisture);
          const { x, z } = getWorldPosition(row, col);

          const ground = new THREE.Mesh(
            new THREE.BoxGeometry(BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_DEPTH),
            new THREE.MeshStandardMaterial({ color: '#a5d6a5', roughness: 0.9, transparent: true, opacity: 0.4 })
          );
          ground.position.set(x, PLATFORM_TOP_Y + BLOCK_HEIGHT / 2, z);
          ground.receiveShadow = true;
          scene.add(ground);

          const group = new THREE.Group();
          group.position.set(x, PLATFORM_TOP_Y + BLOCK_HEIGHT / 2 + columnHeight / 2, z);

          if (modelTemplateRef.current) {
            const model = modelTemplateRef.current.clone(true);
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const scaleX = COLUMN_MODEL_WIDTH / size.x;
            const scaleY = (columnHeight * COLUMN_HEIGHT_SCALE) / size.y;
            const scaleZ = COLUMN_MODEL_DEPTH / size.z;
            model.scale.set(scaleX, scaleY, scaleZ);
            model.position.y = -columnHeight / 2;
            customizeColumnModel(model, colorToken);
            group.add(model);
          }
          const overlay = buildColumnOverlay(COLUMN_MODEL_WIDTH, columnHeight * COLUMN_HEIGHT_SCALE, COLUMN_MODEL_DEPTH, colorToken);
          group.add(overlay);
          scene.add(group);

          const div = document.createElement('div');
          div.className = 'farm3d-label';
          const strong = document.createElement('strong');
          strong.textContent = plotNumber.toString();
          const span = document.createElement('span');
          span.textContent = `${Math.round(moisture)}%`;
          div.appendChild(strong);
          div.appendChild(span);
          const label = new CSS2DObject(div);
          label.position.set(x, group.position.y + columnHeight * 0.22, z + 0.52);
          scene.add(label);

          const hitArea = new THREE.Mesh(
            new THREE.BoxGeometry(COLUMN_MODEL_WIDTH, columnHeight + 0.8, COLUMN_MODEL_DEPTH),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
          );
          hitArea.position.set(x, group.position.y, z);
          hitArea.userData = { plotNumber };
          scene.add(hitArea);

          columnsMapRef.current.set(plotNumber, { group, ground, label, hitArea, columnHeight, colorToken });
        }
      }
    };

    let frameId = null;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        labelRendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (event) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Array.from(columnsMapRef.current.values()).map(v => v.hitArea));
      if (hits.length > 0) {
        const plotNumber = hits[0].object.userData.plotNumber;
        if (plotNumber && onPlotClick) onPlotClick(plotNumber);
      }
    };
    container.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', onClick);
      if (frameId) cancelAnimationFrame(frameId);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.domElement.remove();
      }
      if (labelRendererRef.current) {
        labelRendererRef.current.domElement.remove();
      }
      if (sceneRef.current) sceneRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !loaded) return;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const plotNumber = row * 4 + col + 1;
        const moisture = getMoisture(plotNumber);
        const risk = getRiskLevel(moisture);
        const newColorToken = getColorToken(moisture, risk);
        const newHeight = getColumnHeight(moisture);
        const visual = columnsMapRef.current.get(plotNumber);
        if (!visual) continue;

        const { group, ground, label, hitArea, columnHeight: oldHeight, colorToken: oldToken } = visual;

        label.element.querySelector('span').textContent = `${Math.round(moisture)}%`;

        if (Math.abs(newHeight - oldHeight) > 0.01 || newColorToken !== oldToken) {
          while (group.children.length > 0) group.remove(group.children[0]);
          if (modelTemplateRef.current) {
            const model = modelTemplateRef.current.clone(true);
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const scaleX = COLUMN_MODEL_WIDTH / size.x;
            const scaleY = (newHeight * COLUMN_HEIGHT_SCALE) / size.y;
            const scaleZ = COLUMN_MODEL_DEPTH / size.z;
            model.scale.set(scaleX, scaleY, scaleZ);
            model.position.y = -newHeight / 2;
            customizeColumnModel(model, newColorToken);
            group.add(model);
          }
          const overlay = buildColumnOverlay(COLUMN_MODEL_WIDTH, newHeight * COLUMN_HEIGHT_SCALE, COLUMN_MODEL_DEPTH, newColorToken);
          group.add(overlay);
          group.position.y = PLATFORM_TOP_Y + BLOCK_HEIGHT / 2 + newHeight / 2;

          hitArea.scale.y = (newHeight + 0.8) / (oldHeight + 0.8);
          hitArea.position.y = group.position.y;
          label.position.y = group.position.y + newHeight * 0.22;

          visual.columnHeight = newHeight;
          visual.colorToken = newColorToken;
        }
      }
    }
  }, [fieldsData, loaded]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
};

export default ThreeFarmGrid;