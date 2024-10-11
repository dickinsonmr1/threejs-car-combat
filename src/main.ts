import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import GameScene from './scenes/gameScene'
import HudScene from './scenes/hudScene'
import { RoomEnvironment } from 'three/examples/jsm/Addons.js';
import CannonDebugger from 'cannon-es-debugger';
import SceneController from './scenes/sceneController';
import { GamepadControlScheme } from './scenes/gamePadEnums';
import MenuScene from './scenes/menuScene';
import { GameConfig } from './gameconfig';

import gameconfigJson from '../gameconfig.json'
const gameConfig: GameConfig = gameconfigJson;

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('app') as HTMLCanvasElement
});

renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = 'srgb';

// https://threejs.org/examples/?q=sprites#webgl_sprites
renderer.autoClear = false; // To allow render overlay

const mainCamera = new THREE.PerspectiveCamera(75, width/height, 0.1, 50);

const debugOrbitCamera = new THREE.PerspectiveCamera(75, width/height, 0.1, 500);
debugOrbitCamera.position.set(0, 10, 0);

const debugOrbitControls = new OrbitControls(debugOrbitCamera, renderer.domElement);
//debugOrbitControls.enablePan = true;
/*
debugOrbitControls.keys = {
	LEFT: 'a',
	UP: 'w',
	RIGHT: 'd',
	BOTTOM: 's' 
};
*/
debugOrbitControls.enabled = false; // Disable controls initially

// needed for GLTF models to light correctly
// https://discourse.threejs.org/t/directional-light-and-gltf-model-not-working-together/49358
const environment = new RoomEnvironment( renderer );
const pmremGenerator = new THREE.PMREMGenerator( renderer );

window.addEventListener("gamepadconnected", (event) => {
  console.log("A gamepad connected:");
  console.log(event.gamepad);
  sceneController.setGamePad1(event.gamepad, gameConfig.controlType);
});

window.addEventListener("gamepaddisconnected", (event) => {
  console.log("A gamepad disconnected:");
  console.log(event.gamepad);
});

var sceneController = new SceneController(renderer);

const gameScene = new GameScene(mainCamera, debugOrbitCamera, debugOrbitControls, sceneController, gameConfig);
//gameScene.initialize();

let cannonDebugger: any = null;

if(gameConfig.isDebug) {
  cannonDebugger = CannonDebugger(gameScene, gameScene.world, {color: 0x0000ff });  
}

gameScene.environment = pmremGenerator.fromScene( environment ).texture;
environment.dispose();

// hud scene and camera
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = window.innerHeight;
var cameraOrtho = new THREE.OrthographicCamera(
    -frustumSize * aspect/2,
    frustumSize * aspect/2,
    frustumSize/2,
    -frustumSize/2,
    0.01, 100
);
cameraOrtho.position.z = 10;
            
let sceneOrtho = new HudScene(cameraOrtho, sceneController);

// menu scene and camera
const menuCamera = new THREE.PerspectiveCamera(75, width/height, 0.1, 75);
menuCamera.position.set(-5, 0, 0);
const menuScene = new MenuScene(menuCamera, sceneController);
menuScene.initialize();

menuScene.environment = pmremGenerator.fromScene( environment ).texture;
environment.dispose();

sceneController.init(menuScene, gameScene, sceneOrtho);
sceneController.switchToMenuScene();
sceneController.setOnScreenControls();

var gamepads = navigator.getGamepads();
console.log(gamepads);

function onWindowResize(): void {

  const aspect = window.innerWidth / window.innerHeight;

  // Update camera aspect ratio
  mainCamera.aspect = aspect;
  mainCamera.updateProjectionMatrix();

  // Recalculate the camera's frustum
  cameraOrtho.left = -frustumSize * aspect / 2;
  cameraOrtho.right = frustumSize * aspect / 2;
  cameraOrtho.top = frustumSize / 2;
  cameraOrtho.bottom = -frustumSize / 2;

  cameraOrtho.updateProjectionMatrix();
  cameraOrtho.updateProjectionMatrix();

  menuCamera.aspect = aspect;
  menuCamera.updateProjectionMatrix();
  
  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Re-render the scene
  //render();
}

// Attach the window resize event listener
window.addEventListener('resize', onWindowResize, false);


function tick() {

  var scene = sceneController.currentScene;

  if(scene instanceof GameScene) {

    if(!scene.isPaused) {
      scene.updateWater();
      scene.updatePrecipitation();
      scene.update();
      sceneOrtho.update();

      if(gameConfig.isDebug && cannonDebugger != null) {
        cannonDebugger.update();
      }

      renderer.clear();
      renderer.render(scene, mainCamera);
      renderer.clearDepth();
      renderer.render(sceneOrtho, cameraOrtho);
    }
    else {
      debugOrbitControls.update();
      scene.updateInputForDebug();
      renderer.render(scene, debugOrbitCamera);
    }
    
  }
  else if(scene instanceof MenuScene) {
    scene.update();
    renderer.render(scene, menuCamera);
  }
  
  requestAnimationFrame(tick);
  
  if(scene instanceof GameScene && !scene.isPaused) {
    scene.world.fixedStep();
  }
}

tick()