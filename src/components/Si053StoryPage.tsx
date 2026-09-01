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

const assetFile = (index: number) =>
  `${import.meta.env.BASE_URL}story/${encodeURIComponent(`ChatGPT Image Sep 1, 2026, 05_14_05 PM (${index}).png`)}`;

const storyAssets = {
  brain: assetFile(1),
  tumor: assetFile(2),
  bbb: assetFile(3),
  delivery: assetFile(4),
  pathway: assetFile(5),
  platform: assetFile(6),
};

function ContinuousVisual({ position }: { position: number }) {
  const tumorOut = smooth(0.16, 0.92, position);
  const bbbIn = smooth(1.42, 1.92, position);
  const deliveryIn = smooth(2.55, 3.05, position);
  const releaseEmphasis = smooth(3.35, 4.05, position);
  const workflowIn = smooth(4.5, 4.98, position);
  const platformIn = smooth(5.5, 5.98, position);

  const brainOpacity = (1 - bbbIn) * (1 - workflowIn);
  const bbbOpacity = bbbIn * (1 - deliveryIn) * (1 - workflowIn);
  const deliveryOpacity = deliveryIn * (1 - workflowIn);
  const pathwayOpacity = workflowIn * (1 - platformIn);
  const platformOpacity = platformIn;
  const tumorOpacity = (1 - tumorOut) * brainOpacity;
  const tumorScale = 1 - tumorOut * 0.16;
  const deliveryScale = 0.985 + releaseEmphasis * 0.015;

  return (
    <div className="si-cinema-visual-shell">
      <div className="si-cinema-ambient" />

      <img
        src={storyAssets.brain}
        alt=""
        className="si-story-image si-story-brain"
        style={{ opacity: brainOpacity }}
      />

      <img
        src={storyAssets.tumor}
        alt=""
        className="si-story-image si-story-tumor"
        style={{
          opacity: tumorOpacity,
          transform: `translate(-50%, -50%) scale(${tumorScale})`,
        }}
      />

      <img
        src={storyAssets.bbb}
        alt=""
        className="si-story-image si-story-brain si-story-bbb"
        style={{ opacity: bbbOpacity }}
      />

      <img
        src={storyAssets.delivery}
        alt=""
        className="si-story-image si-story-brain si-story-delivery"
        style={{ opacity: deliveryOpacity, transform: `translate(-50%, -50%) scale(${deliveryScale})` }}
      />

      <img
        src={storyAssets.pathway}
        alt=""
        className="si-story-image si-story-wide"
        style={{
          opacity: pathwayOpacity,
          transform: `translate(-50%, calc(-50% + ${14 * (1 - workflowIn)}px))`,
        }}
      />

      <img
        src={storyAssets.platform}
        alt=""
        className="si-story-image si-story-platform"
        style={{
          opacity: platformOpacity,
          transform: `translateY(${12 * (1 - platformIn)}px) scale(${0.985 + platformIn * 0.015})`,
        }}
      />
    </div>
  );
}

export function Si053StoryPage({ onOpenCommercial, onOpenDevelopment }: Props) {
  const trackRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Object.values(storyAssets).forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

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
        <div className="si-cinema-visual" aria-hidden="true">
          <ContinuousVisual position={position} />
        </div>

        <div className="si-cinema-copy" aria-live="polite">
          {steps.map((step, index) => {
            const distance = Math.abs(position - index);
            const opacity = 1 - smooth(0.12, 0.62, distance);
            return (
              <article
                key={step.title}
                className="si-cinema-copy-step"
                style={{ opacity, pointerEvents: opacity > 0.55 ? 'auto' : 'none' }}
              >
                <span className="si-cinema-eyebrow">{step.eyebrow}</span>
                <h1>{step.title}</h1>
                {step.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <div className="si-cinema-callout"><span />{step.callout}</div>
                {index === steps.length - 1 && (
                  <div className="si-cinema-actions">
                    <button className="primary-button" onClick={onOpenCommercial}>Explore commercial & valuation</button>
                    <button className="secondary-button" onClick={onOpenDevelopment}>Development & cash</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

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
      </div>
    </section>
  );
}
