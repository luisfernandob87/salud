import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Lightformer, useGLTF } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { getBodyZoneId, getBodyZoneDetail, abdomenRegion } from '../../utils/bodyZones';
import { bodyPartLabel } from '../../utils/entities';

// @react-three/fiber v8 crea un `new THREE.Clock()` interno, deprecado en three
// r183+, que imprime un warning en consola en cada montaje del Canvas. Se filtra
// solo ese aviso (benigno) sin silenciar el resto de warnings.
const CLOCK_DEPRECATION_WARN = 'Clock: This module has been deprecated. Please use THREE.Timer instead.';
{
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes(CLOCK_DEPRECATION_WARN)) return;
    originalWarn(...args);
  };
}

useGLTF.setDecoderPath('/draco/');
useGLTF.preload('/models/body.glb', true, false);

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const BASE = '#e8e0d5';
const HOVER = '#c9d6f5';
const SELECTED = '#3b82f6';
const SELECTED_EMISSIVE = '#1d4ed8';

const FOCUS_PRESETS = {
  cuerpo: { target: new THREE.Vector3(0, 0.85, 0), position: new THREE.Vector3(0, 0.95, 2.6) },
  cabeza: { target: new THREE.Vector3(0, 1.55, 0), position: new THREE.Vector3(0, 1.55, 1.25) },
  espalda: { target: new THREE.Vector3(0, 0.85, 0), position: new THREE.Vector3(0, 0.95, -2.6) },
  pies: { target: new THREE.Vector3(0, 0.06, 0), position: new THREE.Vector3(0, 0.06, 1.35) },
};

// Anima cámara y target de los controles hasta el preset elegido.
function FocusRig({ focus, controlsRef, onArrived }) {
  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls || !focus) return;
    const preset = FOCUS_PRESETS[focus];
    if (!preset) return;
    const t = Math.min(1, delta * 5);
    controls.target.lerp(preset.target, t);
    state.camera.position.lerp(preset.position, t);
    controls.update();
    if (
      controls.target.distanceTo(preset.target) < 0.02 &&
      state.camera.position.distanceTo(preset.position) < 0.02
    ) {
      onArrived();
    }
  });
  return null;
}

function mixColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

// El modelo se carga una sola vez; se agrupan sus mallas por zona y se fusionan
// en ~27 mallas (una por zona) para un render ligero en móvil y raycasts rápidos.
// En modo "Detalle" se clasifican ~70 zonas finas y se parten los triángulos del
// abdomen en regiones (epigastrio, mesogastrio, hipogastrio, hipocondrios...).
const zonesCache = { general: null, detail: null };

function addTo(groups, id, geometry) {
  if (!groups.has(id)) groups.set(id, []);
  groups.get(id).push(geometry);
}

// Parte una malla del abdomen en sub-geometrías según la región de cada triángulo.
function splitAbdomenGeometry(geometry) {
  const pos = geometry.attributes.position;
  const norm = geometry.attributes.normal;
  const index = geometry.index ? geometry.index.array : null;
  const triCount = index ? index.length / 3 : pos.count / 3;
  const buckets = new Map();
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const na = new THREE.Vector3();
  const nb = new THREE.Vector3();
  const nc = new THREE.Vector3();

  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index[t * 3] : t * 3;
    const i1 = index ? index[t * 3 + 1] : t * 3 + 1;
    const i2 = index ? index[t * 3 + 2] : t * 3 + 2;
    va.fromBufferAttribute(pos, i0);
    vb.fromBufferAttribute(pos, i1);
    vc.fromBufferAttribute(pos, i2);
    const cx = (va.x + vb.x + vc.x) / 3;
    const cy = (va.y + vb.y + vc.y) / 3;
    const id = abdomenRegion(cx, cy);
    let arr = buckets.get(id);
    if (!arr) {
      arr = { pos: [], norm: [] };
      buckets.set(id, arr);
    }
    if (norm) {
      na.fromBufferAttribute(norm, i0);
      nb.fromBufferAttribute(norm, i1);
      nc.fromBufferAttribute(norm, i2);
    } else {
      na.set(0, 0, 1);
      nb.set(0, 0, 1);
      nc.set(0, 0, 1);
    }
    for (const [v, nrm] of [
      [va, na],
      [vb, nb],
      [vc, nc],
    ]) {
      arr.pos.push(v.x, v.y, v.z);
      arr.norm.push(nrm.x, nrm.y, nrm.z);
    }
  }

  const out = [];
  for (const [id, arr] of buckets) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(arr.norm, 3));
    out.push([id, geo]);
  }
  return out;
}

function buildZones(scene, detail) {
  const key = detail ? 'detail' : 'general';
  if (zonesCache[key]) return zonesCache[key];
  const groups = new Map();
  const center = new THREE.Vector3();

  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    const g = obj.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    g.boundingBox.getCenter(center);
    const coarse = getBodyZoneId(obj.name, center.x, center.y, center.z);

    const gg = g.clone();
    for (const key of Object.keys(gg.attributes)) {
      if (key !== 'position' && key !== 'normal') gg.deleteAttribute(key);
    }
    // La geometría está en espacio mundial; se aplica la transformación del
    // nodo por si algún nodo no fuera identidad.
    gg.applyMatrix4(obj.matrixWorld);

    if (detail && coarse === 'abdomen') {
      for (const [subId, subGeo] of splitAbdomenGeometry(gg)) addTo(groups, subId, subGeo);
      gg.dispose();
      return;
    }
    const zone = detail ? getBodyZoneDetail(obj.name, center.x, center.y, center.z, coarse) || coarse : coarse;
    addTo(groups, zone, gg);
  });

  const zones = [];
  for (const [id, geoms] of groups) {
    const merged = mergeGeometries(geoms, false);
    if (!merged) continue;
    merged.computeBoundingSphere();
    merged.computeBoundsTree();
    zones.push({ id, geometry: merged });
    geoms.forEach((g) => g.dispose());
  }
  zones.sort((a, b) => a.id.localeCompare(b.id));
  zonesCache[key] = zones;
  return zonesCache[key];
}

function Zone({ zone, selected, hovered, onToggle, onHover, onLeave }) {
  const isHovered = hovered === zone.id;
  const color = selected
    ? isHovered
      ? mixColor(SELECTED, '#ffffff', 0.18)
      : SELECTED
    : isHovered
      ? HOVER
      : BASE;
  return (
    <mesh
      geometry={zone.geometry}
      userData={{ zone: zone.id }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(zone.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onLeave(zone.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 5) return;
        onToggle(zone.id);
      }}
    >
      <meshStandardMaterial
        color={color}
        emissive={selected ? SELECTED_EMISSIVE : '#000000'}
        emissiveIntensity={selected ? 0.35 : 0}
        roughness={0.55}
        metalness={0.02}
      />
    </mesh>
  );
}

export default function Body3D({ value = [], onChange, height = 360 }) {
  const { scene } = useGLTF('/models/body.glb', true, false);
  const [mode, setMode] = useState('general');
  const [focus, setFocus] = useState(null);
  const controlsRef = useRef(null);
  const zones = useMemo(() => buildZones(scene, mode === 'detail'), [scene, mode]);
  const [hovered, setHovered] = useState(null);
  const selected = new Set(value);

  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id];
    onChange(next);
  };

  const label = hovered ? bodyPartLabel(hovered) : null;

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-sky-50 to-slate-100 border border-ink-100 overflow-hidden relative" style={{ height }}>
      <div className="absolute top-2.5 left-2.5 z-10 flex rounded-full bg-white/90 border border-ink-200 p-0.5 shadow-sm text-xs font-medium">
        {[
          { key: 'general', label: 'General' },
          { key: 'detail', label: 'Detalle' },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`px-3 py-1 rounded-full transition-colors ${
              mode === m.key ? 'bg-primary-500 text-white' : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.95, 2.6], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} />

        {zones.map((zone) => (
          <Zone
            key={zone.id}
            zone={zone}
            selected={selected.has(zone.id)}
            hovered={hovered}
            onToggle={toggle}
            onHover={setHovered}
            onLeave={(id) => setHovered((h) => (h === id ? null : h))}
          />
        ))}

        <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={3.4} blur={2.4} far={1.6} color="#334155" />

        <Environment frames={1} resolution={64}>
          <Lightformer intensity={1.3} position={[0, 3, 4]} scale={[6, 4, 1]} color="#e0f2fe" />
          <Lightformer intensity={0.7} position={[-4, 1.5, 1]} scale={[3, 3, 1]} color="#fef3c7" />
          <Lightformer intensity={0.5} position={[4, 2, 1]} scale={[3, 3, 1]} color="#fce7f3" />
        </Environment>

        <FocusRig focus={focus} controlsRef={controlsRef} onArrived={() => setFocus(null)} />

        <OrbitControls
          ref={controlsRef}
          target={[0, 0.85, 0]}
          enablePan
          enableDamping
          dampingFactor={0.08}
          minDistance={1.2}
          maxDistance={4}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI * 0.95}
        />
      </Canvas>

      <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 text-center max-w-[75%]">
        {label && <span className="text-xs font-semibold text-white bg-ink-800/85 rounded-full px-2.5 py-0.5">{label}</span>}
        <span className="text-[10px] text-ink-500 bg-white/80 rounded-full px-2 py-0.5">
          Toca para marcar · arrastra para mover y acercarte a la cabeza o los pies
        </span>
      </div>

      <div className="absolute top-12 right-2.5 z-10 flex flex-col gap-1">
        {Object.entries({
          cabeza: 'Cabeza',
          espalda: 'Espalda',
          pies: 'Pies',
          cuerpo: 'Cuerpo',
        }).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFocus(key === focus ? null : key)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border shadow-sm transition-colors ${
              focus === key
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white/85 text-ink-600 border-ink-200 hover:bg-primary-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="absolute top-2.5 right-2.5 bg-primary-500 text-white text-xs font-semibold rounded-full px-2.5 py-1 shadow-soft">
          {selected.size} {selected.size === 1 ? 'zona' : 'zonas'}
        </div>
      )}
    </div>
  );
}
