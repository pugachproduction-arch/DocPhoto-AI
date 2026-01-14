
import { PhotoSize, SheetSize } from './types';

export const PHOTO_SIZES: PhotoSize[] = [
  { label: '3x4 см', width: 30, height: 40, unit: 'mm' },
  { label: '3.5x4.5 см', width: 35, height: 45, unit: 'mm' },
  { label: '4x6 см', width: 40, height: 60, unit: 'mm' },
  { label: '9x12 см', width: 90, height: 120, unit: 'mm' },
];

export const SHEET_SIZES: SheetSize[] = [
  { label: 'A4', width: 210, height: 297 },
  { label: 'A5', width: 148, height: 210 },
  { label: 'A6', width: 105, height: 148 },
];

export const BG_COLORS = [
  { label: 'Белый', value: '#FFFFFF' },
  { label: 'Серый', value: '#E5E7EB' },
  { label: 'Синий', value: '#1E40AF' },
];

export const THEME = {
  bgPrimary: '#064e3b',
  bgSecondary: '#065f46', // ~20% lighter
  accent: '#10b981',
};
