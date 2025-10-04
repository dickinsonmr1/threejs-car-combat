import * as THREE from 'three'
import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js';

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

    constructor(parameters: PositionalAudioParameters) {
        
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
            this.positionalAudio.position.set(10, 10, 10);
            this.positionalAudio.setDirectionalCone(360, 360, 0.1)
        }
    }
}