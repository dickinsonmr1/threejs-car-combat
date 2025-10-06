import * as THREE from 'three'
import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js';
import { Player } from '../player/player';

export class PositionalAudioParameters {
    positionalAudio?: THREE.PositionalAudio;
    listener?: THREE.AudioListener;
    buffer?: AudioBuffer;
    volume?: number;
    refDistance?: number;
    maxDistance?: number;
    loop?: boolean
}

export class PositionalAudioObject {

    positionalAudio: THREE.PositionalAudio;
    helper?: PositionalAudioHelper;
    helperLabel?: THREE.Sprite;
    
    parentPlayer?: Player;
    parentPlayerSoundIndex: number = 0;    

    constructor(scene: THREE.Scene, positionalAudio: THREE.PositionalAudio, position: THREE.Vector3, isDebug: boolean, parentPlayer?: Player) {
        /*       
        if(parameters.positionalAudio) {
            this.positionalAudio = parameters.positionalAudio;
        }
        else {
            this.positionalAudio = new THREE.PositionalAudio(parameters.listener!);
            this.positionalAudio.setBuffer(parameters.buffer!);
            this.positionalAudio.setRefDistance(parameters.refDistance!);
            this.positionalAudio.setMaxDistance(parameters.maxDistance!);
            this.positionalAudio.setLoop(parameters.loop == true);
            this.positionalAudio.setRolloffFactor(0.1);
            this.positionalAudio.setVolume(parameters.volume!);        
            this.positionalAudio.position.copy(position);
            this.positionalAudio.setDirectionalCone(360, 360, 0.1)
        }
        */

        this.parentPlayer = parentPlayer;
        if(parentPlayer) {
           this.parentPlayerSoundIndex = parentPlayer.getNextAvailableSoundEffectIndex();
        }

        this.positionalAudio = positionalAudio;
        if(isDebug) {
            this.helper = new PositionalAudioHelper(this.positionalAudio, 5);          
            this.helper.position.copy(position);
            //object.add(helper);
            scene.add(this.helper);          

            if(parentPlayer)
                this.helperLabel = this.createTextLabel(`${this.parentPlayerSoundIndex} - ${positionalAudio.name}` || 'Sound', 'white', 16);
            else
                this.helperLabel = this.createTextLabel(`${positionalAudio.name}` || 'Sound', 'white', 16);

            this.helperLabel.position.copy(this.helper.position).add(new THREE.Vector3(0, 0.5, 0));
            scene.add(this.helperLabel);
        }
        
    }

    update() {

        if(this.parentPlayer) {
            this.positionalAudio.position.copy(this.parentPlayer.getPosition());
            if(this.helper) {
                this.helper.position.copy(this.parentPlayer.getPosition());
                this.helper.update();

                this.helperLabel?.position.copy(this.parentPlayer.getPosition()).add(new THREE.Vector3(0, 0.5 + this.parentPlayerSoundIndex * 0.2, 0));
            }
        }
    }

    createTextLabel(text: string, color = 'white', fontSize = 64): THREE.Sprite {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        ctx.font = `${fontSize}px Arial`;

        // Measure the text width
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize * 1.2;

        // Resize canvas to fit text
        canvas.width = textWidth + 20;
        canvas.height = textHeight + 20;

        // Redefine font after resize (resizing clears canvas)
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text centered
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);

        // Scale to make it readable in world space
        const scale = 0.01; // Adjust this based on your scene scale
        sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);

        return sprite;
    }
}