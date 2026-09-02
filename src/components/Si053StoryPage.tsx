import { useEffect, useRef, useState } from 'react';

type StoryStep = {
  eyebrow: string;
  title: string;
  body: string[];
  callout: string;
};

type LayerKey = 'tumor' | 'cavity' | 'bbb' | 'needle';
type LayerTransform = { x: number; y: number; scale: number; rotation: number };
type Calibration = Record<LayerKey, LayerTransform>;
type InteractionMode = 'move' | 'scale' | 'rotate';

interface Props {
  onOpenCommercial: () => void;
  onOpenDevelopment: () => void;
}

const steps: StoryStep[] = [
  {
    eyebrow: 'THE CLINICAL IDEA',
    title: 'Treat the place where brain tumor surgery ends.',
    body: [
      'Surgery removes the visible tumor. Infiltrating glioblastoma cells may remain in the tissue surrounding the resection site.',
      'SI-053 is being developed for that postoperative space: a local treatment placed directly into the cavity after resection.',
    ],
    callout: 'Treat the resection margin directly',
  },
  {
    eyebrow: 'AFTER RESECTION',
    title: 'The tumor is removed. The local risk is not.',
    body: [
      'The postoperative cavity marks where the visible mass was removed. Its surrounding margin is also where residual, infiltrating cells may remain.',
      'That makes the cavity a defined, clinically natural site for local treatment.',
    ],
    callout: 'A defined postoperative target',
  },
  {
    eyebrow: 'WHY LOCAL DELIVERY',
    title: 'Systemic therapy still has to cross the blood–brain barrier.',
    body: [
      'The blood–brain barrier limits the passage of many circulating therapies into brain tissue, complicating efforts to achieve high exposure at the tumor margin.',
      'Local administration changes the delivery problem: the therapy starts at the surgical site.',
    ],
    callout: 'Reduce dependence on systemic delivery',
  },
  {
    eyebrow: 'THE SI-053 CONCEPT',
    title: 'SI-053 places temozolomide directly into the cavity.',
    body: [
      'SI-053 is a temozolomide and dextran phosphate hydrogel designed for intracavitary administration immediately after tumor resection.',
      'The drug is positioned where residual tumor cells may remain, within the same surgical procedure.',
    ],
    callout: 'Local administration in the operating room',
  },
  {
    eyebrow: 'LOCAL EXPOSURE',
    title: 'Designed to release temozolomide locally over time.',
    body: [
      'The objective is sustained local exposure at and around the cavity margin, without increasing systemic exposure to achieve the same local concentration.',
      'Delivery, anatomy and recurrence biology are addressed in one local intervention.',
    ],
    callout: 'Sustained exposure at the surgical margin',
  },
  {
    eyebrow: 'CARE PATHWAY',
    title: 'One surgery. One local administration.',
    body: [
      'The intended pathway is deliberately simple: tumor resection, local SI-053 administration, then continuation of the patient’s broader standard treatment pathway.',
      'No separate device platform or chronic administration infrastructure is built into the concept.',
    ],
    callout: 'Designed around the existing surgical workflow',
  },
  {
    eyebrow: 'FROM THERAPY TO OPPORTUNITY',
    title: 'From local treatment to global opportunity.',
    body: [
      'Glioblastoma is the lead indication. The same intracavitary concept could extend to resected brain metastases and other primary brain tumors.',
      'Now explore how patient opportunity, market access, pricing, development costs and risk shape the modeled value of SI-053.',
    ],
    callout: 'The treatment story becomes the commercial model',
  },
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};

const getStoryPosition = (progress: number) => {
  const lastIndex = steps.length - 1;
  if (progress >= 1) return lastIndex;
  const raw = clamp(progress) * lastIndex;
  const chapter = Math.min(lastIndex - 1, Math.floor(raw));
  const chapterProgress = raw - chapter;

  // Let each chapter settle before the next cross-fade begins.
  return chapter + smooth(0.42, 0.92, chapterProgress);
};

const runtimeAssetBase = () =>
  (window as Window & { __SI053_ASSET_ROOT__?: string }).__SI053_ASSET_ROOT__ ?? import.meta.env.BASE_URL;

const storyAsset = (filename: string) =>
  `${runtimeAssetBase()}story/${encodeURIComponent(filename)}`;

const storyAssets = {
  brain: storyAsset('brain.webp'),
  tumor: storyAsset('tumor.webp'),
  cavity: storyAsset('cavity.webp'),
  bbb: storyAsset('bbb.webp'),
  needle: storyAsset('needle-gel.webp'),
  pathway: storyAsset('care-pathway.webp'),
  platform: storyAsset('platform-opportunity.webp'),
};

const layerKeys: LayerKey[] = ['tumor', 'cavity', 'bbb', 'needle'];
const layerLabels: Record<LayerKey, string> = {
  tumor: 'Tumor',
  cavity: 'Cavity',
  bbb: 'BBB outline',
  needle: 'Needle + gel',
};

const defaultCalibration: Calibration = {
  tumor: { x: 0, y: 0, scale: 1, rotation: 0 },
  cavity: { x: 0, y: 0, scale: 1, rotation: 0 },
  bbb: { x: 0, y: 0, scale: 1, rotation: 0 },
  needle: { x: 0, y: 0, scale: 1, rotation: 0 },
};

const cloneCalibration = (source: Calibration): Calibration => ({
  tumor: { ...source.tumor },
  cavity: { ...source.cavity },
  bbb: { ...source.bbb },
  needle: { ...source.needle },
});

const normalizeRotation = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  let normalized = value % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return normalized;
};

const normalizeTransform = (value: Partial<LayerTransform> | undefined): LayerTransform => ({
  x: Math.max(-60, Math.min(60, Number(value?.x) || 0)),
  y: Math.max(-60, Math.min(60, Number(value?.y) || 0)),
  scale: Math.max(0.2, Math.min(2.5, Number(value?.scale) || 1)),
  rotation: normalizeRotation(Number(value?.rotation) || 0),
});

const normalizeCalibration = (value: Partial<Record<LayerKey, Partial<LayerTransform>>> | undefined): Calibration => ({
  tumor: normalizeTransform(value?.tumor),
  cavity: normalizeTransform(value?.cavity),
  bbb: normalizeTransform(value?.bbb),
  needle: normalizeTransform(value?.needle),
});

const encodeCalibration = (value: Calibration) => {
  const raw = window.btoa(JSON.stringify(value));
  return raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const decodeCalibration = (raw: string | null): Calibration | null => {
  if (!raw) return null;
  try {
    const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return normalizeCalibration(JSON.parse(window.atob(padded)));
  } catch {
    return null;
  }
};

const readInitialCalibration = (): Calibration => {
  if (typeof window === 'undefined') return cloneCalibration(defaultCalibration);
  const params = new URLSearchParams(window.location.search);
  const fromUrl = decodeCalibration(params.get('storyCal'));
  if (fromUrl) return fromUrl;
  try {
    const stored = window.localStorage.getItem('si053-story-calibration-v1');
    if (stored) return normalizeCalibration(JSON.parse(stored));
  } catch {
    // Local storage is optional; the editor still works without it.
  }
  return cloneCalibration(defaultCalibration);
};

const layerTransformStyle = (value: LayerTransform) =>
  `translate(${value.x}%, ${value.y}%) rotate(${value.rotation}deg) scale(${value.scale})`;

function ContinuousVisual({
  position,
  calibration,
  editMode,
  selectedLayer,
  onCalibrationChange,
}: {
  position: number;
  calibration: Calibration;
  editMode: boolean;
  selectedLayer: LayerKey;
  onCalibrationChange: (key: LayerKey, value: LayerTransform) => void;
}) {
  const interactionRef = useRef<{
    mode: InteractionMode;
    key: LayerKey;
    pointerId: number;
    clientX: number;
    clientY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    startDistance: number;
    startAngle: number;
    start: LayerTransform;
  } | null>(null);

  const tumorOut = smooth(0.18, 0.92, position);
  const cavityAfterResection = smooth(0.28, 0.92, position) * (1 - smooth(1.34, 1.82, position));
  const bbbOpacity = smooth(1.42, 1.92, position) * (1 - smooth(2.42, 2.92, position));
  const cavityDuringTreatment = smooth(2.48, 2.96, position) * (1 - smooth(4.48, 4.96, position));
  const needleOpacity = smooth(2.58, 3.06, position) * (1 - smooth(4.5, 4.98, position));
  const pathwayIn = smooth(4.56, 5.0, position);
  const platformIn = smooth(5.54, 5.98, position);

  const brainOpacity = editMode ? 1 : 1 - pathwayIn;
  const normalCavityOpacity = Math.min(1, cavityAfterResection + cavityDuringTreatment) * brainOpacity;
  const normalTumorOpacity = (1 - tumorOut) * brainOpacity;
  const normalOutlineOpacity = bbbOpacity * brainOpacity;
  const normalTreatmentOpacity = needleOpacity * brainOpacity;

  const editorOpacity: Record<LayerKey, number> = {
    tumor: selectedLayer === 'tumor' ? 1 : selectedLayer === 'cavity' ? 0.22 : 0,
    cavity: selectedLayer === 'cavity' ? 1 : selectedLayer === 'tumor' ? 0.22 : selectedLayer === 'needle' ? 0.55 : 0,
    bbb: selectedLayer === 'bbb' ? 1 : 0,
    needle: selectedLayer === 'needle' ? 1 : 0,
  };

  const opacityFor = (key: LayerKey) => {
    if (editMode) return editorOpacity[key];
    if (key === 'tumor') return normalTumorOpacity;
    if (key === 'cavity') return normalCavityOpacity;
    if (key === 'bbb') return normalOutlineOpacity;
    return normalTreatmentOpacity;
  };

  const beginInteraction = (
    event: React.PointerEvent<HTMLElement>,
    key: LayerKey,
    mode: InteractionMode,
  ) => {
    if (!editMode || key !== selectedLayer) return;
    const stackElement = event.currentTarget.closest('.si-story-stack') as HTMLElement | null;
    const stack = stackElement?.getBoundingClientRect();
    if (!stack) return;
    const start = { ...calibration[key] };
    const centerX = stack.left + stack.width / 2 + (start.x / 100) * stack.width;
    const centerY = stack.top + stack.height / 2 + (start.y / 100) * stack.height;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    interactionRef.current = {
      mode,
      key,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      width: Math.max(stack.width, 1),
      height: Math.max(stack.height, 1),
      centerX,
      centerY,
      startDistance: Math.max(Math.hypot(dx, dy), 1),
      startAngle: Math.atan2(dy, dx) * (180 / Math.PI),
      start,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const moveInteraction = (event: React.PointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    const { start } = interaction;

    if (interaction.mode === 'move') {
      const x = start.x + ((event.clientX - interaction.clientX) / interaction.width) * 100;
      const y = start.y + ((event.clientY - interaction.clientY) / interaction.height) * 100;
      onCalibrationChange(interaction.key, normalizeTransform({ ...start, x, y }));
      return;
    }

    const dx = event.clientX - interaction.centerX;
    const dy = event.clientY - interaction.centerY;

    if (interaction.mode === 'scale') {
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const scale = start.scale * (distance / interaction.startDistance);
      onCalibrationChange(interaction.key, normalizeTransform({ ...start, scale }));
      return;
    }

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const rotation = start.rotation + (angle - interaction.startAngle);
    onCalibrationChange(interaction.key, normalizeTransform({ ...start, rotation }));
  };

  const endInteraction = (event: React.PointerEvent<HTMLElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    interactionRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const renderLayer = (key: LayerKey, src: string, className: string) => (
    <img
      src={src}
      alt=""
      decoding="async"
      draggable={false}
      className={`si-story-layer ${className}${editMode && selectedLayer === key ? ' is-calibration-selected' : ''}`}
      style={{
        opacity: opacityFor(key),
        transform: layerTransformStyle(calibration[key]),
        pointerEvents: editMode && selectedLayer === key ? 'auto' : 'none',
      }}
      onPointerDown={(event) => beginInteraction(event, key, 'move')}
      onPointerMove={moveInteraction}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
    />
  );

  const selectedTransform = calibration[selectedLayer];

  return (
    <div className="si-cinema-visual-shell">
      <div className="si-cinema-ambient" />

      <div className={`si-story-stack${editMode ? ' is-calibrating' : ''}`}>
        <img
          src={storyAssets.brain}
          alt=""
          decoding="async"
          fetchPriority="high"
          draggable={false}
          className="si-story-layer si-story-layer-brain"
          style={{ opacity: brainOpacity }}
        />
        {renderLayer('cavity', storyAssets.cavity, 'si-story-layer-cavity')}
        {renderLayer('tumor', storyAssets.tumor, 'si-story-layer-tumor')}
        {renderLayer('bbb', storyAssets.bbb, 'si-story-layer-bbb')}
        {renderLayer('needle', storyAssets.needle, 'si-story-layer-needle')}

        {editMode && (
          <div
            className="si-story-transform-box"
            style={{ transform: layerTransformStyle(selectedTransform) }}
            aria-hidden="true"
          >
            <button
              type="button"
              className="si-story-transform-handle si-story-transform-handle-rotate"
              title="Drag to rotate"
              aria-label="Rotate selected layer"
              onPointerDown={(event) => beginInteraction(event, selectedLayer, 'rotate')}
              onPointerMove={moveInteraction}
              onPointerUp={endInteraction}
              onPointerCancel={endInteraction}
            >
              ↻
            </button>
            <button
              type="button"
              className="si-story-transform-handle si-story-transform-handle-resize"
              title="Drag to resize"
              aria-label="Resize selected layer"
              onPointerDown={(event) => beginInteraction(event, selectedLayer, 'scale')}
              onPointerMove={moveInteraction}
              onPointerUp={endInteraction}
              onPointerCancel={endInteraction}
            />
          </div>
        )}
      </div>

      <img
        src={storyAssets.pathway}
        alt=""
        decoding="async"
        draggable={false}
        className="si-story-standalone si-story-pathway"
        style={{ opacity: editMode ? 0 : pathwayIn * (1 - platformIn) }}
      />

      <img
        src={storyAssets.platform}
        alt=""
        decoding="async"
        draggable={false}
        className="si-story-standalone si-story-platform"
        style={{ opacity: editMode ? 0 : platformIn }}
      />
    </div>
  );
}

export function Si053StoryPage({ onOpenCommercial, onOpenDevelopment }: Props) {
  const trackRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [editMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('storyEdit') === '1';
  });
  const [selectedLayer, setSelectedLayer] = useState<LayerKey>('tumor');
  const [calibration, setCalibration] = useState<Calibration>(() =>
    editMode ? readInitialCalibration() : cloneCalibration(defaultCalibration),
  );
  const [copyStatus, setCopyStatus] = useState('');

  const updateLayer = (key: LayerKey, value: LayerTransform) => {
    setCalibration((current) => ({ ...current, [key]: normalizeTransform(value) }));
  };

  useEffect(() => {
    Object.values(storyAssets).forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    if (!editMode || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('si053-story-calibration-v1', JSON.stringify(calibration));
    } catch {
      // The URL remains the source of truth if storage is unavailable.
    }
    const url = new URL(window.location.href);
    url.searchParams.set('storyEdit', '1');
    url.searchParams.set('storyCal', encodeCalibration(calibration));
    window.history.replaceState(null, '', url.toString());
  }, [calibration, editMode]);

  useEffect(() => {
    if (!editMode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const current = calibration[selectedLayer];
      const nudge = event.shiftKey ? 1 : 0.2;
      let next: LayerTransform | null = null;
      if (event.key === 'ArrowLeft') next = { ...current, x: current.x - nudge };
      if (event.key === 'ArrowRight') next = { ...current, x: current.x + nudge };
      if (event.key === 'ArrowUp') next = { ...current, y: current.y - nudge };
      if (event.key === 'ArrowDown') next = { ...current, y: current.y + nudge };
      if (event.key === '[') next = { ...current, scale: current.scale - 0.01 };
      if (event.key === ']') next = { ...current, scale: current.scale + 0.01 };
      if (event.key === ',') next = { ...current, rotation: current.rotation - (event.shiftKey ? 5 : 1) };
      if (event.key === '.') next = { ...current, rotation: current.rotation + (event.shiftKey ? 5 : 1) };
      if (!next) return;
      event.preventDefault();
      updateLayer(selectedLayer, next);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calibration, editMode, selectedLayer]);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const viewport = window.innerHeight;
      const scrollable = Math.max(track.offsetHeight - viewport, 1);
      setProgress(clamp(-rect.top / scrollable));
    };
    const requestUpdate = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const position = getStoryPosition(progress);
  const activeIndex = Math.min(steps.length - 1, Math.max(0, Math.round(position)));
  const selectedTransform = calibration[selectedLayer];

  const copyCalibrationLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('Calibration link copied. Send me that link and I can bake the values into the site.');
    } catch {
      setCopyStatus('Copy was blocked by the browser. Copy the current URL from the address bar instead.');
    }
  };

  const exitEditor = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('storyEdit');
    url.searchParams.delete('storyCal');
    window.location.assign(url.toString());
  };

  return (
    <section ref={trackRef} className="si-cinema-track">
      <div className={`si-cinema-stage${editMode ? ' si-calibration-mode' : ''}`}>
        <div className="si-cinema-visual" aria-hidden={!editMode}>
          <ContinuousVisual
            position={position}
            calibration={calibration}
            editMode={editMode}
            selectedLayer={selectedLayer}
            onCalibrationChange={updateLayer}
          />
        </div>

        <div className="si-cinema-copy" aria-live="polite">
          {steps.map((step, index) => {
            const distance = Math.abs(position - index);
            const opacity = 1 - smooth(0.1, 0.72, distance);
            const offset = Math.max(-28, Math.min(28, (index - position) * 28));
            const isActive = index === activeIndex;
            return (
              <article
                key={step.title}
                className={`si-cinema-copy-step${index === steps.length - 1 ? ' is-final-step' : ''}`}
                style={{
                  opacity,
                  transform: `translate3d(0, ${offset}px, 0)`,
                  pointerEvents: opacity > 0.55 && !editMode ? 'auto' : 'none',
                }}
                aria-hidden={!isActive}
              >
                <span className="si-cinema-eyebrow">{step.eyebrow}</span>
                <h1>{step.title}</h1>
                {step.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <div className="si-cinema-callout"><span />{step.callout}</div>
                {index === steps.length - 1 && (
                  <div className="si-cinema-model-bridge">
                    <span>Continue into the strategic model</span>
                    <div className="si-cinema-actions">
                      <button className="primary-button" onClick={onOpenCommercial}>Open commercial & valuation</button>
                      <button className="secondary-button" onClick={onOpenDevelopment}>Review development & cash</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {editMode && (
          <aside className="si-story-calibrator" aria-label="Story asset alignment editor">
            <div className="si-story-calibrator-head">
              <div>
                <strong>Story alignment</strong>
                <span>Drag, resize and rotate overlays on the master brain</span>
              </div>
              <button type="button" onClick={exitEditor}>Exit</button>
            </div>

            <div className="si-story-calibrator-tabs" role="tablist" aria-label="Layer to align">
              {layerKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={selectedLayer === key ? 'active' : ''}
                  onClick={() => setSelectedLayer(key)}
                >
                  {layerLabels[key]}
                </button>
              ))}
            </div>

            <p className="si-story-calibrator-help">
              Drag the layer to move. Drag the corner handle to resize and the top handle to rotate. Arrow keys nudge; [ ] resize; , . rotate.
            </p>

            <div className="si-story-calibrator-values si-story-calibrator-values-four">
              <label>
                X
                <input
                  type="number"
                  step="0.1"
                  value={Number(selectedTransform.x.toFixed(2))}
                  onChange={(event) => updateLayer(selectedLayer, { ...selectedTransform, x: Number(event.target.value) })}
                />
                <span>%</span>
              </label>
              <label>
                Y
                <input
                  type="number"
                  step="0.1"
                  value={Number(selectedTransform.y.toFixed(2))}
                  onChange={(event) => updateLayer(selectedLayer, { ...selectedTransform, y: Number(event.target.value) })}
                />
                <span>%</span>
              </label>
              <label>
                Scale
                <input
                  type="number"
                  min="0.2"
                  max="2.5"
                  step="0.01"
                  value={Number(selectedTransform.scale.toFixed(3))}
                  onChange={(event) => updateLayer(selectedLayer, { ...selectedTransform, scale: Number(event.target.value) })}
                />
              </label>
              <label>
                Rotate
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="0.5"
                  value={Number(selectedTransform.rotation.toFixed(2))}
                  onChange={(event) => updateLayer(selectedLayer, { ...selectedTransform, rotation: Number(event.target.value) })}
                />
                <span>°</span>
              </label>
            </div>

            <label className="si-story-calibrator-scale">
              <span>Resize selected layer</span>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.005"
                value={selectedTransform.scale}
                onChange={(event) => updateLayer(selectedLayer, { ...selectedTransform, scale: Number(event.target.value) })}
              />
            </label>

            <label className="si-story-calibrator-scale">
              <span>Rotate selected layer</span>
              <input
                type="range"
                min="-180"
                max="180"
                step="0.25"
                value={selectedTransform.rotation}
                onChange={(event) => updateLayer(selectedLayer, { ...selectedTransform, rotation: Number(event.target.value) })}
              />
            </label>

            <div className="si-story-calibrator-actions">
              <button
                type="button"
                onClick={() => updateLayer(selectedLayer, { ...defaultCalibration[selectedLayer] })}
              >
                Reset layer
              </button>
              <button
                type="button"
                onClick={() => setCalibration(cloneCalibration(defaultCalibration))}
              >
                Reset all
              </button>
              <button type="button" className="primary" onClick={copyCalibrationLink}>Copy calibration link</button>
            </div>
            <small>{copyStatus || 'Your values are saved in this browser and encoded into the page URL automatically.'}</small>
          </aside>
        )}

        {!editMode && (
          <div className="si-cinema-ui" aria-hidden="true">
            <div className="si-cinema-count">
              <strong>{String(activeIndex + 1).padStart(2, '0')}</strong>
              <span>/ {String(steps.length).padStart(2, '0')}</span>
            </div>
            <div className="si-cinema-progress"><i style={{ transform: `scaleX(${progress})` }} /></div>
            <div className="si-cinema-dots">
              {steps.map((_, index) => <b key={index} className={index === activeIndex ? 'active' : ''} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
