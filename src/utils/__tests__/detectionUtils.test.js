import { describe, expect, it } from 'vitest';
import { DETECTION_MODES } from '../../constants/detection.js';
import { countPersons, filterDetectionsByMode, formatConfidence, getJapaneseClassName } from '../detectionUtils.js';

const sample = [
  { classIdx: 0, score: 0.95, bbox: [10, 20, 100, 200] },
  { classIdx: 0, score: 0.87, bbox: [150, 20, 100, 200] },
  { classIdx: 16, score: 0.82, bbox: [300, 100, 80, 100] },
];

describe('detection utilities', () => {
  it('counts people after NMS result normalization', () => { expect(countPersons(sample)).toBe(2); });
  it('counts three people correctly', () => { expect(countPersons([...sample, { classIdx: 0, score: 0.7, bbox: [1, 2, 3, 4] }])).toBe(3); });
  it('filters person-only mode', () => { expect(filterDetectionsByMode(sample, DETECTION_MODES.PERSON_ONLY)).toHaveLength(2); });
  it('keeps all detections in all-object mode', () => { expect(filterDetectionsByMode(sample, DETECTION_MODES.ALL)).toHaveLength(3); });
  it('handles empty and invalid inputs', () => { expect(countPersons(null)).toBe(0); expect(filterDetectionsByMode(undefined, DETECTION_MODES.ALL)).toEqual([]); });
  it('falls back for unknown classes', () => { expect(getJapaneseClassName(999)).toBe('クラス 999'); });
  it('translates known classes', () => { expect(getJapaneseClassName(0)).toBe('人物'); expect(getJapaneseClassName(16)).toBe('犬'); });
  it('formats confidence as percentage', () => { expect(formatConfidence(0.925)).toBe('93%'); expect(formatConfidence(2)).toBe('100%'); });
});
