import { describe, expect, it } from 'vitest';
import { describeDuration, formatDuration, formatTotalDuration } from './formatDuration';
import { formatCount, pluralize, TRACK_FORMS } from './pluralize';

describe('formatDuration', () => {
  it('formatuje minuty i sekundy z wiodącym zerem', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(7)).toBe('0:07');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(187.9)).toBe('3:07');
  });

  it('dodaje godziny dla długich nagrań', () => {
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  it('zwraca 0:00 dla wartości nieprawidłowych', () => {
    expect(formatDuration(Number.NaN)).toBe('0:00');
    expect(formatDuration(-5)).toBe('0:00');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('formatTotalDuration', () => {
  it('opisuje łączny czas listy', () => {
    expect(formatTotalDuration(45)).toBe('45 s');
    expect(formatTotalDuration(750)).toBe('12 min 30 s');
    expect(formatTotalDuration(600)).toBe('10 min');
    expect(formatTotalDuration(3900)).toBe('1 godz. 5 min');
    expect(formatTotalDuration(7200)).toBe('2 godz.');
  });

  it('opisuje czas dla czytników ekranu', () => {
    expect(describeDuration(187)).toBe('3 min 7 s');
  });
});

describe('pluralize', () => {
  it('stosuje polskie formy liczby mnogiej', () => {
    expect(pluralize(1, TRACK_FORMS)).toBe('utwór');
    expect(pluralize(2, TRACK_FORMS)).toBe('utwory');
    expect(pluralize(4, TRACK_FORMS)).toBe('utwory');
    expect(pluralize(5, TRACK_FORMS)).toBe('utworów');
    expect(pluralize(12, TRACK_FORMS)).toBe('utworów');
    expect(pluralize(22, TRACK_FORMS)).toBe('utwory');
    expect(pluralize(0, TRACK_FORMS)).toBe('utworów');
    expect(formatCount(25, TRACK_FORMS)).toBe('25 utworów');
  });
});
