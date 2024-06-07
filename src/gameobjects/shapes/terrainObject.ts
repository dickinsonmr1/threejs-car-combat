import * as THREE from "three";
import * as CANNON from 'cannon-es'
import { Utility } from "../../utility";


// TODO: combine PlaneObject and GroundObject (in progress)
export class TerrainObject {
    
    displacementMesh?: THREE.Mesh;
    generatedMesh: THREE.Mesh;

    body?: CANNON.Body;
    heightfieldShape!: CANNON.Heightfield;

    meshMaterial?: THREE.Material;
    physicsMaterial?: CANNON.Material;

    grid?: THREE.GridHelper;

    constructor(scene: THREE.Scene,
        height: number, width: number,
        meshMaterial: THREE.Material,
        world: CANNON.World,
        physicsMaterial: CANNON.Material,
        dataArray2D: number[][] = []) {
            
        this.meshMaterial = meshMaterial;        
        this.physicsMaterial = physicsMaterial;
        
        this.generatedMesh = new THREE.Mesh(
            new THREE.PlaneGeometry( height, width, 100, 100),
            this.meshMaterial
        );

        let grid = new THREE.GridHelper( height, 10, 0xffffff, 0xffffff );
        grid.material.opacity = 1;
        grid.material.transparent = false;
        scene.add( grid );

        // TODO: use height and width
        this.generateCannonHeightField(scene, world, height, width, dataArray2D);
        this.generateThreeMeshFromCannonHeightField(scene, height, width);
        this.generateSplattedMeshFromDisplacementPlane(scene, 20, 20);
    }
    
    getPhysicsMaterial(): CANNON.Material {
        
        if(this.physicsMaterial != null)
            return this.physicsMaterial;
        else
            throw new Error("No physics material set!")
    }

    getPosition() {
        return this.generatedMesh?.position;
    }

    update() {
        if(this.body != null) {
            this.generatedMesh.position.copy(Utility.CannonVec3ToThreeVec3(this.body.position));
            this.generatedMesh.quaternion.copy(Utility.CannonQuaternionToThreeQuaternion(this.body.quaternion));
            this.body.updateAABB();
        }        
    }

    generateCannonHeightField(scene: THREE.Scene, world: CANNON.World, sizeX: number, sizeZ: number, dataArray2D: number[][] = []) {           
        // generate physics object
        var height = 3;        

        //const sizeX = 64;
        //const sizeZ = 64;

        var matrix: number[][] = [];

        if(dataArray2D.length > 0) {
          matrix = dataArray2D;
          for (let i = 0; i < sizeX; i++) {
            for (let j = 0; j < sizeZ; j++) {
              matrix[i][j] *= 10;
              matrix[i][j] += 1;
            }
          }
        }
        else {
          for (let i = 0; i < sizeX; i++) {
            
            matrix.push([]);
            for (let j = 0; j < sizeZ; j++) {
              if (i === 0 || i === sizeX - 1 || j === 0 || j === sizeZ - 1) {
                matrix[i].push(height);
                continue;
              }

              const height2 = Math.cos((i / sizeX) * Math.PI * 5) * Math.cos((j / sizeZ) * Math.PI * 5) * 2 + 2;
              matrix[i].push(height2);
            }
          }
        }

        const groundMaterial = new CANNON.Material('ground');
        this.heightfieldShape = new CANNON.Heightfield(matrix, {
          elementSize: 100 / sizeX,
        });

        const heightfieldBody = new CANNON.Body({ mass: 0, material: groundMaterial });
        heightfieldBody.addShape(this.heightfieldShape);

        heightfieldBody.position.set(
          // -((sizeX - 1) * heightfieldShape.elementSize) / 2,
          -(sizeX * this.heightfieldShape.elementSize) / 2,
          -1,
          // ((sizeZ - 1) * heightfieldShape.elementSize) / 2
          (sizeZ * this.heightfieldShape.elementSize) / 2
        );
        heightfieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        
        world.addBody(heightfieldBody);
        this.body = heightfieldBody;
    
        // TODO: see if texture can be loaded into array to generate cannon heightfield (similiar to three.js displacement map)
        // https://threejs.org/docs/#api/en/textures/DataTexture       
    }    

    generateThreeMeshFromCannonHeightField(scene: THREE.Scene, sizeX: number, sizeZ: number) {
        // https://sbcode.net/threejs/physics-cannonDebugrenderer/
        // generate THREE mesh
        
        let points: THREE.Vector3[] = [];
        var tempGeometry = new THREE.BufferGeometry();

        var tmpVec0: CANNON.Vec3 = new CANNON.Vec3()
        var tmpVec1: CANNON.Vec3 = new CANNON.Vec3()
        var tmpVec2: CANNON.Vec3 = new CANNON.Vec3()
        //var tmpQuat0: CANNON.Quaternion = new CANNON.Quaternion()

        var shape = this.heightfieldShape;
        var v0 = tmpVec0;
        var v1 = tmpVec1;
        var v2 = tmpVec2;
        for (let xi = 0; xi < (shape as CANNON.Heightfield).data.length - 1; xi++) {
          for (let yi = 0; yi < (shape as CANNON.Heightfield).data[xi].length - 1; yi++) {
            for (let k = 0; k < 2; k++) {
              
              (shape as CANNON.Heightfield).getConvexTrianglePillar(xi, yi, k === 0);
              
              v0.copy((shape as CANNON.Heightfield).pillarConvex.vertices[0]);
              v1.copy((shape as CANNON.Heightfield).pillarConvex.vertices[1]);
              v2.copy((shape as CANNON.Heightfield).pillarConvex.vertices[2]);
              
              v0.vadd((shape as CANNON.Heightfield).pillarOffset, v0);
              v1.vadd((shape as CANNON.Heightfield).pillarOffset, v1);
              v2.vadd((shape as CANNON.Heightfield).pillarOffset, v2);

              points.push(new THREE.Vector3(v0.x, v0.y, v0.z), new THREE.Vector3(v1.x, v1.y, v1.z), new THREE.Vector3(v2.x, v2.y, v2.z));
              //const i = geometry.vertices.length - 3
              //geometry.faces.push(new THREE.Face3(i, i + 1, i + 2))
            }
          }
        }
        tempGeometry.setFromPoints(points);
        //tempGeometry.computeFaceNormals();
        tempGeometry.computeVertexNormals();
        //tempGeometry.computeTangents();
        tempGeometry.computeBoundingBox();

        var tempMesh = new THREE.Mesh(tempGeometry, this.meshMaterial);
        tempMesh.scale.set(1, 1, 1);
        tempMesh.position.set(
            // -((sizeX - 1) * heightfieldShape.elementSize) / 2,
            -(sizeX * this.heightfieldShape.elementSize) / 2,
            -1,
            // ((sizeZ - 1) * heightfieldShape.elementSize) / 2
            (sizeZ * this.heightfieldShape.elementSize) / 2
        );
        tempMesh.rotation.x = - Math.PI / 2;
        tempMesh.castShadow = false;
        tempMesh.receiveShadow = true;  
        
        this.generatedMesh = tempMesh;
        scene.add(this.generatedMesh);
    }

    generateSplattedMeshFromDisplacementPlane(scene: THREE.Scene, height: number, width: number) {
        const displacementMap = new THREE.TextureLoader().load('assets/heightmap_64x64.png');
        //const displacementMap = new THREE.TextureLoader().load('assets/heightmaps/heightmapSS_480.png');
        //const normalMap = new THREE.TextureLoader().load('assets/normal-map.png');
        
        const planeSize = 40;
        const repeats = planeSize / 2;

        const loader = new THREE.TextureLoader();

        //const texture = loader.load('assets/checker.png');
        const texture = loader.load('assets/tileable_grass_00.png');                
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.repeat.set(repeats, repeats);

        const texture2 = loader.load('assets/tileable_grass_01.png');
        texture2.wrapS = THREE.RepeatWrapping;
        texture2.wrapT = THREE.RepeatWrapping;
        texture2.magFilter = THREE.NearestFilter;
        texture2.colorSpace = THREE.SRGBColorSpace;
        texture2.repeat.set(repeats, repeats);

        const texture3 = loader.load('assets/stone 3.png');
        texture3.wrapS = THREE.RepeatWrapping;
        texture3.wrapT = THREE.RepeatWrapping;
        texture3.magFilter = THREE.NearestFilter;
        texture3.colorSpace = THREE.SRGBColorSpace;
        texture3.repeat.set(repeats, repeats);

        const texture4 = loader.load('assets/snow.png');
        texture4.wrapS = THREE.RepeatWrapping;
        texture4.wrapT = THREE.RepeatWrapping;
        texture4.magFilter = THREE.NearestFilter;
        texture4.colorSpace = THREE.SRGBColorSpace;
        texture4.repeat.set(repeats, repeats);

        //this.meshMaterial = new THREE.MeshPhongMaterial();
        //var temp = this.meshMaterial as THREE.MeshPhongMaterial;
        //temp.displacementMap = displacementMap;

        var material = new THREE.ShaderMaterial({
            uniforms: {
                level1Texture: { value: texture },
                level2Texture: { value: texture2 },
                level3Texture: { value: texture3 },
                level4Texture: { value: texture3 },
                level5Texture: { value: texture4 },
                displacementMap: { value: displacementMap },
                displacementScale: {value: 2},
                lightMap: { value: displacementMap }
            },
            vertexShader: this.vertexShader3(),
            fragmentShader: this.fragmentShader3(),
        });
        this.meshMaterial = material;

        this.displacementMesh = new THREE.Mesh(
            new THREE.PlaneGeometry( height, width, 100, 100),
            this.meshMaterial
        );

        this.displacementMesh.position.set(0, 0, 0.5);
        this.displacementMesh.rotation.x = - Math.PI / 2;
        this.displacementMesh.rotation.z = Math.PI / 2;

        this.displacementMesh.scale.set(5, 5, 5);
        /*
        this.mesh.position.setX(height / 2);
        this.mesh.position.setY(0);
        this.mesh.position.setZ(-width);
        */

        this.displacementMesh.castShadow = true;
        this.displacementMesh.receiveShadow = true;  

        const uv = this.displacementMesh.geometry.getAttribute('uv');
        const position = this.displacementMesh.geometry.getAttribute('position');

        console.log(position.count); // 4 ( the are points or vertices )
        console.log(position.array.length); // 12 ( x, y, and z for each point )
        // THE UV ATTRIBUTE
        console.log(uv.count); // 4 ( the are points or vertices )
        console.log(uv.array.length); // 8 ( there is a u and v value for each point )

        scene.add(this.displacementMesh)
                
        let grid = new THREE.GridHelper( height, 10, 0xffffff, 0xffffff );
        grid.material.opacity = 1;
        grid.material.transparent = false;
        scene.add( grid );
    }

    vertexShader3() {
        return `
        uniform sampler2D displacementMap;
        uniform float displacementScale;

        varying float vAmount;
        varying vec2 vUV;

        void main() 
        { 
            vUV = uv;
            vec4 displacementData = texture2D( displacementMap, uv );
            
            vAmount = displacementData.r; // assuming map is grayscale it doesn't matter if you use r, g, or b.
            
            // move the position along the normal
            vec3 newPosition = position + normal * displacementScale * vAmount;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
        }
        `
    }

    fragmentShader3() {
        return `
        uniform sampler2D level1Texture;
        uniform sampler2D level2Texture;
        uniform sampler2D level3Texture;
        uniform sampler2D level4Texture;
        uniform sampler2D level5Texture;

        varying vec2 vUV;

        varying float vAmount;

        void main() 
        {
            vec4 water = (smoothstep(0.01, 0.25, vAmount) - smoothstep(0.24, 0.26, vAmount)) * texture2D( level1Texture, vUV * 10.0 );
            vec4 sandy = (smoothstep(0.24, 0.27, vAmount) - smoothstep(0.28, 0.31, vAmount)) * texture2D( level2Texture, vUV * 10.0 );
            vec4 grass = (smoothstep(0.28, 0.32, vAmount) - smoothstep(0.35, 0.40, vAmount)) * texture2D( level3Texture, vUV * 20.0 );
            vec4 rocky = (smoothstep(0.30, 0.50, vAmount) - smoothstep(0.40, 0.70, vAmount)) * texture2D( level4Texture, vUV * 20.0 );
            vec4 snowy = (smoothstep(0.50, 0.65, vAmount))                                   * texture2D( level5Texture, vUV * 10.0 );
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0) + water + sandy + grass + rocky + snowy; //, 1.0);
        }  
        `
    }
}