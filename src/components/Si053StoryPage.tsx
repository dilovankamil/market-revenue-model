import { useEffect, useRef, useState } from 'react';

type StoryStep = {
  eyebrow: string;
  title: string;
  body: string[];
  callout: string;
};

interface Props {
  onOpenCommercial: () => void;
  onOpenDevelopment: () => void;
}

const steps: StoryStep[] = [
  {
    eyebrow: 'SI-053 · THE CLINICAL IDEA',
    title: 'Treat the place where brain-tumor surgery ends.',
    body: [
      'Glioblastoma is highly infiltrative. Surgery removes the visible tumor, but microscopic disease may remain in tissue surrounding the resection site.',
      'SI-053 is being developed around that postoperative space: a local treatment placed directly into the cavity after resection.',
    ],
    callout: 'Residual disease risk at the resection margin',
  },
  {
    eyebrow: 'AFTER RESECTION',
    title: 'Surgery creates a defined cavity at the site of highest local concern.',
    body: [
      'Once the tumor mass is removed, the surgeon is left with a postoperative cavity and a surrounding margin where infiltrating tumor cells may remain.',
      'That cavity creates a direct, clinically natural treatment site.',
    ],
    callout: 'A defined postoperative treatment site',
  },
  {
    eyebrow: 'WHY LOCAL DELIVERY',
    title: 'Systemic therapy still has to reach the brain from the bloodstream.',
    body: [
      'The blood–brain barrier limits the passage of many circulating therapies into brain tissue and complicates efforts to achieve high exposure at the tumor margin.',
      'Local administration changes the delivery problem by placing therapy at the surgical site instead of relying only on systemic transport.',
    ],
    callout: 'Reduce dependence on systemic delivery across the BBB',
  },
  {
    eyebrow: 'THE SI-053 CONCEPT',
    title: 'SI-053 is placed directly into the post-resection cavity.',
    body: [
      'SI-053 is a temozolomide-based hydrogel formulation intended for intracavitary administration immediately following tumor resection.',
      'The drug is positioned where residual tumor cells may remain, within the same surgical episode.',
    ],
    callout: 'Local intracavitary administration',
  },
  {
    eyebrow: 'LOCAL EXPOSURE',
    title: 'The formulation is designed to release temozolomide locally over time.',
    body: [
      'The objective is sustained local drug exposure at and around the cavity margin while limiting the need to increase systemic exposure to achieve it.',
      'The treatment concept therefore connects delivery, anatomy and recurrence biology in one local intervention.',
    ],
    callout: 'Sustained local temozolomide exposure',
  },
  {
    eyebrow: 'CARE PATHWAY',
    title: 'One surgical episode. One local administration.',
    body: [
      'The intended use is deliberately simple: tumor resection, local SI-053 administration, then continuation of the patient’s broader standard treatment pathway.',
      'No separate device platform or chronic administration infrastructure is built into the commercial concept.',
    ],
    callout: 'Designed around the neurosurgical workflow',
  },
  {
    eyebrow: 'FROM THERAPY TO OPPORTUNITY',
    title: 'A local-delivery strategy with a broader brain-tumor opportunity.',
    body: [
      'Glioblastoma is the lead indication. The strategic model can also explore brain metastases and other primary brain tumors in which surgery creates a resection cavity.',
      'The next sections translate this treatment concept into patient opportunity, commercial value, development spend and funding requirements.',
    ],
    callout: 'GBM lead indication · broader intracavitary potential',
  },
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const fadeBetween = (value: number, enterFrom: number, enterTo: number, exitFrom: number, exitTo: number) =>
  smooth(enterFrom, enterTo, value) * (1 - smooth(exitFrom, exitTo, value));

function ContinuousVisual({ position }: { position: number }) {
  const tumorOut = smooth(0.15, 0.95, position);
  const cavityIn = smooth(0.35, 1.0, position);
  const brainOut = smooth(4.45, 5.05, position);
  const bbb = fadeBetween(position, 1.55, 2.0, 2.55, 3.0);
  const applicator = fadeBetween(position, 2.6, 3.05, 3.55, 4.0);
  const gel = smooth(2.85, 3.25, position) * (1 - smooth(4.5, 5.0, position));
  const release = fadeBetween(position, 3.35, 3.95, 4.55, 5.05);
  const workflow = fadeBetween(position, 4.55, 5.0, 5.55, 5.95);
  const platform = smooth(5.55, 6.0, position);
  const vesselY = 70 * (1 - smooth(1.55, 2.0, position));
  const applicatorX = 80 * (1 - smooth(2.6, 3.05, position));
  const releaseScale = 0.35 + 0.65 * smooth(3.35, 4.05, position);
  const platformScale = 0.72 + 0.28 * platform;
  const workflowDraw = smooth(4.6, 5.05, position);

  return (
    <svg viewBox="0 0 980 820" className="si-cinema-svg" aria-hidden="true">
      <defs>
        <radialGradient id="cinema-bg" cx="50%" cy="40%" r="72%">
          <stop offset="0%" stopColor="#183548" />
          <stop offset="52%" stopColor="#0c2130" />
          <stop offset="100%" stopColor="#07141f" />
        </radialGradient>
        <radialGradient id="tumor-fill" cx="40%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#ffbc87" />
          <stop offset="48%" stopColor="#df7656" />
          <stop offset="100%" stopColor="#8e3737" />
        </radialGradient>
        <radialGradient id="gel-fill" cx="42%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#cafff8" />
          <stop offset="48%" stopColor="#69ddcf" />
          <stop offset="100%" stopColor="#16877f" />
        </radialGradient>
        <filter id="cinema-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="18" /></filter>
      </defs>

      <rect width="980" height="820" fill="url(#cinema-bg)" />
      <circle cx="540" cy="380" r="325" className="cinema-orbit" />

      <g opacity={1 - brainOut} transform={`translate(${-18 * smooth(1.5, 2.0, position)} ${-28 * smooth(1.5, 2.0, position)}) scale(${1 - 0.08 * smooth(1.5, 2.0, position)})`}>
        <path className="cinema-head" d="M223 415C218 286 303 167 438 128c128-37 267 6 344 108 62 81 72 185 41 274-18 50-48 88-84 119-31 27-43 66-46 108l-5 62H353l-9-83c-5-42-22-77-50-105-46-46-69-107-71-176Z" />
        <path className="cinema-brain" d="M334 251c50-63 141-94 226-72 94 24 162 105 168 201 6 92-44 177-123 220-73 39-166 36-235-10-75-50-115-139-101-228 6-40 28-80 65-111Z" />
        <path className="cinema-folds" d="M353 292c44-29 99-33 147-13m-170 79c39-22 87-20 124 4m85-127c-20 29-27 66-18 99m87-72c-29 29-41 70-30 109m-169 61c39-24 91-22 129 5m-193 61c55-20 116-11 162 23m58-107c38 12 69 42 85 77" />

        <g opacity={1 - tumorOut} transform={`translate(${576 * tumorOut * 0.45} ${374 * tumorOut * 0.45}) scale(${1 - 0.55 * tumorOut}) translate(${-576 * tumorOut * 0.45} ${-374 * tumorOut * 0.45})`}>
          <circle cx="576" cy="374" r="78" className="cinema-tumor-glow" />
          <path className="cinema-tumor" d="M526 363c9-41 45-69 86-62 42 7 68 47 58 87-10 38-48 61-86 53-40-9-66-39-58-78Z" />
          <circle cx="552" cy="348" r="7" className="cinema-tumor-cell" /><circle cx="626" cy="343" r="6" className="cinema-tumor-cell" /><circle cx="639" cy="405" r="7" className="cinema-tumor-cell" /><circle cx="551" cy="414" r="6" className="cinema-tumor-cell" />
        </g>

        <g opacity={cavityIn} transform={`translate(${576 * (1 - cavityIn) * 0.18} ${374 * (1 - cavityIn) * 0.18}) scale(${0.72 + cavityIn * 0.28})`}>
          <path className="cinema-cavity" d="M520 354c13-42 54-66 96-54 41 12 65 54 52 94-12 38-51 61-90 51-42-10-70-51-58-91Z" />
          <path className="cinema-cavity-rim" d="M520 354c13-42 54-66 96-54 41 12 65 54 52 94-12 38-51 61-90 51-42-10-70-51-58-91Z" />
          <g className="cinema-residual-cells"><circle cx="511" cy="349" r="6" /><circle cx="530" cy="430" r="5" /><circle cx="650" cy="320" r="5" /><circle cx="673" cy="397" r="6" /></g>
        </g>

        <g opacity={gel}><path className="cinema-gel-bed" d="M535 394c21-21 57-31 86-18 17 8 30 23 37 40-18 24-47 35-78 30-22-4-37-19-45-52Z" /></g>

        <g opacity={release} transform={`translate(${576 * (1 - releaseScale)} ${374 * (1 - releaseScale)}) scale(${releaseScale})`}>
          <circle cx="576" cy="374" r="44" className="cinema-release-core" />
          <circle cx="576" cy="374" r="84" className="cinema-release-ring" /><circle cx="576" cy="374" r="126" className="cinema-release-ring cinema-release-ring-2" /><circle cx="576" cy="374" r="166" className="cinema-release-ring cinema-release-ring-3" />
          <g className="cinema-drug-points"><circle cx="505" cy="337" r="5" /><circle cx="532" cy="437" r="5" /><circle cx="627" cy="314" r="5" /><circle cx="666" cy="409" r="5" /><circle cx="588" cy="474" r="4" /></g>
        </g>
      </g>

      <g opacity={bbb} transform={`translate(0 ${vesselY})`}>
        <path className="cinema-vessel" d="M118 600C236 532 342 548 426 603c65 43 130 46 224-4 77-41 145-34 214 13" /><path className="cinema-vessel-inner" d="M118 600C236 532 342 548 426 603c65 43 130 46 224-4 77-41 145-34 214 13" />
        {[183, 275, 374, 482, 600, 724, 826].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 587 : 607} r="10" className="cinema-blood-cell" />)}
        <path className="cinema-barrier" d="M156 507C285 450 398 468 498 514c87 40 179 39 323-9" />
        <g className="cinema-systemic-particles"><circle cx="299" cy="556" r="8" /><circle cx="390" cy="562" r="6" /><circle cx="510" cy="570" r="7" /><circle cx="633" cy="552" r="6" /></g>
        <path className="cinema-blocked-arrow" d="M438 555 462 514" /><path className="cinema-blocked-arrow" d="M552 570 575 525" /><text x="158" y="478" className="cinema-label">BLOOD–BRAIN BARRIER</text>
      </g>

      <g opacity={applicator} transform={`translate(${applicatorX} ${-applicatorX * 0.55})`}><path d="M834 175 663 326" className="cinema-applicator-shaft" /><path d="M870 143 832 178" className="cinema-applicator-handle" /><circle cx="653" cy="336" r="14" className="cinema-gel-drop" /></g>

      <g opacity={workflow}>
        <text x="490" y="225" textAnchor="middle" className="cinema-workflow-heading">Designed around a single surgical episode</text>
        <path pathLength="1" d="M177 455H806" className="cinema-workflow-line" style={{ strokeDashoffset: 1 - workflowDraw }} />
        {[{ x: 177, title: 'RESECTION', sub: 'Remove visible tumor' }, { x: 387, title: 'SI-053', sub: 'Local administration' }, { x: 597, title: 'RELEASE', sub: 'Local exposure' }, { x: 806, title: 'FOLLOW-UP', sub: 'Continue care pathway' }].map((node, index) => {
          const nodeIn = smooth(4.72 + index * 0.06, 5.05 + index * 0.06, position);
          return <g key={node.title} opacity={nodeIn} transform={`translate(0 ${18 * (1 - nodeIn)})`}><circle cx={node.x} cy="455" r="38" className={`cinema-workflow-node node-${index + 1}`} /><text x={node.x} y="525" textAnchor="middle" className="cinema-node-title">{node.title}</text><text x={node.x} y="550" textAnchor="middle" className="cinema-node-sub">{node.sub}</text></g>;
        })}
      </g>

      <g opacity={platform} transform={`translate(${490 * (1 - platformScale)} ${390 * (1 - platformScale)}) scale(${platformScale})`}>
        <circle cx="490" cy="365" r="82" className="cinema-platform-core" /><text x="490" y="358" textAnchor="middle" className="cinema-platform-title">SI-053</text><text x="490" y="389" textAnchor="middle" className="cinema-platform-sub">LOCAL DELIVERY</text><path d="M430 422 288 576M490 447v154M550 422 692 576" className="cinema-platform-lines" />
        <g className="cinema-platform-pill"><rect x="181" y="570" width="214" height="91" rx="24" /><text x="288" y="610" textAnchor="middle">GLIOBLASTOMA</text><text x="288" y="638" textAnchor="middle" className="cinema-platform-small">Lead indication</text></g>
        <g className="cinema-platform-pill"><rect x="383" y="604" width="214" height="91" rx="24" /><text x="490" y="644" textAnchor="middle">BRAIN METASTASES</text><text x="490" y="672" textAnchor="middle" className="cinema-platform-small">Expansion scenario</text></g>
        <g className="cinema-platform-pill"><rect x="585" y="570" width="214" height="91" rx="24" /><text x="692" y="610" textAnchor="middle">OTHER PRIMARY</text><text x="692" y="638" textAnchor="middle" className="cinema-platform-small">Brain tumors</text></g>
      </g>
    </svg>
  );
}

export function Si053StoryPage({ onOpenCommercial, onOpenDevelopment }: Props) {
  const trackRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

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

  const position = progress * (steps.length - 1);
  const activeIndex = Math.min(steps.length - 1, Math.max(0, Math.round(position)));

  return (
    <section ref={trackRef} className="si-cinema-track">
      <div className="si-cinema-stage">
        <div className="si-cinema-visual" aria-hidden="true"><ContinuousVisual position={position} /></div>
        <div className="si-cinema-copy" aria-live="polite">
          {steps.map((step, index) => {
            const distance = Math.abs(position - index);
            const opacity = 1 - smooth(0.12, 0.62, distance);
            return <article key={step.title} className="si-cinema-copy-step" style={{ opacity, pointerEvents: opacity > 0.55 ? 'auto' : 'none' }}><span className="si-cinema-eyebrow">{step.eyebrow}</span><h1>{step.title}</h1>{step.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<div className="si-cinema-callout"><span />{step.callout}</div>{index === steps.length - 1 && <div className="si-cinema-actions"><button className="primary-button" onClick={onOpenCommercial}>Explore commercial & valuation</button><button className="secondary-button" onClick={onOpenDevelopment}>Development & cash</button></div>}</article>;
          })}
        </div>
        <div className="si-cinema-ui" aria-hidden="true"><div className="si-cinema-count"><strong>{String(activeIndex + 1).padStart(2, '0')}</strong><span>/ {String(steps.length).padStart(2, '0')}</span></div><div className="si-cinema-progress"><i style={{ transform: `scaleX(${progress})` }} /></div><div className="si-cinema-dots">{steps.map((_, index) => <b key={index} className={index === activeIndex ? 'active' : ''} />)}</div></div>
      </div>
    </section>
  );
}
