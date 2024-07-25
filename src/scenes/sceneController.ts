
import GameScene from "./gameScene";
import HudScene from "./hudScene";
import { GamepadControlScheme, GamepadEnums } from "./gamePadEnums";
import { ProjectileType } from "../gameobjects/weapons/projectileType";
import nipplejs from 'nipplejs';

export default class SceneController {
    gameScene?: GameScene;
    hudScene?: HudScene;

    gamepad!: Gamepad;
    gamepadPrevious!: Gamepad;
    gamepadControlScheme!: GamepadControlScheme;

    renderer: THREE.WebGLRenderer;

    constructor(renderer: THREE.WebGLRenderer) {
        this.renderer = renderer;
    }


    accelerateGamepadIndex!: number;
    brakeOrReverseGamepadIndex!: number;
    firePrimaryWeaponGamepadIndex!: number;
    fireSecondaryWeaponGamepadIndex!: number;
    fireFlameThrowerGamepadIndex!: number;

    setGamePad1(gamepad: Gamepad, gamepadControlScheme: GamepadControlScheme) {
        this.gamepad = gamepad;
        this.gamepadPrevious = gamepad;

        this.gamepadControlScheme = gamepadControlScheme;

        console.log('gamepad1 assigned');

        if(gamepadControlScheme == GamepadControlScheme.Racing) {
            this.accelerateGamepadIndex = GamepadEnums.RIGHT_SHOULDER_BOTTOM;
            this.brakeOrReverseGamepadIndex = GamepadEnums.LEFT_SHOULDER_BOTTOM;
            this.firePrimaryWeaponGamepadIndex = GamepadEnums.FACE_2;
            this.fireSecondaryWeaponGamepadIndex = GamepadEnums.FACE_1;
            this.fireFlameThrowerGamepadIndex = GamepadEnums.FACE_3;
        }
        else {
            this.accelerateGamepadIndex = GamepadEnums.FACE_3;
            this.brakeOrReverseGamepadIndex = GamepadEnums.FACE_1
            this.firePrimaryWeaponGamepadIndex = GamepadEnums.RIGHT_SHOULDER_BOTTOM;
            this.fireSecondaryWeaponGamepadIndex = GamepadEnums.LEFT_SHOULDER_BOTTOM;
            this.fireFlameThrowerGamepadIndex = GamepadEnums.FACE_2;
        }
    }

    setTouchScreenControls() {
        const leftButton = document.getElementById('left');
        const rightButton = document.getElementById('right');
        const upButton = document.getElementById('up');
        const downButton = document.getElementById('down');

        const primaryWeaponButton = document.getElementById('primaryweapon');
        const secondaryWeaponButton = document.getElementById('secondaryweapon');
        const specialWeaponButton = document.getElementById('specialweapon');
        const jumpButton = document.getElementById('jump');

        const toggleDebugButton = document.getElementById('toggledebug');

        if(leftButton != null) {

            leftButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryTurnLeftWithKeyboard();
            });
            leftButton.addEventListener('touchend', () => {
                this.gameScene?.player1.tryStopTurnLeftWithKeyboard();
            });
        }

        if(rightButton != null) {
            rightButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryTurnRightWithKeyboard();
            });
            rightButton.addEventListener('touchend', () => {
                this.gameScene?.player1.tryStopTurnRightWithKeyboard();
            });
        }

        if(upButton != null) {
            upButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryAccelerateWithKeyboard();
            });
            upButton.addEventListener('touchend', () => {
                this.gameScene?.player1.tryStopAccelerateWithKeyboard();
            });
        }

        if(downButton != null) {
            downButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryReverseWithKeyboard();
            });
            downButton.addEventListener('touchend', () => {
                this.gameScene?.player1.tryStopReverseWithKeyboard();
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
                //
            });
        }


        if(jumpButton != null) {
            jumpButton.addEventListener('touchstart', () => {
                this.gameScene?.player1.tryJump();
            });
            jumpButton.addEventListener('touchend', () => {
                //
            });
        }


        if(toggleDebugButton != null) {
            toggleDebugButton.addEventListener('touchstart', () => {
                this.gameScene?.debugDivElementManager.hideAllElements();
            });
            toggleDebugButton.addEventListener('touchend', () => {
                //
            });
        }

        // static
        let joystickManager : nipplejs.JoystickManager = nipplejs.create({
            zone: document.getElementById('joystickContainerStatic')!,
            mode: 'static',
            position: { left: '20%', bottom: '20%' },
            color: 'blue',
            restOpacity: 0.75
        });

        /*
        // dynamic
        let joystickManager : nipplejs.JoystickManager = nipplejs.create({
            //zone: document.getElementById('joystickContainerDynamic')!,
            mode: 'dynamic',
            position: { left: '50%', top: '50%' },
            color: 'blue',
            restOpacity: 0.75
        });
        */

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
                this.gameScene?.player1.tryAccelerateWithJoystick(output.vector.y);
            else if (output.vector.y < -0.25)
                this.gameScene?.player1.tryReverseWithJoystick(output.vector.y);
            else {
                this.gameScene?.player1.tryStopAccelerateWithKeyboard();           
            }
        });
 
        // listener to be triggered when the joystick stops moving
        joystickManager.on('end',  () => {
 
            // stop the player
            //this.player.setVelocity(0, 0);
            this.gameScene?.player1.tryStopAccelerateWithKeyboard();       
            this.gameScene?.player1.tryStopReverseWithKeyboard();
        })
    }

    pollGamepads() {

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

        
        /*
        if(gamepad.buttons[this.brakeOrReverseGamepadIndex].pressed) {
            this.gameScene?.player1.tryTightTurn(-gamepad.axes[0]);
        }
        else 
        */
        this.gameScene?.player1.tryTurn(-gamepad.axes[0]);

        /*
        if(gamepad.axes[0] < -0.25) {
            this.gameScene?.player1.tryTurnLeftWithKeyboard();
        }
        else if(gamepad.axes[0] > 0.25) {
            this.gameScene?.player1.tryTurnRightWithKeyboard();
        }
        else {
            this.gameScene?.player1.tryStopTurnLeftWithKeyboard()
        }
        */
		//console.log(`Left stick at (${myGamepad.axes[0]}, ${myGamepad.axes[1]})` );
		//console.log(`Right stick at (${myGamepad.axes[2]}, ${myGamepad.axes[3]})` );

        // https://gabrielromualdo.com/articles/2020-12-15-how-to-use-the-html5-gamepad-api        

        gamepad.buttons.map(e => e.pressed).forEach((isPressed, buttonIndex) => {

            if(!this.gameScene) return;

            if(isPressed) {                
                if(buttonIndex == this.accelerateGamepadIndex) {
                    console.log(`pressed: ${buttonIndex}`);
                    this.gameScene?.player1.tryAccelerateWithKeyboard();
                }
                if(buttonIndex == this.brakeOrReverseGamepadIndex) {
                    console.log(`pressed: ${buttonIndex}`);
                    this.gameScene?.player1.tryReverseWithKeyboard();
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
                    this.gameScene?.player1.tryFireFlamethrower();
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
                
                if(buttonIndex == GamepadEnums.RIGHT_SHOULDER && !this.gamepadPrevious.buttons[GamepadEnums.RIGHT_SHOULDER].pressed) {
                    console.log(`pressed: ${buttonIndex}`);
                    this.gameScene.player1.tryJump();
                }

                if(buttonIndex == GamepadEnums.LEFT_SHOULDER) {
                    console.log(`pressed: ${buttonIndex}`);
                    this.gameScene.player1.tryTurbo();
                }
            }
            else {
                if(this.gamepadPrevious.buttons[this.accelerateGamepadIndex].pressed
                    && buttonIndex == this.accelerateGamepadIndex) {
                        console.log(`button no longer pressed: ${buttonIndex}`);
                        this.gameScene?.player1.tryStopAccelerateWithKeyboard();
                }
                if(this.gamepadPrevious.buttons[this.brakeOrReverseGamepadIndex].pressed
                    && buttonIndex == this.brakeOrReverseGamepadIndex) {
                        console.log(`button no longer pressed: ${buttonIndex}`);
                        this.gameScene?.player1.tryStopReverseWithKeyboard();
                }
                if(this.gamepadPrevious.buttons[GamepadEnums.LEFT_SHOULDER].pressed
                    && buttonIndex == GamepadEnums.LEFT_SHOULDER) {
                        console.log(`button no longer pressed: ${buttonIndex}`);
                        this.gameScene?.player1.tryStopTurbo();
                }
            }
        })

        this.gamepadPrevious = gamepad;
    }

    init(gameScene: GameScene, hudScene: HudScene) {
        this.gameScene = gameScene;
        this.hudScene = hudScene;
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

    getWebGLRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }
}