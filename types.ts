
export enum AppScreen {
  HOME = 'HOME',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW',
  EXPORT = 'EXPORT'
}

export type PhotoSize = {
  label: string;
  width: number;
  height: number;
  unit: 'mm';
};

export type SheetSize = {
  label: string;
  width: number;
  height: number;
};

export type SheetOrientation = 'portrait' | 'landscape';

export type ExportFormat = 'JPG' | 'PNG' | 'PDF';

export interface AppState {
  screen: AppScreen;
  originalImage: string | null;
  editedImage: string | null;
  selectedSize: PhotoSize;
  bgColor: string;
  sheetSize: SheetSize;
  sheetOrientation: SheetOrientation;
  exportFormat: ExportFormat;
}
