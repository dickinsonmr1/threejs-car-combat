import * as THREE from 'three'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import * as CANNON from 'cannon-es'
import { BoxObject } from '../gameobjects/shapes/boxObject';
import { SphereObject } from '../gameobjects/shapes/sphereObject';
import Stats from 'three/addons/libs/stats.module.js';
import SpotlightObject from '../gameobjects/shapes/spotlightObject';
import { randFloat, randInt } from 'three/src/math/MathUtils.js';
import { ParticleEmitter } from '../gameobjects/fx/particleEmitter';
import { GltfObject, GltfObjectPhysicsObjectShape } from '../gameobjects/shapes/gltfObject';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { Projectile } from '../gameobjects/weapons/projectile';
import { CylinderObject } from '../gameobjects/shapes/cylinderObject';
import { ProjectileType } from '../gameobjects/weapons/projectileType';
import SceneController from './sceneController';
import { Player, PlayerState, VehicleType } from '../gameobjects/player/player';
import { FlamethrowerEmitter } from '../gameobjects/weapons/flamethrowerEmitter';
import { ExplosionCpuParticleEmitter } from '../gameobjects/fx/explosionCpuParticleEmitter';
import { Utility } from '../utility';
import { TextureHeightMapArray } from '../gameobjects/textureToArray';
import { Water } from 'three/addons/objects/Water.js';
import { DebugDivElementManager } from './debugDivElementManager';
import { TerrainChunk } from '../gameobjects/terrain/terrainChunk';
import { PickupObject2 } from '../gameobjects/pickupObject2';
import { SmokeObject } from '../gameobjects/fx/smokeObject';
import { CpuPlayerPattern } from '../gameobjects/player/cpuPlayerPatternEnums';
import { VehicleFactory } from '../gameobjects/vehicles/vehicleFactory';
import { RainShaderParticleEmitter } from '../gameobjects/fx/rainShaderParticleEmitter';
import { WorldConfig } from '../gameobjects/world/worldConfig';
import { GameConfig } from '../gameconfig';
import { PrecipitationSystem, PrecipitationType } from '../gameobjects/world/precipitationSystem';
import { DumpsterFireObject } from '../gameobjects/weapons/dumpsterFireObject';
import { VehicleUtil } from '../gameobjects/vehicles/vehicleUtil';
import GameAssetModelLoader from '../gameobjects/shapes/gameAssetModelLoader';
import { TextureHeightMapArray2 } from '../gameobjects/fx/textureToArray2';
import { QuadtreeTerrainSystem5 } from '../gameobjects/terrain/quadtree5/QuadtreeTerrainSystem5';
import LODTerrainSystem from '../gameobjects/terrain/lodTerrainSystem';
import { AudioManager } from '../gameobjects/audio/audioManager';
import { SonicPulseEmitter } from '../gameobjects/weapons/sonicPulseEmitter';
import { AnimatedSprite } from '../gameobjects/fx/animatedSprite';

import soundEffectLibraryJson from '../gameobjects/audio/config/soundEffectLibrary.json';
import { SoundEffectConfig } from '../gameobjects/audio/config/soundEffectLibrary';
import { AnimatedShaderSprite } from '../gameobjects/fx/animatedShaderSprite';
import { ExplosionGpuParticleEmitter } from '../gameobjects/fx/explosionGpuParticleEmitter';
import { Lightning, LightningType } from '../gameobjects/weapons/lightning';
import VehicleLibrary from '../gameobjects/vehicles/config/vehicleLibrary';
import KeyboardState from './keyboardState';


// npm install cannon-es-debugger
// https://youtu.be/Ht1JzJ6kB7g?si=jhEQ6AHaEjUeaG-B&t=291

// https://www.youtube.com/watch?v=8J5xl9oijR8&list=PLFky-gauhF46LALXSriZcXLJjwtZLjehn&index=3

export default class GameScene extends THREE.Scene {

    stats: Stats = new Stats();

    private readonly gltfLoader = new GLTFLoader();

    public taxiModel!: GLTF;
    public policeModel!: GLTF;
    public ambulanceModel!: GLTF;
    public trashTruckModel!: GLTF;
    public sedanSportsModel!: GLTF;
    public raceCarBlueModel!: GLTF;
    public raceCarRedModel!: GLTF;
    public suvModel!: GLTF;    
    public killdozerModel!: GLTF;
    public policeTractorModel!: GLTF;    
    public tractorModel!: GLTF;
    public policeSuvModel!: GLTF;
    public fireTruckModel!: GLTF;

    public tankModel!: GLTF;
    public tankerModel!: GLTF;

    public wheelModel!: GLTF;
    public dumpsterModel!: GLTF;

    private readonly textureLoader = new THREE.TextureLoader();

    public readonly camera: THREE.PerspectiveCamera;

    private readonly audioManager: AudioManager;
    private soundEffectLibraryConfig: SoundEffectConfig[] = soundEffectLibraryJson;
    
    private animatedSprites: AnimatedSprite[] = [];
    private shaderAnimatedSprites: AnimatedShaderSprite[] = [];
    private clock: THREE.Clock = new THREE.Clock();

    public getClock(): THREE.Clock {
        return this.clock;
    }
    
    //lightningMaterial!: THREE.ShaderMaterial;
    //lightningMaterial2!: THREE.ShaderMaterial;
    //sphereMaterial!: THREE.ShaderMaterial;

    public getAudioManager(): AudioManager {
        return this.audioManager;
    }

    debugCamera: THREE.PerspectiveCamera;
    debugOrbitControls: OrbitControls;

    //private readonly keyDown = new Set<string>();

    private cubes: BoxObject[] = [];
    private debrisWheels: GltfObject[] = [];
    private dumpsters: DumpsterFireObject[] = [];
    private bouncyWheelMaterial!: CANNON.Material;

    private pickups: PickupObject2[] = [];
    private projectiles: Projectile[] = [];

    private particleEmitters: ParticleEmitter[] = [];
    private fireParticleEmitters: ParticleEmitter[] = [];

    public explosionTexture: THREE.Texture = new THREE.Texture();
    public crosshairTexture: THREE.Texture = new THREE.Texture();
    public playerMarkerTexture: THREE.Texture = new THREE.Texture();
    public animatedSpriteExplosionTexture: THREE.Texture = new THREE.Texture();
    public animatedSpriteSparkTexture: THREE.Texture = new THREE.Texture();

    public groundMaterial!: CANNON.Material;
    public wheelGroundContactMaterial!: CANNON.ContactMaterial;

    worldConfig!: WorldConfig;

    gameConfig: GameConfig;
    gameAssetModelLoader: GameAssetModelLoader;

    public getMapDimensions(): THREE.Vector3 {
        return this.terrainChunk.getMapDimensions();
    }

    world: CANNON.World = new CANNON.World({
        gravity: new CANNON.Vec3(0, -14.81, 0)
    });

    getWorld(): CANNON.World {
        return this.world;
    }

    basicMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial( { color: 0xFFFF00 });
    basicSemitransparentMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial( { color: 0xFFFF00, transparent: true, opacity: 0.5 });
    worldMarkerShaderMaterial: THREE.ShaderMaterial = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: `
            varying vec3 vPosition;
            void main()
            {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
        fragmentShader: `
            varying vec3 vPosition;
            void main()
            {
                // Map the y position to a 0-1 range for alpha
                float alpha = 0.25 - (vPosition.y / 100.0);
                gl_FragColor = vec4(1.0, 1.0, 0.0, alpha);
            }
            `
    });

    sonicPulseEmitters: SonicPulseEmitter[] = [];

    lightningWeapons: Lightning[] = [];
    
    terrainChunk!: TerrainChunk;
    LODTerrainSystem!: LODTerrainSystem;
    quadtreeTerrainSystem5!: QuadtreeTerrainSystem5;

    water!: Water;
    precipitationSystem!: PrecipitationSystem;

    grassBillboards?: THREE.Points;
    
    cube?: BoxObject;
    cube2?: BoxObject;
    cylinder?: CylinderObject;

    debrisDriveTrain!: GltfObject;

    private allPlayers: Player[] = [];
    player1!: Player;
    player2!: Player;
    player3!: Player;
    player4!: Player;

    cpuPlayerBehavior: CpuPlayerPattern = CpuPlayerPattern.Stop;

    private followCam?: THREE.Object3D;

    sphere?: SphereObject;

    spotlight?: SpotlightObject;

    flamethrowerEmitters: FlamethrowerEmitter[] = [];

    sceneController: SceneController;

    debugDivElementManager!: DebugDivElementManager;

    crosshairSprite!: THREE.Sprite;

    public isPaused: boolean = false;

    constructor(camera: THREE.PerspectiveCamera,
        debugCamera: THREE.PerspectiveCamera,
        debugOrbitControls: OrbitControls,
        sceneController: SceneController, gameConfig: GameConfig) {
        super();
        
        this.camera = camera;

        this.audioManager = new AudioManager(this, this.camera, gameConfig.isSoundEnabled, gameConfig.isDebug);
        // asset from here: https://opengameart.org/content/light-machine-gun
        // asset from here: https://opengameart.org/content/q009s-weapon-sounds

        this.debugCamera = debugCamera;
        this.debugOrbitControls = debugOrbitControls;

        this.sceneController = sceneController;
        this.gameConfig = gameConfig;

        this.gameAssetModelLoader = new GameAssetModelLoader(sceneController.getGltfLoader(), new VehicleLibrary());
    }

    preloadMapData(worldConfig: WorldConfig) {        
        this.worldConfig = worldConfig;        
    }

    preloadSkybox(worldConfig: WorldConfig) {
        // skybox tutorial: https://threejs.org/manual/#en/backgrounds
        // asset source: https://polyhaven.com/a/industrial_sunset_puresky
        let skyTexture = this.textureLoader.load(
            worldConfig.skyTexture,
            () => {

                skyTexture.mapping = THREE.EquirectangularReflectionMapping;
                skyTexture.colorSpace = THREE.SRGBColorSpace;
                this.background = skyTexture;
            }  
        );
    }

    async initialize(player1VehicleType: VehicleType): Promise<void> {       
        if(this.gameConfig.useFog) {
            let fogColor = new THREE.Color('#ffbf52');//this.worldConfig.fogColor);
            this.fog = new THREE.Fog(fogColor, this.gameConfig.fogNear, this.gameConfig.fogFar);
        }

        await this.loadVehicleAssets();

        

        this.explosionTexture = this.textureLoader.load('assets/particles/particle-16x16.png');
        //this.explosionTexture = this.textureLoader.load('assets/tank_explosion3.png');
        this.crosshairTexture = this.textureLoader.load('assets/hud/crosshair061.png');
        this.playerMarkerTexture = this.textureLoader.load('assets/hud/playerMarkerIcon.png');
        this.animatedSpriteExplosionTexture = this.textureLoader.load('assets/spritesheets/explosion 1.png');
        this.animatedSpriteSparkTexture = this.textureLoader.load('assets/spritesheets/spritesheet-spark.png');

        // https://www.youtube.com/watch?v=V_yjydXVIwQ&list=PLFky-gauhF46LALXSriZcXLJjwtZLjehn&index=4

        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        //this.world.broadphase = new CANNON.NaiveBroadphase;        
        //(this.world.solver as CANNON.GSSolver).iterations = 20;

        this.generateMap();
    
        var objectMaterial = new CANNON.Material();
    
        this.cube = new BoxObject(this, 1,1,1, new THREE.Vector3(0, 20, -9.5), 0xffff00,
                        //new THREE.MeshPhongMaterial( { color: 0xFFFF00, depthWrite: true }),
                        this.basicMaterial,
                        this.world, objectMaterial);

        this.cube2 = new BoxObject(this, 1,1,1, new THREE.Vector3(0, 10, -8), 0xffff00,
                        //new THREE.MeshPhongMaterial( { color: 0xFFFF00, depthWrite: true }),
                        this.basicMaterial,
                        this.world, objectMaterial);

        this.sphere = new SphereObject(this, 1, new THREE.Vector3(0.5, 5, -10), 0x00ff00,
                        //new THREE.MeshPhongMaterial( { color: 0x00ff00, depthWrite: true }), 
                        this.basicMaterial,
                        this.world, objectMaterial);

        this.cylinder = new CylinderObject(this, 1, 0.25, new THREE.Vector3(0, 3, -12), 0x00ff00,
            //new THREE.MeshPhongMaterial( { color: 0x00ff00, depthWrite: true }), 
            this.basicMaterial,
            this.world, objectMaterial);

        let cylinderMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 100, 16, 1, false),
            this.worldMarkerShaderMaterial);
        cylinderMesh.position.set(20, cylinderMesh.position.y, 20);            
        this.add(cylinderMesh);
       
        /*
        const sphere = new THREE.Mesh(sphereGeometry, this.sphereMaterial);
        sphere.position.set(15, 15, 15);
        this.add(sphere);
        */

        this.bouncyWheelMaterial = new CANNON.Material();
        const wheelGroundContactMaterial = new CANNON.ContactMaterial(this.bouncyWheelMaterial, this.groundMaterial, {
            friction: this.gameConfig.wheelGroundContactMaterialFriction, //1.2,
            restitution: this.gameConfig.wheelGroundContactMaterialRestitution, //0.3 // High restitution for bounciness
            contactEquationRelaxation: this.gameConfig.contactEquationRelaxation, // 3
            contactEquationStiffness: this.gameConfig.contactEquationStiffness, // 1e8
        });
        this.world.addContactMaterial(wheelGroundContactMaterial);
       
        let particleMaterial = new THREE.SpriteMaterial({
            map: this.explosionTexture,
            depthTest: true
        });

        await this.generatePlayers(particleMaterial, player1VehicleType);

        await this.loadSoundEffects(4);
        
        //let sonicPulseEmitter = new SonicPulseEmitter(this, this.player1.getPosition());           
        //this.sonicPulseEmitters.push(sonicPulseEmitter);

        let material = new THREE.SpriteMaterial( { map: this.crosshairTexture, color: 0xffffff, depthTest: false, depthWrite: false });//,transparent: true, opacity: 0.5 } );
        this.crosshairSprite = new THREE.Sprite( material );
        this.add(this.crosshairSprite);

        var treeModelData = await this.gameAssetModelLoader.generateTreeModel();
        let treeModel = treeModelData.scene.clone();
        treeModel.position.copy(this.getWorldPositionOnTerrainAndWater(0, 0));
        treeModel.scale.set(3, 3, 3);
        this.add(treeModel);
        treeModel.add(this.audioManager.getSound('player1-deathFire')!);

        var barrelModelData = await this.gameAssetModelLoader.generateBarrelModel();
        let barrelModel = barrelModelData.scene.clone();
        barrelModel.position.copy(this.getWorldPositionOnTerrainAndWater(2, 2));
        barrelModel.position.y += 0.5;
        barrelModel.scale.set(2, 2, 2);
        this.add(barrelModel);

        this.dumpsterModel = await this.gameAssetModelLoader.generateDumpsterModel();
        
        var groundCubeContactMaterial = new CANNON.ContactMaterial(
            this.terrainChunk.getPhysicsMaterial(),
            this.cube.getPhysicsMaterial(),
            {
                friction: 0
            }            
        );
        this.world.addContactMaterial(groundCubeContactMaterial);

        //const color = new THREE.Color('white');
        const intensity = 0.5;
        const distance = 50;
        const angle = Math.PI / 8;
        const penumbra = 0.25;
        const decay = 0.1;

        this.spotlight = new SpotlightObject(this, new THREE.Color('white'), intensity, distance, angle, penumbra, decay,
            new THREE.Vector3(0,15,0),
            this.cube2.mesh);

        //const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
        //this.add(ambientLight);

        const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
        this.add( light );

        for(let i = 0; i < 50; i++) {
            this.generateRandomPickup(this.terrainChunk.getMapDimensions().x, this.terrainChunk.getMapDimensions().z);
        }

        document.body.appendChild(this.stats.dom);

        this.debugDivElementManager = new DebugDivElementManager(25, 25);
        this.debugDivElementManager.addNamedElementPlaceholders([
            "GameCameraLocation",
            "DebugCameraLocation",
            "PlayerLocation",            
            "AudioListener",
            "Player1Speed",
            "Player1BulletSoundLocation",
            "Player1RocketSoundLocation",
            "Objective",
            "ParticleCount",
            "FlamethrowerParticleCount",
            "PhysicsObjectCount",
            "LightObjectCount",

            "ParticleEmitterCount",
            "AnimatedSpriteCount",
            "GrassBillboardsCount",
            "CpuParticleCount",
            "GpuParticleCount",
            "RendererTotalGeometry",
            "RendererTotalTextures",
            "RendererTotalPrograms",
            "TraverseTotalTextures",
            "cpuOverrideBehavior",
            
            "player2Status",
            "player2Target",

            "player3Status",
            "player3Target",

            "player4Status",
            "player4Target",
            "QuadtreeTerrain",

            "Player1_currentMaxWheelSlip",
            "PositionalSounds"
            //"Player1_Front_Right_WheelSlip",
            //"Player1_Back_Left_WheelSlip",
            //"Player1_Back_Right_WheelSlip"
        ]);
        this.debugDivElementManager.hideAllElements();
       
        // https://threejs.org/examples/?q=water#webgl_shaders_ocean

        if(this.worldConfig.waterY != null) {
            const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
            this.water = new Water(
                waterGeometry,
                {
                    textureWidth: 512,
                    textureHeight: 512,
                    waterNormals: new THREE.TextureLoader().load( 'assets/waternormals.jpg', function ( texture ) {

                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                    } ),
                    sunDirection: new THREE.Vector3(),
                    sunColor: 0xffffff,
                    waterColor: 0x001e0f,
                    distortionScale: 3.7,
                    fog: this.fog !== undefined
                }
            );
            this.water.rotation.x = - Math.PI / 2;
            this.water.position.y += this.worldConfig.waterY; // 1.5
            this.add( this.water );
        }

        if(this.worldConfig.precipitationType != PrecipitationType.None) {
            this.precipitationSystem = new PrecipitationSystem(this, this.terrainChunk.heightMapLength, this.worldConfig.precipitationType, this.worldConfig.horizontalScale);
        }
            
        //this.rainShaderParticleEmitter = new RainShaderParticleEmitter(this);

        // TODO: sun from https://threejs.org/examples/?q=water#webgl_shaders_ocean
        /*
        const parameters = {
            elevation: 2,
            azimuth: 180
        };
        const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
        const theta = THREE.MathUtils.degToRad( parameters.azimuth );

        var sun = new THREE.Vector3();
        sun.setFromSphericalCoords( 1, phi, theta );
        //sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
        this.water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();        
        */

        //this.addToParticleEmitters(new SmokeObject(this, this.explosionTexture, new THREE.Vector3(0, 0, 0), 5, 200000));
    
        this.lightningWeapons.push(new Lightning(this, LightningType.Line, 5));
        this.lightningWeapons.push(new Lightning(this, LightningType.Line, 5));
        this.lightningWeapons.push(new Lightning(this, LightningType.CircleVertical, 1.5));
        this.lightningWeapons.push(new Lightning(this, LightningType.CircleHorizontal, 1.5));

        //this.animatedSprites.push(new AnimatedSprite(this, 'assets/spritesheets/spritesheet-spark.png', 2, 3, 10, true, new THREE.Vector3(0, 5, 0)));

        // https://opengameart.org/content/9-frame-fire-animation-16x-32x-64x        
        //this.animatedSprites.push(new AnimatedSprite(this, 'assets/spritesheets/Fire 64x.png', 3, 3, 5, true, new THREE.Vector3(5, 5, 5)));
       
        // https://opengameart.org/content/2d-explosion-animations-frame-by-frame
        //this.animatedSprites.push(new AnimatedSprite(this, 'assets/spritesheets/explosion 1.png', 8, 8, 120, true, new THREE.Vector3(-5, 5, 5)));                
        //this.animatedSprites.push(new AnimatedSprite(this, 'assets/spritesheets/explosion 2.png', 8, 8, 120, true, new THREE.Vector3(-4, 5, 5)));                
        //this.animatedSprites.push(new AnimatedSprite(this, 'assets/spritesheets/explosion 3.png', 8, 8, 120, true, new THREE.Vector3(-3, 5, 5)));                
        //this.animatedSprites.push(new AnimatedSprite(this, 'assets/spritesheets/explosion 4.png', 8, 8, 120, true, new THREE.Vector3(-2, 5, 5)));                
 
        //document.addEventListener('keydown', this.handleKeyDown);
        //document.addEventListener('keyup', this.handleKeyUp);

        document.getElementById('notificationDiv')!.innerHTML = `<i class="fa-solid fa-location-dot"></i> Objective: Destroy all enemies!`;
        document.getElementById('notificationDiv')!.style.opacity = '80%';            
        setTimeout(() => {
            document.getElementById('notificationDiv')!.style.opacity = '0%';
        }, 2000);
    }   

    //private handleKeyDown = (event: KeyboardEvent) => {        
        /*
        if (['w', 'a', 's', 'd'].includes(event.key)) {
            event.preventDefault();
            return;
        }            
        */
        //this.keyDown.add(event.key.toLowerCase());
    //}

    public processInput(keyboardState: KeyboardState) {

        if(!this.player1 || this.player1.isVehicleObjectNull()) return;

        // gamepad
        this.sceneController.pollGamepadsForGameScene();

        // touch
        if(this.sceneController.touchActivated) {
            // touch buttons
            if(this.sceneController.buttonsHeld.get("turbo")) {
                this.player1.tryTurbo();
            }
            else {
                this.player1.tryStopTurbo();
            }

            if(this.sceneController.buttonsHeld.get("primaryWeapon")) {
                this.player1.tryFirePrimaryWeapon();
            }

            if(this.sceneController.buttonsHeld.get("specialWeapon")) {
                this.player1.tryFireSpecialWeapon();
            }
            else {
                this.player1.tryStopFireSpecialWeapon();
            }

            if(this.sceneController.buttonsHeld.get("secondaryWeapon")) {
                this.player1.tryFireSecondaryWeapon();
            }
        }     

        if(this.sceneController.keyboardActivated) {
            this.processKeyboardStateChanges(keyboardState);
        }
    }

    private processKeyboardStateChanges(keyboardState: KeyboardState) {

        //////////////////////////////////////
        // key currently down this frame
        //////////////////////////////////////
        if(keyboardState.keys['ArrowUp'] || keyboardState.keys['KeyW']) {
            this.player1.tryAccelerate(1.0);
        }
        else if(keyboardState.keys['ArrowDown'] || keyboardState.keys['KeyS']) {
            this.player1.tryReverse(1.0);
        }

        if(keyboardState.keys['ArrowLeft'] || keyboardState.keys['KeyA']) {
            this.player1.tryTurn(1.0);
        }
        else if(keyboardState.keys['ArrowRight'] || keyboardState.keys['KeyD']) {
            this.player1.tryTurn(-1.0);
        }
        
        if (keyboardState.keys['KeyX']) {
            let newProjectile = this.player1.tryFireBullets();
        }        
        if (keyboardState.keys['KeyZ']) {
            this.player1.tryFireFlamethrower();
        }        
        if(keyboardState.keys['KeyC']) {
            this.player1.tryFireLightning();
        }

        if (keyboardState.keys['KeyQ']) {
            this.player2.tryFireFlamethrower();
        }
        if (keyboardState.keys['ShiftLeft']) {
            this.player1.tryTurbo();
        }

        //////////////////////////////////////
        // key just pressed this frame
        //////////////////////////////////////

        //////////////////////////////////////
        // key just released this frame
        //////////////////////////////////////

        if (keyboardState.keysReleasedThisFrame['ControlLeft'])	{            
            //let newProjectile = this.player1.createProjectile(ProjectileType.Rocket);
            //this.addNewProjectile(newProjectile);	            
            this.player1.tryFireRocket();
		}
        if (keyboardState.keysReleasedThisFrame['KeyC']) {			
           
		}
        if (keyboardState.keysReleasedThisFrame['KeyR']) {			

        }
        if (keyboardState.keysReleasedThisFrame['KeyP']) {			
            this.generateRandomDebrisWheel();

            let forwardVector = new THREE.Vector3(-10, 4, 0);
            forwardVector.applyQuaternion(this.player1.getVehicleObject().getModel().quaternion);
            let projectileLaunchVector = forwardVector; 

            this.generateRandomDumpster(this.player1.playerId, this.player1.getPosition(), projectileLaunchVector);
        }
        if (keyboardState.keysReleasedThisFrame['KeyO'])
        {			
            this.player1.tryDamage(ProjectileType.Rocket, new THREE.Vector3(0,0,0));            
            this.sceneController.updateHealthOnHud(this.player1.currentHealth);
        }
        if (keyboardState.keysReleasedThisFrame['KeyY']) {			
            this.player2.tryKill();
            this.player3.tryKill();
            this.player4.tryKill();
        }
        if(keyboardState.keysReleasedThisFrame['KeyU']) {
            this.player1.tryFireDumpster();
        }
        if(keyboardState.keysReleasedThisFrame['KeyT']) {
            this.player1.tryFireSonicPulse();
        }
        if(keyboardState.keysReleasedThisFrame['KeyR']) {            
            this.player1.tryFireShovel();
        }
        if(keyboardState.keysReleasedThisFrame['KeyH']) {            
            this.player1.tryGenerateRandomExplosionGpu();
        }

        if(keyboardState.keysReleasedThisFrame['KeyM']) {
            //this.animatedSprites.push(new AnimatedSprite(this, this.animatedSpriteExplosionTexture, 8, 8, 120, false, this.player1.getPosition()));                
            this.shaderAnimatedSprites.push(
                new AnimatedShaderSprite(this, this.animatedSpriteExplosionTexture, this.player1.getPosition().clone().add(new THREE.Vector3(0, 1, 0)), false,
                {
                    columns: 8,
                    rows: 8,
                    fps: 30,
                    scale: 1,
                    camera: this.camera                    
                }));
        }

        if(keyboardState.keysReleasedThisFrame['KeyN']) {            
            this.player1.tryFireTriRockets();
        }        
        
        if (keyboardState.keysReleasedThisFrame['KeyC']) {            
            this.player1.tryStopFireLightning();
		}
        
        if (keyboardState.keysReleasedThisFrame['KeyE']) {                        
            let newProjectile = this.player2.createProjectile(ProjectileType.Bullet);
            this.addNewProjectile(newProjectile);		
		}
        if (keyboardState.keysReleasedThisFrame['KeyR']) {                        
            let newProjectile = this.player2.createProjectile(ProjectileType.Rocket);
            this.addNewProjectile(newProjectile);		
		}
        if (keyboardState.keysReleasedThisFrame['Digit1']) {
            this.cpuPlayerBehavior = CpuPlayerPattern.Follow;
		}
        if (keyboardState.keysReleasedThisFrame['Digit2']) {
            this.cpuPlayerBehavior = CpuPlayerPattern.FollowAndAttack;
		}
        if (keyboardState.keysReleasedThisFrame['Digit3']) {
            this.cpuPlayerBehavior = CpuPlayerPattern.Stop;
		}
        if (keyboardState.keysReleasedThisFrame['Digit4']) {
            this.cpuPlayerBehavior = CpuPlayerPattern.StopAndAttack;
		}
        if (keyboardState.keysReleasedThisFrame['Digit5']) {
            this.cpuPlayerBehavior = CpuPlayerPattern.Flee;
		}        
        if (keyboardState.keysReleasedThisFrame['Digit6']) {
            this.cpuPlayerBehavior = CpuPlayerPattern.Patrol;
		}      
        if (keyboardState.keysReleasedThisFrame['Digit7']) {

		}      
        if (keyboardState.keysReleasedThisFrame['Enter']) {
			this.player1.tryResetPosition();
		}

        // player 1
        if(keyboardState.keysReleasedThisFrame['ArrowUp'] || keyboardState.keysReleasedThisFrame['KeyW']) {
            this.player1.tryStopAccelerate();
        }
        else if(keyboardState.keysReleasedThisFrame['ArrowDown'] || keyboardState.keysReleasedThisFrame['KeyS']) {
            this.player1.tryStopReverse();
        }
        if(keyboardState.keysReleasedThisFrame['ArrowLeft'] || keyboardState.keysReleasedThisFrame['KeyA']) {
            this.player1.resetTurn();
        }
        else if(keyboardState.keysReleasedThisFrame['ArrowRight'] || keyboardState.keysReleasedThisFrame['KeyD']) {
            this.player1.resetTurn();
        }
        if(keyboardState.keysReleasedThisFrame['Space']) {
            this.player1.tryJump();
        }
        if (keyboardState.keysReleasedThisFrame['ShiftLeft']) {
            this.player1.tryStopTurbo();
        }

        if (keyboardState.keysReleasedThisFrame['Escape']) {
            
            this.sceneController.tryTogglePauseMenu();
        }
        if (keyboardState.keysReleasedThisFrame['KeyQ']) {
            this.player2.tryStopFireFlamethrower();
        }
        if (keyboardState.keysReleasedThisFrame['KeyZ']) {
            this.player1.tryStopFireFlamethrower();
        }
        if (keyboardState.keysReleasedThisFrame['Tab']) {
            this.player1.trySelectNextWeapon();
        }
    }

    public pollGamepads(gamepad: Gamepad) {

        // if paused....

        // if not paused...
    }

    public togglePauseGame() {
        this.isPaused = !this.isPaused;

        this.debugCamera.position.copy(this.camera.position);            
        this.debugCamera.lookAt(this.player1.getPosition());
        this.debugOrbitControls.enabled = this.isPaused;        
    }

    public processInputForPauseScreen(keyboardState: KeyboardState) {
            
        let cameraMovement = 0.15;

        this.sceneController.pollGamepadsForGameScene();

        if(keyboardState.keys['ShiftLeft']) {
            cameraMovement = 0.9;
        }

        // forward
        if(keyboardState.keys['KeyW']) {
            const moveDirection = new THREE.Vector3();
            this.debugCamera.getWorldDirection(moveDirection); // Get the current forward direction
            
            this.debugCamera.position.addScaledVector(moveDirection, cameraMovement); // Move the camera forward by 1 unit
            this.debugOrbitControls.target.addScaledVector(moveDirection, cameraMovement);
        }       
        // left
        if(keyboardState.keys['KeyA']) {
            const forwardVector = new THREE.Vector3();
            this.debugCamera.getWorldDirection(forwardVector); // Get the current forward direction

            const leftVector = new THREE.Vector3();
            leftVector.crossVectors(new THREE.Vector3(0, 1, 0), forwardVector).normalize();

            this.debugCamera.position.addScaledVector(leftVector, cameraMovement); // Move the camera forward by 1 unit
            this.debugOrbitControls.target.addScaledVector(leftVector, cameraMovement);
        }   
        // right
        if(keyboardState.keys['KeyD']) {
            const forwardVector = new THREE.Vector3();
            this.debugCamera.getWorldDirection(forwardVector); // Get the current forward direction

            const leftVector = new THREE.Vector3();
            leftVector.crossVectors(new THREE.Vector3(0, 1, 0), forwardVector).normalize();

            this.debugCamera.position.addScaledVector(leftVector, -cameraMovement); // Move the camera forward by 1 unit
            this.debugOrbitControls.target.addScaledVector(leftVector, -cameraMovement);
        } 
        // backwards
        if(keyboardState.keys['KeyS']) {
            const moveDirection = new THREE.Vector3();
            this.debugCamera.getWorldDirection(moveDirection); // Get the current forward direction
            this.debugCamera.position.add(moveDirection.multiplyScalar(-cameraMovement)); // Move the camera forward by 1 unit
        }   

        // up
        if(keyboardState.keys['KeyQ']) {
            const upVector = new THREE.Vector3(0, 1, 0);

            this.debugCamera.position.addScaledVector(upVector, cameraMovement); // Move the camera forward by 1 unit
            this.debugOrbitControls.target.addScaledVector(upVector, cameraMovement);
        }   
        // down
        if(keyboardState.keys['KeyZ']) {
            const upVector = new THREE.Vector3(0, 1, 0);

            this.debugCamera.position.addScaledVector(upVector, -cameraMovement); // Move the camera forward by 1 unit
            this.debugOrbitControls.target.addScaledVector(upVector, -cameraMovement);
        }   
        
        if(keyboardState.keys['Digit0']) {
            var targetPosition = this.debugCamera.position;
            //this.debugOrbitCamera.position.copy(targetPosition).add(new THREE.Vector3(5, 2, 5));
            this.debugOrbitControls.target = this.player1.getPosition();            
        }   
        if(keyboardState.keys['Digit1']) {
            var targetPosition = this.player1.getPosition();

            this.debugCamera.position.copy(targetPosition).add(new THREE.Vector3(5, 2, 5));
            this.debugOrbitControls.target = this.player1.getPosition();            
        }   
        if(keyboardState.keys['Digit2']) {
            var targetPosition = this.player2.getPosition();

            this.debugCamera.position.copy(targetPosition).add(new THREE.Vector3(5, 2, 5));
            this.debugOrbitControls.target = targetPosition;
        }   
        if(keyboardState.keys['Digit3']) {
            var targetPosition = this.player3.getPosition();
            this.debugCamera.position.copy(targetPosition).add(new THREE.Vector3(5, 2, 5));
            this.debugOrbitControls.target = targetPosition;
        }   
        if(keyboardState.keys['Digit4']) {
            var targetPosition = this.player4.getPosition();
            this.debugCamera.position.copy(targetPosition).add(new THREE.Vector3(5, 2, 5));
            this.debugOrbitControls.target = targetPosition;
        }   

        if (keyboardState.keysReleasedThisFrame['Escape']) {            
            this.sceneController.tryTogglePauseMenu();
        }
    }

    private updateCamera() {
        if(this.followCam != null)
            this.camera.position.lerp(this.followCam?.getWorldPosition(new THREE.Vector3()), 0.1);
		if(this.player1 != null && !this.player1.isModelNull())
            this.camera.lookAt(this.player1.getModelPosition().add(new THREE.Vector3(0, 0.75, 0)));
    }

    public async addNewProjectile(projectile: Projectile) {
        this.projectiles.push(projectile);
        if(projectile.particleEmitterObject != null)
            this.addToParticleEmitters(projectile.particleEmitterObject);	
        if(projectile.particleEmitterSmokeObject != null)
            this.addToParticleEmitters(projectile.particleEmitterSmokeObject);	
    }

    public addToParticleEmitters(emitter: ParticleEmitter) {
        this.particleEmitters.push(emitter);
    }

    public addToFlamethrowerEmitters(emitter: FlamethrowerEmitter) {
        this.flamethrowerEmitters.push(emitter);
    }

    private async generateRandomCube() {
        let randPosition = new THREE.Vector3(randFloat(-10, 10), 5, randFloat(-10, -10));
        let randCubeSize = randFloat(0.5, 1);

        let randColor = THREE.MathUtils.randInt(0, 0xffffff);

        const cube = new BoxObject(this,
            randCubeSize, randCubeSize, randCubeSize,
            randPosition,
            randColor,
            new THREE.MeshPhongMaterial( { color: randColor, depthWrite: true }),
            this.world,
            new CANNON.Material(),
            randCubeSize);

        this.cubes.push(cube);
    }

    public async generateRandomDebrisWheel(randPosition?: THREE.Vector3, quaternion?: THREE.Quaternion) {        
        if(randPosition == null)
            randPosition = new THREE.Vector3(randFloat(-10, 10), randFloat(5, 10), randFloat(-10, -10));

        if(quaternion == null)
            quaternion = new THREE.Quaternion();
        
        var wheelModel = await this.gameAssetModelLoader.generateWheelModel();

        var debrisWheel = new GltfObject(
            this,
            wheelModel.scene,
            randPosition,
            quaternion,
            new THREE.Vector3(1, 1, 1), // scale                
            new THREE.Vector3(randFloat(-10, 10), randFloat(2, 5), randFloat(-10, 10)), // initial velocity            
            new THREE.Vector3(1, 1, 1), // physics object scale
            new THREE.Vector3(0, 0, 0), // physics object offset
            this.world,
            this.bouncyWheelMaterial,
            GltfObjectPhysicsObjectShape.Cylinder
        );

        this.debrisWheels.push(debrisWheel);
    }

    public async generateRandomDumpster(playerId: string, position: THREE.Vector3, launchVector: THREE.Vector3, quaternion?: THREE.Quaternion) {
        
        if(quaternion == null)
            quaternion = new THREE.Quaternion();
        
        position.y += 2.75;
        var dumpster = new DumpsterFireObject(
            this,
            playerId,
            this.dumpsterModel.scene,
            position,
            quaternion,
            new THREE.Vector3(2, 2, 2), // scale                
            launchVector, //new THREE.Vector3(randFloat(-10, 10), randFloat(2, 5), randFloat(-10, 10)), // initial velocity            
            new THREE.Vector3(1, 1, 1), // physics object scale
            new THREE.Vector3(0, 0, 0), // physics object offset
            this.world,
            this.bouncyWheelMaterial
        );
        this.dumpsters.push(dumpster);
    }    

    public async generateSonicPulse(position: THREE.Vector3) {
        let sonicPulse = new SonicPulseEmitter(this, position);
        this.sonicPulseEmitters.push(sonicPulse);
    }
    
    private async generateRandomPickup(mapWidth: number, mapHeight: number) {        
        let pickupTextureRocket = this.textureLoader.load('assets/pickups/pickup-rockets.png');
        let pickupTextureHealth = this.textureLoader.load('assets/pickups/pickup-health.png');
        let pickupTextureFlamethrower = this.textureLoader.load('assets/pickups/pickup-fire.png');
        let pickupTextureFreeze = this.textureLoader.load('assets/pickups/pickup-freeze.png');
        let pickupTextureLightning = this.textureLoader.load('assets/pickups/pickup-lightning-2.png');
        let pickupTextureShockwave = this.textureLoader.load('assets/pickups/pickup-shockwave.png');
        let pickupTextureShield = this.textureLoader.load('assets/pickups/pickup-shield.png');
        let pickupTextureAirstrike = this.textureLoader.load('assets/pickups/pickup-airstrike.png');

        //let boxTextureArmor = this.textureLoader.load('assets/pickup-fire.png');
        
        let texture: THREE.Texture;
        let randIconIndex = THREE.MathUtils.randInt(0, 7);
        let outlineColor = 0xffffff;
        switch(randIconIndex) {
            case 0:
                texture = pickupTextureRocket;
                outlineColor = 0xff0000;
                break;
            case 1:
                texture = pickupTextureHealth;
                outlineColor = 0x22ff22;
                break;
            case 2:
                texture = pickupTextureFlamethrower;
                outlineColor = 0xffcc00;
                break;
            case 3:
                texture = pickupTextureFreeze;
                outlineColor = 0x7777dd;
                break;
            case 4:
                texture = pickupTextureLightning;
                outlineColor = 0xffff11;
                break;
            case 5:
                texture = pickupTextureShockwave;
                outlineColor = 0xADFFDE;
                break;
            case 6:
                texture = pickupTextureShield;
                outlineColor = 0x7777ff;
                break;
            case 7:
                texture = pickupTextureAirstrike;
                outlineColor = 0xdf6620;
                break;                
            default:
                texture = pickupTextureRocket;
                outlineColor = 0xff0000;
                break;
        }

        let randX = randFloat(-mapWidth / 2, mapWidth / 2);        
        let randZ = randFloat(-mapHeight / 2, mapHeight / 2);
        let spawnPosition = this.terrainChunk.getWorldPositionOnTerrain(randX, randZ);
        spawnPosition.y += 0.75;

        let randCubeSize = 0.75; //randFloat(0.5, 2);
        //let randColor = THREE.MathUtils.randInt(0, 0xffffff);

        /*
        const cube = new PickupObject(this,
            randCubeSize, randCubeSize, randCubeSize,
            spawnPosition,
            outlineColor,
            texture,
            0.75
        );
        */

        const item = new PickupObject2(this,
            randCubeSize, randCubeSize, randCubeSize,
            spawnPosition,
            0xffffff,
            outlineColor,
            texture,
            1
        );

        this.pickups.push(item);
    }

    async generateRandomExplosion(
        projectileType: ProjectileType,
        position: THREE.Vector3,
        lightColor: THREE.Color,
        particleColor1: THREE.Color,
        particleColor2: THREE.Color,
        particleColor3: THREE.Color,
        particleColor4: THREE.Color) {

        if(this.explosionTexture != null) {
            //let randPosition = new THREE.Vector3(randFloat(-5, 5), randFloat(5, 15), randFloat(-5.5, -10.5));

            /*
            if(color == null) {
                let randColorR = THREE.MathUtils.randInt(0, 255);
                let randColorG = THREE.MathUtils.randInt(0, 255);
                let randColorB = THREE.MathUtils.randInt(0, 255);

                color = new THREE.Color(randColorR, randColorG, randColorB);
            }
            */

            let particleInitialScale = 0.1;

            let numberParticles: number;
            let scaleMultiplier = 1;
            let opacityReduction = 0.01;
            let velocityMultiplier = 0.98;

            switch(projectileType) {                
                case ProjectileType.Bullet:
                    numberParticles = 5;
                    particleInitialScale = 0.5;
                    scaleMultiplier = 0.95;
                    opacityReduction = 0.0075;
                    break;
                case ProjectileType.Rocket:                
                    numberParticles = 25;
                    particleInitialScale = 1;
                    scaleMultiplier = 0.99;
                    opacityReduction = 0.0075;
                    break;
                case ProjectileType.Airstrike:
                default:
                    numberParticles = 20;
                    particleInitialScale = 20;
                    scaleMultiplier = 0.99;
                    opacityReduction = 0.0075;
                    break;                
            }

            const rand = Math.floor(Math.random() * 5 + 1);
            
            this.audioManager.playSound(`fw_0${rand}`, false);

            this.addToParticleEmitters(new ExplosionGpuParticleEmitter(this, this.clock, numberParticles, particleInitialScale, 5, 1000, position));

            /*
            this.addToParticleEmitters(new ExplosionCpuParticleEmitter(
                this,
                this.explosionTexture,
                lightColor,
                particleColor1,
                particleColor2,
                particleColor3,
                particleColor4,
                position,
                numberParticles,
                0.02,
                velocityMultiplier,
                particleInitialScale,
                opacityReduction,
                scaleMultiplier)            
            );
            */
        }
    }

    async generateSmoke(position: THREE.Vector3) {
        this.addToParticleEmitters(new SmokeObject(this, this.explosionTexture, position, 2, 500));
    }

    private async loadVehicleAssets(): Promise<void> {
       
        this.taxiModel = await this.gameAssetModelLoader.loadTaxiModel();
        this.policeModel = await this.gameAssetModelLoader.loadPoliceModel();
        this.ambulanceModel = await this.gameAssetModelLoader.loadAmbulanceModel();
        this.trashTruckModel = await this.gameAssetModelLoader.loadTrashTruckModel();
        this.sedanSportsModel = await this.gameAssetModelLoader.loadSedanSportsModel();
        this.raceCarBlueModel = await this.gameAssetModelLoader.loadRaceCarBlueModel();
        this.raceCarRedModel = await this.gameAssetModelLoader.loadRaceCarRedModel();       
        this.policeTractorModel = await this.gameAssetModelLoader.loadPoliceTractorModel();       
        this.tractorModel = await this.gameAssetModelLoader.loadTractorModel();       
        
        this.policeSuvModel = await this.gameAssetModelLoader.loadPoliceSuvModel();

        this.suvModel = await this.gameAssetModelLoader.loadOffroaderModel();
        
        this.killdozerModel = await this.gameAssetModelLoader.loadKilldozerModel();
        this.fireTruckModel = await this.gameAssetModelLoader.loadFireTruckModel();

        this.tankModel = await this.gameAssetModelLoader.loadTankModel();
        this.tankerModel = await this.gameAssetModelLoader.loadTankerModel();
        
        this.wheelModel = await this.gltfLoader.loadAsync('assets/kenney-vehicles-2/wheel-racing.glb');
    }

    private async loadSoundEffects(numberOfPlayers: number) {

        this.soundEffectLibraryConfig.forEach(async soundEffect => 
        {
            if(soundEffect.createInstancePerPlayer) {
                this.allPlayers.forEach(async player => {

                    let playerChassis = player.getVehicleObject().getChassis().mesh;                    
                    this.audioManager.addSoundObjectFromPositionalAudio(
                        soundEffect.soundKey!,
                        await this.audioManager.createPositionalAudioFromJsonConfig(soundEffect),
                        playerChassis?.position!,
                        player                     
                    );                                            
                });
            }
            else {
                this.audioManager.addSoundObjectFromPositionalAudio(
                    soundEffect.soundKey!,
                    await this.audioManager.createPositionalAudioFromJsonConfig(soundEffect),
                    new THREE.Vector3(Math.random()*100-50, 5, Math.random()*100-50)
                );    
            }
        });

        this.audioManager.addSoundObjectFromPositionalAudio(`fw_01`, await this.audioManager.createPositionalAudioFromJsonConfig({soundKey: 'fw_01', asset: 'assets/audio/fw_01.ogg', volume: 0.25, refDistance: 25, maxDistance: 100 }), new THREE.Vector3(Math.random()*100-50, 5, Math.random()*100-50));
        this.audioManager.addSoundObjectFromPositionalAudio(`fw_02`, await this.audioManager.createPositionalAudioFromJsonConfig({soundKey: 'fw_02', asset: 'assets/audio/fw_02.ogg', volume: 0.25, refDistance: 25, maxDistance: 100 }), new THREE.Vector3(Math.random()*100-50, 5, Math.random()*100-50));
        this.audioManager.addSoundObjectFromPositionalAudio(`fw_03`, await this.audioManager.createPositionalAudioFromJsonConfig({soundKey: 'fw_03', asset: 'assets/audio/fw_03.ogg', volume: 0.25, refDistance: 25, maxDistance: 100 }), new THREE.Vector3(Math.random()*100-50, 5, Math.random()*100-50));
        this.audioManager.addSoundObjectFromPositionalAudio(`fw_04`, await this.audioManager.createPositionalAudioFromJsonConfig({soundKey: 'fw_04', asset: 'assets/audio/fw_04.ogg', volume: 0.25, refDistance: 25, maxDistance: 100 }), new THREE.Vector3(Math.random()*100-50, 5, Math.random()*100-50));
        this.audioManager.addSoundObjectFromPositionalAudio(`fw_05`, await this.audioManager.createPositionalAudioFromJsonConfig({soundKey: 'fw_05', asset: 'assets/audio/fw_05.ogg', volume: 0.25, refDistance: 25, maxDistance: 100 }), new THREE.Vector3(Math.random()*100-50, 5, Math.random()*100-50));
        this.audioManager.addSoundObjectFromPositionalAudio(`fw_06`, await this.audioManager.createPositionalAudioFromJsonConfig({soundKey: 'fw_06', asset: 'assets/audio/fw_06.ogg', volume: 0.25, refDistance: 25, maxDistance: 100 }), new THREE.Vector3(Math.random()*100-50, 5, Math.random()*100-50));
    }

    async generatePlayers(particleMaterial: THREE.SpriteMaterial, player1VehicleType: VehicleType): Promise<void> {

        await this.loadVehicleAssets();

        var wheelMaterial = new CANNON.Material("wheelMaterial");
        var wheelGroundContactMaterial = new CANNON.ContactMaterial(
            wheelMaterial,
            this.groundMaterial,
            {
                friction: 0.3, restitution: 0, contactEquationStiffness: 1000
            }
        );
        this.world.addContactMaterial(wheelGroundContactMaterial);

        var vehicleFactory = new VehicleFactory(this.crosshairTexture, this.playerMarkerTexture, particleMaterial);

        const values = Object.values(VehicleType).filter(v => typeof v === 'number') as number[];
        const maxVehicleTypeEnum = Math.max(...values);

        this.player1 = vehicleFactory.generatePlayer(this, 0, this.gameConfig.isDebug, this.world, false, player1VehicleType, new THREE.Color('red'), this.gameConfig.gamePadAxesDeadZoneX, wheelMaterial);
        this.player2 = vehicleFactory.generatePlayer(this, 1, this.gameConfig.isDebug, this.world, true, randInt(0, maxVehicleTypeEnum), new THREE.Color('blue'), this.gameConfig.gamePadAxesDeadZoneX, wheelMaterial);
        this.player3 = vehicleFactory.generatePlayer(this, 2, this.gameConfig.isDebug, this.world, true, randInt(0, maxVehicleTypeEnum), new THREE.Color('green'), this.gameConfig.gamePadAxesDeadZoneX, wheelMaterial);
        this.player4 = vehicleFactory.generatePlayer(this, 3, this.gameConfig.isDebug, this.world, true, randInt(0, maxVehicleTypeEnum), new THREE.Color('yellow'), this.gameConfig.gamePadAxesDeadZoneX, wheelMaterial);

        this.allPlayers.push(this.player1);          
        this.allPlayers.push(this.player2);
        this.allPlayers.push(this.player3);
        this.allPlayers.push(this.player4);

        this.allPlayers.forEach(x => x.tryRespawn());

        //this.rigidVehicleObject.model?.add(this.camera);        
        this.camera.position.x = 0;
        this.camera.position.y = 2;        
        this.camera.position.z = 5;

        this.followCam = new THREE.Object3D();
		this.followCam.position.copy(this.camera.position);
		this.add(this.followCam);   
        
        // attach follow camera to player 1
        this.player1.getVehicleObject().getModel()?.add(this.followCam);

        let followCameraOffset = new THREE.Vector3(3, 2, 0); // default

        if(this.player1.getVehicleObject().vehicleOverrideConfig.followCameraOffset != null) {
            followCameraOffset.copy(Utility.ArrayToThreeVector3(this.player1.getVehicleObject().vehicleOverrideConfig.followCameraOffset!));
        }
        this.followCam.position.copy(followCameraOffset); // camera target offset related to car
    }

    private generateMap(): void {
        this.groundMaterial = new CANNON.Material("groundMaterial");
        const normalMap = new THREE.TextureLoader().load('assets/normal-map.png');
        
        var terrainChunk = new TextureHeightMapArray2();
        terrainChunk.generate(this.worldConfig.heightMap).then((heightmap) => {
        //terrainChunk.generate('assets/heightmaps/mountain_circle_512x512.png').then((heightmap) => {
        //terrainChunk.generate('assets/heightmaps/kilimanjaro_2048x2048.png').then((heightmap) => {
            // Heightmap is fully loaded and ready to use
            console.log('Heightmap loaded successfully:', heightmap);
            
            // You can now safely use the heightmap for further processing
            // For example: generate terrain, visualize it, etc.
                    
            this.terrainChunk = new TerrainChunk(this,
                this.world,
                this.groundMaterial,
                heightmap,
                this.worldConfig,
                this.gameConfig,
                new THREE.Vector3(0,0,0)
            );
            
            this.generateGroundPlane();
            this.generateBoundingWalls(heightmap.length, this.worldConfig.horizontalScale);

            if(this.worldConfig.grassBillboard != null && this.worldConfig.grassBillboardStartY != null && this.worldConfig.grassBillboardEndY != null ) {
                var billboards = this.terrainChunk.generateGrassBillboards(
                    this.worldConfig.grassBillboard,
                    heightmap.length,
                    heightmap.length,
                    this.worldConfig.grassBillboardStartY,
                    this.worldConfig.grassBillboardEndY,
                    100000
                );
                this.add( billboards );
                this.grassBillboards = billboards;
            }                
        })
        .catch((error) => {
            console.error('Error loading heightmap:', error);
        });


        // width and height need to match dimensions of heightmap
        

        /*
        const maxLODLevel = 5;        
        var temp = new TextureHeightMapArray2();
        temp.generate('assets/heightmaps/mountain_circle_512x512.png').then((heightmap) => {
        //temp.generate('assets/heightmaps/kilimanjaro_2048x2048.png').then((heightmap) => {
            // Heightmap is fully loaded and ready to use
            console.log('Heightmap loaded successfully:', heightmap);
            
            // You can now safely use the heightmap for further processing
            // For example: generate terrain, visualize it, etc.
                   
            this.quadtreeTerrainSystem3 = new QuadtreeTerrainSystem3(this, heightmap.length, maxLODLevel, heightmap, this.world, 150);
            this.quadtreeTerrainSystem3.buildFullQuadtree(this.quadtreeTerrainSystem3.root, maxLODLevel);
        })
        .catch((error) => {
            console.error('Error loading heightmap:', error);
        });
        */       
      
    }

    private generateGroundPlane(): void {
       
        // adding phyics plane to avoid falling through
        const groundShape = new CANNON.Plane();
        var body = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            material: new CANNON.Material});
        body.addShape(groundShape);     

        body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);        
        this.world.addBody(body);
    }
    private generateBoundingWalls(sizeX: number, horizontalScale: number): void {

        var height = sizeX * horizontalScale;//this.heightMapTextureAsArray.getImageHeight();

        const wallShape = new CANNON.Box(new CANNON.Vec3(height / 2, 20, 1));

        var wallBody1 = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            material: new CANNON.Material});
        wallBody1.addShape(wallShape);            
        wallBody1.position.set(0, 0, height / 2);       
        wallBody1.quaternion.setFromEuler(Math.PI, 0, 0);        
        this.world.addBody(wallBody1);

        var wallBody2 = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            material: new CANNON.Material});
        wallBody2.addShape(wallShape);            
        wallBody2.position.set(0, 0, -height / 2);       
        wallBody2.quaternion.setFromEuler(Math.PI, 0, 0);        
        this.world.addBody(wallBody2);

        var wallBody3 = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            material: new CANNON.Material});
        wallBody3.addShape(wallShape);            
        wallBody3.position.set(height / 2, 0, 0);       
        wallBody3.quaternion.setFromEuler(Math.PI, Math.PI/2, 0);        
        this.world.addBody(wallBody3);

        var wallBody4 = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            material: new CANNON.Material});
        wallBody4.addShape(wallShape);            
        wallBody4.position.set(-height / 2, 0, 0);       
        wallBody4.quaternion.setFromEuler(Math.PI, Math.PI/2, 0);        
        this.world.addBody(wallBody4);
    }

    private checkProjectilesForCollision() { 
        this.projectiles.forEach(projectile => {
            if(projectile.shouldRemove) {
                projectile.kill();
                projectile.group.children.forEach(x => this.remove(x));
                this.remove(projectile.group);      
            }
            else
            {
                let playersToCheck = this.allPlayers.filter(x => x.playerId != projectile.playerId);
                playersToCheck.forEach(player => {

                    if(projectile.projectileType == ProjectileType.Airstrike && projectile.detonationBoundingMesh != null) {

                        if(player.getPosition().distanceTo(projectile.detonationBoundingMesh.position) < projectile.detonationDamageRadius && player.currentHealth > 0){
                            
                            player.tryDamageWithAirstrike();                            
                            if(player.playerId == this.player1.playerId) {
                                this.sceneController.updateHealthOnHud(this.player1.currentHealth);
                            }
                        }
                    }
                    else {
                        if(player.getPosition().distanceTo(projectile.getPosition()) < 1 && player.currentHealth > 0){

                            //const impactForce = projectile.body?.velocity.clone().scale(projectile.body?.mass * 100);

                            const impactForce = Utility.ThreeVec3ToCannonVec3(projectile.getVelocity()).clone()
                                    .scale(projectile.body!.mass * 100);

                            this.generateRandomExplosion(
                                projectile.projectileType,
                                projectile.getPosition(),
                                projectile.getLightColor(),
                                projectile.getParticleColor1(),
                                projectile.getParticleColor2(),
                                projectile.getParticleColor3(),
                                projectile.getParticleColor4()
                            );
                            projectile.kill();
                            this.remove(projectile.group);
                            
                            player.tryDamage(projectile.projectileType, projectile.getPosition(), impactForce);
                            
                            if(player.playerId == this.player1.playerId) {
                                this.sceneController.updateHealthOnHud(this.player1.currentHealth);
                            }
                        }
                    }
                });

                
                // TODO: fix me
                /*
                this.world.contacts.forEach((contact) => {

                    if(contact.bi === projectile.body || contact.bj === projectile.body) {
                        console.log('Collision detected involving projectile');
                    }
                    else 
                        return;


                    if(contact.bi === this.terrain?.body || contact.bj === this.terrain?.body) {
                        console.log('Collision detected involving ground');
                    }
                    else
                        return;

                    if ((contact.bi === projectile.body && contact.bj === this.terrain?.body) || 
                        (contact.bj === projectile.body && contact.bi === this.terrain?.body)) {
                        
                        console.log('Collision detected between projectile and ground');
                        projectile.kill();
                        this.remove(projectile.group);
                        // Perform additional collision handling logic here
                }
                });
                */

                // alternate collision: based on calculating height of terrain
                let worldPosition = this.terrainChunk.getWorldPositionOnTerrain(projectile.group.position.x, projectile.group.position.z );        
                if(projectile.group.position.y <= worldPosition.y) {
                    
                    this.generateRandomExplosion(
                        projectile.projectileType,
                        projectile.getPosition(),
                        projectile.getLightColor(),
                        projectile.getParticleColor1(),
                        projectile.getParticleColor2(),
                        projectile.getParticleColor3(),
                        projectile.getParticleColor4()
                    );
                    
                    projectile.kill();
                    this.remove(projectile.group);
                }
            
                /*
                this.allRigidVehicleObjects.forEach(player => {
                    if(player.getPosition().distanceTo(projectile.getPosition()) < 1){
                        this.generateRandomExplosion(
                            projectile.getPosition(),
                            projectile.getLightColor(),
                            projectile.getParticleColor()
                        );
                        projectile.kill();
                            this.remove(projectile.mesh);
                    }
                });
                */
            };
            
        });

        this.projectiles = this.projectiles.filter(x => !x.shouldRemove);
    }

    private checkDumpstersForCollision() { 
        this.dumpsters.forEach(dumpster => {

            if(dumpster.shouldRemove) {
                //dumpster.kill();
                //dumpster.group.children.forEach(x => this.remove(x));
                //this.remove(dumpster.group);      
            }
            else
            {
                let playersToCheck = this.allPlayers.filter(x => x.playerId != dumpster.playerId);
                playersToCheck.forEach(player => {
                    if(player.getPosition().distanceTo(dumpster.getPosition()) < 2 && player.currentHealth > 0){

                        this.generateRandomExplosion(
                            ProjectileType.Rocket,
                            dumpster.getPosition(),
                        new THREE.Color('white'),
                        new THREE.Color('white'),
                        new THREE.Color('yellow'),
                        new THREE.Color('orange'),
                        new THREE.Color('red')
                        );
                        dumpster.kill();
                        this.remove(dumpster.group);
                        
                        player.tryDamage(ProjectileType.Rocket, dumpster.getPosition());
                        
                        if(player.playerId == this.player1.playerId) {
                            this.sceneController.updateHealthOnHud(this.player1.currentHealth);
                        }
                    }
                });
            };            
        });

        this.projectiles = this.projectiles.filter(x => !x.shouldRemove);
    }

    private checkFlamethrowerForCollision() {
        
        this.allPlayers.forEach(player => {
            
            var anyHits = false;
            if(player.flamethrowerActive) {

                var enemyPlayers = this.allPlayers.filter(x => x.playerId != player.playerId);
                enemyPlayers.forEach(enemy => {
                                        
                    const flamethrowerBoundingBox = new THREE.Box3().setFromObject(player.flamethrowerBoundingBox);
                    var enemyBoundingBox = new THREE.Box3().setFromObject(enemy.getVehicleObject().getChassis().mesh);

                    if(flamethrowerBoundingBox != null && enemyBoundingBox != null && flamethrowerBoundingBox?.intersectsBox(enemyBoundingBox)){
                        enemy.tryDamageWithFlamethrower();
                        player.boundingMeshMaterial.color.set(0xff0000);
                        anyHits = true;
                    }
                });
            }
            if(!anyHits) {
                player.boundingMeshMaterial.color.set(0xffffff);
            }
        });
    }

    checkLightningForCollision() {
         this.allPlayers.forEach(player => {
            
            var anyHits = false;
            if(player.lightningActive) {

                var enemyPlayers = this.allPlayers.filter(x => x.playerId != player.playerId);
                enemyPlayers.forEach(enemy => {
                                        
                    const boundingMesh = new THREE.Box3().setFromObject(player.lightningBoundingMesh);
                    var enemyBoundingBox = new THREE.Box3().setFromObject(enemy.getVehicleObject().getChassis().mesh);

                    if(boundingMesh != null && enemyBoundingBox != null && boundingMesh?.intersectsBox(enemyBoundingBox)){
                        enemy.tryDamageWithLightning();
                                                
                        this.lightningWeapons[2].update(this, enemy.getPosition(), enemy.getModelQuaternion());                        
                        this.lightningWeapons[2].meshGroup.visible = true;

                        this.lightningWeapons[3].update(this, enemy.getPosition(), enemy.getModelQuaternion());                        this.lightningWeapons[3].meshGroup.visible = true;
                        this.lightningWeapons[3].meshGroup.visible = true;

                        player.boundingMeshMaterial.color.set(0xff0000);
                        anyHits = true;
                    }
                });
            }
            if(!anyHits) {
                player.boundingMeshMaterial.color.set(0xffffff);
            }
        });
    }

    private checkKilldozerShovelForCollision() {
        this.allPlayers.forEach(player => {
            
            var anyHits = false;
            if(player.shovelCooldownClock.isRunningAndNotExpired() && player.currentShovelAngle > -Math.PI / 32) {

                var enemyPlayers = this.allPlayers.filter(x => x.playerId != player.playerId);
                enemyPlayers.forEach(enemy => {
                                        
                    const weaponBoundingBox = new THREE.Box3().setFromObject(player.shovelBoundingMesh);
                    var enemyBoundingBox = new THREE.Box3().setFromObject(enemy.getVehicleObject().getChassis().mesh);

                    if(weaponBoundingBox != null && enemyBoundingBox != null && weaponBoundingBox?.intersectsBox(enemyBoundingBox)){
                        enemy.tryDamage(ProjectileType.Rocket, new THREE.Vector3(0,0,0));
                        this.generateRandomExplosion(
                            ProjectileType.Rocket,
                                enemy.getPosition(),
                                new THREE.Color('black'),
                                new THREE.Color('black'),
                                new THREE.Color('brown'),
                                new THREE.Color('brown'),
                                new THREE.Color('gray')
                        );
                        player.boundingMeshMaterial.color.set(0xff0000);
                        anyHits = true;
                    }
                });
            }
            if(!anyHits) {
                player.boundingMeshMaterial.color.set(0xffffff);
            }
        });
    }

    private checkPickupsForCollisionWithPlayers() {
        this.pickups.forEach(pickup => {
            this.allPlayers.forEach(player => {

                let playerPosition = player.getPosition();
                let pickupPosition = pickup.getPosition();
                if(playerPosition.distanceTo(pickupPosition) < 1.5) {
                    // TODO: logic for player receiving pickup item
                    pickup.remove();
                }
            })
        });
    }

    public getWorldPositionOnTerrainAndWater(x: number, z: number): THREE.Vector3 {

        let waterPosition = new THREE.Vector3(0,0,0);
        
        if(this.water != null)
            waterPosition = this.water.position;

        var position = this.terrainChunk.getWorldPositionOnTerrain(x, z);

        if(this.water != null && waterPosition.y > position.y)
            position.y = waterPosition.y;

        return position;
    }

    updateWater() {
        if(!this.water)
            return;

        this.water.material.uniforms[ 'time' ].value += 0.5 / 60.0;
    }

    updatePrecipitation() {
        if(this.precipitationSystem != null) {
            this.precipitationSystem.animateRain();
        }
    }

    preUpdate() {
        this.allPlayers.forEach(player => player.preUpdate());
    }

    update() {
        if(this.world != null) {
            //// called in main.ts
            //this.world.fixedStep();
        }
        this.traverse(x => {
        
        });
        
        this.traverseVisible(x => {
            
        });

        if(!this.player1 || this.player1.isVehicleObjectNull() || this.isPaused) return;

        //this.updateInput(this.sceneController.keyDown);        
        

        var cpuPlayers = this.allPlayers.filter(x => x.isCpuPlayer);// && x.playerState == PlayerState.Alive);
        for(var i = 0; i < cpuPlayers.length; i++) {
            
            let cpuPlayer = cpuPlayers[i];

            if(cpuPlayer.playerState != PlayerState.Alive){
                cpuPlayer.resetTurn();
                cpuPlayer.tryStopAccelerate();
                cpuPlayer.tryStopReverse();
                continue;
            }

            if(this.cpuPlayerBehavior == CpuPlayerPattern.Stop || this.cpuPlayerBehavior == CpuPlayerPattern.StopAndAttack) {
                cpuPlayer.tryStopAccelerate();
                cpuPlayer.tryStopReverse();
                cpuPlayer.tryStopTurbo();
                continue;
            }

            if(this.cpuPlayerBehavior == CpuPlayerPattern.Follow || this.cpuPlayerBehavior == CpuPlayerPattern.FollowAndAttack) {                
                //VehicleUtil.updateFollowerBehavior(this.player1.getVehicleObject().getRaycastVehicle(), cpuPlayer.getVehicleObject().getRaycastVehicle())
                VehicleUtil.updateFollowerBehaviorOnIPlayerVehicle(this.player1.getVehicleObject(), cpuPlayer.getVehicleObject());
                //cpuPlayer.setTargetLocation(this.player1.getPosition());
            }

            // movement
            let randMovement = THREE.MathUtils.randInt(0, 200);
            switch(randMovement) {
            /*
            case 1:
            case 2:
                cpuPlayer.tryAccelerateWithKeyboard();
                break;
            case 3:
            case 4:
                cpuPlayer.tryAccelerateWithKeyboard();
                cpuPlayer.tryTurnLeftWithKeyboard();
                break;
            case 5:
            case 6:
                cpuPlayer.tryAccelerateWithKeyboard();
                cpuPlayer.tryTurn(-0.5);
                break;
            case 7:
            case 8:
                cpuPlayer.tryAccelerateWithKeyboard();
                cpuPlayer.tryTurnRightWithKeyboard();
                break;
            case 9:
            case 10:
                cpuPlayer.tryAccelerateWithKeyboard();
                cpuPlayer.tryTurn(0.5);
                break;
            case 50:
                cpuPlayer.tryReverseWithKeyboard();
                //cpuPlayer.tryTurn(0.5);
                break;
            */
            case 60:
                cpuPlayer.tryJump();                
                //cpuPlayer.tryTurn(0.5);
                break;
            case 70:
                cpuPlayer.tryTurbo();
                break;
            default:
                break;
            }

            // weapons
            if(this.cpuPlayerBehavior as CpuPlayerPattern == CpuPlayerPattern.FollowAndAttack || this.cpuPlayerBehavior as CpuPlayerPattern == CpuPlayerPattern.StopAndAttack) {
                let randomWeaponFiring = THREE.MathUtils.randInt(80, 200);
                switch(randomWeaponFiring) {            
                case 81:
                case 82:
                case 83:
                case 84:
                    cpuPlayer.tryFireBullets();
                    break;
                case 90:
                    cpuPlayer.tryFireRocket();
                    break;
                case 100:
                case 101:
                    cpuPlayer.tryFireFlamethrower();
                    break;
                case 110:
                case 111:
                    cpuPlayer.tryFireAirStrike();
                    break;
                case 120:
                    cpuPlayer.tryFireDumpster();
                    break;
                case 121:
                    cpuPlayer.tryFireSonicPulse();
                    break;
                case 122:
                    cpuPlayer.tryFireSpecialWeapon();
                    break;
                default:
                    break;
                }

                if(randomWeaponFiring != 100 && randomWeaponFiring != 101)
                    cpuPlayer.tryStopFireFlamethrower();
            }
        }

        this.updateCamera(); 
        
        this.terrainChunk?.update();

        // TODO: figure out where best to update quadtree LOD

        this.cube?.update();
        this.cube2?.update();
        this.sphere?.update();
        this.cylinder?.update();

        if(this.player1.lightningActive) {
            for(let i = 0; i < 2; i++) {                
                let worldPos = new THREE.Vector3();
                switch(i) {
                    case 0:
                        this.player1.headLights.mesh1.getWorldPosition(worldPos);
                        break;
                    case 1:
                        this.player1.headLights.mesh2.getWorldPosition(worldPos);
                        break;
                    default:
                        break;
                        //worldPos.copy(this.player1.getPosition());
                        //break;
                }                
                this.lightningWeapons[i].update(this, worldPos, this.player1.getModelQuaternion());
                this.lightningWeapons[i].meshGroup.visible = true;
            }
        }
        else {
            this.lightningWeapons.forEach(x => x.meshGroup.visible = false);
        }

        let time = this.clock.getDelta();
        
        this.animatedSprites.forEach(x => x.update(time));
        this.animatedSprites = this.animatedSprites.filter(x => x.isAlive);
    
        this.shaderAnimatedSprites.forEach(x => x.update(time))
        
        this.cubes.forEach(x => x.update());

        this.debrisWheels.forEach(x => x.update());

        this.dumpsters.forEach(x => x.update(this.clock));

        this.pickups.forEach(x => x.update());

        this.projectiles.forEach(x => x.update());

        this.fireParticleEmitters.forEach(x => x.update(this.clock));
        this.fireParticleEmitters.forEach(x => x.setEmitPosition(new THREE.Vector3(-3, 2.5, -3)));

        //this.rainShaderParticleEmitter.update();

        this.checkProjectilesForCollision();
        this.checkFlamethrowerForCollision();
        this.checkLightningForCollision();
        this.checkKilldozerShovelForCollision();
        this.checkPickupsForCollisionWithPlayers();
        this.checkDumpstersForCollision();

        this.world.contacts.forEach((contact) => {
            if ((contact.bi === this.player1.getChassisBody() && contact.bj === this.player2.getChassisBody()) || 
                (contact.bj === this.player1.getChassisBody() && contact.bi === this.player2.getChassisBody())) {
                console.log('Collision detected between player 1 and player 2');
                // Perform additional collision handling logic here
        }
        });

        if(this.cube != null) 
        {
            //this.spotlight?.setPosition(this.cube?.mesh.position);
        }       

        this.spotlight?.update();

        this.particleEmitters.forEach(x => x.update(this.clock));
        this.particleEmitters = this.particleEmitters.filter(x => !x.isDead);

        this.flamethrowerEmitters.forEach(x => x.update());
        this.sonicPulseEmitters.forEach(x => x.update());

        let player1Position = this.player1.getPosition();
        this.allPlayers.forEach(player => {
            player.update(this.clock, this.cpuPlayerBehavior);
            let distance = player1Position.distanceTo(player.getPosition());
            this.sceneController.hudScene?.updateMeshHealthBar(player.playerId, player.currentHealth, distance);
        });
    
        if(!this.player1.isModelNull() && this.crosshairSprite != null) {
            let forwardVector = new THREE.Vector3(-10, 0, 0);
            forwardVector.applyQuaternion(this.player1.getModelQuaternion());
            this.crosshairSprite.position.addVectors(this.player1.getModelPosition(), forwardVector);//playerPosition.x, playerPosition.y - 2, playerPosition.z);
            
            //let size = 10;
            //this.crosshairSprite.scale.set(size, size, size);

            // otherPlayers still alive
            var otherPlayersStillAlive = this.allPlayers.filter(x => x.playerId != this.player1.playerId && x.currentHealth > 0);

            var otherPlayerBodies: CANNON.Body[] = [];
            for(var i = 0; i < otherPlayersStillAlive.length; i++) {
                if(!otherPlayersStillAlive[i].isVehicleObjectNull() && otherPlayersStillAlive[i].getChassisBody() != null) {
                    let body = otherPlayersStillAlive[i].getChassisBody() ?? new CANNON.Body();
                    otherPlayerBodies.push(body); 
                }
            }

            let ray = new CANNON.Ray(Utility.ThreeVec3ToCannonVec3(player1Position), Utility.ThreeVec3ToCannonVec3(this.crosshairSprite.position));                
            var raycastResult: CANNON.RaycastResult = new CANNON.RaycastResult();

            // intersect multiple bodies
            ray.intersectBodies(otherPlayerBodies, raycastResult);

            if(raycastResult != null && raycastResult.hasHit) {
                this.crosshairSprite.material.color.set(new THREE.Color('red'));
            }
            else {
                this.crosshairSprite.material.color.set(new THREE.Color('white'));
            }        
        }                

        this.camera.updateMatrixWorld(true);

        this.updateDebugDivElements();
        //this.stats.update();

        this.audioManager.update(this.camera.position);
    }
   
    updateLODTerrain() {
        if(!this.LODTerrainSystem)
            return;

        if(this.isPaused)
            this.LODTerrainSystem.update(this.debugCamera);
        else 
        this.LODTerrainSystem.update(this.camera);
        
    }
    updateQuadtreeTerrain5() {
        if(!this.quadtreeTerrainSystem5)
            return;

        if(this.isPaused) {
            this.quadtreeTerrainSystem5.updateLOD(this.debugCamera);
        }
        else {
            this.quadtreeTerrainSystem5.updateLOD(this.camera);
        }
    }

    updateDebugDivElements() {

        if(this.debugDivElementManager == null) return;

        let playerPosition = this.player1.getPosition();
        this.debugDivElementManager.updateElementText("GameCameraLocation", `Follow camera: ${Utility.ThreeVector3ToString(this.camera.position)}`);
        this.debugDivElementManager.updateElementText("DebugCameraLocation", `Debug camera: ${Utility.ThreeVector3ToString(this.debugCamera.position)}`);
        this.debugDivElementManager.updateElementText("PlayerLocation", `Player 1 position: (${playerPosition.x.toFixed(2)}, ${playerPosition.y.toFixed(2)}, ${playerPosition.z.toFixed(2)})`);
        this.debugDivElementManager.updateElementText("AudioListener", `Audio listener position: (${Utility.ThreeVector3ToString(this.audioManager.getAudioListener().position)})`);
        this.debugDivElementManager.updateElementText("Player1Speed", `Player 1 speed: (${this.player1.getVehicleObject().getCurrentSpeed()})`);

        const player1CurrentSpeed = this.player1.getVehicleObject().getForwardVelocity();
        document.getElementById('speed')!.innerText = player1CurrentSpeed.toFixed(0).toString();
        if(Math.abs(player1CurrentSpeed) >= Math.abs(this.player1.getVehicleObject().vehicleOverrideConfig.topSpeedForHigherTorque))
            document.getElementById('speed')!.style.color = 'red';
        else
            document.getElementById('speed')!.style.color = 'green';
        //this.debugDivElementManager.updateElementText("Player1BulletSoundLocation", `Player 1 bullet sound: (${Utility.ThreeVector3ToString(this.player1.bulletSound?.position)})`);
        //this.debugDivElementManager.updateElementText("Player1RocketSoundLocation", `Player 1 rocket sound: (${Utility.ThreeVector3ToString(this.player1.rocketSound.position)})`);
        
        this.debugDivElementManager.updateElementText("Objective", `Scene objects: ${this.children.length}`);
        
        // flamethrower particles
        let flameThrowerEmitterTotalParticleCount: number = 0;
        this.flamethrowerEmitters.forEach(x => {
            flameThrowerEmitterTotalParticleCount += x.sprites.length;
        });
        this.debugDivElementManager.updateElementText("FlamethrowerParticleCount", `Flamethrower particles (sprites): ${flameThrowerEmitterTotalParticleCount}`);

        // particles
        let emitterTotalParticleCount: number = 0;
        this.particleEmitters.forEach(x => {
            emitterTotalParticleCount += x.getParticleCount();
        });

        this.allPlayers.forEach(x => {
            emitterTotalParticleCount += x.getTotalSpriteParticleCount();
        });
        this.projectiles.forEach(x => {
            if(x.particleEmitterObject != null)
                emitterTotalParticleCount += x.particleEmitterObject.getParticleCount();

            if(x.particleEmitterSmokeObject != null)
                emitterTotalParticleCount += x.particleEmitterSmokeObject.getParticleCount();
        });
        this.debugDivElementManager.updateElementText("CpuParticleCount", `Total CPU emitter particles (sprites): ${emitterTotalParticleCount}`);

        let emitterTotalGpuParticleCount: number = 0;        
        this.allPlayers.forEach(x => {
            emitterTotalGpuParticleCount += x.getTotalGpuParticleCount();
        })
        this.debugDivElementManager.updateElementText("GpuParticleCount", `Total GPU emitter particles (THREE.Points): ${emitterTotalGpuParticleCount}`);
        
        this.debugDivElementManager.updateElementText("AnimatedSpriteCount", `Total animated spites: ${this.animatedSprites.length}`);

        // physics objects
        let totalPhysicsObjectCount: number = this.world.bodies.length;        
        this.debugDivElementManager.updateElementText("PhysicsObjectCount", `Total physics objects: ${totalPhysicsObjectCount}`);

        // lights
        var arrayLightTypes = ['SpotLight', 'HemisphereLight', 'AmbientLight', 'DirectionalLight', 'PointLight', 'RectAreaLight'];
        var totalLightCountInGroup = 0;        
        var allGroups = this.children.filter(x => x.type == 'Group');
        allGroups.forEach(x => {
            totalLightCountInGroup += x.children.filter(y => arrayLightTypes.includes(y.type)).length;
        });
        let totalLightObjectCount: number = this.children.filter(x => arrayLightTypes.includes(x.type)).length;
        this.debugDivElementManager.updateElementText("LightObjectCount", `total light objects: ${totalLightObjectCount + totalLightCountInGroup}`);

        // particle emitters
        let particleEmitterCount: number = this.particleEmitters.length;
        this.debugDivElementManager.updateElementText("ParticleEmitterCount", `GameScene particle emitter count: ${particleEmitterCount}`);

        // grass billboards
        let grassBillboardsCount = this.grassBillboards?.geometry.attributes.position.count ?? 0;
        /*
        this.projectiles.forEach(x => {
            if(x.particleEmitterObject != null)
                shaderParticleCount += x.particleEmitterObject.getParticleCount();
        });
        */
        this.debugDivElementManager.updateElementText("GrassBillboardsCount", `Grass billboards count: ${grassBillboardsCount}`);

        const renderer = this.sceneController.getWebGLRenderer();
        if(renderer.info != null) {
            this.debugDivElementManager.updateElementText("RendererTotalGeometry", `WebGLRenderer total geometry: ${renderer.info.memory.geometries}`);
            this.debugDivElementManager.updateElementText("RendererTotalTextures", `WebGLRenderer total textures: ${renderer.info.memory.textures}`);
            this.debugDivElementManager.updateElementText("RendererTotalPrograms", `WebGLRenderer total programs: ${renderer.info?.programs?.length ?? 0}`);
        }

        this.debugDivElementManager.updateElementText("cpuOverrideBehavior", `CPU Override Behavior: ${Utility.getEnumName(CpuPlayerPattern, this.cpuPlayerBehavior)}`);

        this.debugDivElementManager.updateElementText("player2Status", `Player 2 | position: ${Utility.ThreeVector3ToString(this.player2.getPosition())} | ${Utility.getEnumName(PlayerState, this.player2.playerState)} | velocity: ${Utility.CannonVec3ToString(this.player2.getChassisBody().velocity)}`);
        this.debugDivElementManager.updateElementText("player2Target", `Player 2 Target: ${Utility.ThreeVector3ToString(this.player2.target.groundTargetMesh.position)} | Distance: ${this.player1.getPosition().distanceTo(this.player2.getPosition()).toFixed(2)}`);        

        this.debugDivElementManager.updateElementText("player3Status", `Player 3 | position: ${Utility.ThreeVector3ToString(this.player3.getPosition())} | ${Utility.getEnumName(PlayerState, this.player3.playerState)} | velocity: ${Utility.CannonVec3ToString(this.player3.getChassisBody().velocity)}`);
        this.debugDivElementManager.updateElementText("player3Target", `Player 3 Target: ${Utility.ThreeVector3ToString(this.player3.target.groundTargetMesh.position)} | Distance: ${this.player1.getPosition().distanceTo(this.player3.getPosition()).toFixed(2)}`);

        this.debugDivElementManager.updateElementText("player4Status", `Player 4 | position: ${Utility.ThreeVector3ToString(this.player4.getPosition())} | ${Utility.getEnumName(PlayerState, this.player4.playerState)} | velocity: ${Utility.CannonVec3ToString(this.player4.getChassisBody().velocity)}`);
        this.debugDivElementManager.updateElementText("player4Target", `Player 4 Target: ${Utility.ThreeVector3ToString(this.player4.target.groundTargetMesh.position)} | Distance: ${this.player1.getPosition().distanceTo(this.player4.getPosition()).toFixed(2)}`);

        this.debugDivElementManager.updateElementText("Player1_currentMaxWheelSlip",  `Player1_currentMaxWheelSlip: ${this.player1.getVehicleObject().getCurrentSlip()}`);

        let positionalSounds = this.getAudioManager().getAllSounds();
        this.debugDivElementManager.updateElementText("PositionalSounds",  `Positional sounds: ${positionalSounds.size}`);
        //this.debugDivElementManager.updateElementText("Player1_Front_Right_WheelSlip", `Player1_Front_Right_WheelSlip Target: ${Utility.ThreeVector3ToString(this.player4.target.groundTargetMesh.position)} | Distance: ${this.player1.getPosition().distanceTo(this.player4.getPosition()).toFixed(2)}`);
        //this.debugDivElementManager.updateElementText("Player1_Back_Left_WheelSlip",   `Player1_Back_Left_WheelSlip: ${this.player4.getVehicleObject().getwh)}`);
        //this.debugDivElementManager.updateElementText("Player1_Back_Right_WheelSlip",  `Player1_Back_Right_WheelSlip: ${Utility.ThreeVector3ToString(this.player4.target.groundTargetMesh.position)} | Distance: ${this.player1.getPosition().distanceTo(this.player4.getPosition()).toFixed(2)}`);

        /*
        if(this.quadtreeTerrainSystem != null) {
            // Get the camera's frustum
            const frustum = this.isPaused
                ? SceneUtility.getFrustumFromCamera(this.debugCamera)
                : SceneUtility.getFrustumFromCamera(this.camera);

            // Count how many nodes are visible
            this.debugDivElementManager.updateElementText("QuadtreeTerrain", `Quadtree visible nodes: ${this.quadtreeTerrainSystem.getCountOfAllVisibleNodes(frustum)}`);
        }
        */
            
        //let textureCount = this.getAllLoadedTextures(this);
        //this.debugDivElementManager.updateElementText("TraverseTotalTextures", `Total Textures: ${textureCount}`);
    }
}
