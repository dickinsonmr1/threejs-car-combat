import * as THREE from 'three';
import { IPrecipitationSystem } from './IPrecipitationSystem';

export class PrecipitationSystemGpu implements IPrecipitationSystem {
  public object: THREE.Points;
  private size: number;
  private count: number;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.OrthographicCamera;
  private physicsScene: THREE.Scene;
  private physicsMaterial: THREE.ShaderMaterial;
  private renderMaterial: THREE.ShaderMaterial;

  private rtPosA: THREE.WebGLRenderTarget;
  private rtPosB: THREE.WebGLRenderTarget;
  private posTex: THREE.DataTexture;
  private velTex: THREE.DataTexture;

  private swapFlag = false;

  constructor(renderer: THREE.WebGLRenderer, rainCount = 256) {

    console.log(renderer.capabilities.isWebGL2, renderer.capabilities.floatFragmentTextures);
    this.renderer = renderer;
    this.size = rainCount;
    this.count = this.size * this.size;

    // --- Create random position & velocity textures ---
    this.posTex = this.generateTexture(() => [
      (Math.random() - 0.5) * 100,
      Math.random() * 50,
      (Math.random() - 0.5) * 100,
      1
    ]);

    this.velTex = this.generateTexture(() => [0, -0.2 - Math.random() * 0.3, 0, 1]);

    // --- Create render targets ---
    this.rtPosA = this.createRT();
    this.rtPosB = this.createRT();

    // --- Ortho camera for simulation passes ---
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // --- Initialize position texture in render target ---
    const initScene = new THREE.Scene();
    const initQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: this.posTex })
    );
    initScene.add(initQuad);
    this.renderer.setRenderTarget(this.rtPosA);
    this.renderer.render(initScene, this.camera);
    this.renderer.setRenderTarget(null);

    // --- Physics update shader ---
    this.physicsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        posTex: { value: this.posTex },
        velTex: { value: this.velTex },
        delta: { value: 0.016 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D posTex;
        uniform sampler2D velTex;
        uniform float delta;
        varying vec2 vUv;

        void main() {
          vec4 pos = texture2D(posTex, vUv);
          vec4 vel = texture2D(velTex, vUv);

          pos.xyz += vel.xyz * delta * 60.0;

          // Reset if below ground
          if (pos.y < 0.0) {
            pos.y = 50.0;
            pos.x = (fract(sin(dot(vUv.xy ,vec2(12.9898,78.233))) * 43758.5453) - 0.5) * 100.0;
            pos.z = (fract(sin(dot(vUv.xy ,vec2(93.9898,18.233))) * 83758.5453) - 0.5) * 100.0;
          }

          gl_FragColor = pos;
        }
      `,
    });

    this.physicsScene = new THREE.Scene();
    const physicsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.physicsMaterial);
    this.physicsScene.add(physicsQuad);

    // --- Rain render shader ---
    this.renderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        positions: { value: this.rtPosA.texture },
        size: { value: 5.0 },
        projectionMatrix: { value: new THREE.Matrix4() },
        viewMatrix: { value: new THREE.Matrix4() },
      },
      vertexShader: `
        uniform sampler2D positions;
        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        uniform float size;

        varying float vAlpha;

        void main() {
          float texSize = ${this.size}.0;
          vec2 uv = vec2(
            mod(float(gl_VertexID), texSize) / texSize,
            floor(float(gl_VertexID) / texSize) / texSize
          );

          vec3 pos = texture2D(positions, uv).xyz;
          vec4 mvPosition = viewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * (300.0 / -mvPosition.z);
          vAlpha = smoothstep(0.0, 50.0, pos.y);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(0.6, 0.8, 1.0, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setDrawRange(0, this.count);

    this.object = new THREE.Points(rainGeometry, this.renderMaterial);
  }

  // --- Helper: Create random texture ---
  private generateTexture(callback: (x: number, y: number, i: number) => number[]): THREE.DataTexture {
    const data = new Float32Array(this.count * 4);
    for (let i = 0; i < this.count; i++) {
      const [x, y, z, w] = callback(Math.random(), Math.random(), i);
      data[i * 4 + 0] = x;
      data[i * 4 + 1] = y;
      data[i * 4 + 2] = z;
      data[i * 4 + 3] = w;
    }
    const tex = new THREE.DataTexture(data, this.size, this.size, THREE.RGBAFormat, THREE.FloatType);
    tex.needsUpdate = true;
    return tex;
  }

  // --- Helper: Create render target ---
  private createRT(): THREE.WebGLRenderTarget {
    return new THREE.WebGLRenderTarget(this.size, this.size, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  // --- Update simulation each frame ---
  public update(delta: number, camera: THREE.Camera): void {
    // Step 1: Run physics update
    this.physicsMaterial.uniforms.delta.value = delta;
    this.physicsMaterial.uniforms.posTex.value = this.getCurrentRT().texture;

    this.renderer.setRenderTarget(this.getNextRT());
    this.renderer.render(this.physicsScene, this.camera);
    this.renderer.setRenderTarget(null);

    // Step 2: Swap buffers
    this.swapFlag = !this.swapFlag;

    // Step 3: Render shader uses updated positions
    this.renderMaterial.uniforms.positions.value = this.getCurrentRT().texture;
    this.renderMaterial.uniforms.projectionMatrix.value.copy(camera.projectionMatrix);
    this.renderMaterial.uniforms.viewMatrix.value.copy((camera as THREE.PerspectiveCamera).matrixWorldInverse);
  }

  private getCurrentRT(): THREE.WebGLRenderTarget {
    return this.swapFlag ? this.rtPosB : this.rtPosA;
  }

  private getNextRT(): THREE.WebGLRenderTarget {
    return this.swapFlag ? this.rtPosA : this.rtPosB;
  }
}