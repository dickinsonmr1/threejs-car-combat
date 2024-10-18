import * as THREE from "three";
import * as CANNON from 'cannon-es'

export class QuadtreeNode3 {
    children: QuadtreeNode3[] | null = null;
    
    mesh: THREE.Mesh | null = null;
    heightmapChunk: number[][]; // The heightmap data for this chunk

    level: number;
    x: number;
    y: number;
    size: number;

    body?: CANNON.Body;

    constructor(heightmapChunk: number[][], x: number, y: number, size: number, level: number) {
        this.heightmapChunk = heightmapChunk;
        
        this.x = x;
        this.y = y;
        this.size = size;

        this.level = level;
    }

    // Check if node is subdivided
    isSubdivided() {
        return this.children !== null;
    }

    // Subdivide the node into 4 children
    subdivide(scene: THREE.Scene) {
        const halfSize = this.size / 2;

        const topLeftChunk = this.getSubChunk(0, 0, halfSize);
        const topRightChunk = this.getSubChunk(halfSize, 0, halfSize);
        const bottomLeftChunk = this.getSubChunk(0, halfSize, halfSize);
        const bottomRightChunk = this.getSubChunk(halfSize, halfSize, halfSize);
        
        this.children = [
            new QuadtreeNode3(topLeftChunk, this.x, this.y, halfSize, this.level + 1),
            new QuadtreeNode3(topRightChunk, this.x + halfSize, this.y, halfSize, this.level + 1),
            new QuadtreeNode3(bottomLeftChunk, this.x, this.y + halfSize, halfSize, this.level + 1),
            new QuadtreeNode3(bottomRightChunk, this.x + halfSize, this.y + halfSize, halfSize, this.level + 1),
        ];

        // Remove current mesh if it's being subdivided
        if (this.mesh) {
            //scene.remove(this.mesh);
            //this.mesh = null;
            this.mesh.visible = false;
        }
    }

    // Create mesh for this tile (if not subdivided)
    createMesh(scene: THREE.Scene, material: THREE.Material) { //}, dataArray2D: number[][]) {
        if (!this.mesh) {

            const geometry = new THREE.PlaneGeometry(this.size, this.size, this.size - 1, this.size - 1);

            // Set the z-values (height) for each vertex based on the heightmap chunk
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    const index = i * this.size + j;
                    const heightValue = this.heightmapChunk[i][j] * 50;//this.heightScale;
                    geometry.attributes.position.setZ(index, heightValue);
                }
            }

            geometry.computeVertexNormals(); // Recompute normals for smooth shading

            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2; // Rotate to lie flat
            mesh.position.set(this.x + this.size / 2, 20, this.y + this.size / 2); // Center it

            this.mesh = mesh;
            scene.add(mesh);
        }
        else {
            this.mesh.visible = true;
        }
    }


  // Extract a sub-chunk of the heightmap from the current node
  getSubChunk(offsetX: number, offsetY: number, subSize: number): number[][] {
    const subChunk: number[][] = [];

    for (let i = 0; i < subSize; i++) {
      const row: number[] = [];
      for (let j = 0; j < subSize; j++) {
        row.push(this.heightmapChunk[offsetY + i][offsetX + j]);
      }
      subChunk.push(row);
    }

    return subChunk;
  }
}