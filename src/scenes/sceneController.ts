
import GameScene from "./gameScene";
import HudScene from "./hudScene";
import MenuScene from "./menuScene";
import { GamepadControlScheme, GamepadEnums } from "./gamePadEnums";
import { ProjectileType } from "../gameobjects/weapons/projectileType";
import nipplejs from 'nipplejs';
import { Scene } from "three";
import { VehicleType } from "../gameobjects/player/player";
import { WorldConfig } from "../gameobjects/world/worldConfig";
import * as THREE from 'three'

import arenaLevelJson from '../levelData/arena.json';
import fieldLevelJson from '../levelData/field.json';
import mountainLevelJson from '../levelData/mountain.json';
import GUI from "lil-gui";
import { GameConfig } from "../gameconfig";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class SceneController {

    arenaLevelConfig: WorldConfig = arenaLevelJson;
    fieldLevelConfig: WorldConfig = fieldLevelJson;
    mountainLevelConfig: WorldConfig = mountainLevelJson;

    menuScene?: MenuScene;
    gameScene?: GameScene;
    hudScene?: HudScene;

    currentScene?: THREE.Scene;

    gamepad!: Gamepad;
    gamepadPrevious!: Gamepad;
    gamepadControlScheme!: GamepadControlScheme;

    renderer: THREE.WebGLRenderer;
    gui: GUI;

    constructor(renderer: THREE.WebGLRenderer, gui: GUI) {
        this.renderer = renderer;
        this.gui = gui;
                        
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    public keyDown = new Set<string>();
    private handleKeyDown = (event: KeyboardEvent) => {        
        /*
        if (['w', 'a', 's', 'd'].includes(event.key)) {
            event.preventDefault();
            return;
        }            
        */
        this.keyDown.add(event.key.toLowerCase());
    }

	private handleKeyUp = (event: KeyboardEvent) => {

        if(this.currentScene instanceof GameScene ) {

		    this.keyDown.delete(event.key.toLowerCase())

            this.gameScene?.handleKeyUp(event);
        }
        if(this.currentScene instanceof MenuScene) {
            this.keyDown.delete(event.key.toLowerCase())

            this.menuScene?.handleKeyUp(event);
        }
    }

    accelerateGamepadIndex!: number;
    brakeOrReverseGamepadIndex!: number;
    firePrimaryWeaponGamepadIndex!: number;
    fireSecondaryWeaponGamepadIndex!: number;
    fireFlameThrowerGamepadIndex!: number;
    jumpGamepadIndex!: number;

    gamePausedDivElement!: HTMLElement;
    inGameOnScreenControlsDiv!: HTMLElement;

    turboLastPressTime: number = 0;
    turboTapCount: number = 0;
    //turboIsHolding: boolean = false;

    static readonly DOUBLE_TAP_THRESHOLD: number = 250; // Max time between taps (ms)
    static readonly HOLD_THRESHOLD: number = 100; // Time to consider a hold (ms)

    setGamePad1(gamepad: Gamepad, gamepadControlScheme: GamepadControlScheme) {
        this.gamepad = gamepad;
        this.gamepadPrevious = gamepad;

        this.gamepadControlScheme = gamepadControlScheme;

        console.log('gamepad1 assigned');

        if(gamepadControlScheme == GamepadControlScheme.Racing) {
            this.accelerateGamepadIndex = GamepadEnums.RIGHT_SHOULDER_BOTTOM;
            this.brakeOrReverseGamepadIndex = GamepadEnums.LEFT_SHOULDER_BOTTOM;
            this.firePrimaryWeaponGamepadIndex = GamepadEnums.FACE_2;
            this.fireSecondaryWeaponGamepadIndex = GamepadEnums.FACE_4;
            this.fireFlameThrowerGamepadIndex = GamepadEnums.FACE_3;
            this.jumpGamepadIndex = GamepadEnums.FACE_1
        }
        else {
            this.accelerateGamepadIndex = GamepadEnums.FACE_3;
            this.brakeOrReverseGamepadIndex = GamepadEnums.FACE_1
            this.firePrimaryWeaponGamepadIndex = GamepadEnums.RIGHT_SHOULDER_BOTTOM;
            this.fireSecondaryWeaponGamepadIndex = GamepadEnums.LEFT_SHOULDER_BOTTOM;
            this.fireFlameThrowerGamepadIndex = GamepadEnums.FACE_2;
            this.jumpGamepadIndex = GamepadEnums.RIGHT_SHOULDER;
        }
    }

    updateControlType(gamepadControlScheme: GamepadControlScheme) {
        if(this.gamepad != null) {
            this.setGamePad1(this.gamepad, gamepadControlScheme);
        }
    }

    getButton(name: string): HTMLElement {
        return document.getElementById(name)!;
    }

    setOnScreenControls() {
        
        // game scene buttons
        const leftButton = this.getButton('left');
        const rightButton = this.getButton('right');
        const upButton = this.getButton('up');
        const downButton = this.getButton('down');

        const primaryWeaponButton = this.getButton('primaryweapon');
        const secondaryWeaponButton = this.getButton('secondaryweapon');
        const specialWeaponButton = this.getButton('specialweapon');
        const jumpButton = this.getButton('jump');
        const turboButton = this.getButton('turbo');

        const toggleDebugButton = this.getButton('toggledebug');
        const resetButton = this.getButton('reset');

        // menu scene buttons
        const startGameLevel1Button = this.getButton('startgameLevel1');
        const startGameLevel2Button = this.getButton('startgameLevel2');
        const startGameLevel3Button = this.getButton('startgameLevel3');
        const menuLeftButton = this.getButton('menuLeft');
        const menuRightButton = this.getButton('menuRight');

        this.gamePausedDivElement = document.getElementById('gamePausedDiv')!;
        this.inGameOnScreenControlsDiv = document.getElementById('inGameOnScreenControlsDiv')!;

        if(leftButton != null) {

            leftButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryTurn(1.0);
            });
            leftButton.addEventListener('touchend', () => {
                this.gameScene?.player1.resetTurn();
            });
        }

        if(rightButton != null) {
            rightButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryTurn(-1.0);
            });
            rightButton.addEventListener('touchend', () => {
                this.gameScene?.player1.resetTurn();
            });
        }

        if(upButton != null) {
            upButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryAccelerate(1);
            });
            upButton.addEventListener('touchend', () => {
                this.gameScene?.player1.tryStopAccelerate();
            });
        }

        if(downButton != null) {
            downButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryReverse(1.0);
            });
            downButton.addEventListener('touchend', () => {
                this.gameScene?.player1.tryStopReverse();
            });            
        }

        if(primaryWeaponButton != null) {
            primaryWeaponButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryFireRocket();
            });
            primaryWeaponButton.addEventListener('touchend', () => {
                //
            });
        }

        if(secondaryWeaponButton != null) {
            secondaryWeaponButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryFireBullets();
            });
            secondaryWeaponButton.addEventListener('touchend', () => {
                //
            });
        }

        if(specialWeaponButton != null) {
            specialWeaponButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryFireFlamethrower();
            });
            specialWeaponButton.addEventListener('touchend', () => {
                this.gameScene?.player1.tryStopFireFlamethrower();
                //
            });
        }


        if(jumpButton != null) {
            jumpButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryJump();
            });
        }

        if(turboButton != null) {
            turboButton.addEventListener('touchstart ', () => {
                this.gameScene?.player1.tryTurbo();
            });
        }


        if(toggleDebugButton != null) {
            toggleDebugButton.addEventListener('touchstart', () => {
                //this.gameScene?.debugDivElementManager.toggleShowHideAllElements();
                //this.hudScene?.hudDivElementManager.toggleShowHideAllElements();
            });
            toggleDebugButton.addEventListener('click', () => {
                this.gameScene?.debugDivElementManager.toggleShowHideAllElements();
                this.hudScene?.hudDivElementManager.toggleShowHideAllElements();
            });
            toggleDebugButton.addEventListener('touchend', () => {
                //this.gameScene?.debugDivElementManager.toggleShowHideAllElements();
                //this.hudScene?.hudDivElementManager.toggleShowHideAllElements();
            });
        }

        if(resetButton != null) {
            resetButton.addEventListener('touchstart', () => {
                //this.gameScene?.player1.tryResetPosition();
            });
            resetButton.addEventListener('click', () => {
                this.gameScene?.player1.tryResetPosition();
            });
            resetButton.addEventListener('touchend', () => {
                //
            });
        }

        // menu scene buttons

        if(menuLeftButton != null) {

            menuLeftButton.addEventListener('touchstart', () => {
                //this.menuScene?.selectPreviousVehicle();
            });
            menuLeftButton.addEventListener('click', () => {
                this.menuScene?.selectPreviousVehicle();
            });
            menuLeftButton.addEventListener('touchend', () => {

            });
        }
        if(menuRightButton != null) {
            menuRightButton.addEventListener('touchstart', () => {
                //this.menuScene?.selectNextVehicle();
            });
            menuRightButton.addEventListener('click', () => {
                this.menuScene?.selectNextVehicle();
            });
            menuRightButton.addEventListener('touchend', () => {

            });
        }

        if(startGameLevel1Button != null) {
            startGameLevel1Button.addEventListener('touchstart', () => {
                //this.switchToGameScene();
                //startGameButton.style.visibility = "hidden";
            });
            startGameLevel1Button.addEventListener('click', () => {
                this.switchToGameScene(this.menuScene!.getSelectedVehicleType() ?? VehicleType.Killdozer, "arena");
                startGameLevel1Button.style.visibility = "hidden";
            });
            startGameLevel1Button.addEventListener('touchend', () => {
                //
            });
        }

        if(startGameLevel2Button != null) {
            startGameLevel2Button.addEventListener('touchstart', () => {
                //this.switchToGameScene();
                //startGameButton.style.visibility = "hidden";
            });
            startGameLevel2Button.addEventListener('click', () => {
                this.switchToGameScene(this.menuScene!.getSelectedVehicleType() ?? VehicleType.Killdozer, "field");
                startGameLevel2Button.style.visibility = "hidden";
            });
            startGameLevel2Button.addEventListener('touchend', () => {
                //
            });
        }

        if(startGameLevel3Button != null) {
            startGameLevel3Button.addEventListener('touchstart', () => {
            });
            startGameLevel3Button.addEventListener('click', () => {
                this.switchToGameScene(this.menuScene!.getSelectedVehicleType() ?? VehicleType.Killdozer, "mountain");
                startGameLevel3Button.style.visibility = "hidden";
            });
            startGameLevel3Button.addEventListener('touchend', () => {
            });
        }

        // static
        /*
        let joystickManager : nipplejs.JoystickManager = nipplejs.create({
            zone: document.getElementById('joystickContainerStatic')!,
            mode: 'static',
            position: { left: '20%', bottom: '20%' },
            color: 'blue',
            restOpacity: 0.75
        });
        */

        // dynamic
        let joystickManager : nipplejs.JoystickManager = nipplejs.create({
            zone: document.getElementById('joystickContainerDynamic')!,
            mode: 'dynamic',
            position: { left: '50%', top: '50%' },
            color: 'blue',
            restOpacity: 0.75
        });


        // listener to be triggered when the joystick moves
        joystickManager.on('move',  (data : nipplejs.EventData, output : nipplejs.JoystickOutputData) => {
             
            
            /*
            // get the force and don't let it be greater than 1
            let force : number = Math.min(output.force, 1);
 
            // get the angle, in radians
            let angle : number = output.angle.radian;
 
            // determine the speed, according to force and player speed
            let speed : number = GameOptions.playerSpeed * force;
 
            // set player velocity using trigonometry
            this.player.setVelocity(speed * Math.cos(angle), speed * Math.sin(angle) * -1);
            */
           this.gameScene?.player1.tryTurn(-output.vector.x);
           
            if(output.vector.y > 0.25)
                this.gameScene?.player1.tryAccelerate(output.vector.y);
            else if (output.vector.y < -0.25)
                this.gameScene?.player1.tryReverse(output.vector.y);
            else {
                this.gameScene?.player1.tryStopAccelerate();           
            }
        });
 
        // listener to be triggered when the joystick stops moving
        joystickManager.on('end',  () => {
 
            // stop the player
            //this.player.setVelocity(0, 0);
            this.gameScene?.player1.tryStopAccelerate();       
            this.gameScene?.player1.tryStopReverse();
        })
    }

    public pollGamepadsForMenu() {
        const gamepad = navigator.getGamepads()[0];
        if(!gamepad) return;

        if(!(this.currentScene instanceof MenuScene))
            return;
    
        gamepad.buttons.map(e => e.pressed).forEach((isPressed, buttonIndex) => {
                if(isPressed) {                

                    if(buttonIndex == GamepadEnums.LEFT_SHOULDER && !this.gamepadPrevious.buttons[GamepadEnums.LEFT_SHOULDER].pressed) {
                        console.log(`pressed: ${buttonIndex}`);                    
                        this.menuScene?.selectPreviousVehicle();
                    }               
                    if(buttonIndex == GamepadEnums.RIGHT_SHOULDER && !this.gamepadPrevious.buttons[GamepadEnums.RIGHT_SHOULDER].pressed) {
                        console.log(`pressed: ${buttonIndex}`);                    
                        this.menuScene?.selectNextVehicle();
                    }         
                    if(buttonIndex == GamepadEnums.PAD_LEFT && !this.gamepadPrevious.buttons[GamepadEnums.PAD_LEFT].pressed) {
                        console.log(`pressed: ${buttonIndex}`);                    
                        this.menuScene?.selectPreviousVehicle();
                    }               
                    if(buttonIndex == GamepadEnums.PAD_RIGHT && !this.gamepadPrevious.buttons[GamepadEnums.PAD_RIGHT].pressed) {
                        console.log(`pressed: ${buttonIndex}`);                    
                        this.menuScene?.selectNextVehicle();
                    }               
                    if(buttonIndex == GamepadEnums.FACE_1 && !this.gamepadPrevious.buttons[GamepadEnums.FACE_1].pressed) {
                        console.log(`pressed: ${buttonIndex}`);                    
                        this.switchToGameScene(this.menuScene!.getSelectedVehicleType() ?? VehicleType.Killdozer, "arena");
                    }     
                }              
        });
        this.gamepadPrevious = gamepad;
    }

    pollGamepadsForGameScene() {

        if(!(this.currentScene instanceof GameScene))
            return;

        /*
        gamepad.BUTTONS = {
            FACE_1: 0, // Face (main) buttons
            FACE_2: 1,
            FACE_3: 2,
            FACE_4: 3,
            LEFT_SHOULDER: 4, // Top shoulder buttons
            RIGHT_SHOULDER: 5,
            LEFT_SHOULDER_BOTTOM: 6, // Bottom shoulder buttons
            RIGHT_SHOULDER_BOTTOM: 7,
            SELECT: 8,
            START: 9,
            LEFT_ANALOGUE_STICK: 10, // Analogue sticks (if depressible)
            RIGHT_ANALOGUE_STICK: 11,
            PAD_TOP: 12, // Directional (discrete) pad
            PAD_BOTTOM: 13,
            PAD_LEFT: 14,
            PAD_RIGHT: 15
        };
        
        gamepad.AXES = {
            LEFT_ANALOGUE_HOR: 0,
            LEFT_ANALOGUE_VERT: 1,
            RIGHT_ANALOGUE_HOR: 2,
            RIGHT_ANALOGUE_VERT: 3
        };
        */

        /*
        if(this.gamepad?.buttons[0].pressed)
            console.log('A pressed');
        if(this.gamepad?.buttons[1].pressed)
            console.log('B pressed');
        */  
        const gamepad = navigator.getGamepads()[0];
        if(!gamepad) return;

        
        if(this.gameScene?.isPaused) {
            // Deadzone to avoid drift
            const deadZone = 0.15;

            let camera = this.gameScene!.debugCamera!;

            // Left stick for movement (axes 0 and 1)
            const leftStickX = Math.abs(gamepad.axes[0]) > deadZone ? gamepad.axes[0] : 0;
            const leftStickY = Math.abs(gamepad.axes[1]) > deadZone ? gamepad.axes[1] : 0;

            // Right stick for look (axes 2 and 3)
            const rightStickX = Math.abs(gamepad.axes[2]) > deadZone ? gamepad.axes[2] : 0;
            const rightStickY = Math.abs(gamepad.axes[3]) > deadZone ? gamepad.axes[3] : 0;

            // Move the OrbitControls (pan the target)
            //const panSpeed = 1;
            //camera.target.x -= rightStickX * panSpeed;
            //camera.target.y += rightStickY * panSpeed;
        
            // Rotate the OrbitControls (adjust orbit around target)
            //const rotateSpeed = 0.03;
            //this.gameScene!.debugOrbitControls!.rotateLeft(rightStickX * rotateSpeed);
            //this.gameScene!.debugOrbitControls!.rotateUp(rightStickY * rotateSpeed);

            // only works with perspective camera:                
            // Camera movement in look direction (forward/backward)
            const moveSpeed = 5;
            const forwardVector = new THREE.Vector3();
            camera.getWorldDirection(forwardVector);

            // Move forward/backward based on left stick Y-axis
            camera.position.addScaledVector(forwardVector, -leftStickY * moveSpeed);

            // Strafe based on left stick X-axis (optional: add this if strafing is needed)
            const strafeVector = new THREE.Vector3();
            camera.getWorldDirection(strafeVector);
            strafeVector.crossVectors(camera.up, forwardVector); // Strafe perpendicular to look direction
            camera.position.addScaledVector(strafeVector, leftStickX * moveSpeed);

            // Camera tilt (right stick X/Y for pitch and yaw)
            const tiltSpeed = 0.02;
            camera.rotation.y -= rightStickX * tiltSpeed; // Yaw (left/right)
            camera.rotation.x -= rightStickY * tiltSpeed; // Pitch (up/down)

            // Limit the pitch to avoid flipping the camera
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
        /*
        if(gamepad.buttons[this.brakeOrReverseGamepadIndex].pressed) {
            this.gameScene?.player1.tryTightTurn(-gamepad.axes[0]);
        }
        else 
        */
       
        this.gameScene?.player1?.tryTurn(-gamepad.axes[0]);
        
        // https://gabrielromualdo.com/articles/2020-12-15-how-to-use-the-html5-gamepad-api       
        
        var leftShoulderJustPressed = false;
        var rightShoulderJustPressed = false;

        this.processTurboPresses(gamepad.buttons[this.accelerateGamepadIndex], this.gamepadPrevious.buttons[this.accelerateGamepadIndex]);

        gamepad.buttons.map(e => e.pressed).forEach((isPressed, buttonIndex) => {

            if(!this.gameScene || !this.gameScene?.player1) return;

            if(isPressed && buttonIndex == GamepadEnums.START && !this.gamepadPrevious.buttons[GamepadEnums.START].pressed) {
                this.tryTogglePauseMenu();
            }

            if(!this.gameScene.isPaused) {
                if(isPressed) {                
                    if(buttonIndex == this.accelerateGamepadIndex) {
                        //console.log(`pressed: ${buttonIndex}`);
                        this.gameScene?.player1.tryAccelerate(1.0);
                    }
                    if(buttonIndex == this.brakeOrReverseGamepadIndex) {
                        console.log(`pressed: ${buttonIndex}`);
                        this.gameScene?.player1.tryReverse(1.0);
                    }
                    if(buttonIndex == this.firePrimaryWeaponGamepadIndex) { // && !this.gamepadPrevious.buttons[this.firePrimaryWeaponGamepadIndex].pressed) {
                        console.log(`pressed: ${buttonIndex}`);
                        this.gameScene.player1.tryFireBullets();
                    }
                    if(buttonIndex == this.fireSecondaryWeaponGamepadIndex) { // && !this.gamepadPrevious.buttons[this.fireSecondaryWeaponGamepadIndex].pressed) {
                        console.log(`pressed: ${buttonIndex}`);

                        this.gameScene.player1.tryFireRocket();
                    }
                    if(buttonIndex == this.fireFlameThrowerGamepadIndex) {
                        console.log(`pressed: ${buttonIndex}`);
                        this.gameScene?.player1.tryFireSpecialWeapon();
                    }

                    if(buttonIndex == GamepadEnums.FACE_4) {
                        console.log(`pressed: ${buttonIndex}`);
                        //this.gameScene?.player2.tryFireFlamethrower();
                        this.gameScene?.player1.tryFireAirStrike();
                    }

                    if(buttonIndex == GamepadEnums.SELECT && !this.gamepadPrevious.buttons[GamepadEnums.SELECT].pressed) {
                        console.log(`pressed: ${buttonIndex}`);
                        this.gameScene.player1.tryResetPosition();
                    }
                    
                    if(buttonIndex == this.jumpGamepadIndex && !this.gamepadPrevious.buttons[this.jumpGamepadIndex].pressed) {
                        console.log(`pressed: ${buttonIndex}`);
                        rightShoulderJustPressed = true;                    
                        this.gameScene.player1.tryJump();
                    }

                    if(buttonIndex == GamepadEnums.LEFT_SHOULDER && !this.gamepadPrevious.buttons[GamepadEnums.LEFT_SHOULDER].pressed) {
                        console.log(`pressed: ${buttonIndex}`);                    
                        leftShoulderJustPressed = true;
                        this.gameScene.player1.trySelectNextWeapon();
                    }               
                }
                else {
                    if(this.gamepadPrevious.buttons[this.accelerateGamepadIndex].pressed
                        && buttonIndex == this.accelerateGamepadIndex) {
                            console.log(`button no longer pressed: ${buttonIndex}`);
                            this.gameScene?.player1.tryStopAccelerate();
                    }
                    if(this.gamepadPrevious.buttons[this.brakeOrReverseGamepadIndex].pressed
                        && buttonIndex == this.brakeOrReverseGamepadIndex) {
                            console.log(`button no longer pressed: ${buttonIndex}`);
                            this.gameScene?.player1.tryStopReverse();
                    }
                    if(this.gamepadPrevious.buttons[GamepadEnums.LEFT_SHOULDER].pressed
                        && buttonIndex == GamepadEnums.LEFT_SHOULDER) {
                            console.log(`button no longer pressed: ${buttonIndex}`);
                            this.gameScene?.player1.tryStopTurbo();
                    }
                    // stopped firing flamethrower
                    if(this.gamepadPrevious.buttons[this.fireFlameThrowerGamepadIndex].pressed
                        && buttonIndex == this.fireFlameThrowerGamepadIndex) {

                            this.gameScene?.player1.tryStopFireFlamethrower();
                    }                    
                }
            }
        })

        if(leftShoulderJustPressed && rightShoulderJustPressed) {
            // TODO: experiment with LB+RB = jumping
            // this.gameScene?.player1.tryJump();
        }            

        this.gamepadPrevious = gamepad;
    }

    init(menuScene: MenuScene, gameScene: GameScene, hudScene: HudScene) {
        this.menuScene = menuScene;
        this.gameScene = gameScene;
        this.hudScene = hudScene;
    }

    getCurrentScene(scene: Scene) {
        return this.currentScene;
    }

    setCurrentScene(scene: Scene) {
        this.currentScene = scene;
    }

    switchToMenuScene() {
        this.currentScene = this.menuScene;
        document.getElementById('menuSceneDiv')!.style.visibility = 'visible';
        document.getElementById('gameSceneDiv')!.style.visibility = 'hidden';
    }

    async switchToGameScene(player1VehicleType: VehicleType, levelName: string) {

                
        let worldConfig: any;

        switch(levelName) {
            case "field":
                worldConfig = this.fieldLevelConfig;
                break;
            case "arena":
                worldConfig = this.arenaLevelConfig;
                break;
            case "mountain":
            default:
                worldConfig = this.mountainLevelConfig;
                break;
        }

        this.gameScene?.preloadMapData(<WorldConfig>worldConfig);
        this.gameScene?.preloadSkybox(<WorldConfig>worldConfig);
                
        this.currentScene = this.gameScene;
        document.getElementById('menuSceneDiv')!.style.visibility = 'hidden';
        document.getElementById('gameSceneDiv')!.style.visibility = 'visible';
        await this.gameScene?.initialize(player1VehicleType).then(x => {

            const worldConfigFolder = this.gui.addFolder( 'Level Config' );
            worldConfigFolder.add(worldConfig, 'name');
            worldConfigFolder.add(worldConfig, 'heightMap');
            worldConfigFolder.add(worldConfig, 'texture1');
            worldConfigFolder.add(worldConfig, 'texture2');
            worldConfigFolder.add(worldConfig, 'texture3');
            worldConfigFolder.add(worldConfig, 'texture4');
            worldConfigFolder.add(worldConfig, 'texture5');
            
            worldConfigFolder.add(worldConfig, 'skyTexture');

            worldConfigFolder.add(this.gameScene!.water.position, 'y', 0, 20, 0.25)
                .name('Water Level (y)')
                .listen();
            
            worldConfigFolder.add(worldConfig, 'grassBillboard');
            worldConfigFolder.add(worldConfig, 'grassBillboardStartY');
            worldConfigFolder.add(worldConfig, 'grassBillboardEndY');
    
            //worldConfigFolder.addColor(this.gameScene?.fog!, 'color')
                //.name('Scene Fog Color')
                //.listen();
            
            worldConfigFolder.addColor(worldConfig, 'fogColor')
                .name('Scene Fog Color')
                .listen();

            let fog: any = this.gameScene?.fog;

            worldConfigFolder.add(fog, 'near', 0, 25, 5)
                .name('Scene Fog Near')
                .listen();

            worldConfigFolder.add(fog, 'far', 25, 500, 25)
                .name('Scene Fog Far')
                .listen();

            if(this.gameScene?.precipitationSystem != null) {
            const weatherFolder = this.gui.addFolder( 'Weather Config' );
            weatherFolder.add(worldConfig, 'precipitationType', { None: 0, Rain: 1, Snow: 2 })
                .listen();
                weatherFolder.add(this.gameScene?.precipitationSystem!, 'velocityY', 0, 2, 0.1 )
                .name('Precipitation Velocity')    
                .listen();

            }
            const cpuFolder = this.gui.addFolder( 'CPU Player Config' );
            cpuFolder.add(this.gameScene!, 'cpuPlayerBehavior', { Follow: 0, FollowAndAttack: 1, Stop: 2, StopAndAttack: 3, Flee: 4, Patrol: 5})
                .listen();

            const playerFolder = this.gui.addFolder('Player 1 Config')
            // wheels
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'frictionSlip', 0, 10, 0.1).listen();
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'frictionSlipRear', 0, 10, 0.1).listen();
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'driftingFrictionSlipFront', 0, 10, 0.1).listen();
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'driftingFrictionSlipRear', 0, 10, 0.1).listen();

            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'rollInfluence', 0, 1, 0.01).listen();
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'customSlidingRotationalSpeed', -90, 0, 5).listen();

            // wheel turn amount
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'maxSteerVal', 0, Math.PI, Math.PI / 16).listen();
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'driftingMaxSteerVal', 0, Math.PI, Math.PI / 16).listen();

            // engine / drive system
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'lowSpeedForce', 0, 10000, 100).listen();
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'highSpeedForce', 0, 10000, 100).listen();
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'topSpeedForHigherTorque', 0, 60, 5).listen();
            playerFolder.add(this.gameScene!.player1.getVehicleObject().vehicleOverrideConfig, 'driveSystem', {AllWheelDrive: 0, FrontWheelDrive: 1, RearWheelDrive: 2}).listen();
        });

        // todo: fix behavior because of async
        var player1MaxHealth = this.gameScene?.player1?.maxHealth ?? 100;
        this.hudScene?.initialize(player1MaxHealth);
    
        // TODO: get folder by name to add items like CpuPlayerBehavior later
    }

    tryTogglePauseMenu() {
        if(this.currentScene instanceof GameScene ) {
            this.gameScene?.togglePauseGame();
            
            if(this.gameScene?.isPaused) {
                this.gamePausedDivElement.style.visibility = "visible";
                this.inGameOnScreenControlsDiv.style.visibility = "hidden";
            }
            else {
                this.gamePausedDivElement.style.visibility = "hidden";
                this.inGameOnScreenControlsDiv.style.visibility = "visible";
            }
        }
    }

    updateHealthOnHud(currentValue: number) {
        this.hudScene?.updateHealthBar(currentValue);
    }

    updateShieldOnHud(currentValue: number) {
        this.hudScene?.updateShieldBar(currentValue);
    }

    updateTurboOnHud(currentValue: number) {
        this.hudScene?.updateTurboBar(currentValue);
    }

    selectPreviousWeaponOnHud() {
        this.hudScene?.selectPreviousWeapon();
    }

    selectNextWeaponOnHud() {
        this.hudScene?.selectNextWeapon();
    }

    getWebGLRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }

    processTurboPresses(button: GamepadButton, previousButtonState: GamepadButton) {
        const currentTime = performance.now();
        if (button.pressed) {
    
            if(!previousButtonState.pressed) {
                if (this.turboTapCount === 0 || currentTime - this.turboLastPressTime > SceneController.DOUBLE_TAP_THRESHOLD) {
                    this.turboTapCount = 1;
                    this.turboLastPressTime = currentTime;
                    return;
                }    
                if (this.turboTapCount === 1 && currentTime - this.turboLastPressTime < SceneController.DOUBLE_TAP_THRESHOLD) {
                    this.turboTapCount++;
                    this.turboLastPressTime = currentTime;
                    console.log('Double tap detected');
                    setTimeout(() => {
                        if (button.pressed) {
                            console.log('Double tap and hold detected');
                        }
                    }, SceneController.HOLD_THRESHOLD);
                    return;
                }
            }
                
            if (this.turboTapCount === 2) {
                this.gameScene?.player1.tryTurbo();
            }
            
        } else if (!button.pressed && previousButtonState.pressed) {
            
            if(currentTime - this.turboLastPressTime > SceneController.DOUBLE_TAP_THRESHOLD) {
                console.log('Hold released');
                this.gameScene?.player1.tryStopTurbo();
                this.turboTapCount = 0;
            }        
        }
    }

    public update(gameConfig: GameConfig,
        renderer: THREE.WebGLRenderer,
        cannonDebugger: any,
        menuCamera: THREE.PerspectiveCamera,
        mainCamera: THREE.PerspectiveCamera,
        cameraOrtho: THREE.OrthographicCamera,
        debugOrbitCamera: THREE.PerspectiveCamera,
        debugOrbitControls: OrbitControls) {
        
        var scene = this.currentScene;
        if(scene instanceof GameScene && !scene.isPaused) {     
            this.updateGameScene(false);
            this.updateHudScene();
      
            if(gameConfig.isDebug && cannonDebugger != null)
              cannonDebugger.update();
      
            renderer.clear();
            renderer.render(scene, mainCamera);
            renderer.clearDepth();
            
            if(this.hudScene)
                renderer.render(this.hudScene, cameraOrtho);
        }
        else if(scene instanceof GameScene && scene.isPaused){
            debugOrbitControls.update();
            this.updateGameScene(true);
      
            renderer.render(scene, debugOrbitCamera);
        }
        else if(scene instanceof MenuScene) {
          scene.update();    
          renderer.render(scene, menuCamera);
        }
    }

    private updateGameScene(isPaused: boolean) {
        if(!isPaused) {
            this.gameScene?.updateWater();
            this.gameScene?.updatePrecipitation();

            this.gameScene?.preUpdate();
            this.gameScene?.processInput(this.keyDown);
            this.gameScene?.update();
                        
            this.gameScene?.updateLODTerrain();
            this.gameScene?.updateQuadtreeTerrain5();            
        }
        else {
            this.gameScene?.updateInputForDebug(this.keyDown);
            this.gameScene?.updateDebugDivElements();
            
            this.gameScene?.updateLODTerrain();
            this.gameScene?.updateQuadtreeTerrain5();
        }
        this.gameScene?.stats.update();

        if(this.gameScene && this.gameScene.fog)
            this.gameScene.fog.color = new THREE.Color(this.gameScene?.worldConfig.fogColor);
    }

    private updateHudScene() {
        this.hudScene?.update();
    }
}