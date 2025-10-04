import * as THREE from 'three'
import { SoundEffectConfig } from './config/soundEffectLibrary';
import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js';
import { PositionalAudioObject, PositionalAudioParameters } from './positionalAudioObject';

export class AudioManager {

    private audioListener: THREE.AudioListener
    private audioLoader: THREE.AudioLoader;
    private audioBuffers: Map<string, AudioBuffer>;

    private positionalSounds: Map<string, PositionalAudioObject> = new Map<string, PositionalAudioObject>;

    constructor(private scene: THREE.Scene, camera: THREE.Camera, private isEnabled: boolean, private isDebugEnabled: boolean) {        
        this.audioLoader = new THREE.AudioLoader();
        this.audioListener = new THREE.AudioListener();
        this.audioBuffers = new Map();

        camera.add(this.audioListener);        
    }

    public enableAudio(isEnabled: boolean) {
      this.isEnabled = isEnabled;
    }

    public getAudioLoader(): THREE.AudioLoader {
        return this.audioLoader;
    }

    public getAudioListener(): THREE.AudioListener {
        return this.audioListener;
    }    

    // loads the THREE.PositionalAudio
    public async createPositionalAudioFromJsonConfig(config: SoundEffectConfig): Promise<THREE.PositionalAudio> {

        const buffer = await this.loadAudio(config.asset!);

        const positionalAudio = new THREE.PositionalAudio(this.audioListener);
        positionalAudio.setBuffer(buffer);
        positionalAudio.setRefDistance(config.refDistance!);
        positionalAudio.setMaxDistance(config.maxDistance!);
        positionalAudio.setLoop(config.loop == true);
        positionalAudio.setRolloffFactor(0.1);
        positionalAudio.setVolume(config.volume!);        
        positionalAudio.position.set(10, 10, 10);
        positionalAudio.setDirectionalCone(360, 360, 0.1)
        //positionalAudio.play();
            
        return positionalAudio;
    }

    /*
    public async loadPositionalSoundWithParent(config: SoundEffectConfig, object: THREE.Object3D): Promise<THREE.PositionalAudio> {
        let audio = await this.createPositionalAudio(config.asset!, this.audioListener, config.volume!, config.refDistance!, config.maxDistance!, config.loop);
        audio.position.copy(object.position);
        
        if(this.isDebugEnabled) {
          const helper = new PositionalAudioHelper(audio, 5);          
          helper.position.copy(object.position);

          object.add(helper);

          this.audioHelpers.push(helper);
          this.scene.add(helper);          
        }
              
        object.add(audio);
        return audio;
    }
    */

    public setPositionalSoundPosition() {
      return null;
    }

    private async loadAudio(url: string): Promise<AudioBuffer> {
        if (this.audioBuffers.has(url)) {
          return this.audioBuffers.get(url)!;
        }
    
        return new Promise((resolve, reject) => {
          this.audioLoader.load(
            url,
            (buffer) => {
              this.audioBuffers.set(url, buffer);
              resolve(buffer);
            },
            undefined,
            reject
          );
        });
      }

    private async createPositionalAudio(asset: string, listener: THREE.AudioListener, volume: number, refDistance: number, maxDistance: number, loop?: boolean): Promise<THREE.PositionalAudio> {//} | null {

        const buffer = await this.loadAudio(asset);

        const positionalAudio = new THREE.PositionalAudio(listener);
        positionalAudio.setBuffer(buffer);
        positionalAudio.setRefDistance(refDistance);
        positionalAudio.setMaxDistance(maxDistance);
        positionalAudio.setLoop(loop == true);
        positionalAudio.setRolloffFactor(0.1);
        positionalAudio.setVolume(volume);        
        positionalAudio.position.set(10, 10, 10);
        positionalAudio.setDirectionalCone(360, 360, 0.1)
        //positionalAudio.play();
            
        return positionalAudio;
    }    

    private generatePlayerSpecificPrefix(playerIndex: number): string {
      return `player${playerIndex+1}-`;
    }
    
    private generateSoundKey(key: string, playerIndex?: number): string {
      let prefix = '';
      if(playerIndex != null)
        prefix = this.generatePlayerSpecificPrefix(playerIndex+1);

      return `${prefix}${key}`;
    }

    public addSoundObjectFromPositionalAudio(key: string, sound: THREE.PositionalAudio, position: THREE.Vector3, playerIndex?: number): void {      
      this.positionalSounds.set(
        this.generateSoundKey(key, playerIndex),
        new PositionalAudioObject(this.scene, sound, position, this.isDebugEnabled)
      );
    }

    public getSound(key: string, playerIndex?: number): THREE.PositionalAudio | null {
      let sound = this.positionalSounds.get(this.generateSoundKey(key, playerIndex))?.positionalAudio;
      return sound ?? null;
    }

    public playLoopedSound(key: string, playerIndex?: number) {
      if(this.isEnabled) {
        const sound = this.positionalSounds.get(this.generateSoundKey(key, playerIndex))?.positionalAudio;
        if(sound && !sound.isPlaying)
            sound.play();
      }
    }

    public playSound(key: string, detune: boolean, playerIndex?: number) {        
      const sound = this.positionalSounds.get(this.generateSoundKey(key, playerIndex))?.positionalAudio;
      if(sound) {          
        if(sound.isPlaying)
          sound.stop();
        
        if(this.isEnabled)
          sound.play();

        if(detune) {
          sound.detune = Math.floor(Math.random() * 1600 - 800);
        }
      }          
    }

    public playSoundIfNotCurrentlyPlaying(key: string, detune: boolean, playerIndex?: number) {
      const sound = this.positionalSounds.get(this.generateSoundKey(key, playerIndex))?.positionalAudio;
      if(sound) {          
        if(sound.isPlaying)
          return;

        if(this.isEnabled)
          sound.play();

        if(detune) {
          sound.detune = Math.floor(Math.random() * 1600 - 800);
        }
      }          
    }

    public updatePlaybackRate(key: string, playbackRate: number, playerIndex?: number) {
      const sound = this.positionalSounds.get(this.generateSoundKey(key, playerIndex))?.positionalAudio;
      if(sound && this.isEnabled) {          
        if(!sound.isPlaying && this.isEnabled) {
          sound.play();          
        }
        //alert('test');
        sound.setPlaybackRate(playbackRate);
      }          
    }

    public stopSound(key: string, playerIndex?: number) {
      const sound = this.positionalSounds.get(this.generateSoundKey(key, playerIndex))?.positionalAudio;
      if(sound && sound.isPlaying)
          sound.stop();        
    }

    
    public stopAllSoundsForPlayer(playerIndex: number) {      
      const matchingValues = Array.from(this.positionalSounds.entries())
        .filter(([key]) => key.includes(this.generatePlayerSpecificPrefix(playerIndex)))
        .map(([_, value]) => value);

      matchingValues.forEach(x => x.positionalAudio.stop());
    }

    update(newListenerPosition: THREE.Vector3): void {
        this.audioListener.position.copy(newListenerPosition);
        
        const worldPos = new THREE.Vector3();
        this.audioListener.updateMatrixWorld(true);
        this.audioListener.getWorldPosition(worldPos);
        //console.log(worldPos);

        const audioContext = THREE.AudioContext.getContext();
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => console.log('AudioContext resumed'));
        }

        if(this.isDebugEnabled)
          this.positionalSounds.forEach(x => x.helper?.update());
    }

    public getAllSounds(): Map<string, PositionalAudioObject> {
      return this.positionalSounds;
    }
}