import { describe, expect, it } from 'vitest';
import { subnationalDatasets } from './subnational';

describe('subnational datasets', () => {
  it('reconciles the four China census macro-regions to the 2020 census total', () => {
    const total = subnationalDatasets.CHN.regions.reduce((sum, region) => sum + region.populationBase, 0);
    expect(total).toBe(1_409_778_724);
  });

  it('marks India as a selected-region planning layer rather than a national reconciliation', () => {
    expect(subnationalDatasets.IND.coverageNote.toLowerCase()).toContain('selected regions only');
    expect(subnationalDatasets.IND.regions.length).toBeGreaterThanOrEqual(5);
  });

  it('keeps a source URL attached to every subnational population value', () => {
    for (const dataset of Object.values(subnationalDatasets)) {
      for (const region of dataset.regions) {
        expect(region.sourceUrl.startsWith('https://')).toBe(true);
        expect(region.populationBase).toBeGreaterThan(0);
      }
    }
  });
});
