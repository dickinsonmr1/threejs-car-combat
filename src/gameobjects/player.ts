// import { v4 as uuidv4 } from 'uuid';
import { ProjectileType } from "./weapons/projectileType";
import HealthBar from "./healthBar";
import { RigidVehicleObject } from "./vehicles/rigidVehicle/rigidVehicleObject";
import { Utility } from "../utility";
import Headlights from "./vehicles/headLights";
import * as THREE from "three";
import { v4 as uuidv4 } from 'uuid';
import { FireObject } from "./fx/fireObject";
import GameScene from "../scenes/gameScene";
import ProjectileFactory from "./weapons/projectileFactory";
import { Projectile, ProjectileLaunchLocation } from "./weapons/projectile";
import { RaycastVehicleObject } from "./vehicles/raycastVehicle/raycastVehicleObject";
import { IPlayerVehicle } from "./vehicles/IPlayerVehicle";


export enum PlayerState {
    Alive,
    Dead,
    Respawning
}

export class Player {
    // TODO: implement
    /**
     *
     */

    scene: THREE.Scene;
    //public playerId: uuidv4;
    public playerName: string;
    public playerId: string;
    maxHealth: number = 100;
    currentHealth: number;

    static RespawnTimeinMs: number = 3000;

    playerState: PlayerState = PlayerState.Alive;

    healthBar: HealthBar;
    headLights: Headlights;

    vehicleObject!: IPlayerVehicle;    
    //private rigidVehicleObject!: RigidVehicleObject;
    //private raycastVehicleObject!: RaycastVehicleObject;

    fireObjects: FireObject[] = [];

    private fireLeft: boolean = false;
    private projectileFactory: ProjectileFactory = new ProjectileFactory();

    constructor(scene: THREE.Scene,
        playerName: string) {

        this.scene = scene;

        this.playerId = uuidv4();
        this.healthBar = new HealthBar(scene, this.maxHealth);

        this.currentHealth = this.maxHealth;

        this.headLights = new Headlights(scene);
        //super();

        //this.playerId = uuidv4();
        this.playerName = playerName;        
    }


    /*
    createProjectile(): Projectile {
        return;
    }
    */

    getPosition(): THREE.Vector3{
        if(!this.vehicleObject?.getChassis().body) return new THREE.Vector3(0,0,0);

        return Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position);
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

        this.healthBar.update(Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position));

        this.headLights.update(
            Utility.CannonVec3ToThreeVec3(this.vehicleObject.getChassis().body.position),
            Utility.CannonQuaternionToThreeQuaternion(this.vehicleObject.getChassis().body.quaternion)
        );
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
            scene.explosionTexture);              
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


            let scene = <GameScene>this.scene;
            
            this.headLights.group.visible = false;
            this.vehicleObject.getModel().visible = false;

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

        this.headLights.group.visible = true;
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
    }

    refillShield(): void {

    }

    trySelectPreviousWeapon(): void {

    }

    trySelectNextWeapon(): void {

    }

    getTotalParticleCount(): number {
        let particleCount = 0;
        this.fireObjects.forEach(x => particleCount += x.getParticleCount());
        
        return particleCount;
    }
}