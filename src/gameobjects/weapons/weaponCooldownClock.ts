import * as THREE from "three";

export class WeaponCoolDownClock {

    private cooldownClock: THREE.Clock = new THREE.Clock(false);

    constructor(private cooldownTimeInSeconds: number,
                private upgradedCooldownTimeInSeconds: number) {
    }

    public isRunning(): boolean {
        return this.cooldownClock.running;
    }

    public start(): void {
        this.cooldownClock.start();
    }

    public stop(): void {
        this.cooldownClock.stop();
    }

    public isExpired(): boolean {
        return this.cooldownClock.getElapsedTime() > this.cooldownTimeInSeconds;
    }

    public stopIfExpired(): void {        
        if(this.cooldownClock.getElapsedTime() > this.cooldownTimeInSeconds) {
            this.cooldownClock.stop();
        }  
    }
}