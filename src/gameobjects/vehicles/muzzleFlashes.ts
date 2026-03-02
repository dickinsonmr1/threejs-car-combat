import { utimes } from 'fs';
import { start } from 'repl';
import * as THREE from 'three';

export default class MuzzleFlashes {

    mesh1: THREE.Mesh;
    mesh2: THREE.Mesh;
    group: THREE.Group = new THREE.Group();

    muzzleFlashLeftStartTime: number = -1;
    muzzleFlashRightStartTime: number = -1;
    muzzleFlashDuration: number = 0.8; // 0.08;

    shaderMaterialLeft: THREE.ShaderMaterial;
    shaderMaterialRight: THREE.ShaderMaterial;
    /**
     *
     */
    constructor(scene: THREE.Scene, leftOffset: THREE.Vector3, rightOffset: THREE.Vector3) {        

        this.shaderMaterialLeft = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader(),
            fragmentShader: this.fragmentShader(),
            transparent: true, // Enable transparency,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uDuration: { value: 0.08 }
            }
        });

        this.shaderMaterialRight = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader(),
            fragmentShader: this.fragmentShader(),
            transparent: true, // Enable transparency,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uDuration: { value: 0.08 }
            }
        });

        let muzzleFlashGeometry = new THREE.CylinderGeometry(
            0.0,   // tip radius
            0.25,  // base radius
            10,//0.6,   // length
            16,
            1,
            true   // open ended
        );
        muzzleFlashGeometry.rotateX(Math.PI / 2);
                    
        this.mesh1 = new THREE.Mesh(muzzleFlashGeometry, this.shaderMaterialLeft);
        this.mesh1.position.copy(leftOffset);
        this.group.add(this.mesh1);

        this.mesh2 = new THREE.Mesh(muzzleFlashGeometry, this.shaderMaterialRight);        
        this.mesh2.position.copy(rightOffset);
        this.group.add(this.mesh2);

        this.mesh1.visible = false;
        this.mesh2.visible = false;

        scene.add(this.group);
    }

    fire(isLeft: boolean, startTime: number) {

        if(isLeft) {
            this.muzzleFlashLeftStartTime = startTime;
            this.mesh1.visible = true;
        }
        else {
            this.muzzleFlashRightStartTime = startTime;
            this.mesh2.visible = true;
        }
    }

    update(position: THREE.Vector3, quaternion: THREE.Quaternion, clock: THREE.Clock) {

        this.group.position.copy(position);
        
        let extraQuat = new THREE.Quaternion();
        extraQuat = extraQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);      
        this.group.quaternion.copy(quaternion).multiply(extraQuat);

        const now = clock.getElapsedTime();

        if(this.mesh1.visible && this.muzzleFlashLeftStartTime >= 0) {
            const elapsed = now - this.muzzleFlashLeftStartTime;
            const life = elapsed / this.muzzleFlashDuration;

            if (life >= 1.0) {
                this.mesh1.visible = false;
                this.muzzleFlashLeftStartTime = -1;
                return;
            }
            else {

                // Drive shader time
                this.shaderMaterialLeft.uniforms.uTime.value = elapsed;

                // Optional: stretch forward over life
                const length = THREE.MathUtils.lerp(0.3, 1.2, life);
                this.mesh1.scale.set(1, 1, length);
            }
        }
        if (this.mesh2.visible && this.muzzleFlashRightStartTime >= 0) {
            const elapsed = now - this.muzzleFlashRightStartTime;
            const life = elapsed / this.muzzleFlashDuration;

            if (life >= 1.0) {
                this.mesh2.visible = false;
                this.muzzleFlashRightStartTime = -1;
                return;
            }
            else {

                // Drive shader time
                this.shaderMaterialRight.uniforms.uTime.value = elapsed;

                // Optional: stretch forward over life
                const length = THREE.MathUtils.lerp(0.3, 1.2, life);
                this.mesh2.scale.set(1, 1, length);
            }
           
        }
    }

    // Vertex shader
    vertexShader() {    
        return `
            varying vec2 vUv;
            varying float vLength;

            void main() {
                vUv = uv;
                vLength = uv.y; // along cone

                gl_Position = projectionMatrix *
                                modelViewMatrix *
                                vec4(position, 1.0);
            }
            `
    }


    // Fragment shader
    fragmentShader() {
        return `
                uniform float uTime;
                uniform float uDuration;

                varying vec2 vUv;
                varying float vLength;

                void main() {

                    float life = uTime / uDuration;
                    if (life > 1.0) discard;

                    // radial center
                    vec2 centered = vUv - vec2(0.5, 0.0);

                    float radius = abs(centered.x);

                    // animated spikes
                    float angle = atan(centered.x, vLength);
                    float spikes = sin(angle * 12.0 + uTime * 40.0) * 0.2 + 0.8;

                    // core cone glow
                    float cone = smoothstep(0.4 * spikes, 0.0, radius);

                    // fade toward tip
                    float lengthFade = smoothstep(1.0, 0.0, vLength);

                    // overall fade over lifetime
                    float timeFade = 1.0 - life;

                    float intensity = cone * lengthFade * timeFade;

                    vec3 color = vec3(2.0, 1.2, 0.4) * intensity;

                    gl_FragColor = vec4(color, intensity);
                }
        `
    }
}