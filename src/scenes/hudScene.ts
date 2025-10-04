import * as THREE from 'three';
import HudHealthBar, { HudBarType } from '../gameobjects/hudHealthBar';
import SceneController from './sceneController';
import { HudDivElementManager } from './hudDivElementManager';
import {Text} from 'troika-three-text'
import MeshHealthBar from '../gameobjects/meshHealthBar';

export enum HudIconLocation {
    UpperLeft,
    UpperRight,
    Center,
    CenterBottom,
    LowerLeft,
    LowerRight,
}

export default class HudScene extends THREE.Scene {
    private healthBar?: HudHealthBar;
    private turboBar?: HudHealthBar;
    private shieldBar?: HudHealthBar;

    private ammoText!: Text;
    private spriteCenterBottom!: THREE.Sprite;

    private meshHealthBars: MeshHealthBar[] = [];

    private player1Id!: string;

    weaponInventory: THREE.Texture[] = [];
    selectedWeaponIndex: number = 0;
    
    hudDivElementManager!: HudDivElementManager;

    constructor(private camera: THREE.OrthographicCamera, private sceneController: SceneController) {
        super();
    }

    private readonly hudWidth = window.innerWidth / 2.25;
    private readonly hudHeight = window.innerHeight / 2.25;

    async initialize(player1MaxHealth: number) {        
        /////////////////////////////////////////////

        let textureLoader = new THREE.TextureLoader();
        
        let healthIconTexture = textureLoader.load('assets/hud/DPAD.png');
        healthIconTexture.colorSpace = THREE.SRGBColorSpace;

        let shieldIconTexture = textureLoader.load('assets/hud/shield.png');
        shieldIconTexture.colorSpace = THREE.SRGBColorSpace;

        let rocketTexture = textureLoader.load('assets/hud/rocketIcon-multiple.png');
        healthIconTexture.colorSpace = THREE.SRGBColorSpace;

        let fireIconTexture = textureLoader.load('assets/hud/fire.png');
        healthIconTexture.colorSpace = THREE.SRGBColorSpace;

        let freezeIconTexture = textureLoader.load('assets/hud/freezeIcon.png');
        freezeIconTexture.colorSpace = THREE.SRGBColorSpace;
        
        let turboIconTexture = textureLoader.load('assets/hud/turboIcon.png');
        freezeIconTexture.colorSpace = THREE.SRGBColorSpace;

        let specialIconTexture = textureLoader.load('assets/hud/specialIcon.png');
        specialIconTexture.colorSpace = THREE.SRGBColorSpace;

        let shockwaveIconTexture = textureLoader.load('assets/hud/shockwaveIcon3.png');
        shockwaveIconTexture.colorSpace = THREE.SRGBColorSpace;

        let lightningIconTexture = textureLoader.load('assets/hud/shockwaveIcon2.png');
        lightningIconTexture.colorSpace = THREE.SRGBColorSpace;        

        this.weaponInventory.push(specialIconTexture);
        this.weaponInventory.push(rocketTexture);
        this.weaponInventory.push(fireIconTexture);
        this.weaponInventory.push(freezeIconTexture);
        this.weaponInventory.push(shockwaveIconTexture);
        this.weaponInventory.push(lightningIconTexture);

        this.healthBar = new HudHealthBar(this, HudBarType.TopCenterMain,
            this.hudWidth, this.hudHeight,
            200,
            40,
            player1MaxHealth,
            healthIconTexture);

        this.turboBar = new HudHealthBar(this, HudBarType.TopCenterSecondary,
            this.hudWidth, this.hudHeight,
            200,
            20,
            100,
            turboIconTexture,
            new THREE.Color('yellow'),
            );
        
        this.shieldBar = new HudHealthBar(this, HudBarType.LowerLeftMain,
            this.hudWidth, this.hudHeight,
            200,
            20,
            100,
            shieldIconTexture,
            new THREE.Color('blue'));


        //this.meshHealthBars[0].updateHealthBarPosition(this.camera, new THREE.Vector3(10, 10, 10), this.);

        this.ammoText = this.generateTroikaThreeText(new THREE.Vector3(0,0,-5), "Ammo", 10, 'middle', 'middle', 0xFFFFFF);
        //this.add(this.statBar1Text);


        let material = new THREE.SpriteMaterial( { map: healthIconTexture });//,transparent: true, opacity: 0.5 } );

        //const spriteWidth = material.map?.image.width;
        //const spriteHeight = material.map?.image.height;

        //let spriteCenter = this.generateIcon(freezeIconTexture, new THREE.Color('white'), HudIconLocation.Center);
        this.spriteCenterBottom = this.generateIcon(this.weaponInventory[this.selectedWeaponIndex], new THREE.Color('white'), HudIconLocation.CenterBottom);
        //let spriteTL = this.generateIcon(rocketTexture, new THREE.Color('white'), HudIconLocation.UpperLeft);    
        //let spriteTR = this.generateIcon(fireIconTexture, new THREE.Color('white'), HudIconLocation.UpperRight);
        //let spriteLL = this.generateIcon(healthIconTexture, new THREE.Color('white'), HudIconLocation.LowerLeft);
        //let spriteLR = this.generateIcon(turboIconTexture, new THREE.Color('white'), HudIconLocation.LowerRight);    

        this.hudDivElementManager = new HudDivElementManager(window.innerWidth * 0.9, window.innerHeight * 0.25, 0, 20);

        this.hudDivElementManager.addElement("Special", "");        
        this.hudDivElementManager.addElement("Rockets", "");        
        this.hudDivElementManager.addElement("Flamethrower", "");        
        this.hudDivElementManager.addElement("Airstrike", "");        
        this.hudDivElementManager.addElement("Shockwave", "");        
        this.hudDivElementManager.addElement("Freeze", "");        
        this.hudDivElementManager.addElement("Lightning", "");        

        this.hudDivElementManager.hideAllElements();
    }
    async initializeMeshHealthBars(player1Id: string, player1MaxHealth: number,
        player2Id: string, player2MaxHealth: number,
        player3Id: string, player3MaxHealth: number,
        player4Id: string, player4MaxHealth: number
    ) {

        this.player1Id = player1Id;
        this.meshHealthBars.push(new MeshHealthBar(this, player1Id, player1MaxHealth));//, new THREE.Color('red')));
        this.meshHealthBars.push(new MeshHealthBar(this, player2Id, player2MaxHealth));//, new THREE.Color('blue')));
        this.meshHealthBars.push(new MeshHealthBar(this, player3Id, player3MaxHealth));//, new THREE.Color('green')));
        this.meshHealthBars.push(new MeshHealthBar(this, player4Id, player4MaxHealth));//,new THREE.Color('yellow')));
    }

    generateIcon(texture: THREE.Texture, color: THREE.Color, location: HudIconLocation): THREE.Sprite {

        let spriteWidth: number = 64;
        let spriteHeight: number = 64;
        let spritePosition: THREE.Vector2;
        
        let material = new THREE.SpriteMaterial( { map: texture, color: color });//,transparent: true, opacity: 0.5 } );
        let sprite = new THREE.Sprite( material );
        switch(location) {
            case HudIconLocation.Center:                
                sprite.center.set( 0.5, 0.5 );
                sprite.scale.set( spriteWidth, spriteWidth, 1 );
                this.add(sprite);
                sprite.position.set(0, 0, 0);
                break;
            case HudIconLocation.CenterBottom:                
                sprite.center.set( 0.5, 0.5 );
                sprite.scale.set( spriteWidth, spriteWidth, 1 );
                this.add(sprite);
                sprite.position.set(0, -this.hudHeight, 0);
                break;
            case HudIconLocation.UpperLeft:
                sprite.center.set( 0.5, 0.5 );
                sprite.scale.set( spriteWidth, spriteWidth, 1 );
                this.add(sprite);
                sprite.position.set(-this.hudWidth, this.hudHeight, 0);               
                break;
            case HudIconLocation.UpperRight:
                sprite.center.set( 0.5, 0.5 );
                sprite.scale.set( spriteWidth, spriteWidth, 1 );
                this.add(sprite);
                sprite.position.set(this.hudWidth, this.hudHeight, 0);
                break;
            case HudIconLocation.LowerLeft:
                sprite.center.set( 0.5, 0.5 );
                sprite.scale.set( spriteWidth, spriteWidth, 1 );
                this.add( sprite);
                sprite.position.set(-this.hudWidth, -this.hudHeight, 0);                
                break;
            case HudIconLocation.LowerRight:
                sprite.center.set( 0.5, 0.5 );
                sprite.scale.set( spriteWidth, spriteWidth, 1 );
                this.add(sprite);
                sprite.position.set(this.hudWidth, -this.hudHeight, 0);
                break;
        }

        return sprite;
    }

    generateTroikaThreeText(position: THREE.Vector3, title: string, fontSize: number, anchorX: string, anchorY: string, colorNumber: number): Text {
        const text = new Text();
        this.add(text);

        text.text = title;
        text.fontSize = fontSize;
        text.position.set(position.x, position.y, position.z);
        text.color = colorNumber;
        text.anchorX = anchorX;
        text.anchorY = anchorY;
        text.scale.set(1000, 1000, 1);
        text.sync();

        return text;
    }

    updateMeshHealthBar(playerId: string, currentHealth: number, distanceFromCamera: number) {
        let healthBar = this.meshHealthBars.find(x => x.playerId == playerId);
        if(healthBar != null) {
            healthBar.updateValue(currentHealth);
            healthBar?.setVisible(currentHealth > 0 && distanceFromCamera < 25 && playerId != this.player1Id);
        }            
    }

    update(positions: THREE.Vector3[], gameCamera: THREE.Camera) {

        if(this.hudDivElementManager != null) {
            this.hudDivElementManager.updateElementText("Special", `Special: 5`);
            this.hudDivElementManager.updateElementText("Rockets", `Rockets: 5`);
            this.hudDivElementManager.updateElementText("Flamethrower", `Flamethrower: 5`);
            this.hudDivElementManager.updateElementText("Airstrike", `Airstrike: 5`);
            this.hudDivElementManager.updateElementText("Shockwave", `Shockwave: 5`);
            this.hudDivElementManager.updateElementText("Freeze", `Freeze: 5`);
            this.hudDivElementManager.updateElementText("Lightning", `Lightning: 5`);
        }
        
        if(this.ammoText != null) {
            //this.statBar1Text.quaternion.copy(this.camera.quaternion);
            //this.statBar1Text.rotation.y += 0.01;
        }       

        if(this.meshHealthBars.length > 0) {
            this.meshHealthBars[0].updateHealthBarPosition(this.camera, positions[0], gameCamera);
            this.meshHealthBars[1].updateHealthBarPosition(this.camera, positions[1], gameCamera);
            this.meshHealthBars[2].updateHealthBarPosition(this.camera, positions[2], gameCamera);
            this.meshHealthBars[3].updateHealthBarPosition(this.camera, positions[3], gameCamera);
        }
    }

    updateHealthBar(currentValue: number) {
        this.healthBar?.updateValue(currentValue);
    }

    updateShieldBar(currentValue: number) {
        this.shieldBar?.updateValue(currentValue);
    }

    updateTurboBar(currentValue: number) {
        this.turboBar?.updateValue(currentValue);
    }

    selectPreviousWeapon() {
        this.selectedWeaponIndex--;
        if(this.selectedWeaponIndex < 0)
            this.selectedWeaponIndex = this.weaponInventory.length - 1;
    }

    selectNextWeapon() {
        this.selectedWeaponIndex++;
        if(this.selectedWeaponIndex >= this.weaponInventory.length)
            this.selectedWeaponIndex = 0;

        if(this.spriteCenterBottom != null)
            this.spriteCenterBottom.material.map = this.weaponInventory[this.selectedWeaponIndex];
    }

    updateWeaponAmmo() {

    }
}
