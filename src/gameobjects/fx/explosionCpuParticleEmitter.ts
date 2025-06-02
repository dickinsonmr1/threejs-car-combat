import * as THREE from "three";
import { PointLightObject } from "./pointLightObject";
import { ParticleEmitter } from "./particleEmitter";
import { Utility } from "../../utility";

export class ExplosionCpuParticleEmitter extends ParticleEmitter {
    
    setEmitPosition(position: THREE.Vector3): void {
        throw new Error("Method not implemented.");
    }
    getParticleCount(): number {
        return this.particleGroup.children.length;
    }


    isEmitting: boolean;
    isDead: boolean;
    
    scene: THREE.Scene;
    particleGroup: THREE.Group;
    particleTexture: THREE.Texture;
    lightColor: THREE.Color;

    particleColor1: THREE.Color;
    particleColor2: THREE.Color;
    particleColor3: THREE.Color;
    particleColor4: THREE.Color;

    position: THREE.Vector3;
    numberParticles: number;
    initialVelocity: number;
    velocityMultiplier: number;

    opacityReduction: number;
    scaleMultiplier: number;

    pointLightObject?: PointLightObject;

    // tutorial from here: https://www.youtube.com/watch?v=DtRFv9_XfnE

    constructor(scene: THREE.Scene,
        particleTexture: THREE.Texture,
        lightColor: THREE.Color,

        particleColor1: THREE.Color,
        particleColor2: THREE.Color,
        particleColor3: THREE.Color,
        particleColor4: THREE.Color,

        position: THREE.Vector3,
        numberParticles: number,
        initialVelocity: number,
        velocityMultiplier: number,
        particleInitialScale: number,
        opacityReduction: number,
        scaleMultiplier: number) {

        super();

        this.scene = scene;
        this.particleGroup = new THREE.Group();
        this.particleTexture = particleTexture;
        this.lightColor = lightColor;

        this.particleColor1 = particleColor1;
        this.particleColor2 = particleColor2;
        this.particleColor3 = particleColor3;
        this.particleColor4 = particleColor4;

        this.position = position;
        this.numberParticles = numberParticles;
        this.initialVelocity = initialVelocity;
        this.velocityMultiplier = velocityMultiplier;
        this.opacityReduction = opacityReduction;
        this.scaleMultiplier = scaleMultiplier;

        this.isEmitting = true;
        this.isDead = false;

        for(let i = 0; i < numberParticles; i++) {
            let particleMaterial = new THREE.SpriteMaterial({
                map: this.particleTexture,
                depthTest: true
            });

            let sprite = new THREE.Sprite(particleMaterial);
            sprite.material.blending = THREE.AdditiveBlending;
            
            sprite.userData.velocity = new THREE.Vector3(
                Math.random() * this.initialVelocity - this.initialVelocity / 2,
                Math.random() * this.initialVelocity - this.initialVelocity / 4, // particles should go upwards more
                Math.random() * this.initialVelocity - this.initialVelocity / 2
            );
            sprite.userData.velocity.multiplyScalar(Math.random() * Math.random() * 3 + 2);

            sprite.material.color = particleColor1;

            sprite.material.opacity = Math.random() * 0.2 + 0.8;

            let size = Math.random() * 0.1 + particleInitialScale;
            sprite.scale.set(size, size, size);

            this.particleGroup.add(sprite);
        }

        this.particleGroup.position.set(position.x, position.y, position.z);

        //this.pointLightObject = new PointLightObject(scene,
            //lightColor, 0.1, 2, 0.5, position);
        /*
        this.particleGroup.position.set(
            Math.random() * 20 - 10,
            Math.random() * 5 + 3,
            Math.random() * 10 - 5);
        */
       //if(this.pointLightObject.pointLight)
            //this.particleGroup.add(this.pointLightObject.pointLight)

        this.scene.add(this.particleGroup);
    }

    getPosition(): THREE.Vector3 {
        return this.particleGroup.position;
    }

    setPosition(position: THREE.Vector3) {
        this.particleGroup.position.set(position.x, position.y, position.z);
    }
    
    setQuaternion(quaternion: THREE.Quaternion): void {
        throw new Error("Method not implemented.");
    }

    update() {
        this.particleGroup.children.forEach((child) => {
            let item = <THREE.Sprite>child;

            child.userData.velocity.x *= this.velocityMultiplier;
            //child.userData.velocity.y *= this.velocityMultiplier;
            child.userData.velocity.z *= this.velocityMultiplier;

            item.position.add(child.userData.velocity);
            item.material.opacity -= this.opacityReduction;
            item.scale.x *= this.scaleMultiplier;
            item.scale.y *= this.scaleMultiplier;
            item.scale.z *= this.scaleMultiplier;
            //item.material.opacity *= this.opacityMultiplier;
            
            const color1 = item.material.color;
            item.material.color.copy(color1);      
            
            //THREE.MathUtils.lerp
            if(item.material.opacity < 0.60 && item.material.opacity >= 0.50)      
                item.material.color.lerp(this.particleColor2, 0.5);
            else if(item.material.opacity < 0.50 && item.material.opacity >= 0.25)      
                item.material.color.lerp(this.particleColor3, 0.5);
            else if(item.material.opacity < 0.25)
                item.material.color.lerp(this.particleColor4, 0.5);

            if(item.material.opacity <= 0.0) {
                this.particleGroup.remove(item);
                Utility.disposeSprite(item);
            }
        });

        this.particleGroup.children = this.particleGroup.children
            .filter((child) => {
                let item = <THREE.Sprite>child;
                return item.material.opacity > 0.0;
            });       
                    
        if(this.pointLightObject && this.pointLightObject.pointLight)
            this.pointLightObject.pointLight.intensity *= 0.95;

        if(this.particleGroup.children.length === 0) {
            this.isDead = true;
            this.pointLightObject?.kill();
            this.scene.remove(this.particleGroup);
        } 
        else {
            this.pointLightObject?.update();
        }
    }

    kill(): void {
        throw new Error("Method not implemented.");
    }
    stop(): void {
        throw new Error("Method not implemented.");
    }

    pause(): void {
        throw new Error("Method not implemented.");
    }
    resume(): void {
        throw new Error("Method not implemented.");
    }
}