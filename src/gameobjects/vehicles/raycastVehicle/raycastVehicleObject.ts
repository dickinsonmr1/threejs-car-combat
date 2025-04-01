import * as THREE from "three";
import * as CANNON from 'cannon-es'
import { Utility } from "../../../utility";
import { RaycastWheelObject } from "./raycastWheelObject";
import { ChassisObject } from "../chassisObject";
import { IPlayerVehicle } from "../IPlayerVehicle";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VehicleConfig } from "../config/vehicleConfig";

export enum DriveSystem {
    AllWheelDrive,
    FrontWheelDrive,
    RearWheelDrive
}

export class RaycastVehicleObject implements IPlayerVehicle {
    
    wheels: RaycastWheelObject[] = [];
    chassis: ChassisObject;

    private raycastVehicle?: CANNON.RaycastVehicle;

    // TODO: use these
    private model!: THREE.Group;
    private wheelModels: THREE.Group[] = [];

    modelOffset?: THREE.Vector3;
    
    //private readonly maxSteerVal: number = Math.PI / 4;//0.7;
    //private readonly maxForce: number = 1500;

    private driveSystem: DriveSystem;
    private currentSpeed: number = 0;

    public getCurrentSpeed(): number {
        return this.currentSpeed;
    }

    private isActive: boolean = true;

    getRaycastVehicle(): CANNON.RaycastVehicle{
        return this.raycastVehicle!;
    }
    //mesh: THREE.Mesh;
    //body?: CANNON.Body;

    //meshMaterial: THREE.Material;
    //physicsMaterial?: CANNON.Material;
    /**
     *
     */

    vehicleOverrideConfig: VehicleConfig;

    constructor(scene: THREE.Scene,
        isDebug: boolean,        
        world: CANNON.World,
        wheelMaterial: CANNON.Material,

        modelData: GLTF,
        wheelModelData: GLTF,

        vehicleOverrideConfig: VehicleConfig)
    {

        this.vehicleOverrideConfig = vehicleOverrideConfig;

        const position = new THREE.Vector3(0,0,0);
        const wheelMass = 20;
        const chassisDimensions = Utility.ArrayToCannonVec3(vehicleOverrideConfig.chassisDimensions);
        const centerOfMassAdjust = Utility.ArrayToCannonVec3(vehicleOverrideConfig.centerOfMassAdjust);

        const frontWheelModelScale = Utility.ArrayToCannonVec3(vehicleOverrideConfig.frontWheelModelScale);
        const rearWheelModelScale = Utility.ArrayToCannonVec3(vehicleOverrideConfig.rearWheelModelScale);

        const frontWheelOffset = Utility.ArrayToCannonVec3(vehicleOverrideConfig.frontWheelOffset);
        const rearWheelOffset = Utility.ArrayToCannonVec3(vehicleOverrideConfig.rearWheelOffset);

        const modelOffset = Utility.ArrayToThreeVector3(vehicleOverrideConfig.modelOffset);
        const modelScale = Utility.ArrayToThreeVector3(vehicleOverrideConfig.modelScale);

        this.chassis = new ChassisObject(
            scene,
            isDebug,
            chassisDimensions,
            position,
            world,
            new CANNON.Material(), 
            vehicleOverrideConfig.chassisMass,
            centerOfMassAdjust
        );

        this.driveSystem = vehicleOverrideConfig.driveSystem;

        const frontWheelOptions = {
            radius: this.vehicleOverrideConfig.frontWheelRadius,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: this.vehicleOverrideConfig.suspensionStiffness,
            suspensionRestLength: this.vehicleOverrideConfig.suspensionRestLength,
            frictionSlip: this.vehicleOverrideConfig.frictionSlip, //5.0, // 1.4
            dampingRelaxation: this.vehicleOverrideConfig.dampingRelaxation,//6.0,
            dampingCompression:  this.vehicleOverrideConfig.dampingCompression,//5.0,
            maxSuspensionForce:  this.vehicleOverrideConfig.maxSuspensionForce,//100000,
            rollInfluence: this.vehicleOverrideConfig.rollInfluence,
            axleLocal: new CANNON.Vec3(0, 0, 1),
            chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1), //-1, 0, 1
            maxSuspensionTravel: this.vehicleOverrideConfig.maxSuspensionTravel,//, // 0.3     
            useCustomSlidingRotationalSpeed: this.vehicleOverrideConfig.useCustomSlidingRotationalSpeed,
            customSlidingRotationalSpeed: this.vehicleOverrideConfig.customSlidingRotationalSpeed,
        };

        const rearWheelOptions = {
            radius: this.vehicleOverrideConfig.rearWheelRadius,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: this.vehicleOverrideConfig.suspensionStiffness,
            suspensionRestLength: this.vehicleOverrideConfig.suspensionRestLength,
            frictionSlip: this.vehicleOverrideConfig.frictionSlip, //5.0, // 1.4
            dampingRelaxation: this.vehicleOverrideConfig.dampingRelaxation,//6.0,
            dampingCompression:  this.vehicleOverrideConfig.dampingCompression,//5.0,
            maxSuspensionForce:  this.vehicleOverrideConfig.maxSuspensionForce,//100000,
            rollInfluence: this.vehicleOverrideConfig.rollInfluence,
            axleLocal: new CANNON.Vec3(0, 0, 1),
            chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1), //-1, 0, 1
            maxSuspensionTravel:  this.vehicleOverrideConfig.maxSuspensionTravel,//, // 0.3
            useCustomSlidingRotationalSpeed: this.vehicleOverrideConfig.useCustomSlidingRotationalSpeed,
            customSlidingRotationalSpeed: this.vehicleOverrideConfig.customSlidingRotationalSpeed,
        };

        this.raycastVehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassis.body,
            //indexRightAxis: 0,
            //indexUpAxis: 1,
            //indexForwardAxis: 2
        });

        const axisWidth = chassisDimensions.z * 2.5; //0.75;
        const down = new CANNON.Vec3(0, -1, 0);
        
        const chassisLength = chassisDimensions.x;

        // front right
        frontWheelOptions.chassisConnectionPointLocal.set(-chassisLength + frontWheelOffset.x, frontWheelOffset.y, -axisWidth / 2);
        this.raycastVehicle.addWheel(frontWheelOptions);
        
        // front left
        frontWheelOptions.chassisConnectionPointLocal.set(-chassisLength + frontWheelOffset.x, frontWheelOffset.y, axisWidth / 2);
        this.raycastVehicle.addWheel(frontWheelOptions);
        
        // rear right
        rearWheelOptions.chassisConnectionPointLocal.set(chassisLength - rearWheelOffset.x, rearWheelOffset.y, -axisWidth / 2);
        this.raycastVehicle.addWheel(rearWheelOptions);

        // rear left
        rearWheelOptions.chassisConnectionPointLocal.set(chassisLength - rearWheelOffset.x, rearWheelOffset.y, axisWidth / 2);        
        rearWheelOptions.radius = this.vehicleOverrideConfig.rearWheelRadius;
        this.raycastVehicle.addWheel(rearWheelOptions);

        this.raycastVehicle.addToWorld(world);

        let i = 0;
        let wheelColor = 0x00ff00;
		this.raycastVehicle.wheelInfos.forEach(wheel => {
            
            var modelScale = frontWheelModelScale;
            var wheelHeight = this.vehicleOverrideConfig.frontWheelHeight;

            if(i > 1) {
                wheelColor = 0xff0000;
                modelScale = rearWheelModelScale;
                wheelHeight = this.vehicleOverrideConfig.rearWheelHeight;
            }            
            
            const temp = new RaycastWheelObject(scene, isDebug, wheel.radius, wheelHeight, wheelColor, world, wheelMaterial);                    
            this.wheels.push(temp);
            
            if(wheelModelData != null) {
 
                let temp = wheelModelData.scene.clone()
                temp.position.set(i, i, i);
                temp.rotateX(Math.PI);
                temp.scale.set(modelScale.x, modelScale.y, modelScale.z);

                this.wheelModels.push(temp);

                scene.add(this.wheelModels[i]);
            }

            i++;
		});

        if(modelData != null) {
            this.model = modelData.scene.clone();//.children[0];
            this.modelOffset = modelOffset;

            
            //if(this.model.children[1] != null) this.model.children[1].remove();
            //if(this.model.children[2] != null) this.model.children[2].remove();
            //if(this.model.children[3] != null) this.model.children[3].remove();
            //if(this.model.children[4] != null) this.model.children[4].remove();

            this.model.position.set(position.x + modelOffset.x, position.y + modelOffset.y, position.z + modelOffset.z);
            this.model.scale.set(modelScale.x, modelScale.y, modelScale.z);         
            this.model.rotateY(Math.PI / 2);

            scene.add(this.model);
        }

        
        if(wheelModelData != null) {

                    
            let temp = wheelModelData.scene;
            temp.position.set(5, 5, 5);
            //scene.add(temp);
            
            /*
            if(this.raycastVehicle != null) {
                for(let i = 0; i < this.raycastVehicle.wheelInfos.length; i++) {
                    
                    this.wheelModels[i].copy(wheelModelData.scene);
                    scene.add(this.wheelModels[i]);
                }
            } 
            */           
        }
    }

    respawnPosition(x: number, y: number, z: number): void {
        if(!this.isActive) return;
        if(!this.raycastVehicle) return;

        this.raycastVehicle.chassisBody.position.x = x;
        this.raycastVehicle.chassisBody.position.y = y;
        this.raycastVehicle.chassisBody.position.z = z;        

        this.raycastVehicle.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
    }

    tryJump(): void {      
        if(!this.isActive) return;  

        this.raycastVehicle?.chassisBody.applyImpulse(new CANNON.Vec3(0, this.chassis.body.mass * 7.5, 0));
    }
    
    tryTurbo(): void {
        if(!this.isActive) return;  

        let forwardVector = new THREE.Vector3(-100, 0, 0);
        forwardVector.applyQuaternion(this.getModel().quaternion);

        let vec3 = Utility.ThreeVec3ToCannonVec3(forwardVector);

        this.raycastVehicle?.chassisBody.applyImpulse(vec3);
    }

    resetPosition(position: THREE.Vector3): void {
        if(!this.raycastVehicle) return;

        this.raycastVehicle.chassisBody.position.x = position.x;
        this.raycastVehicle.chassisBody.position.y = position.y;
        this.raycastVehicle.chassisBody.position.z = position.z;

        this.raycastVehicle.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 0);
        this.raycastVehicle.chassisBody.angularVelocity = new CANNON.Vec3(0, 0, 0);
        this.raycastVehicle.chassisBody.velocity.set(0, 0, 0);
    }

    getChassis(): ChassisObject {
        return this.chassis;
    }

    getModel(): THREE.Group<THREE.Object3DEventMap> {
        return this.model;
    }

    getWheelModels(): THREE.Group<THREE.Object3DEventMap>[] {
        return this.wheelModels;
    }
    
    getCannonVehicleChassisBody(): CANNON.Body | undefined {
        return this.raycastVehicle?.chassisBody;
    }

    getPosition() {
        return this.chassis.mesh.position;
    }

    tryAccelerate(): void {
           
        if(!this.isActive) return;

        let engineForce = this.calculateEngineForce();

        // rear wheels
        if(this.driveSystem != DriveSystem.FrontWheelDrive) {
            this.raycastVehicle?.applyEngineForce(-engineForce, 2);
            this.raycastVehicle?.applyEngineForce(-engineForce, 3);
        }

        // front wheels
        if(this.driveSystem != DriveSystem.RearWheelDrive) {
            this.raycastVehicle?.applyEngineForce(-engineForce, 0);
            this.raycastVehicle?.applyEngineForce(-engineForce, 1);
        }
    }

    private calculateEngineForce(): number {
        //const maxEngineForce = 5000;  // Max torque at low speed for 
        const minEngineForce = this.vehicleOverrideConfig.highSpeedForce;  // Reduced torque at high speed
        const topSpeed = this.vehicleOverrideConfig.topSpeedForHigherTorque;          // The speed at which torque reduction starts

        // Scale engine force based on speed
        let currentEngineForce = 0;

        let scaledEngineForce = this.vehicleOverrideConfig.lowSpeedForce * (1 - Math.min(this.currentSpeed / topSpeed, 1)); 
        scaledEngineForce = Math.max(scaledEngineForce, minEngineForce); // Clamp to min force
        currentEngineForce = scaledEngineForce;


        // smoother throttle response

        //const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        //currentEngineForce = lerp(currentEngineForce, scaledEngineForce, deltaTime * 5);

        return currentEngineForce;
    }

    tryAccelerateWithJoystick(joystickY: number): void {
        if(!this.isActive) return;

        let engineForce = this.calculateEngineForce();

        // rear wheels
        if(this.driveSystem != DriveSystem.FrontWheelDrive) {
            this.raycastVehicle?.applyEngineForce(-engineForce * joystickY, 2);
            this.raycastVehicle?.applyEngineForce(-engineForce * joystickY, 3);
        }

        // front wheels
        if(this.driveSystem != DriveSystem.RearWheelDrive) {
            this.raycastVehicle?.applyEngineForce(-engineForce * joystickY, 0);
            this.raycastVehicle?.applyEngineForce(-engineForce * joystickY, 1);
        }

    }

    tryStopAccelerate(): void {
        if(!this.isActive) return;

        // rear wheels
        this.raycastVehicle?.applyEngineForce(0, 2);
        this.raycastVehicle?.applyEngineForce(0, 3);
        
        // front wheels
        this.raycastVehicle?.applyEngineForce(0, 0);
        this.raycastVehicle?.applyEngineForce(0, 1);
    }

    tryReverse(): void {
        if(!this.isActive) return;

        let engineForce = this.calculateEngineForce();

        // rear wheels
        if(this.driveSystem != DriveSystem.FrontWheelDrive) {
            this.raycastVehicle?.applyEngineForce(engineForce, 2);
            this.raycastVehicle?.applyEngineForce(engineForce, 3);
        }

        // front wheels
        if(this.driveSystem != DriveSystem.RearWheelDrive) {
            this.raycastVehicle?.applyEngineForce(engineForce, 0);
            this.raycastVehicle?.applyEngineForce(engineForce, 1);
        }
    }

    tryReverseWithJoystick(joystickY: number): void {
        if(!this.isActive) return;

        let engineForce = this.calculateEngineForce();
        var amount = Math.abs(joystickY);

        // rear wheels        
        if(this.driveSystem != DriveSystem.FrontWheelDrive) {
            this.raycastVehicle?.applyEngineForce(engineForce * amount, 2);
            this.raycastVehicle?.applyEngineForce(engineForce * amount, 3);
        }

        // front wheels
        if(this.driveSystem != DriveSystem.RearWheelDrive) {
            this.raycastVehicle?.applyEngineForce(engineForce * amount, 0);
            this.raycastVehicle?.applyEngineForce(engineForce * amount, 1);
        }
    }

    tryStopReverse(): void {
        if(!this.isActive) return;

        // rear wheels
        this.raycastVehicle?.applyEngineForce(0, 2);
        this.raycastVehicle?.applyEngineForce(0, 3);

        // front wheels
        this.raycastVehicle?.applyEngineForce(0, 0);
        this.raycastVehicle?.applyEngineForce(0, 1);
    }

    tryTurn(gamepadStickX: number): void {
        if(!this.isActive) return;
        
        // front wheels
        /*
        const deadZone = 0.15;
        this.raycastVehicle?.setSteeringValue(
            Math.abs(gamepadStickX) > deadZone
                ? this.vehicleOverrideConfig.maxSteerVal * gamepadStickX
                : 0,
            0
        );

        this.raycastVehicle?.setSteeringValue(
            Math.abs(gamepadStickX) > deadZone
                ? this.vehicleOverrideConfig.maxSteerVal * gamepadStickX
                : 0,
            1);
        */
        this.raycastVehicle?.setSteeringValue(this.vehicleOverrideConfig.maxSteerVal * gamepadStickX, 0);
        this.raycastVehicle?.setSteeringValue(this.vehicleOverrideConfig.maxSteerVal * gamepadStickX, 1);

        // rear wheels
        //this.raycastVehicle?.setSteeringValue(-this.maxSteerVal * gamepadStickX, 2);
        //this.raycastVehicle?.setSteeringValue(-this.maxSteerVal * gamepadStickX, 3);
    }

    tryTightTurn(gamepadStickX: number): void {
        if(!this.isActive) return;

        // front wheels
        this.raycastVehicle?.setSteeringValue(1.0 * gamepadStickX, 0);
        this.raycastVehicle?.setSteeringValue(1.0 * gamepadStickX, 1);

        // rear wheels
        //this.raycastVehicle?.setSteeringValue(-this.maxSteerVal * gamepadStickX, 2);
        //this.raycastVehicle?.setSteeringValue(-this.maxSteerVal * gamepadStickX, 3);
    }

    tryTurnLeft() {
        if(!this.isActive) return;

        this.raycastVehicle?.setSteeringValue(this.vehicleOverrideConfig.maxSteerVal, 0);
        this.raycastVehicle?.setSteeringValue(this.vehicleOverrideConfig.maxSteerVal, 1);
    }

    tryStopTurnLeft() {
        if(!this.isActive) return;

        this.raycastVehicle?.setSteeringValue(0, 0);
        this.raycastVehicle?.setSteeringValue(0, 1);
    }

    tryTurnRight(): void {
        if(!this.isActive) return;

        this.raycastVehicle?.setSteeringValue(-this.vehicleOverrideConfig.maxSteerVal, 0);
        this.raycastVehicle?.setSteeringValue(-this.vehicleOverrideConfig.maxSteerVal, 1);
    }
    tryStopTurnRight(): void {
        if(!this.isActive) return;

        this.raycastVehicle?.setSteeringValue(0, 0);
        this.raycastVehicle?.setSteeringValue(0, 1);
    }

    applyImpulseWhileWheelsAreDisabled(impulse: CANNON.Vec3):void {

        const originalStiffness = this.raycastVehicle?.wheelInfos.map(wheel => wheel.suspensionStiffness); // Save original values

        this.disableSuspension(this.raycastVehicle!);
        
        this.chassis.body.invInertia.set(1, 1, 1); // Equalize resistance to rotation
        this.chassis.body.applyImpulse(impulse, this.chassis.body.position.clone().vadd(this.chassis.body.shapeOffsets[0]));        
        this.chassis.body.torque.set(0, 0, 0);                

        this.enableSuspension(this.raycastVehicle!, originalStiffness!);
    }

    private disableSuspension(vehicle: CANNON.RaycastVehicle) {
        vehicle.wheelInfos.forEach((wheel) => {
          wheel.suspensionStiffness = 0; // Disable suspension
        });
      }
      
    private enableSuspension(vehicle: CANNON.RaycastVehicle, originalStiffness: number[]) {
        vehicle.wheelInfos.forEach((wheel, index) => {
          wheel.suspensionStiffness = originalStiffness[index]; // Restore original values
        });
      }

    update() {
        
        //this.raycastVehicle?.updateVehicle(1);
        this.chassis.update();  

        const forwardVelocity = this.chassis.body.velocity.dot(this.chassis.body.quaternion.vmult(new CANNON.Vec3(1, 0, 0)));
        this.currentSpeed = Math.abs(forwardVelocity); 

        if(this.vehicleOverrideConfig.driveSystem != this.driveSystem)
            this.driveSystem = this.vehicleOverrideConfig.driveSystem;

        //this.wheels.forEach(x => x.update());
        
        if(this.raycastVehicle != null) {
            for(let i = 0; i < this.raycastVehicle.wheelInfos.length; i++) {

                if(this.vehicleOverrideConfig.frictionSlip != this.raycastVehicle.wheelInfos[i].frictionSlip)
                    this.raycastVehicle.wheelInfos[i].frictionSlip = this.vehicleOverrideConfig.frictionSlip;

                if(this.vehicleOverrideConfig.rollInfluence != this.raycastVehicle.wheelInfos[i].rollInfluence)
                    this.raycastVehicle.wheelInfos[i].rollInfluence = this.vehicleOverrideConfig.rollInfluence;

                if(this.vehicleOverrideConfig.customSlidingRotationalSpeed != this.raycastVehicle.wheelInfos[i].customSlidingRotationalSpeed)
                    this.raycastVehicle.wheelInfos[i].customSlidingRotationalSpeed = this.vehicleOverrideConfig.customSlidingRotationalSpeed;
                
                if(this.vehicleOverrideConfig.suspensionStiffness != this.raycastVehicle.wheelInfos[i].suspensionStiffness)
                    this.raycastVehicle.wheelInfos[i].suspensionStiffness = this.vehicleOverrideConfig.suspensionStiffness;
                
                if(this.vehicleOverrideConfig.suspensionRestLength != this.raycastVehicle.wheelInfos[i].suspensionRestLength)
                    this.raycastVehicle.wheelInfos[i].suspensionRestLength = this.vehicleOverrideConfig.suspensionRestLength;

                // TODO: allow more properties to be updated via lil-gui debug panel
               
                this.raycastVehicle?.updateWheelTransform(i);

                const transform = this.raycastVehicle?.wheelInfos[i].worldTransform;

                if(this.isActive) {
                    let wheel = this.wheels[i];
                    
                    wheel.wheelBody.position.copy(transform.position);
                    wheel.wheelBody.quaternion.copy(transform.quaternion);

                    wheel.mesh.position.copy(Utility.CannonVec3ToThreeVec3(transform.position));
                    wheel.mesh.quaternion.copy(Utility.CannonQuaternionToThreeQuaternion(transform.quaternion));

                    this.wheelModels[i].position.copy(wheel.mesh.position);
                    this.wheelModels[i].quaternion.copy(wheel.mesh.quaternion);                
                    if(i == 0 || i == 2)
                        this.wheelModels[i].rotateY(Math.PI / 2);
                    else
                        this.wheelModels[i].rotateY(3 * Math.PI / 2);
                }
                //if(i < 2)
                    //this.wheelModels[i].rotateX(Math.PI);
                //else
                    //this.wheelModels[i].rotateX(Math.PI/2);

                if(this.model != null) {
                    //if(this.model.children[i+1] != null) {
                        //this.model.children[i+1].position.copy(wheel.mesh.position);
                        //this.model.children[i+1].rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);
                        //this.model.children[i+1].applyQuaternion(Utility.CannonQuaternionToThreeQuaternion(transform.quaternion));
                        //this.model.children[i+1].quaternion.copy(wheel.mesh.quaternion);
                    //}
                }

                /*
                if(t?.position != null)
                    this.wheels[i].mesh.position.copy(Utility.CannonVec3ToThreeVec3(t?.position));
                if(t?.quaternion != null)
                    this.wheels[i].mesh.quaternion.copy(Utility.CannonQuaternionToThreeQuaternion(t?.quaternion));
                */

                //this.wheels[i].update();    
            }
        }

        if(this.model != null) { // && this.modelOffset != null) {            
            
            this.model.quaternion.copy(Utility.CannonQuaternionToThreeQuaternion(this.chassis.body.quaternion));

            let offset = this.modelOffset!.clone();
            offset.applyQuaternion(Utility.CannonQuaternionToThreeQuaternion(this.chassis.body.quaternion));

            this.model.position.copy(Utility.CannonVec3ToThreeVec3(this.chassis.body.position));//.add(offset));
            this.model.position.add(offset);
        

            /*
            var temp = new THREE.Quaternion().multiplyQuaternions(
                Utility.CannonQuaternionToThreeQuaternion(this.chassis.body.quaternion),
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2)
            );
            this.model.quaternion.copy(temp);
            */
            
        }

        this.dampenLateralVelocityInLocalSpace();
        //this.wheels.forEach(x => x.update());
           
    }

    private dampenLateralVelocityInLocalSpace() {
        const chassis = this.chassis.body;

        // Get the vehicle's velocity in world space
        const velocity = chassis.velocity.clone();

        // Get the chassis orientation
        const quaternion = chassis.quaternion;

        // Convert velocity to local space
        const velocityLocal = quaternion.conjugate().vmult(velocity);

        // Reduce lateral movement (y-axis in local space is up)
        if(this.vehicleOverrideConfig.lateralMotionDampingMultiplier)
            velocityLocal.z *= this.vehicleOverrideConfig.lateralMotionDampingMultiplier;        
        else
            velocityLocal.z *= 0.92; // Dampen sideways motion (lateral velocity)

        // Convert velocity back to world space
        const velocityWorld = quaternion.vmult(velocityLocal);

        // Apply the adjusted velocity
        this.chassis.body.velocity.set(velocityWorld.x, chassis.velocity.y, velocityWorld.z);
    }

    setAcceptInput(isActive: boolean) {
        this.isActive = isActive;
    }
}