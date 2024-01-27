import * as THREE from "three";

export class PointLightObject {

    scene: THREE.Scene;
    pointLight?: THREE.PointLight;
    pointLightHelper?: THREE.PointLightHelper;
    group: THREE.Group = new THREE.Group;

    constructor(scene: THREE.Scene,
        color: THREE.Color,
        intensity: number,
        distance: number,
        decay: number,
        position: THREE.Vector3) {

        this.scene = scene;

        this.pointLight = new THREE.PointLight(color, intensity, distance, decay);
        //this.pointLight.position.set(0,0,0);
        this.pointLight.castShadow = false;

        this.pointLightHelper = new THREE.PointLightHelper(this.pointLight)
        //this.pointLightHelper.position.set(0,0,0);                            
        
        this.group.add(this.pointLight);
        this.group.position.set(position.x, position.y, position.z);

        // hack
        scene.add(this.pointLightHelper);

        scene.add(this.group);
    }

    getPosition() {
        return this.group.position;
    }

    // only use if pointLight is not already attached to another object
    setPosition(position: THREE.Vector3) {
        this.group.position.set(position.x, position.y, position.z);        
    }

    update() {
        //this.pointLightHelper?.update();
    }

    kill() {

        if(this.pointLight != null) {
            this.pointLight.visible = false;
            this.group.remove(this.pointLight);
        }

        if(this.pointLightHelper != null) {
            this.pointLightHelper.visible = false;
            this.scene.remove(this.pointLightHelper);
        }

        this.scene.remove(this.group);
    }
}