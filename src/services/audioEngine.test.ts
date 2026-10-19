import { describe, expect, it, vi } from 'vitest';
import { FakeAudio } from '../test/FakeAudio';
import { AudioEngine, type EngineEvent } from './audioEngine';

function setup() {
  const audio = new FakeAudio();
  const engine = new AudioEngine(audio.asElement());
  engine.attach();
  const events: EngineEvent['type'][] = [];
  engine.subscribe((event) => events.push(event.type));
  return { audio, engine, events };
}

describe('AudioEngine', () => {
  it('wczytuje plik i odtwarza go', async () => {
    const { audio, engine, events } = setup();
    engine.load('utwor.mp3');
    expect(audio.src).toBe('utwor.mp3');
    await expect(engine.play()).resolves.toBe('playing');
    await Promise.resolve();
    expect(events).toEqual(['loading', 'ready', 'playing']);
  });

  it('rozpoznaje blokadę autoodtwarzania', async () => {
    const { audio, engine } = setup();
    audio.playMode = 'blocked';
    engine.load('utwor.mp3');
    await expect(engine.play()).resolves.toBe('blocked');
  });

  it('zgłasza czytelny komunikat przy błędzie wczytywania', () => {
    const { audio, engine } = setup();
    const messages: string[] = [];
    engine.subscribe((event) => event.type === 'error' && messages.push(event.message));
    engine.load('brak.mp3');
    audio.fail(4);
    expect(messages[0]).toMatch(/niedostępne/);
  });

  it('udostępnia postęp i przewija w granicach długości utworu', () => {
    const { audio, engine } = setup();
    const listener = vi.fn();
    engine.subscribeProgress(listener);
    engine.load('utwor.mp3');
    audio.advance(10);
    expect(engine.getProgress()).toMatchObject({ currentTime: 10, duration: 120 });
    engine.seek(500);
    expect(audio.currentTime).toBe(120);
    engine.seek(-3);
    expect(audio.currentTime).toBe(0);
    expect(listener).toHaveBeenCalled();
  });

  it('wznawia od zapamiętanej pozycji', () => {
    const { audio, engine } = setup();
    engine.load('utwor.mp3', 42);
    expect(audio.currentTime).toBe(42);
  });

  it('po odłączeniu usuwa nasłuchiwacze i nie zgłasza już zdarzeń', () => {
    const { audio, engine, events } = setup();
    engine.load('utwor.mp3');
    engine.detach();
    const before = events.length;
    audio.dispatchEvent(new Event('playing'));
    audio.dispatchEvent(new Event('ended'));
    expect(events.length).toBe(before);
  });

  it('ustawia głośność w zakresie 0-1 i wyciszenie', () => {
    const { audio, engine } = setup();
    engine.setVolume(1.5);
    expect(audio.volume).toBe(1);
    engine.setMuted(true);
    expect(audio.muted).toBe(true);
  });
});
