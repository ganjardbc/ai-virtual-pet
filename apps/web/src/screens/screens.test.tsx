import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { makeSnapshot } from '../testing/snapshot';
import { EggScreen } from './EggScreen';
import { NamingScreen } from './NamingScreen';
import { PetHome } from './PetHome';

const render = (element: ReactElement) =>
  renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}>{element}</QueryClientProvider>);

const visibleText = (markup: string) => markup.replace(/<[^>]+>/g, ' ');

describe('player screens', () => {
  it('shows only the egg and one action on the Egg screen', () => {
    const markup = render(<EggScreen hatching={false} onHatch={() => {}} />);

    expect(markup).toContain('Ada sesuatu yang menunggu…');
    expect(markup).toContain('>Tetaskan<');
    expect(markup).not.toContain('Perut');
  });

  it('introduces the pet before asking for a name', () => {
    const markup = render(<NamingScreen onSubmit={async () => {}} celebratingName={null} />);

    expect(markup.indexOf('role="img"')).toBeLessThan(markup.indexOf('pet-name'));
    expect(markup).toContain('Kamu mau panggil aku apa?');
  });

  it('shows descriptive needs and never raw stats or Bond on Pet Home', () => {
    const snapshot = makeSnapshot({ derived: { mood: 'HAPPY', needs: { fullness: 'OKAY', energy: 'ENERGETIC' } } });
    const text = visibleText(render(<PetHome snapshot={snapshot} />));

    expect(text).toContain('Momo');
    expect(text).toContain('Cukup');
    expect(text).toContain('Bersemangat');
    expect(text).toContain('Senang');
    for (const raw of ['72.4', '64.2', '81.3', '12.7', 'Bond', 'Talk', 'Bicara']) {
      expect(text).not.toContain(raw);
    }
  });

  it('presents sleep: Feed and Play disabled, Sleeping active, Energy recovering, no Wake button', () => {
    const snapshot = makeSnapshot({
      state: { currentActivity: 'SLEEPING', sleepStartedAt: '2026-09-25T11:00:00.000Z' },
    });
    const markup = render(<PetHome snapshot={snapshot} />);

    expect((markup.match(/disabled=""/g) ?? []).length).toBe(3);
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('Memulihkan diri');
    expect(markup).toContain('Momo sedang tidur.');
    expect(markup).not.toMatch(/>(Wake|Bangunkan)</);
  });
});
