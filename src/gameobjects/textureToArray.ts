import * as THREE from "three";

export class TextureToArray {
    
    public numbers2DArray: number[][] = [];
    
    private width!: number;
    private height!: number;
    private assetName!: string;
    
    constructor(textureLoader: THREE.TextureLoader, asset: string) {

        // Assuming you have a texture already loaded
        //var textureLoader = new THREE.TextureLoader();
        //var originalTexture = textureLoader.load('assets/normal-map.png');
        //const originalTexture = new THREE.TextureLoader().load('assets/normal-map.png');

        let originalTexture = textureLoader.load(
            asset,
            () => {

            // Get the image data from the original texture
            var canvas = document.createElement('canvas') as HTMLCanvasElement; 
            var context = canvas.getContext('2d') as CanvasRenderingContext2D;
            if(!context) return;
            //document.body.appendChild(context.canvas);

            context.drawImage(originalTexture.image, 0, 0);
            var imageData = context.getImageData(0, 0, originalTexture.image.width, originalTexture.image.height);

            // Convert the image data to a 2D array of numbers
            var pixelData = imageData.data;
            var width = originalTexture.image.width;
            var height = originalTexture.image.height;

            this.width = width;
            this.height = height;
            this.assetName = asset;
            //var numbers2DArray = [];

            for (var y = 0; y < height; y++) {
                
                var row = [];
                for (var x = 0; x < width; x++) {
                    var index = (y * width + x) * 4; // Each pixel has 4 values: red, green, blue, and alpha

                    // For grayscale, you can use any of the color channels (red, green, or blue)
                    // Here, we'll use the red channel as an example
                    var value = pixelData[index] / 255; // Normalize the value to the range [0, 1]

                    row.push(value);
                }
                this.numbers2DArray.push(row);
            }

            // Now numbers2DArray contains the numerical values of each pixel in the texture
            } 
        );      
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