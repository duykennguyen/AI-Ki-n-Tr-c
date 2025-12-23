
export enum AppMode {
  SKETCH_TO_RENDER = 'SKETCH_TO_RENDER',
  PERSPECTIVE_TO_FLOORPLAN = 'PERSPECTIVE_TO_FLOORPLAN',
  HOME_RENOVATION = 'HOME_RENOVATION',
  LAND_TO_FLOORPLAN = 'LAND_TO_FLOORPLAN'
}

export interface DesignVariant {
  id: string;
  style: string;
  imageUrl: string;
  description: string;
}

export interface AnalysisResult {
  architectureStyle: string;
  structureNotes: string;
  recommendations: string;
}

export interface GenerationState {
  isAnalyzing: boolean;
  isGenerating: boolean;
  analysis: AnalysisResult | null;
  variants: DesignVariant[];
  error: string | null;
}
