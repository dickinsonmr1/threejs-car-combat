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
    parentPlayer?: Player;

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
        this.positionalAudio = positionalAudio;
        if(isDebug) {
            this.helper = new PositionalAudioHelper(this.positionalAudio, 5);          
            this.helper.position.copy(position);
            //object.add(helper);

            scene.add(this.helper);          
        }
        this.parentPlayer = parentPlayer;
    }

    update() {

        if(this.parentPlayer) {
            this.positionalAudio.position.copy(this.parentPlayer.getPosition());
            if(this.helper) {
                this.helper.position.copy(this.parentPlayer.getPosition());
                this.helper.update();
            }
        }
    }
}