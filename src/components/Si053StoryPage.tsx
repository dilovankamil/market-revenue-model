import { useEffect, useMemo, useRef, useState } from 'react';

type StoryScene = 'recurrence' | 'resection' | 'bbb' | 'delivery' | 'release' | 'workflow' | 'platform';

type StoryStep = {
  id: string;
  scene: StoryScene;
  eyebrow: string;
  title: string;
  body: string[];
  callout: string;
};

interface Props {
  onOpenCommercial: () => void;
  onOpenDevelopment: () => void;
}

const storySteps: StoryStep[] = [
  {
    id: 'recurrence',
    scene: 'recurrence',
    eyebrow: 'The clinical problem',
    title: 'The visible tumor can be removed. The local disease problem can remain.',
    body: [
      'Glioblastoma is highly infiltrative. Surgery removes the main tumor mass, but microscopic tumor cells may remain in tissue surrounding the resection site.',
      'That makes the postoperative cavity and its margins a clinically important treatment zone — and the starting point for the SI-053 concept.',
    ],
    callout: 'Residual disease risk at the resection margin',
  },
  {
    id: 'resection',
    scene: 'resection',
    eyebrow: 'After surgery',
    title: 'Resection creates a cavity exactly where local recurrence risk is concentrated.',
    body: [
      'Once the visible tumor has been removed, the surgeon is left with a defined postoperative cavity.',
      'Instead of treating that space as the end of surgery, SI-053 is being developed around it as an opportunity for immediate local therapy.',
    ],
    callout: 'A defined postoperative treatment site',
  },
  {
    id: 'bbb',
    scene: 'bbb',
    eyebrow: 'Why local delivery',
    title: 'Systemic treatment must reach the brain through a highly selective vascular barrier.',
    body: [
      'The blood–brain barrier limits the passage of many circulating therapies into brain tissue and complicates efforts to achieve high exposure at the tumor margin.',
      'A local formulation changes the delivery problem: the drug is placed at the surgical site rather than relying only on systemic transport to reach it.',
    ],
    callout: 'Reduce dependence on systemic delivery across the BBB',
  },
  {
    id: 'delivery',
    scene: 'delivery',
    eyebrow: 'The SI-053 concept',
    title: 'SI-053 is designed to be placed directly into the post-resection cavity.',
    body: [
      'SI-053 is a local temozolomide-based hydrogel formulation intended for intracavitary administration after tumor resection.',
      'The treatment is positioned at the site where residual tumor cells may remain, integrating drug delivery into the existing surgical episode.',
    ],
    callout: 'Local intracavitary administration',
  },
  {
    id: 'release',
    scene: 'release',
    eyebrow: 'Local exposure',
    title: 'The formulation is designed to release temozolomide locally over time.',
    body: [
      'The strategic aim is sustained local exposure at and around the cavity margin, where postoperative residual disease is most relevant.',
      'Local administration is intended to support high drug exposure at the treatment site while limiting the need to increase systemic exposure to achieve it.',
    ],
    callout: 'Sustained local temozolomide exposure',
  },
  {
    id: 'workflow',
    scene: 'workflow',
    eyebrow: 'Designed for the care pathway',
    title: 'One surgical episode. One local administration. No new treatment infrastructure.',
    body: [
      'The intended use setting is deliberately simple: tumor resection, local SI-053 administration, then continuation of the patient’s broader standard treatment pathway.',
      'That makes the product concept compatible with the neurosurgical workflow rather than dependent on a separate device, treatment center or chronic administration system.',
    ],
    callout: 'Designed to fit the existing neurosurgical workflow',
  },
  {
    id: 'platform',
    scene: 'platform',
    eyebrow: 'From therapy to opportunity',
    title: 'The same local-delivery logic can be evaluated across a broader brain-tumor opportunity.',
    body: [
      'Glioblastoma is the lead indication. The strategic model also allows exploration of brain metastases and other primary brain tumors where surgery creates a resection cavity.',
      'The next two sections translate this treatment concept into market scope, commercial value, development spend and funding requirements under explicit assumptions.',
    ],
    callout: 'GBM lead indication · broader intracavitary platform potential',
  },
];

function BrainBase() {
  return (
    <>
      <path className="story-head-outline" d="M190 420C187 290 275 166 417 126c133-37 279 9 355 115 60 83 67 191 32 279-19 48-48 83-82 113-29 25-39 64-42 105l-5 73H330l-8-91c-4-39-21-72-48-99-52-50-81-119-84-201Z" />
      <path className="story-brain-outline" d="M306 250c49-68 143-101 231-79 97 24 167 109 171 210 4 92-48 180-130 223-75 39-172 34-241-16-76-55-113-151-93-243 8-36 29-71 62-95Z" />
      <path className="story-brain-fold" d="M329 285c43-31 100-37 150-18m-174 82c38-23 88-23 127 0m91-120c-23 28-32 67-24 102m91-70c-31 28-45 72-35 113m-166 55c41-26 96-25 136 3m-196 64c55-23 119-16 168 19m53-103c39 12 72 42 89 79" />
    </>
  );
}

function Tumor({ removed = false }: { removed?: boolean }) {
  return (
    <g className={removed ? 'story-tumor story-tumor-removed' : 'story-tumor'}>
      <circle cx="556" cy="378" r="75" className="story-tumor-halo" />
      <path d="M508 369c7-42 45-73 87-65 43 8 69 49 57 89-10 37-50 58-87 48-39-10-65-39-57-72Z" className="story-tumor-core" />
      <circle cx="536" cy="357" r="8" className="story-tumor-cell" />
      <circle cx="611" cy="344" r="6" className="story-tumor-cell" />
      <circle cx="622" cy="406" r="7" className="story-tumor-cell" />
      <circle cx="539" cy="414" r="6" className="story-tumor-cell" />
    </g>
  );
}

function Cavity() {
  return (
    <g>
      <path className="story-cavity" d="M502 356c12-42 54-68 97-56 42 12 67 55 53 96-13 39-54 62-93 51-42-11-70-50-57-91Z" />
      <path className="story-cavity-rim" d="M502 356c12-42 54-68 97-56 42 12 67 55 53 96-13 39-54 62-93 51-42-11-70-50-57-91Z" />
      <g className="story-residual-cells">
        <circle cx="491" cy="350" r="6" /><circle cx="510" cy="431" r="5" /><circle cx="642" cy="321" r="5" /><circle cx="661" cy="399" r="6" />
      </g>
    </g>
  );
}

function BbbScene() {
  return (
    <g className="story-bbb-scene">
      <path className="story-vessel" d="M180 560C286 496 356 530 421 581c57 44 116 48 204-2 63-36 114-32 161 0" />
      <path className="story-vessel-inner" d="M180 560C286 496 356 530 421 581c57 44 116 48 204-2 63-36 114-32 161 0" />
      {[235, 323, 418, 525, 646, 735].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 548 : 567} r="10" className="story-blood-cell" />)}
      <g className="story-drug-particles">
        <circle cx="310" cy="520" r="8" /><circle cx="382" cy="527" r="6" /><circle cx="479" cy="541" r="7" /><circle cx="585" cy="527" r="6" />
      </g>
      <path className="story-barrier-line" d="M210 480C318 432 412 452 492 490c74 35 149 36 259-5" />
      <text x="207" y="445" className="story-svg-label">BLOOD–BRAIN BARRIER</text>
      <path className="story-blocked-arrow" d="M432 523 454 486" />
      <path className="story-blocked-arrow" d="M522 536 542 497" />
    </g>
  );
}

function Applicator() {
  return (
    <g className="story-applicator">
      <path d="M747 205 624 323" className="story-applicator-shaft" />
      <path d="M775 177 744 210" className="story-applicator-handle" />
      <circle cx="616" cy="331" r="13" className="story-gel-drop" />
    </g>
  );
}

function ReleaseRings() {
  return (
    <g className="story-release-rings">
      <circle cx="575" cy="374" r="39" className="story-release-core" />
      <circle cx="575" cy="374" r="72" className="story-release-ring ring-one" />
      <circle cx="575" cy="374" r="108" className="story-release-ring ring-two" />
      <circle cx="575" cy="374" r="145" className="story-release-ring ring-three" />
      <g className="story-release-particles">
        <circle cx="510" cy="338" r="5" /><circle cx="535" cy="428" r="5" /><circle cx="624" cy="320" r="5" /><circle cx="657" cy="406" r="5" /><circle cx="582" cy="470" r="4" />
      </g>
    </g>
  );
}

function WorkflowScene() {
  const stages = [
    { x: 155, title: 'RESECTION', sub: 'Remove visible tumor' },
    { x: 365, title: 'SI-053', sub: 'Local administration' },
    { x: 575, title: 'RELEASE', sub: 'Local drug exposure' },
    { x: 785, title: 'FOLLOW-UP', sub: 'Continue care pathway' },
  ];
  return (
    <g className="story-workflow-scene">
      <path d="M155 455H785" className="story-workflow-line" />
      {stages.map((stage, index) => (
        <g key={stage.title}>
          <circle cx={stage.x} cy="455" r="38" className={`story-workflow-node node-${index + 1}`} />
          <text x={stage.x} y="535" textAnchor="middle" className="story-workflow-title">{stage.title}</text>
          <text x={stage.x} y="563" textAnchor="middle" className="story-workflow-sub">{stage.sub}</text>
        </g>
      ))}
      <text x="470" y="250" textAnchor="middle" className="story-workflow-hero">Designed around a single surgical episode</text>
    </g>
  );
}

function PlatformScene() {
  return (
    <g className="story-platform-scene">
      <circle cx="450" cy="380" r="82" className="story-platform-core" />
      <text x="450" y="370" textAnchor="middle" className="story-platform-core-label">SI-053</text>
      <text x="450" y="402" textAnchor="middle" className="story-platform-core-sub">LOCAL DELIVERY</text>
      <path d="M383 438 255 570M450 462v153M517 438 648 570" className="story-platform-lines" />
      <g className="story-platform-pill"><rect x="150" y="570" width="205" height="92" rx="24" /><text x="252" y="610" textAnchor="middle">GLIOBLASTOMA</text><text x="252" y="638" textAnchor="middle" className="story-platform-small">Lead indication</text></g>
      <g className="story-platform-pill"><rect x="348" y="615" width="205" height="92" rx="24" /><text x="450" y="655" textAnchor="middle">BRAIN METASTASES</text><text x="450" y="683" textAnchor="middle" className="story-platform-small">Expansion scenario</text></g>
      <g className="story-platform-pill"><rect x="545" y="570" width="205" height="92" rx="24" /><text x="648" y="610" textAnchor="middle">OTHER PRIMARY</text><text x="648" y="638" textAnchor="middle" className="story-platform-small">Brain tumors</text></g>
    </g>
  );
}

function StoryVisual({ step, stepIndex }: { step: StoryStep; stepIndex: number }) {
  return (
    <div className={`si-story-visual scene-${step.scene}`}>
      <div className="si-story-visual-topline"><span>SI-053 · HOW IT WORKS</span><strong>{String(stepIndex + 1).padStart(2, '0')} / {String(storySteps.length).padStart(2, '0')}</strong></div>
      <svg viewBox="0 0 900 860" className="si-story-svg" aria-hidden="true">
        <defs>
          <radialGradient id="story-bg" cx="50%" cy="34%" r="70%"><stop offset="0%" stopColor="#17334a" /><stop offset="58%" stopColor="#0a1b2a" /><stop offset="100%" stopColor="#06101a" /></radialGradient>
          <radialGradient id="story-tumor-gradient" cx="42%" cy="35%" r="70%"><stop offset="0%" stopColor="#ffb174" /><stop offset="45%" stopColor="#e36d45" /><stop offset="100%" stopColor="#9d342f" /></radialGradient>
          <radialGradient id="story-gel-gradient" cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#bbfff6" /><stop offset="45%" stopColor="#5ee7d3" /><stop offset="100%" stopColor="#168f89" /></radialGradient>
          <filter id="story-soft-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="18" /></filter>
        </defs>
        <rect width="900" height="860" rx="34" fill="url(#story-bg)" />
        <circle cx="460" cy="394" r="310" className="story-backdrop-orbit" />
        {(step.scene === 'recurrence' || step.scene === 'resection' || step.scene === 'delivery' || step.scene === 'release') && <BrainBase />}
        {step.scene === 'recurrence' && <Tumor />}
        {step.scene === 'resection' && <><Tumor removed /><Cavity /><text x="678" y="330" className="story-svg-label">RESECTION CAVITY</text><path d="M667 337 635 352" className="story-label-line" /></>}
        {step.scene === 'bbb' && <><BrainBase /><Cavity /><BbbScene /></>}
        {step.scene === 'delivery' && <><Cavity /><Applicator /><circle cx="575" cy="374" r="36" className="story-gel-bed" /><text x="664" y="450" className="story-svg-label">SI-053</text><path d="M654 441 612 407" className="story-label-line" /></>}
        {step.scene === 'release' && <><Cavity /><ReleaseRings /><text x="662" y="260" className="story-svg-label">LOCAL RELEASE</text><path d="M650 271 626 300" className="story-label-line" /></>}
        {step.scene === 'workflow' && <WorkflowScene />}
        {step.scene === 'platform' && <PlatformScene />}
      </svg>
      <div className="si-story-visual-caption"><span className="si-story-pulse" /><strong>{step.callout}</strong></div>
    </div>
  );
}

export function Si053StoryPage({ onOpenCommercial, onOpenDevelopment }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const steps = useMemo(() => storySteps, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    stepRefs.current.forEach((element, index) => {
      if (!element) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) setActiveIndex(index); });
      }, { threshold: 0.48, rootMargin: '-12% 0px -28% 0px' });
      observer.observe(element);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, [steps.length]);

  const activeStep = steps[activeIndex] ?? steps[0];
  const progress = ((activeIndex + 1) / steps.length) * 100;

  return (
    <div className="si-story-page">
      <section className="si-story-hero">
        <div className="si-story-hero-copy">
          <span className="si-story-kicker">SI-053 · LOCAL TEMOZOLOMIDE DELIVERY</span>
          <h1>Designed for the place where brain-tumor surgery ends.</h1>
          <p>SI-053 is being developed as a local temozolomide-based hydrogel treatment for administration into the post-resection cavity. Scroll to follow the treatment concept from tumor removal to local drug delivery.</p>
          <div className="si-story-hero-chips"><span>Intracavitary</span><span>Single administration</span><span>Post-resection</span></div>
        </div>
        <div className="si-story-scroll-cue"><span>SCROLL TO EXPLORE</span><i /></div>
      </section>

      <section className="si-story-scrolly">
        <div className="si-story-copy-column">
          {steps.map((step, index) => (
            <article key={step.id} ref={(element) => { stepRefs.current[index] = element; }} className={`si-story-step ${index === activeIndex ? 'is-active' : ''}`}>
              <div className="si-story-step-number">{String(index + 1).padStart(2, '0')}</div>
              <span className="si-story-step-eyebrow">{step.eyebrow}</span>
              <h2>{step.title}</h2>
              {step.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <div className="si-story-inline-callout"><span />{step.callout}</div>
            </article>
          ))}
        </div>

        <div className="si-story-sticky-column">
          <div className="si-story-progress"><div style={{ width: `${progress}%` }} /></div>
          <StoryVisual step={activeStep} stepIndex={activeIndex} />
          <div className="si-story-dots" aria-label="Story progress">
            {steps.map((step, index) => <button key={step.id} aria-label={`Story step ${index + 1}: ${step.eyebrow}`} className={index === activeIndex ? 'active' : ''} onClick={() => stepRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />)}
          </div>
        </div>
      </section>

      <section className="si-story-handoff">
        <div className="si-story-handoff-copy">
          <span className="si-story-kicker">FROM THERAPY TO ECONOMICS</span>
          <h2>Now model the opportunity.</h2>
          <p>The treatment story defines the use case. The next sections let you change market scope, price, penetration, development assumptions and see how those choices flow through to revenue, funding and asset value.</p>
        </div>
        <div className="si-story-handoff-actions">
          <button className="si-story-primary" onClick={onOpenCommercial}>Commercial & valuation <span>→</span></button>
          <button className="si-story-secondary" onClick={onOpenDevelopment}>Development & cash <span>→</span></button>
        </div>
      </section>
    </div>
  );
}
