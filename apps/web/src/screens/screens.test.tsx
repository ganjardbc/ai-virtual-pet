import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { makeSnapshot } from '../testing/snapshot';
import { EggScreen } from './EggScreen';
import { ConversationScreen } from './ConversationScreen';
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
    expect(text).toContain('Bicara');
    for (const raw of ['72.4', '64.2', '81.3', '12.7', 'Bond', 'Playful', 'Curious', 'Clingy']) {
      expect(text).not.toContain(raw);
    }
  });

  it('lays out Pet Home full-screen with floating needs bars and no raw numbers', () => {
    const markup = render(<PetHome snapshot={makeSnapshot()} />);

    expect(markup).toContain('game--home');
    expect(markup).toContain('game--full');
    expect((markup.match(/class="stats__fill"/g) ?? []).length).toBe(3);
    expect(visibleText(markup)).not.toContain('72');
  });

  it('presents sleep: Feed, Play, and Talk disabled, Sleeping active, Energy recovering, no Wake button', () => {
    const snapshot = makeSnapshot({
      state: { currentActivity: 'SLEEPING', sleepStartedAt: '2026-09-25T11:00:00.000Z' },
    });
    const markup = render(<PetHome snapshot={snapshot} />);

    expect((markup.match(/disabled=""/g) ?? []).length).toBe(4);
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('Memulihkan diri');
    expect(markup).toContain('Momo sedang tidur.');
    expect(markup).not.toMatch(/>(Wake|Bangunkan)</);
  });
});

describe('Talk', () => {
  it('offers Talk as a core action between Play and Sleep', () => {
    const markup = render(<PetHome snapshot={makeSnapshot()} onTalk={() => {}} />);
    const labels = [...markup.matchAll(/class="action__label">([^<]+)</g)].map((match) => match[1]);

    expect(labels).toEqual(['Beri makan', 'Main', 'Bicara', 'Tidur']);
  });

  it('keeps the pet first, then the conversation, then the input (scope §124)', () => {
    const markup = render(<ConversationScreen snapshot={makeSnapshot()} onBack={() => {}} />);
    const pet = markup.indexOf('role="img"');
    const log = markup.indexOf('role="log"');
    const input = markup.indexOf('<textarea');

    expect(pet).toBeGreaterThan(-1);
    expect(pet).toBeLessThan(log);
    expect(log).toBeLessThan(input);
    expect(markup).toContain('>Momo<');
    expect(markup).toContain('game--conversation');
    expect(markup).toContain('game--full');
    expect(markup).toContain('aria-busy="true"');
  });

  it('labels the input, bounds it to 1000 characters, and offers a way back', () => {
    const markup = render(<ConversationScreen snapshot={makeSnapshot()} onBack={() => {}} />);

    expect(markup).toContain('<label class="visually-hidden" for="chat-input">Pesan untuk Momo</label>');
    expect(markup).toContain('maxLength="1000"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('role="status"');
    expect(visibleText(markup)).toContain('Kembali');
    // Nothing to send yet.
    expect(markup).toMatch(/<button type="submit"[^>]*disabled=""/);
  });

  it('shows no stats, personality, or debug data in the Talk view', () => {
    const text = visibleText(render(<ConversationScreen snapshot={makeSnapshot()} onBack={() => {}} />));

    for (const hidden of ['72.4', '12.7', 'Bond', 'confidence', 'PLAYFUL', 'Playful']) {
      expect(text).not.toContain(hidden);
    }
  });
});
