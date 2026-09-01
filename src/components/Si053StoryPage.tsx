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

const storyAsset = (filename: string) =>
  `${import.meta.env.BASE_URL}story/${encodeURIComponent(filename)}`;

const storyAssets = {
  brain: storyAsset('ChatGPT Image Sep 1, 2026, 05_59_27 PM (1).png'),
  tumor: storyAsset('ChatGPT Image Sep 1, 2026, 05_59_27 PM (2).png'),
  cavity: storyAsset('ChatGPT Image Sep 1, 2026, 05_59_28 PM (3).png'),
  bbb: storyAsset('ChatGPT Image Sep 1, 2026, 05_59_28 PM (4).png'),
  needle: storyAsset('ChatGPT Image Sep 1, 2026, 05_59_28 PM (5).png'),
  pathway: storyAsset('ChatGPT Image Sep 1, 2026, 05_59_29 PM (6).png'),
  platform: storyAsset('ChatGPT Image Sep 1, 2026, 05_59_29 PM (7).png'),
};

function ContinuousVisual({ position }: { position: number }) {
  const tumorOut = smooth(0.18, 0.92, position);

  const cavityAfterResection = smooth(0.28, 0.92, position) * (1 - smooth(1.34, 1.82, position));
  const bbbOpacity = smooth(1.42, 1.92, position) * (1 - smooth(2.42, 2.92, position));
  const cavityDuringTreatment = smooth(2.48, 2.96, position) * (1 - smooth(4.48, 4.96, position));
  const needleOpacity = smooth(2.58, 3.06, position) * (1 - smooth(4.5, 4.98, position));

  const pathwayIn = smooth(4.56, 5.0, position);
  const platformIn = smooth(5.54, 5.98, position);

  const brainOpacity = 1 - pathwayIn;
  const cavityOpacity = Math.min(1, cavityAfterResection + cavityDuringTreatment) * brainOpacity;
  const tumorOpacity = (1 - tumorOut) * brainOpacity;
  const outlineOpacity = bbbOpacity * brainOpacity;
  const treatmentOpacity = needleOpacity * brainOpacity;
  const pathwayOpacity = pathwayIn * (1 - platformIn);
  const platformOpacity = platformIn;

  return (
    <div className="si-cinema-visual-shell">
      <div className="si-cinema-ambient" />

      <div className="si-story-stack">
        <img
          src={storyAssets.brain}
          alt=""
          className="si-story-layer si-story-layer-brain"
          style={{ opacity: brainOpacity }}
        />
        <img
          src={storyAssets.cavity}
          alt=""
          className="si-story-layer si-story-layer-cavity"
          style={{ opacity: cavityOpacity }}
        />
        <img
          src={storyAssets.tumor}
          alt=""
          className="si-story-layer si-story-layer-tumor"
          style={{ opacity: tumorOpacity }}
        />
        <img
          src={storyAssets.bbb}
          alt=""
          className="si-story-layer si-story-layer-bbb"
          style={{ opacity: outlineOpacity }}
        />
        <img
          src={storyAssets.needle}
          alt=""
          className="si-story-layer si-story-layer-needle"
          style={{ opacity: treatmentOpacity }}
        />
      </div>

      <img
        src={storyAssets.pathway}
        alt=""
        className="si-story-standalone si-story-pathway"
        style={{ opacity: pathwayOpacity }}
      />

      <img
        src={storyAssets.platform}
        alt=""
        className="si-story-standalone si-story-platform"
        style={{ opacity: platformOpacity }}
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
