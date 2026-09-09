import Phaser from 'phaser';
import './utils/gameState.js';

import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { HomeScene } from './scenes/HomeScene.js';
import { LakeForestScene } from './scenes/LakeForestScene.js';
import { MountainFootLakeScene } from './scenes/MountainFootLakeScene.js';
import { ForestTrailScene } from './scenes/ForestTrailScene.js';
import { WaterfallGorgeScene } from './scenes/WaterfallGorgeScene.js';
import { WitchYardScene } from './scenes/WitchYardScene.js';
import { WitchCottageScene } from './scenes/WitchCottageScene.js';
import { GrandmaGardenScene } from './scenes/GrandmaGardenScene.js';
import { BeeGardenScene } from './scenes/BeeGardenScene.js';
import { WoodshopScene } from './scenes/WoodshopScene.js';
import { FirewoodForestScene } from './scenes/FirewoodForestScene.js';
import { BakeryMillScene } from './scenes/BakeryMillScene.js';
import { VillageResidentialScene } from './scenes/VillageResidentialScene.js';
import { EastForestScene } from './scenes/EastForestScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        activePointers: 3
    },
    resolution: Math.max(2, window.devicePixelRatio || 2),
    render: {
        antialias: false,
        antialiasGL: false,
        roundPixels: true,
        pixelArt: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: [BootScene, TitleScene, HomeScene, LakeForestScene, MountainFootLakeScene, ForestTrailScene, WaterfallGorgeScene, WitchYardScene, WitchCottageScene, GrandmaGardenScene, BeeGardenScene, WoodshopScene, FirewoodForestScene, BakeryMillScene, VillageResidentialScene, EastForestScene]
};

// Ensure Google Fonts (Fredoka & Pirata One) are fully loaded before rendering
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        window.__game = new Phaser.Game(config);
    });
} else {
    window.__game = new Phaser.Game(config);
}

