import * as THREE from 'three'
import GameScene from './scenes/gameScene'
import HudScene from './scenes/hudScene'
import { RoomEnvironment } from 'three/examples/jsm/Addons.js';
import CannonDebugger from 'cannon-es-debugger';
import HealthBar from './gameobjects/healthBar';
import SceneController from './scenes/sceneController';

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('app') as HTMLCanvasElement
});

renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = 'srgb';

// https://threejs.org/examples/?q=sprites#webgl_sprites
renderer.autoClear = false; // To allow render overlay on top of sprited sphere

const mainCamera = new THREE.PerspectiveCamera(75, width/height, 0.1, 100);

// needed for GLTF models to light correctly
// https://discourse.threejs.org/t/directional-light-and-gltf-model-not-working-together/49358
const environment = new RoomEnvironment( renderer );
const pmremGenerator = new THREE.PMREMGenerator( renderer );

var sceneController = new SceneController();

const scene = new GameScene(mainCamera, sceneController);
scene.initialize();

const cannonDebugger = CannonDebugger(scene, scene.world, {color: 0x0000ff });

scene.environment = pmremGenerator.fromScene( environment ).texture;
environment.dispose();


let hudwidth = 1920;
let hudheight = 1080;
/*
var hudCanvas = document.createElement('canvas');
hudCanvas.width = hudwidth;
hudCanvas.height = hudheight;
var hudBitmap = hudCanvas.getContext('2d');

if(hudBitmap != null) {
  hudBitmap.font = "Normal 40px Arial";
  hudBitmap.textAlign = 'center';
  hudBitmap.fillStyle = "rgba(245,245,245,0.75)";
  hudBitmap.fillText('Initializing...', hudwidth / 2, hudheight / 2);
}
*/

var cameraOrtho = new THREE.OrthographicCamera(
    -hudwidth/2, hudwidth/2,
    hudheight/2, -hudheight/2,
    1, 10
);
cameraOrtho.position.z = 1;
//cameraOrtho.position.x = 1;
//cameraOrtho.lookAt(new THREE.Vector3(0, 0, 0));
            
let sceneOrtho = new HudScene(cameraOrtho, sceneController);
sceneOrtho.initialize();

sceneController.init(scene, sceneOrtho)

/*
var hudTexture = new THREE.Texture(hudCanvas)
hudTexture.needsUpdate = true;
var material = new THREE.MeshBasicMaterial( {map: hudTexture, opacity: 0.1 } );
material.transparent = true;

var planeGeometry = new THREE.PlaneGeometry( hudwidth, hudheight );
var plane = new THREE.Mesh( planeGeometry, material );
sceneHUD.add( plane );
*/



function tick() {
  scene.update();
  sceneOrtho.update();
  cannonDebugger.update();

  /*
  if(hudBitmap != null) {
    hudBitmap.clearRect(0, 0, hudwidth, hudheight);
    hudBitmap.fillText("Health", 0, 0);
    hudTexture.needsUpdate = true;
  }
  */
  renderer.clear();
  renderer.render(scene, mainCamera);
  renderer.clearDepth();
  renderer.render(sceneOrtho, cameraOrtho);
  requestAnimationFrame(tick);
}

tick()