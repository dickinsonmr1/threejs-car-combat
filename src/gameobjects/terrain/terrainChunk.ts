import * as THREE from "three";
import * as CANNON from 'cannon-es'
import { Utility } from "../../utility";
import { WorldConfig } from "../world/worldConfig";
import { GameConfig } from "../../gameconfig";

export class TerrainChunk {
    
    body?: CANNON.Body;
    mesh: THREE.Mesh;

    heightMapLength: number;

    private heightfieldShape!: CANNON.Heightfield;
    private physicsMaterial?: CANNON.Material;

    fog: THREE.Fog;

    gameConfig: GameConfig;

    constructor(scene: THREE.Scene,
        world: CANNON.World,
        physicsMaterial: CANNON.Material,
        heightmap: number[][],
        worldConfig: WorldConfig,
        gameConfig: GameConfig,
        offset: THREE.Vector3) {
            
        // important: width and height used in this class need to match dimensions of heightmap!
        var height = heightmap.length;
        var width = heightmap.length;

        this.heightMapLength = heightmap.length;

        this.physicsMaterial = physicsMaterial;
        
        this.fog = scene.fog as THREE.Fog;

        this.gameConfig = gameConfig;

        let grid = new THREE.GridHelper( height, 10, 0xffffff, 0xffffff );
        grid.material.opacity = 1;
        grid.material.transparent = false;
        scene.add( grid );
              
        // physics object and mesh generated directly from physics object
        this.body = this.generateCannonHeightField(world, height, width, worldConfig.heightScale, worldConfig.horizontalScale, heightmap, offset);            
        //this.body.position.vadd(Utility.ThreeVec3ToCannonVec3(offset));

        const planeSize = width * 2;
        var geometry = this.generateMeshFromHeightData(height, width, heightmap, worldConfig.horizontalScale);
        var material = this.generateMaterial(256, worldConfig.heightScale, worldConfig, gameConfig.isDebug);

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.rotation.z = Math.PI / 2;

        this.mesh.position.add(offset);
        scene.add(this.mesh);    
    }
    
    getPhysicsMaterial(): CANNON.Material {
        
        if(this.physicsMaterial != null)
            return this.physicsMaterial;
        else
            throw new Error("No physics material set!")
    }

    getPosition() {
        return this.mesh.position;
    }

    update() {
        if(this.body != null) {
            //this.generatedMesh.position.copy(Utility.CannonVec3ToThreeVec3(this.body.position));
            //this.generatedMesh.quaternion.copy(Utility.CannonQuaternionToThreeQuaternion(this.body.quaternion));
            //this.body.updateAABB();
        }        
    }

    generateCannonHeightField(world: CANNON.World, sizeX: number, sizeZ: number, heightFactor: number, horizontalScale: number, dataArray2D: number[][] = [], offset: THREE.Vector3): CANNON.Body {           

        // generate physics object
        var matrix: number[][] = [];

        // scale by heightFactor
        if(dataArray2D.length > 0) {
          matrix = dataArray2D;
          for (let i = 0; i < sizeX; i++) {
            for (let j = 0; j < sizeZ; j++) {
              matrix[i][j] *= heightFactor;              
            }
          }
        }
        
        const groundMaterial = new CANNON.Material('ground');
        this.heightfieldShape = new CANNON.Heightfield(matrix, {
          elementSize: horizontalScale
        });

        const heightfieldBody = new CANNON.Body({ mass: 0, material: groundMaterial, isTrigger: false });
        heightfieldBody.addShape(this.heightfieldShape);

        heightfieldBody.position.set(
          -(sizeX * this.heightfieldShape.elementSize) / 2,
          0,
          (sizeZ * this.heightfieldShape.elementSize) / 2
        );
        heightfieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        heightfieldBody.position.set(
          heightfieldBody.position.x + offset.x,
          heightfieldBody.position.y + offset.y,
          heightfieldBody.position.z + offset.z
        );

        world.addBody(heightfieldBody);

        heightfieldBody.addEventListener('collide', (event: any) => {
          let body = <CANNON.Body>event.body;
          //console.log('body collided with terrain', event);
        });

        return heightfieldBody;
    }    

    generateMaterial(repeats: number, heightFactor: number, worldConfig: WorldConfig, isWireframe: boolean): THREE.Material {

      const loader = new THREE.TextureLoader();

      const texture1 = this.loadAndConfigureTexture(loader, worldConfig.texture1, repeats);                
      const texture2 = this.loadAndConfigureTexture(loader, worldConfig.texture2, repeats);        
      const texture3 = this.loadAndConfigureTexture(loader, worldConfig.texture3, repeats);        
      const texture4 = this.loadAndConfigureTexture(loader, worldConfig.texture4, repeats);
      const texture5 = this.loadAndConfigureTexture(loader, worldConfig.texture5, repeats);

      const roadMaskTexture = this.loadAndConfigureTexture(loader, 'assets/terrain/road-mask-256x256.png', repeats);
      const roadTexture = this.loadAndConfigureTexture(loader, 'assets/terrain/road-32x32.png', repeats);

      return new THREE.ShaderMaterial({
          uniforms: {
            lowTexture: { value: texture1},
            lowMidTexture: { value: texture2 },
            midTexture: { value: texture3 },
            highMidTexture: { value: texture4 },
            highTexture: { value: texture5 },

            roadMaskTexture: {value: roadMaskTexture},
            roadTexture: {value: roadTexture },
            roadRepeats: {value: repeats},

            repeats: { value: repeats },
            heightFactor: { value: heightFactor },
            fogColor: { value: this.fog?.color ?? new THREE.Color('black') },
            fogNear: { value: (this.fog as THREE.Fog)?.near ?? 10000 },
            fogFar: { value: (this.fog as THREE.Fog)?.far ?? 10000 },
          },
          fog: this.gameConfig.useFog,
          vertexShader: this.vertexShader4(),
          fragmentShader: this.fragmentShader4(),
          wireframe: isWireframe
      });
    }

    generateMeshFromHeightData(height: number, width: number, matrix: number[][], horizontalScale: number): THREE.PlaneGeometry {
      const geometry = new THREE.PlaneGeometry(width * horizontalScale, height * horizontalScale, width - 1, height - 1);

      // Apply the height data to the plane geometry vertices
      for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
        const x = i / 3 % width;
        const y = Math.floor(i / 3 / width);
        geometry.attributes.position.array[i + 2] = matrix[y][x];
      }
      geometry.computeVertexNormals();

      return geometry;
    }

    loadAndConfigureTexture(loader: THREE.TextureLoader, asset: string, repeats: number): THREE.Texture
    {
        const texture = loader.load(asset);                
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        //texture.minFilter = THREE.NearestMipMapLinearFilter;
        //texture.anisotropy = 16;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.repeat.set(repeats, repeats);
        texture.needsUpdate = true;

        return texture;
    }

    getHeightFieldShape(): CANNON.Heightfield {
      return this.heightfieldShape;
    }

    getWorldPositionOnTerrain(x: number, z: number): THREE.Vector3 {
      
      let worldPosition = new THREE.Vector3(0,0,0);

      let startPosition = new THREE.Vector3(x, 100, z);
      let endPosition = new THREE.Vector3(x, -100, z);

      let ray = new CANNON.Ray(Utility.ThreeVec3ToCannonVec3(startPosition), Utility.ThreeVec3ToCannonVec3(endPosition));                
      var raycastResult: CANNON.RaycastResult = new CANNON.RaycastResult();
      if(this.body != null) {
          ray.intersectBody(this.body, raycastResult);
      }
      if(raycastResult != null && raycastResult.hasHit) {
          worldPosition = Utility.CannonVec3ToThreeVec3(raycastResult.hitPointWorld);           
      }

      return worldPosition;
  }

  getMapDimensions(): THREE.Vector3 {
    return new THREE.Vector3(this.heightMapLength, 0, this.heightMapLength);
  }

  generateGrassBillboards(textureName: string, mapWidth: number, mapHeight: number, yMin: number, yMax: number, maxCount: number): THREE.Points {

    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    const sprite = new THREE.TextureLoader().load( textureName );
    sprite.colorSpace = THREE.SRGBColorSpace;

    for ( let i = 0; i < maxCount; i ++ ) {

        const x = mapWidth * Math.random() - mapWidth / 2;
        const z = mapHeight * Math.random() - mapHeight / 2;

        let tempVector3 = this.getWorldPositionOnTerrain(x, z);
        if(tempVector3.y > yMin && tempVector3.y < yMax)
            vertices.push( tempVector3.x, tempVector3.y, tempVector3.z );
    }

    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    var material = new THREE.PointsMaterial( { size: 1, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: false, depthTest: true, depthWrite: false } );
    //material.color.setHSL( 1.0, 0.3, 0.7, THREE.SRGBColorSpace );

    return new THREE.Points( geometry, material );
  }

    vertexShader4() {
      return `
      varying vec3 vPosition;
      varying vec2 vUv;
      varying float vFogDepth;

      void main() {
        vPosition = position;
        vUv = uv;
        
        // Calculate model-view position (required for fog)
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

        // Pass the fog depth (distance from the camera)
        vFogDepth = -mvPosition.z;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `
    }

    fragmentShader4() {
      return `

      uniform sampler2D lowTexture;
      uniform sampler2D lowMidTexture;
      uniform sampler2D midTexture;
      uniform sampler2D highMidTexture;
      uniform sampler2D highTexture;      
      uniform float repeats;

      uniform sampler2D roadMaskTexture;
      uniform sampler2D roadTexture;      
      uniform float roadRepeats;
      
      uniform float heightFactor;

      uniform vec3 fogColor;
      uniform float fogNear;
      uniform float fogFar;

      varying vec3 vPosition;      
      varying vec2 vUv;
      varying float vFogDepth;

      void main() {
        float height = vPosition.z / heightFactor; // Normalize height to 0.0 - 1.0

        vec2 repeatedUv = vUv * repeats; // Adjust the number of repetitions here

        vec4 lowColor = texture2D(lowTexture, repeatedUv);
        vec4 lowMidColor = texture2D(lowMidTexture, repeatedUv);
        vec4 midColor = texture2D(midTexture, repeatedUv);
        vec4 highMidColor = texture2D(highMidTexture, repeatedUv);
        vec4 highColor = texture2D(highTexture, repeatedUv);

        vec4 color = mix(lowColor, lowMidColor, smoothstep(0.0, 0.25, height));
        color = mix(color, midColor, smoothstep(0.25, 0.5, height));
        color = mix(color, highMidColor, smoothstep(0.5, 0.75, height));
        color = mix(color, highColor, smoothstep(0.75, 1.0, height));

        //// Mix base color with fog color based on fog factor
        //gl_FragColor = vec4(mix(color.rgb, fogColor, fogFactor), color.a);

        vec2 roadUv = vUv * roadRepeats;

        vec4 roadColor = texture2D(roadTexture, roadUv);
        float mask = texture2D(roadMaskTexture, vUv).r;

            //float roadBlend = texture2D(roadMaskTexture, vUv).r; 
            //float roadBlend = smoothstep(0.4, 0.6, texture2D(roadMaskTexture, vUv).r);

        float roadBlend = mask * roadColor.a;
        roadBlend = clamp(roadBlend, 0.0, 1.0);

        //vec4 finalColor = mix(color, roadColor, roadBlend);
        vec3 finalColor = mix(color.rgb, roadColor.rgb, roadBlend);

        // Fog factor calculation (standard linear fog)
        float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);

        // Apply fog AFTER blending
        vec3 fogged = mix(finalColor.rgb, fogColor, fogFactor);

        gl_FragColor = vec4(fogged, 1.0);
      }
        `
    }
}