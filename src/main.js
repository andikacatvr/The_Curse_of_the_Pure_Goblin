import Phaser from 'phaser';
import './utils/gameState.js';

import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { IntroScene } from './scenes/IntroScene.js';
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
import { SaffronFarmScene } from './scenes/SaffronFarmScene.js';
import { EastForestScene } from './scenes/EastForestScene.js';
import { EndingScene } from './scenes/EndingScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    parent: 'game-container',
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FILL,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        activePointers: 3
    },
    resolution: Math.min(window.devicePixelRatio || 1, 2),
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
    scene: [BootScene, TitleScene, IntroScene, HomeScene, LakeForestScene, MountainFootLakeScene, ForestTrailScene, WaterfallGorgeScene, WitchYardScene, WitchCottageScene, GrandmaGardenScene, BeeGardenScene, WoodshopScene, FirewoodForestScene, BakeryMillScene, VillageResidentialScene, SaffronFarmScene, EastForestScene, EndingScene]
};

// Safe game launcher: ensure game boots within 800ms even if mobile network delays Google Fonts
const initGame = () => {
    if (window.__game) return;
    window.__game = new Phaser.Game(config);
};

if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    Promise.race([
        document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 800))
    ]).then(initGame).catch(initGame);
} else {
    initGame();
}

