import { GamepadControlScheme } from "./scenes/gamePadEnums";

export interface GameConfig {
    isDebug: boolean;    
    controlType: GamepadControlScheme;
    gamePadAxesDeadZoneX: number;
    gamePadAxesDeadZoneY: number;
    isSoundEnabled: boolean;

    farDrawDistance: number;
    
    useFog: boolean;
    fogNear: number;
    fogFar: number;
    
    wheelGroundContactMaterialFriction: number;
    wheelGroundContactMaterialRestitution: number;
    contactEquationRelaxation: number;
    contactEquationStiffness: number;

    overrideRenderResolution: boolean;
    renderResolutionOverrideX?: number;
    renderResolutionOverrideY?: number;
}