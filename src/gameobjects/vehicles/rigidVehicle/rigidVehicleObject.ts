import * as THREE from "three";
import * as CANNON from 'cannon-es'
import { ChassisObject } from "../chassisObject";
import { SphereWheelObject } from "./sphereWheelObject";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Utility } from "../../../utility";
import { IPlayerVehicle } from "../IPlayerVehicle";
import { VehicleConfig } from "../config/vehicleConfig";

export class RigidVehicleObject implements IPlayerVehicle {
    
    wheels: SphereWheelObject[] = [];
    chassis: ChassisObject;

    private rigidVehicle?: CANNON.RigidVehicle;

    private model!: THREE.Group;
    modelOffset?: THREE.Vector3;

    private readonly maxForceRigidBodyVehicle: number = 25;
    private readonly rigidMaxSteerVal: number = Math.PI / 12;

    constructor(scene: THREE.Scene,
        isDebug: boolean,
        position: THREE.Vector3,
        world: CANNON.World,
        chassisDimensions: CANNON.Vec3,        
        centerOfMassAdjust: CANNON.Vec3,
        chassisMass: number,
        wheelMaterial: CANNON.Material,
        wheelRadius: number,
        wheelOffset: CANNON.Vec3,
        wheelMass: number,
        vehicleOverrideConfig: VehicleConfig,
        modelData?: GLTF,
        modelScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1),
        modelOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {

        this.vehicleOverrideConfig = vehicleOverrideConfig;

        this.chassis = new ChassisObject(
            scene,
            isDebug,
            chassisDimensions,
            position,
            world,
            new CANNON.Material(), 
            chassisMass,
            centerOfMassAdjust
        );

        this.rigidVehicle = new CANNON.RigidVehicle({
            chassisBody: this.chassis.body
        });
        
        const axisWidth = chassisDimensions.z * 2.5; //0.75;
        const down = new CANNON.Vec3(0, -1, 0);
        
        const chassisLength = chassisDimensions.x;
        //const chassisHalfLength = chassisDimensions.x / 2;

        // front left
        const frontLeftWheel = new SphereWheelObject(
            scene,
            wheelRadius,
            0x00ff00,
            world,
            wheelMaterial,
            wheelMass
        );
        this.rigidVehicle.addWheel({
            body: frontLeftWheel.wheelBody,
            position: new CANNON.Vec3(-chassisLength, 0, axisWidth / 2).vadd(wheelOffset),
            axis: new CANNON.Vec3(0, 0, 1),
            direction: down,
        });
        this.wheels.push(frontLeftWheel);

        // front right
        const frontRightWheel = new SphereWheelObject(
            scene,
            wheelRadius,
            0x00ff00,
            world,
            wheelMaterial,
            wheelMass
        );
        this.rigidVehicle.addWheel({
            body: frontRightWheel.wheelBody,
            position: new CANNON.Vec3(-chassisLength, 0, -axisWidth / 2).vadd(wheelOffset),
            axis: new CANNON.Vec3(0, 0, 1),
            direction: down,
        });
        this.wheels.push(frontRightWheel);        
        
        // rear left
        const rearLeftWheel = new SphereWheelObject(
            scene,
            wheelRadius,
            0xff0000,
            world,
            wheelMaterial,
            wheelMass
        );
        this.rigidVehicle.addWheel({
            body: rearLeftWheel.wheelBody,
            position: new CANNON.Vec3(chassisLength, 0, axisWidth / 2).vadd(wheelOffset),
            axis: new CANNON.Vec3(0, 0, -1),
            direction: down,
        });
        this.wheels.push(rearLeftWheel);

        // rear right
        const rearRightWheel = new SphereWheelObject(
            scene,
            wheelRadius,
            0xff0000,
            world,
            wheelMaterial,
            wheelMass
        );
        this.rigidVehicle.addWheel({
            body: rearRightWheel.wheelBody,
            position: new CANNON.Vec3(chassisLength, 0, -axisWidth / 2).vadd(wheelOffset),
            axis: new CANNON.Vec3(0, 0, -1),
            direction: down,
        });
        this.wheels.push(rearRightWheel);        
      
        this.rigidVehicle.addToWorld(world);


        if(modelData != null) {
            this.model = modelData.scene;//.children[0];
            this.modelOffset = modelOffset;

            this.model.position.set(position.x + modelOffset.x, position.y + modelOffset.y, position.z + modelOffset.z);
            this.model.scale.set(modelScale.x, modelScale.y, modelScale.z);         
            this.model.rotateY(Math.PI / 2);
        }
    }
    vehicleOverrideConfig: VehicleConfig;
    getCurrentSpeed(): number {
        throw new Error("Method not implemented.");
    }
    getForwardVelocity(): number {
        throw new Error("Method not implemented.");
    }
    getRaycastVehicle(): CANNON.RaycastVehicle {
        throw new Error("Method not implemented.");
    }
    setAcceptInput(isActive: boolean): void {
        throw new Error("Method not implemented.");
    }
    tryAccelerateWithJoystick(y: number): void {
        throw new Error("Method not implemented.");
    }
    tryReverseWithJoystick(y: number): void {
        throw new Error("Method not implemented.");
    }
    getWheelModels(): THREE.Group[] {
        throw new Error("Method not implemented.");
    }
    tryTightTurn(x: number): void {
        throw new Error("Method not implemented.");
    }
    tryJump(): void {
        throw new Error("Method not implemented.");
    }
    
    tryTurbo(): void {
        throw new Error("Method not implemented.");
    }

    tryBrake(): void {
        throw new Error("Method not implemented.");
    }

    getChassis(): ChassisObject {
        return this.chassis;
    }
    getChassisPosition(): THREE.Vector3 {
        return this.chassis.getPosition();
    }
    getChassisQuaternion(): CANNON.Quaternion {
        return this.chassis.body.quaternion;
    }
    getModelQuaternion(): THREE.Quaternion {
        return this.model.quaternion;
    }
    getModel(): THREE.Group<THREE.Object3DEventMap> {
        return this.model;
    }

    getCannonVehicleChassisBody(): CANNON.Body | undefined {
        return this.rigidVehicle?.chassisBody;
    }

    getPosition() {
        return this.chassis.mesh.position;
    }

    respawnPosition(x: number, y: number, z: number): void {
        if(!this.rigidVehicle) return;

        this.rigidVehicle.chassisBody.position.x = x;
        this.rigidVehicle.chassisBody.position.y = y;
        this.rigidVehicle.chassisBody.position.z = z;        

        this.rigidVehicle.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
    }

    resetPosition(): void {
        if(!this.rigidVehicle) return;

        this.rigidVehicle.chassisBody.position.y = 5;
        this.rigidVehicle.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
    }

    tryTurn(gamepadStickX: number): void {
        // front wheels
        this.rigidVehicle?.setSteeringValue(this.rigidMaxSteerVal * gamepadStickX, 0);
        this.rigidVehicle?.setSteeringValue(this.rigidMaxSteerVal * gamepadStickX, 1);

        // rear wheels
        this.rigidVehicle?.setSteeringValue(-this.rigidMaxSteerVal * gamepadStickX, 2);
        this.rigidVehicle?.setSteeringValue(-this.rigidMaxSteerVal * gamepadStickX, 3);
    }

    tryTurnLeft(): void {
        // front wheels
        this.rigidVehicle?.setSteeringValue(this.rigidMaxSteerVal, 0);
        this.rigidVehicle?.setSteeringValue(this.rigidMaxSteerVal, 1);

        // rear wheels
        this.rigidVehicle?.setSteeringValue(-this.rigidMaxSteerVal, 2);
        this.rigidVehicle?.setSteeringValue(-this.rigidMaxSteerVal, 3);
    }

    setDrifting(): void {
        throw new Error("Method not implemented.");
    }

    resetTurn(): void {
        // front wheels
        this.rigidVehicle?.setSteeringValue(0, 0);
        this.rigidVehicle?.setSteeringValue(0, 1);

        // rear wheels
        this.rigidVehicle?.setSteeringValue(0, 2);
        this.rigidVehicle?.setSteeringValue(0, 3);
    }

    tryTurnRight(): void {
        // front wheels
        this.rigidVehicle?.setSteeringValue(-this.rigidMaxSteerVal, 0);
        this.rigidVehicle?.setSteeringValue(-this.rigidMaxSteerVal, 1);

        // rear wheels
        this.rigidVehicle?.setSteeringValue(this.rigidMaxSteerVal, 2);
        this.rigidVehicle?.setSteeringValue(this.rigidMaxSteerVal, 3);
    }
    tryStopTurnRight(): void {
        // front wheels
        this.rigidVehicle?.setSteeringValue(0, 0);
        this.rigidVehicle?.setSteeringValue(0, 1);

        // rear wheels
        this.rigidVehicle?.setSteeringValue(0, 2);
        this.rigidVehicle?.setSteeringValue(0, 3);
    }

    tryAccelerate(): void {
        // rear wheels
        this.rigidVehicle?.setWheelForce(-this.maxForceRigidBodyVehicle, 2);
        this.rigidVehicle?.setWheelForce(-this.maxForceRigidBodyVehicle, 3);

        // front wheels
        //this.rigidVehicleObject?.setWheelForce(this.maxForceRigidBodyVehicle, 0);
        //this.rigidVehicleObject?.setWheelForce(this.maxForceRigidBodyVehicle, 1);
    }
    tryStopAccelerate(): void {
       // rear wheels
       this.rigidVehicle?.setWheelForce(0, 2);
       this.rigidVehicle?.setWheelForce(0, 3);

       // front wheels
       //this.rigidVehicleObject?.setWheelForce(0, 0);
       //this.rigidVehicleObject?.setWheelForce(0, 1);
    }

    tryReverse(): void {
        // rear wheels
        this.rigidVehicle?.setWheelForce(this.maxForceRigidBodyVehicle, 2);
        this.rigidVehicle?.setWheelForce(this.maxForceRigidBodyVehicle, 3);

        // front wheels
        //this.rigidVehicleObject?.setWheelForce(-this.maxForceRigidBodyVehicle, 0);
        //this.rigidVehicleObject?.setWheelForce(-this.maxForceRigidBodyVehicle, 1);
    }
    tryStopReverse(): void {
        // rear wheels
        this.rigidVehicle?.setWheelForce(0, 2);
        this.rigidVehicle?.setWheelForce(0, 3);

        //this.rigidVehicleObject?.setWheelForce(0, 0);
        //this.rigidVehicleObject?.setWheelForce(0, 1);
    }

    applyImpulseWhileWheelsAreDisabled(impulse: CANNON.Vec3): void {
        throw new Error("Method not implemented.");
    }

    preUpdate(): void {
        throw new Error("Method not implemented.");
    }

    update() {
        this.chassis.update();            
        this.wheels.forEach(x => x.update());   
        
        if(this.model != null && this.modelOffset != null) {            
            
            this.model.position.copy(Utility.CannonVec3ToThreeVec3(this.chassis.body.position));//.add(this.modelOffset));
            this.model.quaternion.copy(Utility.CannonQuaternionToThreeQuaternion(this.chassis.body.quaternion));

            /*
            var temp = new THREE.Quaternion().multiplyQuaternions(
                Utility.CannonQuaternionToThreeQuaternion(this.chassis.body.quaternion),
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2)
            );
            this.model.quaternion.copy(temp);
            */
            
        }
    }

    getBrakeForceOnWheels(): number[] {
        return [];
    }
    
    getCurrentSlip(): number {
        return -1;
    }
}