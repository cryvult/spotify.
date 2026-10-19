// Silnik odtwarzania oparty na HTML5 Audio API.
//
// Aplikacja ma dokładnie jeden obiekt AudioEngine (tworzy go PlayerProvider), więc nigdy
// nie grają dwa utwory naraz. Silnik nie zna Reacta: zgłasza zdarzenia przez subskrypcje,
// a postęp odtwarzania udostępnia w formie zgodnej z useSyncExternalStore.

export type EngineEvent =
  | { type: 'loading' }
  | { type: 'waiting' }
  | { type: 'ready' }
  | { type: 'playing' }
  | { type: 'paused' }
  | { type: 'ended' }
  | { type: 'error'; message: string };

/** Wynik próby odtworzenia: przeglądarka mogła zablokować dźwięk lub przerwać wczytywanie. */
export type PlayResult = 'playing' | 'blocked' | 'interrupted' | 'failed';

export interface PlaybackProgress {
  currentTime: number;
  duration: number;
  /** Ile sekund utworu zostało już pobrane. */
  buffered: number;
}

const MEDIA_ERROR_MESSAGES: Record<number, string> = {
  2: 'Błąd sieci podczas pobierania utworu. Sprawdź połączenie z internetem.',
  3: 'Nie udało się odczytać pliku audio. Plik może być uszkodzony.',
  4: 'Źródło audio jest niedostępne albo ma nieobsługiwany format.',
};

const EMPTY_PROGRESS: PlaybackProgress = { currentTime: 0, duration: 0, buffered: 0 };

export class AudioEngine {
  private readonly audio: HTMLAudioElement;
  private readonly listeners = new Set<(event: EngineEvent) => void>();
  private readonly progressListeners = new Set<() => void>();
  private readonly cleanups: Array<() => void> = [];
  private progress: PlaybackProgress = EMPTY_PROGRESS;
  private source: string | null = null;
  private pendingSeek: number | null = null;
  private attached = false;
  /**
   * Zmiana źródła w trakcie grania może wywołać zdarzenie „pause”. Nie jest to pauza
   * użytkownika, więc ignorujemy je do czasu rozpoczęcia wczytywania (loadstart).
   */
  private ignorePause = false;

  constructor(audio: HTMLAudioElement = new Audio()) {
    this.audio = audio;
    this.audio.preload = 'auto';
  }

  /**
   * Podłącza nasłuchiwacze zdarzeń elementu audio. Wywoływane w efekcie Reacta;
   * para attach/detach działa poprawnie także przy podwójnym montowaniu w trybie StrictMode.
   */
  attach(): void {
    if (this.attached) return;
    this.attached = true;
    this.listen('loadstart', () => {
      this.ignorePause = false;
      this.emit({ type: 'loading' });
    });
    this.listen('waiting', () => this.emit({ type: 'waiting' }));
    this.listen('canplay', () => this.emit({ type: 'ready' }));
    this.listen('playing', () => this.emit({ type: 'playing' }));
    this.listen('pause', () => {
      if (!this.ignorePause) this.emit({ type: 'paused' });
    });
    this.listen('ended', () => this.emit({ type: 'ended' }));
    this.listen('error', () => this.handleError());
    this.listen('loadedmetadata', () => {
      if (this.pendingSeek !== null) {
        this.audio.currentTime = Math.min(this.pendingSeek, this.audio.duration || this.pendingSeek);
        this.pendingSeek = null;
      }
      this.updateProgress();
    });
    for (const name of ['timeupdate', 'durationchange', 'progress', 'seeked', 'emptied'] as const) {
      this.listen(name, () => this.updateProgress());
    }
  }

  /** Zatrzymuje dźwięk, zwalnia plik i usuwa wszystkie nasłuchiwacze zdarzeń. */
  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    this.source = null;
    this.pendingSeek = null;
    this.audio.pause();
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups.length = 0;
    this.audio.removeAttribute('src');
    this.audio.load();
    this.setProgress(EMPTY_PROGRESS);
  }

  /** Wczytuje nowy plik. `startAt` pozwala wznowić utwór od zapamiętanego miejsca. */
  load(source: string, startAt = 0): void {
    if (!this.attached) return;
    this.source = source;
    this.pendingSeek = startAt > 0 ? startAt : null;
    this.ignorePause = !this.audio.paused;
    this.audio.src = source;
    this.audio.load();
    this.setProgress(EMPTY_PROGRESS);
  }

  async play(): Promise<PlayResult> {
    if (!this.attached || !this.source) return 'failed';
    try {
      await this.audio.play();
      return 'playing';
    } catch (error) {
      if (error instanceof DOMException) {
        // NotAllowedError: przeglądarka wymaga interakcji użytkownika przed odtworzeniem dźwięku.
        if (error.name === 'NotAllowedError') return 'blocked';
        // AbortError: odtwarzanie przerwało wczytanie innego utworu. To normalna sytuacja.
        if (error.name === 'AbortError') return 'interrupted';
      }
      return 'failed';
    }
  }

  pause(): void {
    this.audio.pause();
  }

  seek(seconds: number): void {
    if (!this.source) return;
    const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : Infinity;
    const target = Math.max(0, Math.min(seconds, duration));
    if (this.audio.readyState === 0) {
      this.pendingSeek = target;
    } else {
      this.audio.currentTime = target;
    }
    this.setProgress({ ...this.progress, currentTime: target });
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.min(1, Math.max(0, volume));
  }

  setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  getCurrentTime(): number {
    return this.audio.currentTime || 0;
  }

  isPaused(): boolean {
    return this.audio.paused;
  }

  /** Subskrypcja zdarzeń silnika. Zwraca funkcję, która ją anuluje. */
  subscribe = (listener: (event: EngineEvent) => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Dla useSyncExternalStore: powiadomienie o zmianie postępu. */
  subscribeProgress = (listener: () => void): (() => void) => {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  };

  /** Dla useSyncExternalStore: ten sam obiekt, dopóki postęp się nie zmieni. */
  getProgress = (): PlaybackProgress => this.progress;

  private listen(name: keyof HTMLMediaElementEventMap, handler: () => void): void {
    this.audio.addEventListener(name, handler);
    this.cleanups.push(() => this.audio.removeEventListener(name, handler));
  }

  private emit(event: EngineEvent): void {
    if (!this.attached || !this.source) return;
    this.listeners.forEach((listener) => listener(event));
  }

  private handleError(): void {
    // Po usunięciu źródła przeglądarka też zgłasza błąd: wtedy go ignorujemy.
    if (!this.source || !this.attached) return;
    const code = this.audio.error?.code ?? 0;
    if (code === 1) return; // MEDIA_ERR_ABORTED: wczytywanie przerwane celowo.
    this.emit({ type: 'error', message: MEDIA_ERROR_MESSAGES[code] ?? 'Nie udało się odtworzyć utworu.' });
  }

  private updateProgress(): void {
    const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
    const ranges = this.audio.buffered;
    const buffered = ranges && ranges.length > 0 ? ranges.end(ranges.length - 1) : 0;
    const currentTime = this.pendingSeek ?? this.audio.currentTime ?? 0;
    const next = { currentTime, duration, buffered };
    const previous = this.progress;
    if (
      Math.abs(previous.currentTime - next.currentTime) < 0.01 &&
      previous.duration === next.duration &&
      Math.abs(previous.buffered - next.buffered) < 0.5
    ) {
      return;
    }
    this.setProgress(next);
  }

  private setProgress(progress: PlaybackProgress): void {
    this.progress = progress;
    this.progressListeners.forEach((listener) => listener());
  }
}

/**
 * iOS nie pozwala zmieniać głośności z poziomu strony (tylko przyciskami telefonu).
 * Sprawdzamy to, aby nie pokazywać suwaka, który nic nie robi.
 */
export function canControlVolume(): boolean {
  try {
    const probe = new Audio();
    probe.volume = 0.5;
    return probe.volume === 0.5;
  } catch {
    return false;
  }
}
