import * as THREE from 'three'
import { Player } from "../player/player";
import { DumpsterFireObject } from "./dumpsterFireObject";
import { Lightning } from "./lightning";
import { SonicPulseEmitter } from "./sonicPulseEmitter";
import { FlamethrowerEmitter } from './flamethrowerEmitter';

export class WeaponManager {

    public flamethrowerEmitters: FlamethrowerEmitter[] = [];
    public sonicPulseEmitters: SonicPulseEmitter[] = [];
    private dumpsters: DumpsterFireObject[] = [];

    lightningWeapons: Lightning[] = [];// = [
        //new Lightning(this, LightningType.Line, 5),
        //new Lightning(this, LightningType.Line, 5),
        //new Lightning(this, LightningType.CircleVertical, 1.5),
        //new Lightning(this, LightningType.CircleHorizontal, 1.5)
    //];

    /**
     *
     */
    constructor() {
                    
    }

    public update() {
        this.flamethrowerEmitters.forEach(x => x.update());
    }

    public checkAllWeaponsForCollision(allPlayers: Player[]) {

        this.checkProjectilesForCollision(allPlayers);
        this.checkFlameThrowersForCollision(allPlayers);
        this.checkLightningForCollision(allPlayers);
        this.checkKilldozerShovelForCollision(allPlayers);
        this.checkDumpstersForCollision(allPlayers);
    }

    private checkProjectilesForCollision(allPlayers: Player[]) {

    }

    private checkFlameThrowersForCollision(allPlayers: Player[]) {
        allPlayers.forEach(player => {
            
            var anyHits = false;
            if(player.flamethrowerActive) {

                var enemyPlayers = allPlayers.filter(x => x.playerId != player.playerId);
                enemyPlayers.forEach(enemy => {
                                        
                    const flamethrowerBoundingBox = new THREE.Box3().setFromObject(player.flamethrowerBoundingBox);
                    var enemyBoundingBox = new THREE.Box3().setFromObject(enemy.getVehicleObject().getChassis().mesh);

                    if(flamethrowerBoundingBox != null && enemyBoundingBox != null && flamethrowerBoundingBox?.intersectsBox(enemyBoundingBox)){
                        enemy.tryDamageWithFlamethrower();
                        player.boundingMeshMaterial.color.set(0xff0000);
                        anyHits = true;
                    }
                });
            }
            if(!anyHits) {
                player.boundingMeshMaterial.color.set(0xffffff);
            }
        });
    }

    private checkLightningForCollision(allPlayers: Player[]) {
        
    }

    private checkKilldozerShovelForCollision(allPlayers: Player[]) {
    }

    private checkDumpstersForCollision(allPlayers: Player[]) {
    }        
}