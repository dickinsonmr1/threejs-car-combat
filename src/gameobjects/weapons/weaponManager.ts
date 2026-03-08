import * as THREE from 'three'
import { Player } from "../player/player";
import { DumpsterFireObject } from "./dumpsterFireObject";
import { Lightning, LightningType } from "./lightning";
import { SonicPulseEmitter } from "./sonicPulseEmitter";
import { FlamethrowerEmitter } from './flamethrowerEmitter';
import GameScene from '../../scenes/gameScene';
import { ProjectileType } from './projectileType';

export class WeaponManager {

    public flamethrowerEmitters: FlamethrowerEmitter[] = [];
    public sonicPulseEmitters: SonicPulseEmitter[] = [];
    public dumpsters: DumpsterFireObject[] = [];

    lightningWeapons: Lightning[] = [];// = [
        //new Lightning(this, LightningType.Line, 5),
        //new Lightning(this, LightningType.Line, 5),
        //new Lightning(this, LightningType.CircleVertical, 1.5),
        //new Lightning(this, LightningType.CircleHorizontal, 1.5)
    //];

    /**
     *
     */
    constructor(private scene: GameScene) {
        this.lightningWeapons.push(new Lightning(scene, LightningType.Line, 5));
        this.lightningWeapons.push(new Lightning(scene, LightningType.Line, 5));
        this.lightningWeapons.push(new Lightning(scene, LightningType.CircleVertical, 1.5));
        this.lightningWeapons.push(new Lightning(scene, LightningType.CircleHorizontal, 1.5));
    }

    // TODO: move "generate weapon" methods from GameScene -> here

    public update(player1: Player, clock: THREE.Clock) {
        this.flamethrowerEmitters.forEach(x => x.update());

        // update lightning
        if(player1.lightningActive) {
                for(let i = 0; i < 2; i++) {                
                    let worldPos = new THREE.Vector3();
                    switch(i) {
                        case 0:
                            player1.headLights.mesh1.getWorldPosition(worldPos);
                            break;
                        case 1:
                            player1.headLights.mesh2.getWorldPosition(worldPos);
                            break;
                        default:
                            break;
                            //worldPos.copy(this.player1.getPosition());
                            //break;
                    }                
                    this.lightningWeapons[i].update(this.scene, worldPos, player1.getModelQuaternion());
                    this.lightningWeapons[i].meshGroup.visible = true;
                }
            }
            else {
                this.lightningWeapons.forEach(x => x.meshGroup.visible = false);
            }

        this.dumpsters.forEach(x => x.update(clock));
        this.sonicPulseEmitters.forEach(x => x.update());
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
         allPlayers.forEach(player => {                    
            var anyHits = false;
            if(player.lightningActive) {

                var enemyPlayers = allPlayers.filter(x => x.playerId != player.playerId);
                enemyPlayers.forEach(enemy => {
                                        
                    const boundingMesh = new THREE.Box3().setFromObject(player.lightningBoundingMesh);
                    var enemyBoundingBox = new THREE.Box3().setFromObject(enemy.getVehicleObject().getChassis().mesh);

                    if(boundingMesh != null && enemyBoundingBox != null && boundingMesh?.intersectsBox(enemyBoundingBox)){
                        enemy.tryDamageWithLightning();
                                                
                        this.lightningWeapons[2].update(this.scene, enemy.getPosition(), enemy.getModelQuaternion());                        
                        this.lightningWeapons[2].meshGroup.visible = true;

                        this.lightningWeapons[3].update(this.scene, enemy.getPosition(), enemy.getModelQuaternion());
                        this.lightningWeapons[3].meshGroup.visible = true;

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

    private checkKilldozerShovelForCollision(allPlayers: Player[]) {
         allPlayers.forEach(player => {            
            var anyHits = false;
            if(player.shovelCooldownClock.isRunningAndNotExpired() && player.currentShovelAngle > -Math.PI / 32) {

                var enemyPlayers = allPlayers.filter(x => x.playerId != player.playerId);
                enemyPlayers.forEach(enemy => {
                                        
                    const weaponBoundingBox = new THREE.Box3().setFromObject(player.shovelBoundingMesh);
                    var enemyBoundingBox = new THREE.Box3().setFromObject(enemy.getVehicleObject().getChassis().mesh);

                    if(weaponBoundingBox != null && enemyBoundingBox != null && weaponBoundingBox?.intersectsBox(enemyBoundingBox)){
                        enemy.tryDamage(ProjectileType.Rocket, new THREE.Vector3(0,0,0));
                        this.scene.generateRandomExplosion(
                            ProjectileType.Rocket,
                                enemy.getPosition(),
                                new THREE.Color('black'),
                                new THREE.Color('black'),
                                new THREE.Color('brown'),
                                new THREE.Color('brown'),
                                new THREE.Color('gray')
                        );
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

    private checkDumpstersForCollision(allPlayers: Player[]) {
        this.dumpsters.forEach(dumpster => {        
            if(dumpster.shouldRemove) {
                //dumpster.kill();
                //dumpster.group.children.forEach(x => this.remove(x));
                //this.remove(dumpster.group);      
            }
            else
            {
                let playersToCheck = allPlayers.filter(x => x.playerId != dumpster.playerId);
                playersToCheck.forEach(player => {
                    if(player.getPosition().distanceTo(dumpster.getPosition()) < 2 && player.currentHealth > 0){

                        this.scene.generateRandomExplosion(
                            ProjectileType.Rocket,
                            dumpster.getPosition(),
                        new THREE.Color('white'),
                        new THREE.Color('white'),
                        new THREE.Color('yellow'),
                        new THREE.Color('orange'),
                        new THREE.Color('red')
                        );
                        dumpster.kill();
                        this.scene.remove(dumpster.group);
                        
                        player.tryDamage(ProjectileType.Rocket, dumpster.getPosition());
                        
                        if(player.playerId == this.scene.player1.playerId) {
                            this.scene.sceneController.updateHealthOnHud(this.scene.player1.currentHealth);
                        }
                    }
                });
            };            
        });

        this.dumpsters = this.dumpsters.filter(x => !x.shouldRemove);
    }        
}