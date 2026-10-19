/**
 * Atrapa elementu <audio> do testów: zachowuje się jak prawdziwy odtwarzacz
 * (zdarzenia loadstart, playing, pause, ended, error), ale nie wydaje dźwięku.
 */
export class FakeAudio extends EventTarget {
  src = '';
  preload = '';
  currentTime = 0;
  duration = Number.NaN;
  paused = true;
  volume = 1;
  muted = false;
  readyState = 0;
  error: { code: number } | null = null;
  buffered = { length: 0, end: () => 0 } as unknown as TimeRanges;
  /** Ustaw na „blocked”, aby zasymulować blokadę autoodtwarzania przez przeglądarkę. */
  playMode: 'ok' | 'blocked' = 'ok';
  playCalls = 0;

  load() {
    this.error = null;
    if (!this.src) return;
    this.dispatchEvent(new Event('loadstart'));
    this.readyState = 1;
    this.duration = 120;
    this.dispatchEvent(new Event('loadedmetadata'));
    this.dispatchEvent(new Event('canplay'));
  }

  play(): Promise<void> {
    this.playCalls++;
    if (this.playMode === 'blocked')
      return Promise.reject(new DOMException('Wymagana interakcja', 'NotAllowedError'));
    this.paused = false;
    queueMicrotask(() => this.dispatchEvent(new Event('playing')));
    return Promise.resolve();
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  removeAttribute(name: string) {
    if (name === 'src') this.src = '';
  }

  /** Symuluje postęp odtwarzania. */
  advance(seconds: number) {
    this.currentTime += seconds;
    this.dispatchEvent(new Event('timeupdate'));
  }

  /** Symuluje koniec utworu (przeglądarka wysyła wtedy „pause”, a potem „ended”). */
  finish() {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
    this.dispatchEvent(new Event('ended'));
  }

  /** Symuluje błąd wczytywania (np. 2 = błąd sieci, 4 = źródło niedostępne). */
  fail(code: number) {
    this.error = { code };
    this.paused = true;
    this.dispatchEvent(new Event('error'));
  }

  asElement(): HTMLAudioElement {
    return this as unknown as HTMLAudioElement;
  }
}
