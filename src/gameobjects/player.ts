// import { v4 as uuidv4 } from 'uuid';
import { ProjectileType } from "./weapons/projectileType";
import HealthBar from "./healthBar";
import { Utility } from "../utility";
import Headlights from "./vehicles/headLights";
import * as THREE from "three";
import { v4 as uuidv4 } from 'uuid';
import { FireObject } from "./fx/fireObject";
import GameScene from "../scenes/gameScene";
import ProjectileFactory from "./weapons/projectileFactory";
import { Projectile, ProjectileLaunchLocation } from "./weapons/projectile";
import { IPlayerVehicle } from "./vehicles/IPlayerVehicle";
import { ParticleEmitterType, ParticleTrailObject } from "./fx/particleTrailObject";
import * as CANNON from 'cannon-es';
import { Target } from "./target";
import { PlayerMarker } from "./playerMarker";

export enum PlayerState {
    Alive,
    Dead,
    Respawning
}

export class Player {

    scene: THREE.Scene;
    public playerName: string;
    public playerId: string;
    maxHealth: number = 100;
    currentHealth: number;

    static RespawnTimeinMs: number = 3000;

    playerState: PlayerState = PlayerState.Alive;

    healthBar: HealthBar;
    headLights!: Headlights;

    private vehicleObject!: IPlayerVehicle;    
    turboParticleEmitter: ParticleTrailObject;

    fireObjects: FireObject[] = [];

    playerColor: THREE.Color;
    target!: Target;
    playerMarker!: PlayerMarker;

    private fireLeft: boolean = false;
    private projectileFactory: ProjectileFactory;// = new ProjectileFactory();

    constructor(scene: THREE.Scene,
        playerName: string, playerColor: THREE.Color, crosshairTexture: THREE.Texture, markerTexture: THREE.Texture, particleMaterial: THREE.SpriteMaterial) {

        this.scene = scene;

        this.playerId = uuidv4();
        this.healthBar = new HealthBar(scene, this.maxHealth);

        this.currentHealth = this.maxHealth;

        this.projectileFactory = new ProjectileFactory(particleMaterial);
        //this.headLights = new Headlights(scene);

        this.playerName = playerName;      
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
            0.01,
            material);

        this.turboParticleEmitter.pause();
        gameScene.addToParticleEmitters(this.turboParticleEmitter);

        this.playerColor = playerColor;
        this.target = new Target(scene, crosshairTexture, playerColor, new THREE.Vector3(0,0,0), 0.075, true);
        this.playerMarker = new PlayerMarker(scene, markerTexture, playerColor, new THREE.Vector3(0,0,0), 0.05, true);
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

    isModelNull(): boolean {
        return !this.vehicleObject.getModel();
    }

    getModelQuaternion(): THREE.Quaternion {
        return this.vehicleObject.getModel().quaternion;
    }

    getModelPosition(): THREE.Vector3 {
        return this.vehicleObject.getModel().position;
    }

    update(): void {

        this.fireObjects.forEach(x => x.update());

        if(this.playerState == PlayerState.Dead) {
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

        if(!this.vehicleObject?.getChassis()?.body?.position) return;

        this.vehicleObject.update();

        let healthBarOffset = new THREE.Vector3(0, 0, 0.5);
        healthBarOffset.applyQuaternion(this.vehicleObject.getModel().quaternion);
        this.healthBar.update(Utility.ThreeVector3Add(Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position), healthBarOffset));

        let targetOffset = new THREE.Vector3(-5, 0, 0);
        targetOffset.applyQuaternion(this.vehicleObject.getModel().quaternion);
        this.target.setTargetLocation(Utility.ThreeVector3Add(Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position), targetOffset));

        this.playerMarker.setTargetLocation(new THREE.Vector3(this.getPosition().x, this.getPosition().y + 1, this.getPosition().z));
        

        if(this.headLights != null)
            this.headLights.update(
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
                sideOffset = 3;
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
        this.vehicleObject.getModel().getWorldPosition(vec) ;//this.rigidVehicleObject?.model?.position.clone();
        
        //if(vec == null) return;
        // distance off ground
        //vec.y += 2;

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

        return this.projectileFactory.generateProjectile(
            this.scene,
            this.playerId,
            projectileType,            
            tempPosition,           // launchPosition relative to chassis
            projectileLaunchVector,            
            scene.getWorld());              
    }

    setVehicleObject(vehicle: IPlayerVehicle) {
        this.vehicleObject = vehicle;
    }

    getVehicleObject(): IPlayerVehicle {
        return this.vehicleObject;
    }


    tryAccelerateWithKeyboard(): void {
        this.vehicleObject.tryAccelerate();
    }

    tryStopAccelerateWithKeyboard(): void {
        this.vehicleObject.tryStopAccelerate();
    }
    
    tryReverseWithKeyboard(): void {
        this.vehicleObject.tryReverse();
    }

    tryStopReverseWithKeyboard(): void {
        this.vehicleObject.tryStopReverse();
    }

    tryTurn(x: number): void {
        this.vehicleObject.tryTurn(x);
    }
    
    tryTurnLeftWithKeyboard(): void {
        this.vehicleObject.tryTurnLeft();
    }

    tryStopTurnLeftWithKeyboard(): void {
        this.vehicleObject.tryStopTurnLeft(); // same as right
    }

    tryTurnRightWithKeyboard(): void {
        this.vehicleObject.tryTurnRight();
    }

    tryStopTurnRightWithKeyboard(): void {
    }

    tryJump(): void {
        this.vehicleObject.tryJump();
    }

    tryTurbo(): void {        
        this.vehicleObject.tryTurbo();
        this.turboParticleEmitter.resume();
    }

    tryStopTurbo(): void {
        this.turboParticleEmitter.pause();
    }
    
    tryDamage(projectileType: ProjectileType, damageLocation: THREE.Vector3): void {
        
        if(projectileType == ProjectileType.Bullet)
            this.currentHealth -= 5;
        else if(projectileType == ProjectileType.Rocket)
            this.currentHealth -= 20;

        this.healthBar.updateValue(this.currentHealth);

        if(this.currentHealth <= 0)
            this.tryKill();
    }
    
    tryKill() {

        if(this.playerState == PlayerState.Alive) {
            this.playerState = PlayerState.Dead;

            var scene = this.getScene();
            
            if(this.headLights != null)
                this.headLights.group.visible = false;

            this.vehicleObject.getModel().visible = false;
            this.turboParticleEmitter.pause();

            if(!scene.explosionTexture) return;

            let deathFire = new FireObject(
                this.scene,
                scene.explosionTexture,
                new THREE.Color('yellow'),
                new THREE.Color('orange'),
                this.getPosition(),
                10
            );

            this.fireObjects.push(deathFire);

            setTimeout(() => {
                this.playerState = PlayerState.Respawning
            }, Player.RespawnTimeinMs);
        }
    }

    tryRespawn() {
        this.refillHealth();        

        
        this.playerState = PlayerState.Alive;
        this.vehicleObject.getModel().visible = true;
        this.tryStopTurbo();

        var mapDimensions = this.getScene().getMapDimensions();
        
        let randX = THREE.MathUtils.randFloat(-mapDimensions.x / 2, mapDimensions.x / 2);        
        let randZ = THREE.MathUtils.randFloat(-mapDimensions.z / 2, mapDimensions.z / 2);

        let worldPosition = this.getScene().getWorldPositionOnTerrain(randX, randZ);

        this.vehicleObject.respawnPosition(worldPosition.x, worldPosition.y + 2, worldPosition.z);

        if(this.headLights != null)
            this.headLights.group.visible = true;
        //this.turboParticleEmitter.isEmitting = true;
    }

    tryFirePrimaryWeapon(): void {

    }

    tryFireSecondaryWeapon(): void {

    }

    tryFireRocket(): void {

    }

    tryFireBullets(): void {

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
        this.healthBar.updateValue(this.currentHealth);

        if(this.playerId == this.getScene().player1.playerId)
            this.getScene().sceneController.updateHealthOnHud(this.currentHealth);
    }

    refillShield(): void {

    }

    trySelectPreviousWeapon(): void {

    }

    trySelectNextWeapon(): void {

    }
    
    tryResetPosition(): void {
        this.vehicleObject.resetPosition();
    }

    getTotalParticleCount(): number {
        let particleCount = 0;
        this.fireObjects.forEach(x => particleCount += x.getParticleCount());
        
        return particleCount;
    }
}