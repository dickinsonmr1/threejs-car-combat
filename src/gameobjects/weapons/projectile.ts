import * as THREE from "three";
import { PointLightObject } from "../fx/pointLightObject";
import { SphereObject } from "../shapes/sphereObject";
import { ParticleTrailObject, ParticleEmitterType } from "../fx/particleTrailObject";
import { ProjectileType } from "./projectileType";
import { v4 as uuidv4 } from 'uuid';
import * as CANNON from 'cannon-es'
import { Utility } from "../../utility";

export enum ProjectileLaunchLocation {
    Left,
    Center,
    Right
}

export class Projectile extends SphereObject {

    public playerId: string;
    public projectileType: ProjectileType;
    private lightColor: THREE.Color;
    private particleColor: THREE.Color;

    scene: THREE.Scene;

    pointLightObject!: PointLightObject;
    particleEmitterObject!: ParticleTrailObject;
    
	private readonly velocity = new THREE.Vector3();    

	private isDead = false;

    private maxLifespanInSeconds: number = 3;

    //private expiryTimer: THREE.Clock;

    constructor(scene: THREE.Scene,
        playerId: string,
        projectileType: ProjectileType,
        radius: number,
        position: THREE.Vector3,
        launchVector: THREE.Vector3,
        projectileSpeed: number,
        lightColor: THREE.Color,
        particleColor: THREE.Color,
        meshMaterial?: THREE.Material,
        particleTexture?: THREE.Texture,
        world?: CANNON.World) {
        
        super(scene, radius, position, particleColor.getHex(), meshMaterial, world);

        this.scene = scene;
        
        this.playerId = playerId;
        this.projectileType = projectileType;

        this.lightColor = lightColor;
        this.particleColor = particleColor;
        
        //scene.add(this.group);
        this.group.position.set(position.x, position.y, position.z);

        if(this.projectileType == ProjectileType.Rocket) {

            
            this.pointLightObject = new PointLightObject(
                scene,
                lightColor,//new THREE.Color('white'),
                0.2, 2, 0.96, 
                new THREE.Vector3()// this.group.position
            );

            //if(this.pointLightObject.pointLight != null) 
            //this.group.add(this.pointLightObject.group);

            //if(this.pointLightObject.pointLightHelper != null) 
                //this.group.add(this.pointLightObject.pointLightHelper);

            //this.group.position.set(position.x, position.y, position.z);

            if(particleTexture != null) {
                this.particleEmitterObject = new ParticleTrailObject(
                    scene,
                    ParticleEmitterType.GlowingParticles,
                    particleTexture,
                    particleColor,//new THREE.Color('grey'),
                    position,
                    1,
                    20,
                    0.0025
                )
            };
        }
        
        setTimeout(() => {            
            this.isDead = true
        }, 5000);
        

        this.setVelocity(
            launchVector.x * projectileSpeed,
            launchVector.y * projectileSpeed,
            launchVector.z * projectileSpeed
        );

        //this.expiryTimer = new THREE.Clock(true);
        //this.expiryTimer.start();
    }

    getLightColor(): THREE.Color {
        return this.lightColor;
    }

    getParticleColor(): THREE.Color {
        return this.particleColor;
    }

    get shouldRemove() {
		return this.isDead;
	}

	setVelocity(x: number, y: number, z: number) {
		this.velocity.set(x, y, z);
        //this.body?.velocity.set(x, y, z);
	}

	kill(): void {

        super.kill();
        this.isDead = true;

        if(this.particleEmitterObject != null) {
            this.particleEmitterObject.stop();
        }
        if(this.pointLightObject != null) {
            this.pointLightObject.kill();
        
        }

        this.scene.remove(this.mesh);
        this.scene.remove(this.group);        
	}

    update() {

        //this.body?.applyForce(new CANNON.Vec3(0, 9.81, 0)) // opposite of gravity 
        super.update();

        if(this.isDead) {
            this.kill();
            return;
        }
        
        //if(this.expiryTimer.getElapsedTime() > this.maxLifespanInSeconds) {
            //this.kill();
            //return;
        //}        

        
        //this.body?.velocity.set(this.velocity.x, this.velocity.y, this.velocity.z);
        this.group.position.x += this.velocity.x;
		this.group.position.y += this.velocity.y;
		this.group.position.z += this.velocity.z;

        //this.body?.position.addScaledVector(1, Utility.ThreeVec3ToCannonVec3(this.velocity));
        this.body?.position.set(this.group.position.x, this.group.position.y, this.group.position.z);
        //this.body?.updateBoundingRadius();
        this.body?.updateAABB();

        this.pointLightObject?.setPosition(this.group.position);

        if(this.particleEmitterObject != null) {     
            this.particleEmitterObject.setEmitPosition(this.getPosition());   
            //this.particleEmitterObject.update(this.getPosition());
        }
    }
}