import { PrecipitationType } from "./precipitationSystem";

export interface WorldConfig {
    name: string;
    menuButtonIcon: string;
    heightMap: string;
    heightScale: number;
    horizontalScale: number;
    
    texture1: string;
    texture2: string;
    texture3: string;
    texture4: string;
    texture5: string;  

    roadMaskTexture?: string;
    roadTexture?: string;
    
    skyTexture: string;

    precipitationType: PrecipitationType;

    waterY?: number;

    grassBillboard: string;
    grassBillboardStartY: number;
    grassBillboardEndY: number;

    fogColor: string;
}  


export interface WorldLibrary {
    items: WorldConfig[];
}