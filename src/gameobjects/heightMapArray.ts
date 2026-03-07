import * as THREE from "three";
import { texture } from "three/examples/jsm/nodes/Nodes.js";

export class HeightMapArray {
    
    public numbers2DArray: number[][] = [];
    
    private width!: number;
    private height!: number;
    private assetName!: string;
    
    generate(asset: string): Promise<number[][]> {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
    
            // Load the image as a texture
            loader.load(
            asset,
            (texture) => {
                // Create a canvas to extract the pixel data
                const image = texture.image;
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                if (!context) {
                reject(new Error('Failed to create canvas context.'));
                return;
                }

                // Set canvas size to match the image
                canvas.width = image.width;
                canvas.height = image.height;
                
                // Draw the image onto the canvas
                context.drawImage(image, 0, 0);
                
                // Extract the pixel data
                const imageData = context.getImageData(0, 0, image.width, image.height);
                const { data, width, height } = imageData;
                const heightmap: number[][] = [];

                // Convert the pixel data to a heightmap array (assuming grayscale)
                for (let y = 0; y < height; y++) {
                const row: number[] = [];
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    // Take the red channel (since it's grayscale, R=G=B)
                    const r = data[index]; // Red channel (0-255)
                    
                    // Convert the 8-bit color to a float (0 to 1) and store in the array
                    const heightValue = r / 255; // Normalize to 0-1 range
                    row.push(heightValue);
                }
                heightmap.push(row);
                }

                resolve(heightmap);
            },
            undefined, // onProgress callback (optional)
            (error) => {
                reject(error); // Handle loading errors
            }
            );
        });        
    }

    getArray(): number[][] {
        return this.numbers2DArray;
    }
    getImageWidth(): number {
        return this.width;
    }

    getImageHeight(): number {
        return this.height;
    }

    getAssetName(): string {
        return this.assetName;
    }

    getMapDimensions(): THREE.Vector3 {
        return new THREE.Vector3(this.getImageWidth(), 0, this.getImageHeight());
    }
}