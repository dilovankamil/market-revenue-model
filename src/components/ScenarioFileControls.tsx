import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { parseScenario, serializeScenario } from '../model/scenarioIO';
import type { Scenario } from '../model/types';

interface Props {
  scenario: Scenario;
  setScenario: Dispatch<SetStateAction<Scenario>>;
}

const safeFileName = (name: string) => `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scenario'}.private.json`;

export function ScenarioFileControls({ scenario, setScenario }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState('');

  const exportScenario = () => {
    const url = URL.createObjectURL(new Blob([serializeScenario(scenario)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFileName(scenario.name);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatus('Scenario exported locally. Keep private files outside this repository.');
  };

  const importScenario = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next = parseScenario(await file.text());
      setScenario(next);
      setStatus(`Loaded “${next.name}” from this device.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The scenario file could not be read.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="panel scenario-file-panel" aria-label="Private scenario file controls">
      <div>
        <span className="section-kicker">Private build</span>
        <h3>Local scenario file</h3>
        <p>Import and export stay in this browser; no file is uploaded.</p>
        {status && <small className="scenario-file-status" role="status">{status}</small>}
      </div>
      <div className="scenario-file-actions">
        <input ref={inputRef} className="hidden-file-input" type="file" accept="application/json,.json" onChange={(event) => void importScenario(event.target.files?.[0])} />
        <button type="button" className="toolbar-button" onClick={() => inputRef.current?.click()}>Import scenario</button>
        <button type="button" className="toolbar-button" onClick={exportScenario}>Export scenario</button>
      </div>
    </section>
  );
}
