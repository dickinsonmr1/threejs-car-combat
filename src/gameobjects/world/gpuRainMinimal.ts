import * as THREE from 'three';
import { IPrecipitationSystem } from './IPrecipitationSystem';

export class GpuRainMinimal implements IPrecipitationSystem {
  mesh: THREE.Points;
  uniforms: { [uniform: string]: THREE.IUniform };

  constructor(scene: THREE.Scene, private count = 20000, private height = 50, private area = 50) {
    const positions = new Float32Array(this.count * 3);
    const velocities = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * this.area;
      positions[i * 3 + 1] = Math.random() * this.height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.area;
      velocities[i] = 5 + Math.random() * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

    this.uniforms = {
      uTime: { value: 0 },
      uHeight: { value: this.height }
    };

    const vertexShader = /* glsl */`
      uniform float uTime;
      uniform float uHeight;
      attribute float velocity;
      void main() {
        vec3 pos = position;
        pos.y -= mod(uTime * velocity + position.y, uHeight);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = 20.0;
      }
    `;

    const fragmentShader = /* glsl */`
      void main() {
        // simple round raindrop
        float r = length(gl_PointCoord - vec2(0.5));
        if (r > 0.5) discard;
        gl_FragColor = vec4(0.6, 0.7, 1.0, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.mesh = new THREE.Points(geometry, material);
    scene.add(this.mesh);
  }

  update(dt: number) {
    this.uniforms.uTime.value += dt;
  }
}