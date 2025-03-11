import { DriveSystem } from "../raycastVehicle/raycastVehicleObject";

export interface VehicleConfig {

    vehicleTypeEnum: number;
    vehicleName: string;
    asset: string;
    health: number;
    special: number;
    speed: number;
    defensiveSpecial: number;
    
    comment: string;
    
    // wheel properties
    frontWheelHeight: number;
    rearWheelHeight: number;

    frontWheelRadius: number;
    rearWheelRadius: number;

    frontWheelOffset: number[];
    rearWheelOffset: number[];

    frontWheelModelScale: number[];
    rearWheelModelScale: number[];

    wheelMass: number;
    
    frictionSlip: number; // Lower slip = more grip (1.2 is high grip)
    rollInfluence: number; // Reduces car tilting
    useCustomSlidingRotationalSpeed: boolean;
    customSlidingRotationalSpeed: number; // Helps prevent sliding
    lateralMotionDampingMultiplier?: number; // 
    
    // suspension
    suspensionStiffness: number;
    suspensionRestLength: number;
    dampingRelaxation: number; // Helps reduce bouncing
    dampingCompression: number; // Stiffens suspension for control
    maxSuspensionForce: number;
    maxSuspensionTravel: number;

    maxSteerVal: number;

    // chassis properties
    chassisMass: number;
    chassisDimensions: number[];
    centerOfMassAdjust: number[];

    modelScale: number[];
    modelOffset: number[];

    hasEmergencyLights1?: boolean;
    hasEmergencyLights2?: boolean;
    offsetLeft1?: number[];
    offsetRight1?: number[];
    offsetLeft2?: number[];
    offsetRight2?: number[];
    
    //
    lowSpeedForce: number; // max torque at low speed for faster acceleration
    highSpeedForce: number; // reduced torque at higher speed
    topSpeedForHigherTorque: number; // speed at which torque reduction starts
    driveSystem: DriveSystem;
}