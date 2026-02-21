// import { v4 as uuidv4 } from 'uuid';
import { ProjectileType } from "../weapons/projectileType";
import { Utility } from "../../utility";
import Headlights from "../vehicles/headLights";
import * as THREE from "three";
import { v4 as uuidv4 } from 'uuid';
import GameScene from "../../scenes/gameScene";
import ProjectileFactory from "../weapons/projectileFactory";
import { Projectile, ProjectileLaunchLocation } from "../weapons/projectile";
import { IPlayerVehicle } from "../vehicles/IPlayerVehicle";
import { ParticleEmitterType, ParticleTrailObject } from "../fx/particleTrailObject";
import * as CANNON from 'cannon-es';
import { Target } from "../target";
import { PlayerMarker } from "./playerMarker";
import { FlamethrowerEmitter } from "../weapons/flamethrowerEmitter";
import { Shield } from "../vehicles/shield";
import { ParticleEmitter } from "../fx/particleEmitter";
import { SmokeObject2 } from "../fx/smokeObject2";
import Brakelights from "../vehicles/brakeLights";
import { randInt } from "three/src/math/MathUtils.js";
import EmergencyLights from "../vehicles/emergencyLights";
import { CpuPlayerPattern } from "./cpuPlayerPatternEnums";
import { VehicleConfig } from "../vehicles/config/vehicleConfig";
import { WeaponCoolDownClock } from "../weapons/weaponCooldownClock";
import { ExplosionGpuParticleEmitter } from "../fx/explosionGpuParticleEmitter";
import { FireGpuParticleEmitter2 } from "../fx/fire/fireGpuParticleEmitter2";
import { SpecialType } from "./specialType";

export enum PlayerState {
    Alive,
    Dead,
    Respawning
}

export enum VehicleType {
    
    Taxi = 0,
    Ambulance = 1,
    
    RaceCar = 2,
    RaceCarRed = 3,

    Killdozer = 4,
    Police = 5,
    TrashTruck = 6,

    Offroader = 7,

    FireTruck = 8,

    PoliceTractor = 9,
    Harvester = 10,
    
    PoliceSuv = 11,

    Tank = 12,
    Tanker = 13
}


export enum PlayerTeam {
    Red,
    Blue,
    Green,
    Yellow
}

// TODO: convert to abstract class and add 1 child class per vehicle type
export class Player {

    scene: THREE.Scene;
    isDebug: boolean;
    public playerName: string;

    public isCpuPlayer: boolean;
    public playerId: string;
    maxHealth: number;
    currentHealth: number;

    static RespawnTimeinMs: number = 5000;

    playerState: PlayerState = PlayerState.Alive;

    headLights!: Headlights;
    brakeLights!: Brakelights;
    emergencyLights!: EmergencyLights;
    emergencyLights2!: EmergencyLights;

    private vehicleObject!: IPlayerVehicle;    
    turboParticleEmitter: ParticleTrailObject;
    
    throttle: number = 0;
    currentRate: number = 1.0; // idle pitch

    private brakeForces: number[] = [];
    private currentWheelSlip: number = 0;

    leftRearWheelDustEmitter: ParticleTrailObject;
    rightRearWheelDustEmitter: ParticleTrailObject;

    flamethrowerEmitter: FlamethrowerEmitter;

    fireObjects: ParticleEmitter[] = [];

    playerColor: THREE.Color;
    target!: Target;
    playerMarker!: PlayerMarker;

    private fireLeft: boolean = false;
    private projectileFactory: ProjectileFactory;// = new ProjectileFactory();

    private bulletCooldownClock: WeaponCoolDownClock = new WeaponCoolDownClock(0.15, 0.05);
    private megaGunCooldownClock: WeaponCoolDownClock = new WeaponCoolDownClock(0.05, 0.05);

    private deathExplosionCooldownClock: WeaponCoolDownClock = new WeaponCoolDownClock(0.25, 0.25);
    private rocketCooldownClock: WeaponCoolDownClock = new WeaponCoolDownClock(0.5, 0.5);
    private triRocketCooldownClock: WeaponCoolDownClock = new WeaponCoolDownClock(1, 1);
    private airstrikeCooldownClock: WeaponCoolDownClock = new WeaponCoolDownClock(0.25, 0.25);
    private sonicPulseCooldownClock: WeaponCoolDownClock = new WeaponCoolDownClock(1.00, 1.00);
    private dumpsterCooldownClock: WeaponCoolDownClock = new WeaponCoolDownClock(1.00, 1.00);

    public shovelCooldownClock: WeaponCoolDownClock = new WeaponCoolDownClock(8, 1);
    public currentShovelAngle: number = 0;

    flamethrowerBoundingBox: THREE.Mesh;
    lightningBoundingMesh: THREE.Mesh;
    boundingMeshMaterial: THREE.MeshBasicMaterial;
    
    flamethrowerActive: boolean = false;
    lightningActive: boolean = false;

    shovelBoundingMesh: THREE.Mesh;
    
    private activeAirstrike!: Projectile;

    private selectedWeaponIndex: number = 0;

    private shield!: Shield;

    private deathCount: number = 0;
    public getDeathCount() {
        return this.deathCount;
    }

    private readonly bulletSoundMarker?: THREE.Mesh;    
    private readonly rocketSoundMarker?: THREE.Mesh;   
    
    private readonly deadzoneX: number;

    vehicleType: VehicleType;
    specialType: SpecialType;

    private maxSoundEffectIndex: number = 0;

    public getNextAvailableSoundEffectIndex(): number {
        return this.maxSoundEffectIndex++;
    }

    private getEngineSoundKey(): string {
        switch(this.vehicleType) {
            case VehicleType.Ambulance:
            case VehicleType.FireTruck:
            case VehicleType.Harvester:
            case VehicleType.Killdozer:
            case VehicleType.PoliceTractor:
            case VehicleType.TrashTruck:
            case VehicleType.Tank:
            case VehicleType.Tanker:
                return "engineLarge";
            case VehicleType.RaceCar:
            case VehicleType.RaceCarRed:
                return "engineRally";
            default:
                return "engine";
        }

    }

    constructor(scene: THREE.Scene,
        public playerIndex: number,
        isDebug: boolean,
        isCpuPlayer: boolean,
        vehicleType: VehicleType, playerColor: THREE.Color,
        crosshairTexture: THREE.Texture, markerTexture: THREE.Texture, particleMaterial: THREE.SpriteMaterial,
        vehicle: IPlayerVehicle,
        maxHealth: number,
        leftHeadlightOffset: THREE.Vector3,
        rightHeadlightOffset: THREE.Vector3,
        leftBrakeLightOffset: THREE.Vector3,
        rightBrakeLightOffset: THREE.Vector3,
        //fireBulletSound: THREE.PositionalAudio,
        //fireRocketSound: THREE.PositionalAudio,
        //explosionSound: THREE.PositionalAudio,
        //deathFireSound: THREE.PositionalAudio,
        deadzoneX: number,
        vehicleConfig: VehicleConfig) {

        this.scene = scene;
        this.isDebug = isDebug;
        this.isCpuPlayer = isCpuPlayer;
        this.vehicleType = vehicleType;

        this.playerId = uuidv4();        
        
        this.maxHealth= maxHealth;
        this.currentHealth = maxHealth;

        this.projectileFactory = new ProjectileFactory(particleMaterial);
        this.headLights = new Headlights(scene, leftHeadlightOffset, rightHeadlightOffset);
        this.brakeLights = new Brakelights(scene, leftBrakeLightOffset, rightBrakeLightOffset);
        if(this.brakeLights != null)
            this.brakeLights.setVisible(false);


        if(vehicleConfig.hasEmergencyLights1 && vehicleConfig.offsetLeft1 && vehicleConfig.offsetRight1) {
            const frontLeftOffset = Utility.ArrayToThreeVector3(vehicleConfig.offsetLeft1);
            const frontRightOffset = Utility.ArrayToThreeVector3(vehicleConfig.offsetRight1);

            this.emergencyLights = new EmergencyLights(scene, frontLeftOffset, frontRightOffset);
            this.emergencyLights.setVisible(true);            
        }

        if(vehicleConfig.hasEmergencyLights2 && vehicleConfig.offsetLeft2 && vehicleConfig.offsetRight2) {
            const rearLeftOffset = Utility.ArrayToThreeVector3(vehicleConfig.offsetLeft2);
            const rearRightOffset = Utility.ArrayToThreeVector3(vehicleConfig.offsetRight2);
            this.emergencyLights2 = new EmergencyLights(scene, rearLeftOffset, rearRightOffset);
            this.emergencyLights2.setVisible(true);    
        }
       
        this.playerName = vehicleConfig.vehicleName;
        this.specialType = vehicleConfig.specialTypeEnum;

        let gameScene = <GameScene>scene;

        let material = new THREE.SpriteMaterial({
            map: gameScene.explosionTexture,
            depthTest: true
        });
        
        this.turboParticleEmitter = new ParticleTrailObject(
            scene,
            ParticleEmitterType.GlowingParticles,
            new THREE.Color('white'),
            new THREE.Color('yellow'),
            new THREE.Color('orange'),
            new THREE.Color('red'),
            1,
            0.02,
            material);

        this.turboParticleEmitter.pause();
        gameScene.addToParticleEmitters(this.turboParticleEmitter);

        this.leftRearWheelDustEmitter = new ParticleTrailObject(
            scene,
            ParticleEmitterType.SmokeEmit,
            new THREE.Color('brown'),
            new THREE.Color('brown'),
            new THREE.Color('brown'),
            new THREE.Color('brown'),
            1,
            0.02,
            material);
        this.leftRearWheelDustEmitter.pause();
        gameScene.addToParticleEmitters(this.leftRearWheelDustEmitter);

        this.rightRearWheelDustEmitter = new ParticleTrailObject(
            scene,
            ParticleEmitterType.SmokeEmit,
            new THREE.Color('brown'),
            new THREE.Color('brown'),
            new THREE.Color('brown'),
            new THREE.Color('brown'),
            1,
            0.02,
            material);
        this.rightRearWheelDustEmitter.pause();
        gameScene.addToParticleEmitters(this.rightRearWheelDustEmitter);

        this.flamethrowerEmitter = new FlamethrowerEmitter(gameScene,
            this.playerId,
            gameScene.explosionTexture,
            new THREE.Color('yellow'),
            new THREE.Color('orange'),
            new THREE.Vector3(0, 1, 0),
            5
        );
        gameScene.addToFlamethrowerEmitters(this.flamethrowerEmitter);

        this.playerColor = playerColor;
        this.target = new Target(scene, crosshairTexture, playerColor, new THREE.Vector3(0,0,0), 0.075, true);
        this.playerMarker = new PlayerMarker(scene, markerTexture, playerColor, new THREE.Vector3(0,0,0), 0.05, false);

        //this.shield = new Shield(scene, this.getPosition());

        this.setVehicleObject(vehicle);

        //const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
        const cylinderGeometry = new THREE.CylinderGeometry(0.6, 0.4, 3);
        //const cylinderGeometry = new THREE.BoxGeometry(1, 5, 1)
        this.boundingMeshMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
        this.flamethrowerBoundingBox = new THREE.Mesh(cylinderGeometry, this.boundingMeshMaterial);
        scene.add(this.flamethrowerBoundingBox);

        const cylinderGeometry2 = new THREE.CylinderGeometry(0.6, 0.4, 5);
        this.lightningBoundingMesh = new THREE.Mesh(cylinderGeometry2, this.boundingMeshMaterial);
        scene.add(this.lightningBoundingMesh);
        

        const BoxGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
        this.shovelBoundingMesh = new THREE.Mesh(BoxGeometry, this.boundingMeshMaterial);
        scene.add(this.shovelBoundingMesh);
       
        //this.bulletSound.position.copy(this.getPosition());
        //this.rocketSound.position.copy(this.getPosition());
        //scene.add(this.bulletSound);
        //scene.add(this.rocketSound);

        let audioManager = gameScene.getAudioManager();
        
        /*
        this.vehicleObject.getChassis().mesh.add(audioManager.getSound('bullet', this.playerIndex)!);
        this.vehicleObject.getChassis().mesh.add(audioManager.getSound('rocket', this.playerIndex)!);
        this.vehicleObject.getChassis().mesh.add(audioManager.getSound('explosion', this.playerIndex)!);
        this.vehicleObject.getChassis().mesh.add(audioManager.getSound('flamethrower', this.playerIndex)!);
        this.vehicleObject.getChassis().mesh.add(audioManager.getSound('deathFire', this.playerIndex)!);
        this.vehicleObject.getChassis().mesh.add(audioManager.getSound('engine', this.playerIndex)!);
        this.vehicleObject.getChassis().mesh.add(audioManager.getSound('brake', this.playerIndex)!);
        */

        //this.rocketSoundMarker = new THREE.Mesh(new THREE.SphereGeometry(1.5), new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true }));
        //this.bulletSoundMarker = new THREE.Mesh(new THREE.SphereGeometry(1.5), new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true }));
        //scene.add(this.rocketSoundMarker);
        //scene.add(this.bulletSoundMarker);

        this.deadzoneX = deadzoneX;

        //if(!isCpuPlayer)
        //if(this.playerIndex === 0)
            //gameScene.getAudioManager().playLoopedSound('engine', this.playerIndex);      
    }

    private getScene(): GameScene {
        return <GameScene>this.scene;
    }

    getPosition(): THREE.Vector3{
        if(!this.vehicleObject?.getChassis().body) return new THREE.Vector3(0,10,0);

        return Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position);
    }

    isVehicleObjectNull(): boolean {
        return !this.vehicleObject;
    }

    getChassisBody(): CANNON.Body {
        return this.vehicleObject.getChassis().body;
    }

    getChassisBodyCenterOfMassVec3(): CANNON.Vec3 {
        let chassisBody = this.vehicleObject.getChassis().body;

        return chassisBody.position.clone().vadd(chassisBody.shapeOffsets[0]);
        //return chassis.body.position.clone().vsub(chassis.centerOfMassAdjust);
    } 

    isModelNull(): boolean {
        return !this.vehicleObject.getModel();
    }

    getModelQuaternion(): THREE.Quaternion {
        return this.vehicleObject.getModel().quaternion;
    }

    getModelPosition(): THREE.Vector3 {
        return this.vehicleObject.getModel().position;
    }

    setTargetLocation(targetLocation:THREE.Vector3) {
        this.target.setForwardTargetLocation(targetLocation);
    }

    preUpdate(): void {
        this.vehicleObject.preUpdate();
    }

    update(clock: THREE.Clock, cpuPlayerBehaviorOverride?: CpuPlayerPattern): void {
            
        this.fireObjects.forEach(x => {            
            //x.setPosition(this.vehicleObject.getChassis().getPosition());

            // todo: figure out if need to handle FireParticleEmitter objects differently
            x.setEmitPosition(this.vehicleObject.getChassis().getPosition());
        });
        this.fireObjects.forEach(x => x.update(clock));
        this.fireObjects = this.fireObjects.filter(x => !x.isDead);

        if(this.playerState == PlayerState.Dead) {
            
            if(this.deathExplosionCooldownClock.isExpired()) {
                this.deathExplosionCooldownClock.stop();

                this.generateRandomExplosionGpu(0.5);
                this.deathExplosionCooldownClock.start();
            }        

            this.vehicleObject.update();            

            return; 
        }
            
        if(this.playerState == PlayerState.Respawning)
            this.tryRespawn();
        
            /*
            if(this.deadUntilRespawnTimer.running) {

            if(this.deadUntilRespawnTimer.elapsedTime >= 3)
                this.tryRespawn();
            else
                return;
        }     
        */   

        if(this.playerIndex === 0) {
            this.updateEngine(this.throttle);

            this.currentWheelSlip = this.getVehicleObject().getCurrentSlip();
            this.updateTireEffects();
        }
            
        if(!this.vehicleObject?.getChassis()?.body?.position) return;

        this.vehicleObject.update();

        if(this.vehicleType == VehicleType.Killdozer) {
            let shovelModel = this.getShovel(this.vehicleObject.getModel());
            if(shovelModel != null) {

            if(this.shovelCooldownClock.isRunningAndNotExpired()) {
                
                const rotationAmplitude = -3 * Math.PI / 4; // -3π/4
                const elapsedTime = this.shovelCooldownClock.getElapsedTime() % 0.5; // Normalize to 0.5-second cycle
                const progress = elapsedTime * 2 * Math.PI; // Convert to full sine wave cycle
            
                // Smooth rotation using sin wave (alternates between 0 and -3π/4)
                let angle = rotationAmplitude * Math.sin(progress);
                shovelModel?.rotation.set(angle, 0, 0);

                this.currentShovelAngle = angle;
                if(elapsedTime < 0.1) {
                    let gameScene = <GameScene>this.scene;
                    gameScene.getAudioManager().playSoundIfNotCurrentlyPlaying('shovel', false, this.playerIndex);
                }                    
            }
            else 
                shovelModel?.rotation.set(0,0,0);
        }
        }

        if(this.triRocketCooldownClock.isRunningAndNotExpired()) {

        }

        //this.bulletSound.position.copy(this.getPosition());        
        //this.bulletSound.updateMatrixWorld(true);

        //this.rocketSound.position.copy(this.getPosition());
        //this.rocketSound.updateMatrixWorld(true);
        
        if(this.target != null) {
            let targetOffset = new THREE.Vector3(-5, 0, 0);
            targetOffset.applyQuaternion(this.vehicleObject.getModel().quaternion);
            this.target.setForwardTargetLocation(Utility.ThreeVector3Add(Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position), targetOffset));

            
            // TODO: move to projectile        
            let groundTargetOffset = new THREE.Vector3(-10, 0, 0);
            groundTargetOffset.applyQuaternion(this.vehicleObject.getModel().quaternion);

            let groundTargetMeshLocation = Utility.ThreeVector3Add(Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position), groundTargetOffset);
            if(this.isCpuPlayer
                && cpuPlayerBehaviorOverride != null
                && (cpuPlayerBehaviorOverride == CpuPlayerPattern.Follow || cpuPlayerBehaviorOverride == CpuPlayerPattern.FollowAndAttack)) {
                    groundTargetMeshLocation = this.getScene().player1.getPosition();
            }
            let positionOnTerrain = this.getScene().terrainChunk.getWorldPositionOnTerrain(groundTargetMeshLocation.x, groundTargetMeshLocation.z);                
            
            this.target.setGroundTargetMeshPosition(positionOnTerrain);//new THREE.Vector3(worldPosition.x, worldPosition.y + 1, worldPosition.z));        
            this.target.rotateGroundTargetToFaceDown();            
        }
                
        this.playerMarker.setTargetLocation(new THREE.Vector3(this.getPosition().x, this.getPosition().y + 2, this.getPosition().z));

        // flamethrower intersection mesh
        let offset = new THREE.Vector3(-2, 0, 0);
        offset.applyQuaternion(this.vehicleObject.getModel().quaternion);
        const flamethrowerBoundingCylinderOffset = Utility.ThreeVector3Add(Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position), offset);
        this.flamethrowerBoundingBox.position.set(flamethrowerBoundingCylinderOffset.x, flamethrowerBoundingCylinderOffset.y, flamethrowerBoundingCylinderOffset.z);
        this.flamethrowerBoundingBox.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
        this.flamethrowerBoundingBox.applyQuaternion(this.vehicleObject.getModel().quaternion);       

        if(this.flamethrowerActive) {
            if(this.isDebug) { 
                this.flamethrowerBoundingBox.visible = true;
            }

            //this.flamethrowerActive = false;
        }
        else {
            this.flamethrowerBoundingBox.visible = false;            
        }

        // lightning bounding mesh
        offset = new THREE.Vector3(-3, 0, 0);
        offset.applyQuaternion(this.vehicleObject.getModel().quaternion);
        const lightningBoundingMeshOffset = Utility.ThreeVector3Add(Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position), offset);
        this.lightningBoundingMesh.position.set(lightningBoundingMeshOffset.x, lightningBoundingMeshOffset.y, lightningBoundingMeshOffset.z);
        this.lightningBoundingMesh.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
        this.lightningBoundingMesh.applyQuaternion(this.vehicleObject.getModel().quaternion);       

        if(this.lightningActive) {
            if(this.isDebug) { 
                this.lightningBoundingMesh.visible = true;
            }

            //this.flamethrowerActive = false;
        }
        else {
            this.lightningBoundingMesh.visible = false;            
        }



        // shovel intersection mesh
        offset = new THREE.Vector3(-1, 0.5, 0);
        offset.applyQuaternion(this.vehicleObject.getModel().quaternion);
        var boundingMeshOffset = Utility.ThreeVector3Add(Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position), offset);
        this.shovelBoundingMesh.position.set(boundingMeshOffset.x, boundingMeshOffset.y, boundingMeshOffset.z);
        this.shovelBoundingMesh.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
        this.shovelBoundingMesh.applyQuaternion(this.vehicleObject.getModel().quaternion);

        if(this.shovelCooldownClock.isRunningAndNotExpired()) {
            if(this.isDebug)
                this.shovelBoundingMesh.visible = true;
        }
        else
            this.shovelBoundingMesh.visible = false
        
        if(this.headLights != null)
            this.headLights.update(
                Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position),
                Utility.CannonQuaternionToThreeQuaternion(this.vehicleObject.getChassis().body.quaternion)            
            );
        
        if(this.brakeLights != null)
            this.brakeLights.update(
                Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position),
                Utility.CannonQuaternionToThreeQuaternion(this.vehicleObject.getChassis().body.quaternion)            
            );              

        if(this.emergencyLights != null)
            this.emergencyLights.update(
                Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position),
                Utility.CannonQuaternionToThreeQuaternion(this.vehicleObject.getChassis().body.quaternion)            
            );            
            
        if(this.emergencyLights2 != null)
            this.emergencyLights2.update(
                Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position),
                Utility.CannonQuaternionToThreeQuaternion(this.vehicleObject.getChassis().body.quaternion)            
            );    
        
        /*
        switch(launchLocation) {
            case ProjectileLaunchLocation.Left:                
                sideVector = new THREE.Vector3(-10, 0, sideOffset);
                break;
            case ProjectileLaunchLocation.Center:
                sideVector = new THREE.Vector3(0, 0, 0);
                break;                
            case ProjectileLaunchLocation.Right:
                sideVector = new THREE.Vector3(0, 0, -sideOffset);
                break;
        }
        */
        let turboOffset = new THREE.Vector3(1, 0, 0);
        turboOffset.applyQuaternion(this.vehicleObject.getModel().quaternion);
        let turboEmitPosition = Utility.ThreeVector3Add(Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position), turboOffset);
        this.turboParticleEmitter.setEmitPosition(turboEmitPosition);
       
        let wheels = this.vehicleObject.getWheelModels();        

        let leftRearWheelDustEmitPosition = wheels[2].position;
        this.leftRearWheelDustEmitter.setEmitPosition(leftRearWheelDustEmitPosition);

        let rightRearWheelDustEmitPosition = wheels[3].position;
        this.rightRearWheelDustEmitter.setEmitPosition(rightRearWheelDustEmitPosition);

        this.fireObjects.forEach(x => x.setEmitPosition(this.getPosition()));

        this.bulletCooldownClock.stopIfExpired();
        this.megaGunCooldownClock.stopIfExpired();
        this.rocketCooldownClock.stopIfExpired();
        this.airstrikeCooldownClock.stopIfExpired();
        this.sonicPulseCooldownClock.stopIfExpired();
        this.shovelCooldownClock.stopIfExpired();
        this.triRocketCooldownClock.stopIfExpired();
        this.dumpsterCooldownClock.stopIfExpired();

        if(this.shield != null)
            this.shield.updatePosition(this.getPosition());

        //this.bulletSoundMarker.position.copy(this.bulletSound.position);
        //this.rocketSoundMarker.position.copy(this.rocketSound.position);
    }

    private getShovel(model: THREE.Group): THREE.Object3D<THREE.Object3DEventMap> | undefined {
        let bodyModel = model.children.find(x => x.name == 'body');
        return bodyModel?.children.find(x => x.name == 'shovel');
    }

    public createProjectile(projectileType: ProjectileType): Projectile {
                
        let scene = <GameScene>this.scene;

        let launchLocation = ProjectileLaunchLocation.Center;        

        let forwardVector = new THREE.Vector3(-2, 0, 0);
        forwardVector.applyQuaternion(this.vehicleObject.getModel().quaternion);
        let projectileLaunchVector = forwardVector; 

        let sideOffset = 0;
        switch(projectileType) {
            case ProjectileType.Bullet:
                sideOffset = 2;
                this.fireLeft = !this.fireLeft;
                launchLocation = this.fireLeft ? ProjectileLaunchLocation.Left : ProjectileLaunchLocation.Right;
                break;
            case ProjectileType.Rocket:
                sideOffset = 5;
                launchLocation = ProjectileLaunchLocation.Center;
                break;
        }        

        let sideVector = new THREE.Vector3();
        switch(launchLocation) {
            case ProjectileLaunchLocation.Left:                
                sideVector = new THREE.Vector3(0, 0, sideOffset);
                break;
            case ProjectileLaunchLocation.Center:
                sideVector = new THREE.Vector3(0, 0, 0);
                break;                
            case ProjectileLaunchLocation.Right:
                sideVector = new THREE.Vector3(0, 0, -sideOffset);
                break;
        }
        sideVector.applyQuaternion(this.vehicleObject.getModel().quaternion);

        //axis-aligned bounding box
        const aabb = new THREE.Box3().setFromObject(this.vehicleObject.getChassis().mesh);
        const size = aabb.getSize(new THREE.Vector3());

        const vec = new THREE.Vector3();
        this.vehicleObject.getModel().getWorldPosition(vec);

        // offset to front of gun
        var tempPosition = vec.add(
                sideVector.clone().multiplyScalar(-size.z * 0.12)
        );

        if(projectileType == ProjectileType.Airstrike) {
            vec.y += 20;
        }

        // offset to side of car
        // +x is in left of car, -x is to right of car
        // +z is in front of car, -z is to rear of car
        //var tempPosition = vec.add(
            //this.directionVector.clone().multiplyScalar(-size.z * 5)
        //);
        //tempPosition.add(this.directionVector.clone().multiplyScalar(size.z * 1.5));

        var projectile = this.projectileFactory.generateProjectile(
            this.scene, this.isDebug,
            this.playerId,
            projectileType,            
            tempPosition,           // launchPosition relative to chassis
            projectileLaunchVector,  
            this.vehicleObject.getModel().quaternion,          
            scene.getWorld());              

        if(projectileType == ProjectileType.Airstrike)
            this.activeAirstrike = projectile;

        return projectile;
    }

    public createProjectiles(projectileType: ProjectileType) : Projectile[] {
        let projectiles: Projectile[] = [];
                   
        let scene = <GameScene>this.scene;

        for(let i = 0; i < 3; i++) {

            let launchLocation = i;        
    
            let forwardVector = new THREE.Vector3(-2, 0, 0);
            forwardVector.applyQuaternion(this.vehicleObject.getModel().quaternion);
            let projectileLaunchVector = forwardVector; 
    
            let topOffset = -3;
            let frontOffset = 3;
            let sideOffset = 3;
    
            let sideVector = new THREE.Vector3();
            switch(launchLocation) {
                case ProjectileLaunchLocation.Left:                
                    sideVector = new THREE.Vector3(0, 0, sideOffset);
                    break;
                case ProjectileLaunchLocation.Center:
                    sideVector = new THREE.Vector3(frontOffset, topOffset, 0);
                    break;                
                case ProjectileLaunchLocation.Right:
                    sideVector = new THREE.Vector3(0, 0, -sideOffset);
                    break;
            }
            sideVector.applyQuaternion(this.vehicleObject.getModel().quaternion);
    
            //axis-aligned bounding box
            const aabb = new THREE.Box3().setFromObject(this.vehicleObject.getChassis().mesh);
            const size = aabb.getSize(new THREE.Vector3());
    
            const vec = new THREE.Vector3();
            this.vehicleObject.getModel().getWorldPosition(vec);
    
            // offset to front of gun
            var tempPosition = vec.add(
                    sideVector.clone().multiplyScalar(-size.z * 0.12)
            );
    
            // offset to side of car
            // +x is in left of car, -x is to right of car
            // +z is in front of car, -z is to rear of car
            //var tempPosition = vec.add(
                //this.directionVector.clone().multiplyScalar(-size.z * 5)
            //);
            //tempPosition.add(this.directionVector.clone().multiplyScalar(size.z * 1.5));
    
            var projectile = this.projectileFactory.generateProjectile(
                this.scene, this.isDebug,
                this.playerId,
                projectileType,            
                tempPosition,           // launchPosition relative to chassis
                projectileLaunchVector,  
                this.vehicleObject.getModel().quaternion,          
                scene.getWorld());              

            projectiles.push(projectile);
        }

        return projectiles;
    }

    private setVehicleObject(vehicle: IPlayerVehicle) {
        this.vehicleObject = vehicle;
    }

    getVehicleObject(): IPlayerVehicle {
        return this.vehicleObject;
    }
    
    tryAccelerate(joystickY: number): void {
        this.vehicleObject.tryAccelerate(joystickY);
        this.brakeLights.setVisible(false);

        this.throttle = 1;
    }

    tryStopAccelerate(): void {        
        this.vehicleObject.tryStopAccelerate();

        this.throttle = 0;
    }

    updateTireEffects(): void {

        if((this.brakeForces.some(x => x > 0) && this.vehicleObject.getCurrentSpeed() > 1)
            || this.currentWheelSlip > 2) {

            this.leftRearWheelDustEmitter.resume();
            this.rightRearWheelDustEmitter.resume();

            let gameScene = <GameScene>this.scene;
            let sound = gameScene.getAudioManager().getSound('brake', this.playerIndex);        
            if(sound && !sound.isPlaying)
                sound.play();
        }
        else if(this.brakeForces.every(x => x === 0) && this.currentWheelSlip <= 2) {

            this.leftRearWheelDustEmitter.pause();
            this.rightRearWheelDustEmitter.pause();

            let gameScene = <GameScene>this.scene;
            let sound = gameScene.getAudioManager().getSound('brake', this.playerIndex);        
            if(sound && sound.isPlaying)
                sound.stop();
        }
        else {
            this.leftRearWheelDustEmitter.pause();
            this.rightRearWheelDustEmitter.pause();

            let gameScene = <GameScene>this.scene;
            let sound = gameScene.getAudioManager().getSound('brake', this.playerIndex);        
            if(sound && sound.isPlaying)
                sound.stop();
        }
    }
        
    tryReverse(joystickY: number): void {
        this.vehicleObject.setDrifting();
        this.vehicleObject.tryReverse(joystickY);
        this.brakeLights.setVisible(true);
        //this.leftRearWheelDustEmitter.resume();
        //this.rightRearWheelDustEmitter.resume();

        this.brakeForces = this.vehicleObject.getBrakeForceOnWheels();

        this.throttle = 0.75;
    }

    tryStopReverse(): void {
        this.vehicleObject.tryStopReverse();
        this.brakeLights.setVisible(false);
        //this.leftRearWheelDustEmitter.pause();
        //this.rightRearWheelDustEmitter.pause();

        let gameScene = <GameScene>this.scene;
        let sound = gameScene.getAudioManager().getSound('brake', this.playerIndex);        
        if(sound && sound.isPlaying)
            sound.stop();

        this.throttle = 0;
    }

    tryTurn(x: number): void {

        if(Math.abs(x) > this.deadzoneX)
            this.vehicleObject.tryTurn(x);
        else
            this.vehicleObject.resetTurn();
    }
    
    tryTightTurn(x: number): void {
        if(Math.abs(x) > this.deadzoneX)
            this.vehicleObject.tryTightTurn(x);
        else
            this.vehicleObject.resetTurn();
    }

    resetTurn(): void {
        this.vehicleObject.resetTurn();
    }

    tryJump(): void {
        this.vehicleObject.tryJump();
    }

    tryTurbo(): void {        
        this.vehicleObject.tryTurbo();
        this.turboParticleEmitter.resume();

        this.throttle = 1.25;
    }

    tryStopTurbo(): void {
        this.throttle = 0;
        this.turboParticleEmitter.pause();
    }
    
    tryDamage(projectileType: ProjectileType, damageLocation: THREE.Vector3, impactForce?: CANNON.Vec3): void {
        
        if(projectileType == ProjectileType.Bullet)
            this.currentHealth -= 5;
        else if(projectileType == ProjectileType.Rocket) {
            this.currentHealth -= 20;

            if(impactForce != undefined) {
                //this.getChassisBody().applyForce(impactForce, Utility.ThreeVec3ToCannonVec3(damageLocation))
                //this.getChassisBody().applyImpulse(impactForce, Utility.ThreeVec3ToCannonVec3(damageLocation))
                this.getVehicleObject().applyImpulseWhileWheelsAreDisabled(impactForce);                                        
            }
        }

        if(this.currentHealth <= 0)         
            this.tryKill();
    }

    tryDamageWithFlamethrower(): void {
        
        this.currentHealth -= 0.5;

        if(this.currentHealth <= 0)
            this.tryKill();
    }

    tryDamageWithLightning(): void {
        
        this.currentHealth -= 0.5;

        if(this.currentHealth <= 0)
            this.tryKill();
    }

    tryDamageWithAirstrike(): void {
        
        this.currentHealth -= 2;

        if(this.currentHealth <= 0)
            this.tryKill();
    }
    
    tryKill() {

        if(this.playerState == PlayerState.Alive) {

            if(randInt(0, 1) == 0)
                this.tryJump();

            this.playerState = PlayerState.Dead;
            this.deathCount++;
        
            var scene = this.getScene();
            
            if(this.headLights != null)
                this.headLights.group.visible = false;

            if(this.brakeLights != null)
                this.brakeLights.group.visible = false;

            if(this.shield != null)
                this.shield.setVisible(false);

            if(this.emergencyLights != null)
                this.emergencyLights.setVisible(false);

            if(this.emergencyLights2 != null)
                this.emergencyLights2.setVisible(false);

            this.vehicleObject.tryStopAccelerate();
            this.vehicleObject.tryStopReverse();

            //this.vehicleObject.getModel().visible = false;
            this.vehicleObject.getModel().traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const material = mesh.material as THREE.MeshStandardMaterial;
                    // Set the material color for the mesh
                    material.color.set(0x000000); // Example: Set color to green
                }
            });            

            this.vehicleObject.getWheelModels().forEach(x => x.visible = false);      
        
            this.vehicleObject.setAcceptInput(false);      
            this.turboParticleEmitter.pause();

            if(!scene.explosionTexture) return;

            let gameScene = <GameScene>this.scene;

            /*
            let deathFire = new FireCpuParticleEmitter(
                this.scene,
                scene.explosionTexture,
                new THREE.Color('yellow'),
                new THREE.Color('orange'),
                this.getPosition(),
                3,
                3000,
                gameScene.getAudioManager().getSound('deathFire', this.playerIndex)!,
                gameScene.gameConfig.isSoundEnabled
            );
            this.fireObjects.push(deathFire);
            */

            //let fireParticleEmitter = new FireGpuParticleEmitter(this.scene, 3000, this.getPosition());
            let fireParticleEmitter = new FireGpuParticleEmitter2(this.scene, Player.RespawnTimeinMs, 10, this.getPosition());
            this.fireObjects.push(fireParticleEmitter);

            gameScene.getAudioManager().playSound('deathfire', true, this.playerIndex);
            
            let smokeEmitPosition = this.getPosition().add(new THREE.Vector3(0, 0.5, 0));
            let smokeObject = new SmokeObject2(this.scene, scene.explosionTexture, smokeEmitPosition, 1, 3000);

            const announcement = this.playerIndex == 0 ? "You were destroyed!" : `${this.playerName} was destroyed!`
            document.getElementById('notificationDiv')!.innerHTML = '<i class="fa-solid fa-skull"></i> ' + announcement;
            document.getElementById('notificationDiv')!.style.opacity = '80%';            
            setTimeout(() => {
                document.getElementById('notificationDiv')!.style.opacity = '0%';
                //document.getElementById('notificationDiv')!.style.transition = 'opacity 0.3s ease';
            }, 2000);

            this.generateRandomExplosionGpu(1);

            gameScene.getAudioManager().playSound('explosion', false, this.playerIndex);

            //if(this.explosionSound.isPlaying)
                //this.explosionSound.stop();
            //this.explosionSound.play();
            //this.explosionSound.detune = Math.floor(Math.random() * 1600 - 800);

            let wheels = this.vehicleObject.getWheelModels();
            scene.generateRandomDebrisWheel(wheels[0].position.add(new THREE.Vector3(0, 0.5, 0)), wheels[0].quaternion);
            scene.generateRandomDebrisWheel(wheels[1].position.add(new THREE.Vector3(0, 0.5, 0)), wheels[1].quaternion);
            scene.generateRandomDebrisWheel(wheels[2].position.add(new THREE.Vector3(0, 0.5, 0)), wheels[2].quaternion);
            scene.generateRandomDebrisWheel(wheels[3].position.add(new THREE.Vector3(0, 0.5, 0)), wheels[3].quaternion);
            
            this.deathExplosionCooldownClock.start();
            /*
            let smokeObject = new ParticleTrailPointsShaderObject(
                scene,
                ParticleEmitterType.SmokeEmit,
                //particleTexture,
                new THREE.Color('grey'),
                new THREE.Color(0x663399),
                new THREE.Color(0x663399),
                new THREE.Color(0x4d0099),
                1, // number of particle
                0.01, // TODO: max particle velocity
                100, // initial particle size
                0.01, // max position jitter
                3000
            );
            smokeObject.setEmitPosition(this.getPosition());
            */
            //this.fireObjects.push(smokeObject);            

            this.fireObjects.forEach(x => x.setEmitPosition(this.getPosition()));

            setTimeout(() => {
                this.playerState = PlayerState.Respawning
            }, Player.RespawnTimeinMs);
        }
    }

    tryRespawn() {
        this.refillHealth();        

        this.fireObjects.forEach(x => x.kill());

        let gameScene = <GameScene>this.scene;
        gameScene.getAudioManager().stopAllSoundsForPlayer(this.playerIndex);
        
        this.playerState = PlayerState.Alive;        
        this.tryStopTurbo();

        var mapDimensions = this.getScene().getMapDimensions();
        
        let randX = THREE.MathUtils.randFloat(-mapDimensions.x / 2, mapDimensions.x / 2);        
        let randZ = THREE.MathUtils.randFloat(-mapDimensions.z / 2, mapDimensions.z / 2);

        let worldPosition = this.getScene().terrainChunk.getWorldPositionOnTerrain(randX, randZ);

        this.vehicleObject.setAcceptInput(true);
        this.vehicleObject.respawnPosition(worldPosition.x, worldPosition.y + 2, worldPosition.z);

        this.vehicleObject.getModel().traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.color.set(0xffffff);
            }
        });        
        this.vehicleObject.getModel().visible = true;
        this.vehicleObject.getWheelModels().forEach(x => x.visible = true);            

        if(this.headLights != null)
            this.headLights.group.visible = true;

        if(this.emergencyLights != null)
            this.emergencyLights.setVisible(true);

        if(this.emergencyLights2 != null)
            this.emergencyLights2.setVisible(true);

        this.fireObjects.forEach(x => x.kill());
        //this.turboParticleEmitter.isEmitting = true;
    }

    tryFirePrimaryWeapon(): void {
        this.tryFireRocket();
    }

    tryFireSecondaryWeapon(): void {
        this.tryFireBullets();
    }

    tryFireRocket(): void {

        if(!this.rocketCooldownClock.isRunning()) {

            let projectile = this.createProjectile(ProjectileType.Rocket);

            let gameScene = <GameScene>this.scene;
            gameScene.addNewProjectile(projectile);

            this.rocketCooldownClock.start();

            gameScene.getAudioManager().playSound('rocket', true, this.playerIndex);

            //if(this.rocketSound.isPlaying)
                //this.rocketSound.stop();

            //this.rocketSound.play();
            //this.rocketSound.detune = Math.floor(Math.random() * 1600 - 800);
        }       
    }

    tryFireTriRockets() {
        if(!this.triRocketCooldownClock.isRunning()) {

            let projectiles = this.createProjectiles(ProjectileType.Rocket);

            let gameScene = <GameScene>this.scene;
            projectiles.forEach(x => gameScene.addNewProjectile(x));

            this.triRocketCooldownClock.start();
            gameScene.getAudioManager().playSound('rocket', true, this.playerIndex);
        }   
    }

    tryFireAirStrike(): void {

        if(!this.airstrikeCooldownClock.isRunning()) {

            if(this.activeAirstrike == null || this.activeAirstrike.isDetonated) {
                let projectile = this.createProjectile(ProjectileType.Airstrike);

                let gameScene = <GameScene>this.scene;
                gameScene.addNewProjectile(projectile);

                this.airstrikeCooldownClock.start();
                gameScene.getAudioManager().playSound('bomber', true, this.playerIndex);
            }
            else {
                this.activeAirstrike.detonate();
                this.airstrikeCooldownClock.start();
            }
        }       
    }

    tryFireFlamethrower(): void {        

        if(this.playerState == PlayerState.Alive) {
            this.flamethrowerEmitter.setPosition(this.getPosition());
            if(!this.isVehicleObjectNull() && !this.isModelNull()) {                
                this.flamethrowerEmitter.setQuaternion(this.getModelQuaternion());
            }
        
            let gameScene = <GameScene>this.scene;
            gameScene.getAudioManager().playLoopedSound('flamethrower', this.playerIndex);

            this.flamethrowerEmitter.emitParticles();
            this.flamethrowerActive = true;
        }
    }

    tryStopFireFlamethrower() {
        this.flamethrowerActive = false;

        let gameScene = <GameScene>this.scene;
        gameScene.getAudioManager().stopSound('flamethrower', this.playerIndex);
    }

    tryFireBullets(): void {
        //if(this.bulletCooldownTime <= 0) {
        if(!this.bulletCooldownClock.isRunning()) {

            let projectile = this.createProjectile(ProjectileType.Bullet);

            let gameScene = <GameScene>this.scene;
            gameScene.addNewProjectile(projectile);

            //this.bulletCooldownTime = this.maxBulletCooldownTime;
            this.bulletCooldownClock.start();

            //if(this.bulletSound != null) {
                
                // TODO: replace with audio manager call
                /*
                if(this.bulletSound.isPlaying)
                    this.bulletSound.stop();

                this.bulletSound.play();
                this.bulletSound.detune = Math.floor(Math.random() * 1600 - 800);
                */
                //
                let audioManager = gameScene.getAudioManager();
                audioManager.playSound('bullet', true, this.playerIndex);
            //}
        }
    }

     tryFireMegaGun(): void {
        //if(this.bulletCooldownTime <= 0) {
        if(!this.megaGunCooldownClock.isRunning()) {

            let projectile = this.createProjectile(ProjectileType.Bullet);

            let gameScene = <GameScene>this.scene;
            gameScene.addNewProjectile(projectile);

            //this.bulletCooldownTime = this.maxBulletCooldownTime;
            this.megaGunCooldownClock.start();

            //if(this.bulletSound != null) {
                
                // TODO: replace with audio manager call
                /*
                if(this.bulletSound.isPlaying)
                    this.bulletSound.stop();

                this.bulletSound.play();
                this.bulletSound.detune = Math.floor(Math.random() * 1600 - 800);
                */
                //
                let audioManager = gameScene.getAudioManager();
                audioManager.playSound('bullet', true, this.playerIndex);
            //}
        }
    }

    tryFireDumpster(): void {

        if(!this.dumpsterCooldownClock.isRunning()) {
            let gameScene = <GameScene>this.scene;

            let forwardVector = new THREE.Vector3(-22.5, -1, 0);
            forwardVector.applyQuaternion(this.getVehicleObject().getModel().quaternion);
            let projectileLaunchVector = forwardVector; 

            gameScene.generateRandomDumpster(this.playerId, this.getPosition(), projectileLaunchVector);

            this.dumpsterCooldownClock.start();
        }        
    }

    tryFireSonicPulse(): void {

        if(!this.sonicPulseCooldownClock.isRunning()) {

            let gameScene = <GameScene>this.scene;
            gameScene.getAudioManager().playSound('sonicPulse', false, this.playerIndex);
            gameScene.generateSonicPulse(this.getPosition());

            this.sonicPulseCooldownClock.start();
        }
    }

    tryFireShovel(): void {
        if(this.vehicleType != VehicleType.Killdozer)
            return;

        this.shovelCooldownClock.start();
    }

    
    tryFireLightning(): void {
       this.lightningActive = true;

       let gameScene = <GameScene>this.scene;
       gameScene.getAudioManager().playLoopedSound('lightning', this.playerIndex);
    }

    tryStopFireLightning() {
        this.lightningActive = false;

        let gameScene = <GameScene>this.scene;
        gameScene.getAudioManager().stopSound('lightning', this.playerIndex);
    }

    tryFireSpecialWeapon() {
        switch(this.specialType) {
            case SpecialType.TriRockets:
                this.tryFireTriRockets();
                break;
            case SpecialType.Flamethrower:
                this.tryFireFlamethrower();
                break;
            case SpecialType.SonicPulse:
                this.tryFireSonicPulse();
                break;
            case SpecialType.MegaGun:
                this.tryFireMegaGun();
                break;
            case SpecialType.Lightning:
                this.tryFireLightning();
                break;
            case SpecialType.Dumpster:
                this.tryFireDumpster();
                break;
            case SpecialType.Shovel:
                this.tryFireShovel();
                break;
        }
    }

    tryStopFireSpecialWeapon() {

        switch(this.specialType) {            
            case SpecialType.Flamethrower:
                this.tryStopFireFlamethrower();
                break;
            case SpecialType.Lightning:
                this.tryStopFireLightning();
                break;
            default:
                break;
        }      
    }
    
    // TODO: try fire additional weapons

    tryTurboBoostOn(): void {

    }
    
    tryTurboBoostOff(): void {

    }

    refillTurbo(): void {

    }

    refillHealth(): void {
        this.currentHealth = this.maxHealth;        

        if(this.playerId == this.getScene().player1.playerId)
            this.getScene().sceneController.updateHealthOnHud(this.currentHealth);
    }

    refillShield(): void {

    }

    trySelectPreviousWeapon(): void {
        this.selectedWeaponIndex--;
        this.getScene().sceneController.selectPreviousWeaponOnHud();
    }

    trySelectNextWeapon(): void {
        this.selectedWeaponIndex++;
        this.getScene().sceneController.selectNextWeaponOnHud();
    }

    updateEngine(throttle: number) {

        // throttle: 0 → idle, 1 → full rev, turbo is even higher
        const minPitch = 0.8;
        const maxPitch = 2.0;
        const smoothness = 0.0125; // smaller = slower ramp

        const targetRate = THREE.MathUtils.lerp(minPitch, maxPitch, throttle);
        // smooth interpolation toward target
        this.currentRate = THREE.MathUtils.lerp(this.currentRate, targetRate, smoothness);

        let gameScene = <GameScene>this.scene;
        let sound = gameScene.getAudioManager().getSound(this.getEngineSoundKey(), this.playerIndex);        
        if(sound && !sound.isPlaying) {
            sound.play();
        }
        if(sound)
            sound.setPlaybackRate(this.currentRate);
    }
    
    tryResetPosition(): void {

        let gameScene = <GameScene>this.scene;

        var position = gameScene.terrainChunk.getWorldPositionOnTerrain(this.getPosition().x, this.getPosition().z);
        position.y += 2;

        this.vehicleObject.resetPosition(position);
    }
    
    getTotalSpriteParticleCount(): number {
        let particleCount = 0;

        let items = this.fireObjects.filter(this.isNotGpuParticleEmitter);
        items.forEach(x => {
            particleCount += x.getParticleCount()
        });

        particleCount += this.turboParticleEmitter.getParticleCount();

        return particleCount;
    }

    isNotGpuParticleEmitter(item: ParticleEmitter): item is Exclude<ParticleEmitter, FireGpuParticleEmitter2> {
        return !(item instanceof FireGpuParticleEmitter2);
    }

    getTotalGpuParticleCount(): number {
        
        let particleCount = 0;

        let items = this.fireObjects.filter(x => x instanceof FireGpuParticleEmitter2);
        items.forEach(x => particleCount += x.getParticleCount());        
        
        return particleCount;
    }

    tryGenerateRandomExplosion(): void {
        this.generateRandomExplosionGpu(1);
    }

    tryGenerateRandomExplosionGpu(): void {
        this.generateRandomExplosionGpu(1);
    }

    /*
    private generateRandomExplosion(): void {
        let scene = this.getScene();                
        scene.generateRandomExplosion(ProjectileType.Rocket,
            this.getPosition().add(new THREE.Vector3(randFloatSpread(3), randFloatSpread(2), randFloatSpread(3))),
            new THREE.Color('white'),
            new THREE.Color('white'),
            new THREE.Color('yellow'),
            new THREE.Color('orange'),
            new THREE.Color('red')
        );
    }
    */

    private generateRandomExplosionGpu(particleSize: number, clock?: THREE.Clock): void {
        let gameScene = <GameScene>this.scene;        
        let particleEmitter = new ExplosionGpuParticleEmitter(gameScene, gameScene.getClock(), 5, particleSize, 10, 1000, this.getPosition());
        this.fireObjects.push(particleEmitter);
    }

    private emitFireParticlesGpu(clock?: THREE.Clock): void {
        let particleEmitter = new FireGpuParticleEmitter2(this.scene, 5000, 5, this.getPosition());
        this.fireObjects.push(particleEmitter);
    }
}