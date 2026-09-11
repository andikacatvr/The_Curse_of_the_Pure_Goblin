import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.svg('title_banner', '/assets/title_banner_v2.svg', { width: 900, height: 390 });
        this.load.image('menu_bg', '/assets/menu_bg.jpg');

        // Character portrait images for dialogue box
        this.load.image('portrait_rachael', '/assets/karakter_rachael.png');
        this.load.image('portrait_nenek', '/assets/karakter_nenek.png');
        this.load.image('portrait_aksel', '/assets/karakter_aksel.png');
        this.load.image('portrait_penyihir', '/assets/karakter_penyihir.png');
        this.load.image('portrait_aksel_goblin', '/assets/karakter_aksel_goblin.png');
        this.load.image('portrait_mary', '/assets/karakter_nenekmary.png');
        this.load.image('portrait_heinreich', '/assets/karakter_mrheinreich.png');
        this.load.image('portrait_breado', '/assets/karakter_mrbreado.png');
        this.load.image('portrait_hunter', '/assets/karakter_pemburu_npc.png');
        this.load.image('portrait_thomas', '/assets/karakter_pakthomas_npc.png');
        this.load.image('portrait_sarah', '/assets/karakter_ibusarah_npc.png');
        this.load.image('portrait_bob', '/assets/karakter_pamanbob_npc.png');
        this.load.image('portrait_rachael_sembuh', '/assets/karakter_rachael_sembuh.png');

        // Building & Ground Assets
        this.load.image('building_rumah', '/assets/rumah_aksel_rachael.png');
        this.load.image('tanah_home', '/assets/tanah_home.png');
        this.load.image('waterfall_canyon_bg', '/assets/waterfallbackg.jpg');
        this.load.image('home_village_bg', '/assets/rumahwargabackg.jpg');
        this.load.image('lake_forest_bg', '/assets/lakebackgr.png');
        this.load.image('mountain_foot_bg', '/assets/kakigunungbackgr.png');
        this.load.image('forest_trail_bg', '/assets/hutanhijaulebat.jpg');
        this.load.image('witch_yard_bg', '/assets/latarbelakangrumahpenyihir.jpg');
        this.load.image('witch_yard_house', '/assets/rumahpenyihirbackgr.png');
        this.load.image('tanah_witch', '/assets/tanah_witch.png');
        this.load.image('witch_cottage_bg', '/assets/dalam_rumah_penyihir.jpg');
        this.load.image('tiles_kayu', '/assets/tiles_kayu.png');
        this.load.image('monster_shadow', '/assets/mosnter1.png');
        this.load.image('witch_spirit', '/assets/karakter_penyihir.png');
        this.load.image('grandma_mary_bg', '/assets/latarbelakangrumahmarybackgr.png');
        this.load.image('bee_garden_bg', '/assets/latarbelakangladangmarybackgr.png');
        this.load.image('woodshop_bg', '/assets/latarbelakangmrheinreichbackgr.png');
        this.load.image('firewood_forest_bg', '/assets/latarbelakangpinggirhutanbackgr.png');
        this.load.image('bakery_mill_bg', '/assets/latarbelakangmrbreado.jpg');
        this.load.image('village_residential_bg', '/assets/latarbelakangrumahwargahutanbackgr.png');
        this.load.image('east_forest_bg', '/assets/hutanmenujugpenyihir.png');

        // NPC Nenek Sprite (frozen/static PNG)
        this.load.image('npc_grandma_home', '/assets/nenek_aksel_rachael_sprite.png');

        // NPC Rachael Spritesheet (3 frames: sitting, eyes closed, sleeping)
        this.load.spritesheet('npc_rachael', '/assets/rachael_sprite_frozens.png', {
            frameWidth: 175,
            frameHeight: 189
        });

        // Human Aksel Spritesheet (44x68 per frame, 7 frames)
        this.load.spritesheet('player_human', '/assets/aksel_human_spritesheet.png', {
            frameWidth: 44,
            frameHeight: 68
        });

        this.generateAllTextures();
    }

    generateAllTextures() {
        // 1. Player Human (Aksel Manusia) is loaded as spritesheet in preload()
        // (Procedural generator removed to avoid overwriting spritesheet)

        // 2. Player Goblin (Aksel Goblin - Si Goblin Baik Hati) - 36 x 44
        const goblinG = this.make.graphics({ x: 0, y: 0, add: false });
        // Goblin Pointy Ears
        goblinG.fillStyle(0x15803d, 1);
        goblinG.fillTriangle(6, 10, 0, 15, 6, 20);
        goblinG.fillTriangle(30, 10, 36, 15, 30, 20);
        goblinG.fillStyle(0x86efac, 1);
        goblinG.fillTriangle(6, 12, 2, 15, 6, 18);
        goblinG.fillTriangle(30, 12, 34, 15, 30, 18);
        // Goblin Body & Tattered Blue Shirt
        goblinG.fillStyle(0x3b82f6, 1);
        goblinG.fillRoundedRect(7, 21, 22, 15, 3);
        // Tattered Patches & Belt
        goblinG.fillStyle(0x1d4ed8, 1);
        goblinG.fillRect(9, 29, 6, 5);
        goblinG.fillStyle(0x92400e, 1);
        goblinG.fillRect(7, 30, 22, 3);
        goblinG.fillStyle(0xf59e0b, 1);
        goblinG.fillRect(16, 29, 4, 5);
        // Goblin Legs & Feet
        goblinG.fillStyle(0x15803d, 1);
        goblinG.fillRect(9, 36, 7, 5);
        goblinG.fillRect(20, 36, 7, 5);
        goblinG.fillStyle(0x166534, 1);
        goblinG.fillRect(8, 40, 9, 4);
        goblinG.fillRect(19, 40, 9, 4);
        // Goblin Head (Green Skin)
        goblinG.fillStyle(0x22c55e, 1);
        goblinG.fillRoundedRect(6, 6, 24, 17, 6);
        // Friendly Eyebrows
        goblinG.fillStyle(0x14532d, 1);
        goblinG.fillRect(9, 9, 5, 2);
        goblinG.fillRect(22, 9, 5, 2);
        // Big Expressive Eyes (Whites)
        goblinG.fillStyle(0xffffff, 1);
        goblinG.fillRect(9, 11, 6, 6);
        goblinG.fillRect(21, 11, 6, 6);
        // Dark Pupils
        goblinG.fillStyle(0x0f172a, 1);
        goblinG.fillRect(11, 12, 4, 5);
        goblinG.fillRect(23, 12, 4, 5);
        // Eye Sparkle (Kindness)
        goblinG.fillStyle(0xffffff, 1);
        goblinG.fillRect(12, 12, 2, 2);
        goblinG.fillRect(24, 12, 2, 2);
        // Cute Goblin Nose
        goblinG.fillStyle(0x15803d, 1);
        goblinG.fillCircle(18, 18, 2.5);
        // Cheerful Smiling Mouth (The Good Goblin) with cute tiny tooth
        goblinG.fillStyle(0x881337, 1);
        goblinG.fillRect(14, 20, 8, 2);
        goblinG.fillRect(15, 21, 6, 2);
        goblinG.fillStyle(0xffffff, 1);
        goblinG.fillRect(19, 20, 2, 2); // Tiny friendly fang/tooth
        goblinG.generateTexture('player_goblin', 36, 44);

        // 3. NPC Rachael (Adik Aksel yang Lembut)
        // Now loaded as spritesheet PNG in preload() with key 'npc_rachael'

        // 3b. NPC Nenek Aksel & Rachael (Nenek Penyayang di Rumah)
        // Now loaded as PNG image in preload() with key 'npc_grandma_home'

        // 4. NPC Madam Joanne (Sang Penyihir Misterius) - 38 x 48
        const joanneG = this.make.graphics({ x: 0, y: 0, add: false });
        // Flowing Witch Robe
        joanneG.fillStyle(0x3b0764, 1);
        joanneG.fillTriangle(19, 18, 2, 48, 36, 48);
        joanneG.fillStyle(0x6b21a8, 1);
        joanneG.fillRect(15, 28, 8, 20);
        // Golden Brooch & Ruby Crystal
        joanneG.fillStyle(0xf59e0b, 1);
        joanneG.fillCircle(19, 28, 4);
        joanneG.fillStyle(0xef4444, 1);
        joanneG.fillCircle(19, 28, 2);
        // Silver-Violet Mystic Hair
        joanneG.fillStyle(0xc4b5fd, 1);
        joanneG.fillRoundedRect(7, 14, 24, 20, 4);
        joanneG.fillRect(6, 18, 6, 16);
        joanneG.fillRect(26, 18, 6, 16);
        // Elegant Face
        joanneG.fillStyle(0xfef3c7, 1);
        joanneG.fillRoundedRect(10, 16, 18, 15, 4);
        // Arched Witch Eyebrows
        joanneG.fillStyle(0x4c1d95, 1);
        joanneG.fillRect(12, 18, 5, 2);
        joanneG.fillRect(21, 18, 5, 2);
        // Mystical Sharp Eyes (Whites)
        joanneG.fillStyle(0xffffff, 1);
        joanneG.fillRect(12, 20, 5, 4);
        joanneG.fillRect(21, 20, 5, 4);
        // Glowing Violet Pupils
        joanneG.fillStyle(0x7c3aed, 1);
        joanneG.fillRect(14, 20, 3, 4);
        joanneG.fillRect(23, 20, 3, 4);
        // Magical Eye Sparkle
        joanneG.fillStyle(0x38bdf8, 1);
        joanneG.fillRect(15, 20, 2, 2);
        joanneG.fillRect(24, 20, 2, 2);
        // Nose
        joanneG.fillStyle(0xd97706, 1);
        joanneG.fillRect(18, 24, 2, 2);
        // Mysterious Smirk / Lipstick
        joanneG.fillStyle(0x9f1239, 1);
        joanneG.fillRect(15, 27, 7, 2);
        joanneG.fillRect(20, 26, 3, 2); // Smug curve
        // Grand Witch Hat Brim
        joanneG.fillStyle(0x2e1065, 1);
        joanneG.fillRoundedRect(2, 12, 34, 6, 2);
        // Pointed Hat Cone
        joanneG.fillTriangle(19, 0, 8, 14, 30, 14);
        // Gold Hat Band & Buckle
        joanneG.fillStyle(0x9333ea, 1);
        joanneG.fillRect(10, 10, 18, 4);
        joanneG.fillStyle(0xfbbf24, 1);
        joanneG.fillRect(16, 9, 6, 6);
        joanneG.fillStyle(0x2e1065, 1);
        joanneG.fillRect(18, 10, 2, 4);
        joanneG.generateTexture('npc_joanne', 38, 48);

        // 5. NPC Hunter (Pemburu Hutan Desa) - 34 x 46
        const hunterG = this.make.graphics({ x: 0, y: 0, add: false });
        // Hunter Green Tunic
        hunterG.fillStyle(0x15803d, 1);
        hunterG.fillRoundedRect(5, 20, 24, 17, 4);
        // Leather Cross-Strap & Buckle
        hunterG.fillStyle(0x78350f, 1);
        hunterG.fillTriangle(7, 20, 27, 36, 24, 37);
        hunterG.fillStyle(0xf59e0b, 1);
        hunterG.fillRect(15, 26, 4, 4);
        // Belt & Pants
        hunterG.fillStyle(0x451a03, 1);
        hunterG.fillRect(5, 33, 24, 4);
        hunterG.fillStyle(0x1f2937, 1);
        hunterG.fillRect(7, 37, 8, 5);
        hunterG.fillRect(19, 37, 8, 5);
        hunterG.fillStyle(0x111827, 1);
        hunterG.fillRect(6, 41, 10, 5);
        hunterG.fillRect(18, 41, 10, 5);
        // Head / Face
        hunterG.fillStyle(0xfed7aa, 1);
        hunterG.fillRoundedRect(6, 8, 22, 16, 4);
        // Brown Hair on Sides
        hunterG.fillStyle(0x451a03, 1);
        hunterG.fillRect(5, 10, 3, 10);
        hunterG.fillRect(26, 10, 3, 10);
        // Determined Eyebrows
        hunterG.fillStyle(0x292524, 1);
        hunterG.fillRect(9, 12, 5, 2);
        hunterG.fillRect(20, 12, 5, 2);
        // Keen Hunter Eyes (Whites)
        hunterG.fillStyle(0xffffff, 1);
        hunterG.fillRect(9, 14, 5, 4);
        hunterG.fillRect(20, 14, 5, 4);
        // Dark Pupils
        hunterG.fillStyle(0x1c1917, 1);
        hunterG.fillRect(11, 14, 3, 4);
        hunterG.fillRect(22, 14, 3, 4);
        // Eye Sparkle
        hunterG.fillStyle(0xffffff, 1);
        hunterG.fillRect(12, 14, 2, 2);
        hunterG.fillRect(23, 14, 2, 2);
        // Nose
        hunterG.fillStyle(0xd97706, 1);
        hunterG.fillRect(16, 17, 2, 2);
        // Stubble / Chin Beard
        hunterG.fillStyle(0x78350f, 0.6);
        hunterG.fillRect(12, 22, 10, 2);
        // Confident Friendly Smile
        hunterG.fillStyle(0x991b1b, 1);
        hunterG.fillRect(14, 20, 6, 2);
        // Forest Ranger Cap
        hunterG.fillStyle(0x166534, 1);
        hunterG.fillRoundedRect(4, 2, 26, 9, 3);
        hunterG.fillRect(3, 7, 28, 4);
        // Orange Feather on Cap
        hunterG.fillStyle(0xf97316, 1);
        hunterG.fillTriangle(26, 1, 23, 7, 28, 7);
        hunterG.fillStyle(0xfef08a, 1);
        hunterG.fillRect(24, 3, 2, 4);
        hunterG.generateTexture('npc_hunter', 34, 46);

        // 6. NPC Grandma Mary (Nenek Ramah Pemilik Kebun) - 34 x 44
        const maryG = this.make.graphics({ x: 0, y: 0, add: false });
        // Cozy Orange Dress
        maryG.fillStyle(0xe67e22, 1);
        maryG.fillRoundedRect(5, 18, 24, 20, 4);
        // Gardening Apron (Pale Cream) with Pocket
        maryG.fillStyle(0xfef9c3, 1);
        maryG.fillRect(9, 22, 16, 16);
        maryG.fillStyle(0xd97706, 1);
        maryG.fillRect(12, 27, 10, 7); // Apron pocket
        // Shoes
        maryG.fillStyle(0x451a03, 1);
        maryG.fillRect(8, 38, 7, 4);
        maryG.fillRect(19, 38, 7, 4);
        // Silver-Grey Hair Bun on Top
        maryG.fillStyle(0x94a3b8, 1);
        maryG.fillCircle(17, 4, 6);
        maryG.fillStyle(0xe2e8f0, 1);
        maryG.fillCircle(17, 4, 4);
        // Silver Hair Around Head
        maryG.fillStyle(0xcbd5e1, 1);
        maryG.fillRoundedRect(5, 5, 24, 13, 5);
        // Kind Elderly Face
        maryG.fillStyle(0xfed7aa, 1);
        maryG.fillRoundedRect(7, 8, 20, 15, 4);
        // Rosy Warm Cheeks
        maryG.fillStyle(0xfca5a5, 0.8);
        maryG.fillRect(8, 16, 4, 3);
        maryG.fillRect(22, 16, 4, 3);
        // Golden Spectacles / Round Glasses
        maryG.lineStyle(2, 0xf59e0b, 1);
        maryG.strokeCircle(11, 14, 4);
        maryG.strokeCircle(23, 14, 4);
        maryG.beginPath();
        maryG.moveTo(15, 14);
        maryG.lineTo(19, 14);
        maryG.strokePath();
        // Kind Eyes behind Glasses
        maryG.fillStyle(0xffffff, 1);
        maryG.fillRect(9, 13, 4, 3);
        maryG.fillRect(21, 13, 4, 3);
        maryG.fillStyle(0x1e293b, 1);
        maryG.fillRect(10, 13, 3, 3);
        maryG.fillRect(22, 13, 3, 3);
        // Eyebrows
        maryG.fillStyle(0x64748b, 1);
        maryG.fillRect(9, 9, 5, 1);
        maryG.fillRect(20, 9, 5, 1);
        // Sweet Rounded Nose
        maryG.fillStyle(0xf97316, 1);
        maryG.fillRect(16, 16, 2, 2);
        // Sweet Grandmotherly Warm Smile
        maryG.fillStyle(0xb91c1c, 1);
        maryG.fillRect(13, 19, 8, 2);
        maryG.fillRect(14, 20, 6, 1);
        maryG.generateTexture('npc_mary', 34, 44);

        // 7. NPC Mr. Heinreich (Tukang Kayu Berjanggut Lebat) - 38 x 48
        const heinreichG = this.make.graphics({ x: 0, y: 0, add: false });
        // Heavy Lumberjack Shirt (Orange/Flannel)
        heinreichG.fillStyle(0xd97706, 1);
        heinreichG.fillRoundedRect(4, 18, 30, 20, 4);
        // Heavy Leather Carpenter Apron
        heinreichG.fillStyle(0x78350f, 1);
        heinreichG.fillRect(8, 22, 22, 18);
        // Leather Apron Straps & Brass Buckles
        heinreichG.fillStyle(0x451a03, 1);
        heinreichG.fillRect(8, 18, 4, 8);
        heinreichG.fillRect(26, 18, 4, 8);
        heinreichG.fillStyle(0xf59e0b, 1);
        heinreichG.fillRect(8, 22, 4, 3);
        heinreichG.fillRect(26, 22, 4, 3);
        // Tool Pouch & Hammer Handle
        heinreichG.fillStyle(0xb45309, 1);
        heinreichG.fillRect(12, 30, 14, 8);
        heinreichG.fillStyle(0x94a3b8, 1);
        heinreichG.fillRect(24, 26, 6, 4); // Hammer metal head
        heinreichG.fillStyle(0x78350f, 1);
        heinreichG.fillRect(26, 29, 2, 8); // Hammer wood handle
        // Sturdy Legs & Work Boots
        heinreichG.fillStyle(0x1e293b, 1);
        heinreichG.fillRect(8, 38, 8, 6);
        heinreichG.fillRect(22, 38, 8, 6);
        heinreichG.fillStyle(0x0f172a, 1);
        heinreichG.fillRect(7, 43, 10, 5);
        heinreichG.fillRect(21, 43, 10, 5);
        // Head / Strong Face
        heinreichG.fillStyle(0xfed7aa, 1);
        heinreichG.fillRoundedRect(7, 6, 24, 18, 4);
        // Rugged Brown Hair
        heinreichG.fillStyle(0x451a03, 1);
        heinreichG.fillRoundedRect(6, 2, 26, 8, 3);
        heinreichG.fillRect(5, 6, 5, 8);
        heinreichG.fillRect(28, 6, 5, 8);
        // Bushy Eyebrows
        heinreichG.fillStyle(0x291505, 1);
        heinreichG.fillRect(10, 9, 6, 2);
        heinreichG.fillRect(22, 9, 6, 2);
        // Honest Hardworking Eyes (Whites)
        heinreichG.fillStyle(0xffffff, 1);
        heinreichG.fillRect(10, 12, 5, 4);
        heinreichG.fillRect(23, 12, 5, 4);
        // Dark Pupils
        heinreichG.fillStyle(0x1c1917, 1);
        heinreichG.fillRect(12, 12, 3, 4);
        heinreichG.fillRect(24, 12, 3, 4);
        // Eye Sparkle
        heinreichG.fillStyle(0xffffff, 1);
        heinreichG.fillRect(13, 12, 2, 2);
        heinreichG.fillRect(25, 12, 2, 2);
        // Sturdy Carpenter Nose
        heinreichG.fillStyle(0xd97706, 1);
        heinreichG.fillRect(18, 15, 3, 3);
        // Bushy Lumberjack Mustache & Full Beard
        heinreichG.fillStyle(0x5c2b09, 1);
        heinreichG.fillRoundedRect(7, 17, 24, 11, 4);
        heinreichG.fillStyle(0x78350f, 1);
        heinreichG.fillRect(9, 17, 20, 5); // Mustache layer
        // Hearty Open Craftsman Smile (With Teeth)
        heinreichG.fillStyle(0x000000, 1);
        heinreichG.fillRect(14, 19, 10, 4);
        heinreichG.fillStyle(0xffffff, 1);
        heinreichG.fillRect(15, 19, 8, 2); // White teeth
        heinreichG.fillStyle(0xef4444, 1);
        heinreichG.fillRect(16, 21, 6, 2); // Red tongue
        heinreichG.generateTexture('npc_heinreich', 38, 48);

        // 8. Item Dagger
        const daggerG = this.make.graphics({ x: 0, y: 0, add: false });
        daggerG.fillStyle(0xbdc3c7, 1);
        daggerG.fillRect(8, 0, 4, 18);
        daggerG.fillStyle(0xe74c3c, 1);
        daggerG.fillRect(4, 14, 12, 4);
        daggerG.generateTexture('item_dagger', 20, 20);

        // 9. Item Bread
        const breadG = this.make.graphics({ x: 0, y: 0, add: false });
        breadG.fillStyle(0xd35400, 1);
        breadG.fillRoundedRect(0, 2, 22, 16, 4);
        breadG.generateTexture('item_bread', 22, 20);

        // 10. Item Bee Smoker
        const smokerG = this.make.graphics({ x: 0, y: 0, add: false });
        smokerG.fillStyle(0x94a3b8, 1);
        smokerG.fillRoundedRect(2, 4, 18, 18, 4);
        smokerG.fillStyle(0x475569, 1);
        smokerG.fillRect(8, 0, 6, 6);
        smokerG.generateTexture('item_smoker', 22, 24);

        // 11. Item Madu Murni
        const honeyG = this.make.graphics({ x: 0, y: 0, add: false });
        honeyG.fillStyle(0xeab308, 1);
        honeyG.fillCircle(12, 14, 10);
        honeyG.fillStyle(0xa16207, 1);
        honeyG.fillRect(6, 2, 12, 4);
        honeyG.generateTexture('item_honey', 24, 26);

        // 12. Item Mythical Seed (Glowing Runes)
        const seedG = this.make.graphics({ x: 0, y: 0, add: false });
        seedG.fillStyle(0xa855f7, 1);
        seedG.fillCircle(12, 12, 11);
        seedG.fillStyle(0x38bdf8, 1);
        seedG.fillRect(8, 8, 8, 8);
        seedG.generateTexture('item_seed', 24, 24);

        // 13. Fertilizer Bag (Karung Pupuk)
        const bagG = this.make.graphics({ x: 0, y: 0, add: false });
        bagG.fillStyle(0x78350f, 1);
        bagG.fillRoundedRect(0, 0, 26, 32, 4);
        bagG.fillStyle(0xf59e0b, 1);
        bagG.fillRect(4, 8, 18, 16);
        bagG.generateTexture('fertilizer_bag', 26, 32);

        // 14. Special Firewood Log (Kayu Bakar Khusus)
        const firewoodG = this.make.graphics({ x: 0, y: 0, add: false });
        firewoodG.fillStyle(0x92400e, 1);
        firewoodG.fillRoundedRect(0, 4, 30, 14, 3);
        firewoodG.fillStyle(0xf59e0b, 1);
        firewoodG.fillCircle(24, 11, 4);
        firewoodG.generateTexture('special_firewood', 30, 20);

        // 15. Platform / Ground
        const groundG = this.make.graphics({ x: 0, y: 0, add: false });
        groundG.fillStyle(0x2d3748, 1);
        groundG.fillRect(0, 0, 400, 32);
        groundG.fillStyle(0x27ae60, 1);
        groundG.fillRect(0, 0, 400, 6);
        groundG.generateTexture('platform', 400, 32);

        // 15b. Canyon Rock Platform (Wet slate rock with moss & water drips) - 140 x 32
        const rockPlatG = this.make.graphics({ x: 0, y: 0, add: false });
        rockPlatG.fillStyle(0x1e293b, 1);
        rockPlatG.fillRoundedRect(0, 4, 140, 28, 4);
        // Wet slate highlights
        rockPlatG.fillStyle(0x334155, 1);
        rockPlatG.fillRect(8, 6, 124, 4);
        // Lush vibrant moss top
        rockPlatG.fillStyle(0x15803d, 1);
        rockPlatG.fillRoundedRect(0, 0, 140, 7, 3);
        rockPlatG.fillStyle(0x22c55e, 1);
        rockPlatG.fillRect(10, 0, 35, 4);
        rockPlatG.fillRect(60, 0, 40, 4);
        rockPlatG.fillRect(115, 0, 20, 4);
        // Water drops hanging from rock bottom
        rockPlatG.fillStyle(0x38bdf8, 0.8);
        rockPlatG.fillCircle(25, 30, 2);
        rockPlatG.fillCircle(85, 30, 2.5);
        rockPlatG.fillCircle(120, 30, 1.8);
        rockPlatG.generateTexture('canyon_rock_platform', 140, 32);

        // 15c. Thorn Spikes (Poisonous glowing thorns) - 32 x 26
        const thornG = this.make.graphics({ x: 0, y: 0, add: false });
        // Thorn 1 (left)
        thornG.fillStyle(0x4c0519, 1);
        thornG.fillTriangle(3, 26, 11, 26, 7, 5);
        thornG.fillStyle(0xf43f5e, 1);
        thornG.fillTriangle(5, 14, 9, 14, 7, 5);
        // Thorn 2 (center main)
        thornG.fillStyle(0x581c87, 1);
        thornG.fillTriangle(9, 26, 23, 26, 16, 0);
        thornG.fillStyle(0xa855f7, 1);
        thornG.fillTriangle(13, 10, 19, 10, 16, 0);
        // Thorn 3 (right)
        thornG.fillStyle(0x4c0519, 1);
        thornG.fillTriangle(21, 26, 29, 26, 25, 7);
        thornG.fillStyle(0xf43f5e, 1);
        thornG.fillTriangle(23, 15, 27, 15, 25, 7);
        // Toxic base root
        thornG.fillStyle(0x1e1b4b, 1);
        thornG.fillRect(2, 22, 28, 4);
        thornG.generateTexture('thorn_spike', 32, 26);

        // 15d. Crystal Healing Fruit - 24 x 26
        const fruitG = this.make.graphics({ x: 0, y: 0, add: false });
        // Glowing cyan gemstone body
        fruitG.fillStyle(0x0284c7, 1);
        fruitG.fillRoundedRect(3, 7, 18, 17, 6);
        fruitG.fillStyle(0x38bdf8, 1);
        fruitG.fillTriangle(4, 12, 20, 12, 12, 24);
        fruitG.fillStyle(0xbae6fd, 1);
        fruitG.fillTriangle(7, 9, 17, 9, 12, 18);
        fruitG.fillStyle(0xffffff, 1);
        fruitG.fillCircle(10, 11, 2);
        // Vine & Leaf stem
        fruitG.fillStyle(0x166534, 1);
        fruitG.fillRect(11, 2, 3, 6);
        fruitG.fillStyle(0x22c55e, 1);
        fruitG.fillEllipse(17, 4, 6, 3);
        fruitG.generateTexture('crystal_fruit', 24, 26);

        // 15e. Rustic Signpost - 36 x 44
        const signG = this.make.graphics({ x: 0, y: 0, add: false });
        // Wood post
        signG.fillStyle(0x78350f, 1);
        signG.fillRect(15, 14, 6, 30);
        // Top plank
        signG.fillStyle(0xb45309, 1);
        signG.fillRoundedRect(2, 4, 32, 14, 2);
        signG.fillStyle(0xd97706, 1);
        signG.fillRect(4, 6, 28, 10);
        // Arrow notches / nails
        signG.fillStyle(0x451a03, 1);
        signG.fillCircle(6, 11, 1.5);
        signG.fillCircle(30, 11, 1.5);
        signG.generateTexture('signpost', 36, 44);

        // 16. Monster Shadow (Loaded from PNG /assets/mosnter1.png in preload)

        // 17. Witch Door
        const doorG = this.make.graphics({ x: 0, y: 0, add: false });
        doorG.fillStyle(0x451a03, 1);
        doorG.fillRect(0, 0, 40, 65);
        doorG.fillStyle(0xf59e0b, 1);
        doorG.fillCircle(30, 35, 4);
        doorG.generateTexture('witch_door', 40, 65);

        // 18. Potion Shelf
        const shelfG = this.make.graphics({ x: 0, y: 0, add: false });
        shelfG.fillStyle(0x581c87, 1);
        shelfG.fillRect(0, 0, 30, 45);
        shelfG.fillStyle(0x22c55e, 1);
        shelfG.fillCircle(15, 20, 6);
        shelfG.generateTexture('potion_shelf', 30, 45);

        // 19. Weed Node
        const weedG = this.make.graphics({ x: 0, y: 0, add: false });
        weedG.fillStyle(0x16a34a, 1);
        weedG.fillTriangle(12, 0, 0, 24, 24, 24);
        weedG.fillStyle(0x15803d, 1);
        weedG.fillTriangle(20, 4, 10, 24, 30, 24);
        weedG.generateTexture('weed_node', 30, 24);

        // 20. Beehive
        const beehiveG = this.make.graphics({ x: 0, y: 0, add: false });
        beehiveG.fillStyle(0xeab308, 1);
        beehiveG.fillCircle(18, 18, 16);
        beehiveG.fillStyle(0xca8a04, 1);
        beehiveG.fillRect(6, 14, 24, 8);
        beehiveG.generateTexture('beehive', 36, 36);

        // 20b. Magic Honey Bee (Little Flying Pixel Bee) - 14x12
        const beeG = this.make.graphics({ x: 0, y: 0, add: false });
        // Golden aura
        beeG.fillStyle(0xfef08a, 0.45);
        beeG.fillCircle(7, 6, 6);
        // Bee Wings (translucent wings)
        beeG.fillStyle(0xe0f2fe, 0.85);
        beeG.fillEllipse(4, 2, 4, 2.5);
        beeG.fillEllipse(10, 2, 4, 2.5);
        // Bee striped body
        beeG.fillStyle(0xfbbf24, 1);
        beeG.fillRoundedRect(2, 4, 10, 6, 2);
        // Black stripes
        beeG.fillStyle(0x1c1917, 1);
        beeG.fillRect(5, 4, 2, 6);
        beeG.fillRect(9, 4, 2, 6);
        // Stinger
        beeG.fillStyle(0x1c1917, 1);
        beeG.fillRect(12, 6, 1.5, 2);
        // Black eye
        beeG.fillStyle(0x0f172a, 1);
        beeG.fillRect(3, 5, 1, 1);
        beeG.generateTexture('magic_bee', 14, 12);

        // 21. NPC Mr. Breado
        // 21. NPC Mr. Breado (Koki Pembuat Roti yang Ceria) - 38 x 48
        const breadoG = this.make.graphics({ x: 0, y: 0, add: false });
        // Baker's Jacket (Warm Orange/Brown)
        breadoG.fillStyle(0xd97706, 1);
        breadoG.fillRoundedRect(4, 20, 30, 18, 4);
        // Crisp White Baker's Apron
        breadoG.fillStyle(0xf8fafc, 1);
        breadoG.fillRect(8, 24, 22, 16);
        // Apron Pocket with Tiny Wheat/Bread Icon
        breadoG.fillStyle(0xfef08a, 1);
        breadoG.fillRect(14, 30, 10, 6);
        breadoG.fillStyle(0xd97706, 1);
        breadoG.fillRect(16, 32, 6, 2);
        // Legs & Baker Shoes
        breadoG.fillStyle(0x334155, 1);
        breadoG.fillRect(8, 38, 8, 5);
        breadoG.fillRect(22, 38, 8, 5);
        breadoG.fillStyle(0x1e293b, 1);
        breadoG.fillRect(7, 43, 10, 5);
        breadoG.fillRect(21, 43, 10, 5);
        // Plump Round Face
        breadoG.fillStyle(0xfed7aa, 1);
        breadoG.fillRoundedRect(6, 10, 26, 17, 5);
        // Rosy Chubby Cheeks
        breadoG.fillStyle(0xf87171, 0.7);
        breadoG.fillRect(7, 18, 4, 3);
        breadoG.fillRect(27, 18, 4, 3);
        // Cheerful Eyebrows
        breadoG.fillStyle(0x5c2b09, 1);
        breadoG.fillRect(10, 12, 5, 2);
        breadoG.fillRect(23, 12, 5, 2);
        // Bright Happy Eyes (Whites)
        breadoG.fillStyle(0xffffff, 1);
        breadoG.fillRect(10, 14, 5, 4);
        breadoG.fillRect(23, 14, 5, 4);
        // Dark Pupils
        breadoG.fillStyle(0x1c1917, 1);
        breadoG.fillRect(12, 14, 3, 4);
        breadoG.fillRect(25, 14, 3, 4);
        // Eye Sparkle
        breadoG.fillStyle(0xffffff, 1);
        breadoG.fillRect(13, 14, 2, 2);
        breadoG.fillRect(25, 14, 2, 2);
        // Round Baker Nose
        breadoG.fillStyle(0xf97316, 1);
        breadoG.fillCircle(19, 18, 2.5);
        // Curled Baker's Mustache (Iconic!)
        breadoG.fillStyle(0x78350f, 1);
        breadoG.fillRect(12, 20, 14, 3);
        breadoG.fillRect(10, 19, 3, 3); // Left curl up
        breadoG.fillRect(25, 19, 3, 3); // Right curl up
        // Big Jolly Smile (Open mouth)
        breadoG.fillStyle(0x000000, 1);
        breadoG.fillRect(15, 23, 8, 3);
        breadoG.fillStyle(0xef4444, 1);
        breadoG.fillRect(16, 24, 6, 2); // Tongue
        // Puffy Tall Chef's Hat (Toque)
        breadoG.fillStyle(0xf8fafc, 1);
        breadoG.fillRoundedRect(6, 0, 26, 12, 4);
        breadoG.fillCircle(10, 3, 5);
        breadoG.fillCircle(19, 2, 6);
        breadoG.fillCircle(28, 3, 5);
        // Hat Pleat Shading
        breadoG.fillStyle(0xcbd5e1, 1);
        breadoG.fillRect(14, 3, 2, 7);
        breadoG.fillRect(22, 3, 2, 7);
        // Hat Base Band
        breadoG.fillStyle(0xe2e8f0, 1);
        breadoG.fillRect(7, 9, 24, 3);
        breadoG.generateTexture('npc_breado', 38, 48);

        // 22. Stone Mill
        const millG = this.make.graphics({ x: 0, y: 0, add: false });
        millG.fillStyle(0x64748b, 1);
        millG.fillCircle(25, 25, 24);
        millG.fillStyle(0x334155, 1);
        millG.fillCircle(25, 25, 12);
        millG.fillStyle(0xf59e0b, 1);
        millG.fillRect(20, 5, 10, 8);
        millG.generateTexture('stone_mill', 50, 50);

        // 23. Bread Basket
        const basketG = this.make.graphics({ x: 0, y: 0, add: false });
        basketG.fillStyle(0x78350f, 1);
        basketG.fillRoundedRect(0, 8, 32, 22, 4);
        basketG.fillStyle(0xf59e0b, 1);
        basketG.fillCircle(10, 8, 6);
        basketG.fillCircle(22, 8, 6);
        basketG.generateTexture('bread_basket', 32, 30);

        // 24. Magic Oven
        const ovenG = this.make.graphics({ x: 0, y: 0, add: false });
        ovenG.fillStyle(0x334155, 1);
        ovenG.fillRect(0, 0, 48, 55);
        ovenG.fillStyle(0xf97316, 1);
        ovenG.fillRoundedRect(8, 15, 32, 28, 6);
        ovenG.fillStyle(0xfef08a, 1);
        ovenG.fillCircle(24, 29, 8);
        ovenG.generateTexture('magic_oven', 48, 55);

        // 25. Magic Flour Item
        const flourG = this.make.graphics({ x: 0, y: 0, add: false });
        flourG.fillStyle(0xf8fafc, 1);
        flourG.fillRoundedRect(0, 0, 22, 24, 4);
        flourG.fillStyle(0xf59e0b, 1);
        flourG.fillRect(4, 4, 14, 4);
        flourG.generateTexture('item_flour', 22, 24);

        // 26. Magic Bread Item (Bahan 3)
        const magicBreadG = this.make.graphics({ x: 0, y: 0, add: false });
        magicBreadG.fillStyle(0xd97706, 1);
        magicBreadG.fillRoundedRect(0, 2, 26, 20, 6);
        magicBreadG.fillStyle(0xfef08a, 1);
        magicBreadG.fillRect(6, 8, 14, 8);
        magicBreadG.generateTexture('item_magic_bread', 26, 22);

        // 27. Red Potion Bottle (Flask with Cork & Liquid - matches pixel RPG reference)
        const potionG = this.make.graphics({ x: 0, y: 0, add: false });
        // Glass lip & main body outline
        potionG.fillStyle(0x0f172a, 1);
        potionG.fillRoundedRect(7, 7, 14, 5, 1);
        potionG.fillRoundedRect(4, 11, 20, 18, 5);
        
        // Cork stopper at top
        potionG.fillStyle(0x92400e, 1);
        potionG.fillRect(10, 2, 8, 6);
        potionG.fillStyle(0xd97706, 1);
        potionG.fillRect(11, 3, 6, 5);
        potionG.fillStyle(0xfde68a, 1);
        potionG.fillRect(11, 3, 3, 2);

        // Glass neck
        potionG.fillStyle(0xe2e8f0, 0.9);
        potionG.fillRect(9, 8, 10, 4);

        // Bottle interior (empty glass top)
        potionG.fillStyle(0x1e293b, 0.7);
        potionG.fillRect(6, 12, 16, 5);

        // Red Potion Liquid
        potionG.fillStyle(0x7f1d1d, 1); // liquid shadow bottom
        potionG.fillRoundedRect(6, 17, 16, 11, 4);
        potionG.fillStyle(0xb91c1c, 1); // rich ruby red liquid
        potionG.fillRoundedRect(7, 16, 14, 10, 3);
        potionG.fillStyle(0xef4444, 1); // bright crimson middle
        potionG.fillRect(8, 17, 12, 6);

        // Liquid surface meniscus line
        potionG.fillStyle(0xfca5a5, 0.9);
        potionG.fillRect(9, 16, 10, 2);

        // Glass specular highlight reflection (top left)
        potionG.fillStyle(0xffffff, 0.9);
        potionG.fillRect(7, 14, 2, 8);
        potionG.fillRect(9, 13, 3, 1);

        // Tiny bubble / sparkle in liquid
        potionG.fillStyle(0xffffff, 0.85);
        potionG.fillRect(16, 21, 2, 2);

        potionG.generateTexture('item_potion', 28, 32);
        potionG.generateTexture('item_real_cure', 28, 32);

        // 27b. Golden Vintage Skeleton Key (matches pixel RPG reference)
        const keyG = this.make.graphics({ x: 0, y: 0, add: false });
        keyG.fillStyle(0x451a03, 1); // dark outline
        keyG.fillCircle(14, 8, 7);
        keyG.fillRect(12, 14, 4, 16);
        keyG.fillRect(8, 23, 6, 6);

        // Loop inner hole
        keyG.fillStyle(0x050a14, 1);
        keyG.fillCircle(14, 8, 3.5);

        // Gold base body
        keyG.fillStyle(0xd97706, 1);
        keyG.lineStyle(2, 0xf59e0b, 1);
        keyG.strokeCircle(14, 8, 5);
        keyG.fillStyle(0xf59e0b, 1);
        keyG.fillRect(13, 14, 2, 15);

        // Teeth (bits)
        keyG.fillRect(9, 24, 4, 2);
        keyG.fillRect(9, 27, 5, 2);

        // Golden highlights
        keyG.fillStyle(0xfef08a, 1);
        keyG.fillRect(12, 4, 3, 2);
        keyG.fillRect(13, 15, 1, 10);
        keyG.fillRect(10, 24, 2, 1);

        // Loop ring connector / collar
        keyG.fillStyle(0xf59e0b, 1);
        keyG.fillRect(11, 14, 6, 2);

        keyG.generateTexture('item_key', 28, 32);

        // 27c. Glowing Blue Crystal Gem (matches pixel RPG reference)
        const gemG = this.make.graphics({ x: 0, y: 0, add: false });
        // Dark outline
        gemG.fillStyle(0x0c1e3d, 1);
        gemG.beginPath();
        gemG.moveTo(14, 3);
        gemG.lineTo(24, 14);
        gemG.lineTo(14, 25);
        gemG.lineTo(4, 14);
        gemG.closePath();
        gemG.fillPath();

        // Facets: Top highlight
        gemG.fillStyle(0x7dd3fc, 1);
        gemG.beginPath();
        gemG.moveTo(14, 5);
        gemG.lineTo(22, 14);
        gemG.lineTo(14, 14);
        gemG.closePath();
        gemG.fillPath();

        // Left facet
        gemG.fillStyle(0x38bdf8, 1);
        gemG.beginPath();
        gemG.moveTo(14, 5);
        gemG.lineTo(14, 14);
        gemG.lineTo(6, 14);
        gemG.closePath();
        gemG.fillPath();

        // Bottom-left facet
        gemG.fillStyle(0x2563eb, 1);
        gemG.beginPath();
        gemG.moveTo(6, 14);
        gemG.lineTo(14, 14);
        gemG.lineTo(14, 23);
        gemG.closePath();
        gemG.fillPath();

        // Bottom-right facet
        gemG.fillStyle(0x1d4ed8, 1);
        gemG.beginPath();
        gemG.moveTo(14, 14);
        gemG.lineTo(22, 14);
        gemG.lineTo(14, 23);
        gemG.closePath();
        gemG.fillPath();

        // Center jewel sparkle
        gemG.fillStyle(0xffffff, 0.95);
        gemG.fillRect(13, 7, 2, 3);
        gemG.fillRect(12, 8, 4, 1);

        // 3 Detached glowing blue specks / sparkles around the gem
        gemG.fillStyle(0x0c1e3d, 1);
        gemG.fillRect(1, 16, 4, 4);
        gemG.fillStyle(0x38bdf8, 1);
        gemG.fillRect(2, 17, 2, 2);

        gemG.fillStyle(0x0c1e3d, 1);
        gemG.fillRect(5, 23, 4, 4);
        gemG.fillStyle(0x60a5fa, 1);
        gemG.fillRect(6, 24, 2, 2);

        gemG.fillStyle(0x0c1e3d, 1);
        gemG.fillRect(23, 17, 4, 4);
        gemG.fillStyle(0x38bdf8, 1);
        gemG.fillRect(24, 18, 2, 2);

        gemG.generateTexture('item_gem', 28, 32);

        // 28. Village Houses
        // House 1: Red Roof (Pak Thomas)
        const h1G = this.make.graphics({ x: 0, y: 0, add: false });
        h1G.fillStyle(0xb91c1c, 1); // Red Roof
        h1G.fillTriangle(50, 0, 0, 45, 100, 45);
        h1G.fillStyle(0xfef3c7, 1); // Wall
        h1G.fillRect(10, 45, 80, 55);
        h1G.fillStyle(0x78350f, 1); // Door
        h1G.fillRect(40, 65, 20, 35);
        h1G.fillStyle(0x38bdf8, 1); // Window
        h1G.fillRect(20, 55, 14, 14);
        h1G.fillRect(66, 55, 14, 14);
        h1G.generateTexture('village_house1', 100, 100);

        // House 2: Blue Roof (Ibu Sarah)
        const h2G = this.make.graphics({ x: 0, y: 0, add: false });
        h2G.fillStyle(0x1d4ed8, 1); // Blue Roof
        h2G.fillTriangle(50, 0, 0, 45, 100, 45);
        h2G.fillStyle(0xffedd5, 1); // Wall
        h2G.fillRect(10, 45, 80, 55);
        h2G.fillStyle(0x92400e, 1); // Door
        h2G.fillRect(40, 65, 20, 35);
        h2G.fillStyle(0xfef08a, 1); // Window
        h2G.fillRect(20, 55, 14, 14);
        h2G.fillRect(66, 55, 14, 14);
        h2G.generateTexture('village_house2', 100, 100);

        // House 3: Green Roof (Paman Bob)
        const h3G = this.make.graphics({ x: 0, y: 0, add: false });
        h3G.fillStyle(0x15803d, 1); // Green Roof
        h3G.fillTriangle(50, 0, 0, 45, 100, 45);
        h3G.fillStyle(0xfae8ff, 1); // Wall
        h3G.fillRect(10, 45, 80, 55);
        h3G.fillStyle(0x78350f, 1); // Door
        h3G.fillRect(40, 65, 20, 35);
        h3G.fillStyle(0x60a5fa, 1); // Window
        h3G.fillRect(20, 55, 14, 14);
        h3G.fillRect(66, 55, 14, 14);
        h3G.generateTexture('village_house3', 100, 100);

        // 29. Villagers (Warga Desa yang Ramah) - 32 x 44
        // Pak Thomas (Warga Rumah 1)
        const thomasG = this.make.graphics({ x: 0, y: 0, add: false });
        // Blue Vest & Shirt
        thomasG.fillStyle(0x0284c7, 1);
        thomasG.fillRoundedRect(4, 18, 24, 16, 4);
        thomasG.fillStyle(0xf8fafc, 1);
        thomasG.fillRect(12, 18, 8, 8); // Shirt collar
        // Pants & Shoes
        thomasG.fillStyle(0x334155, 1);
        thomasG.fillRect(6, 34, 8, 6);
        thomasG.fillRect(18, 34, 8, 6);
        thomasG.fillStyle(0x0f172a, 1);
        thomasG.fillRect(5, 40, 10, 4);
        thomasG.fillRect(17, 40, 10, 4);
        // Face
        thomasG.fillStyle(0xfed7aa, 1);
        thomasG.fillRoundedRect(6, 6, 20, 15, 4);
        // Flat Newsboy Cap (Slate)
        thomasG.fillStyle(0x475569, 1);
        thomasG.fillRoundedRect(4, 2, 24, 8, 3);
        thomasG.fillRect(3, 7, 26, 3); // Brim
        // Eyebrows
        thomasG.fillStyle(0x451a03, 1);
        thomasG.fillRect(9, 9, 4, 1);
        thomasG.fillRect(19, 9, 4, 1);
        // Friendly Eyes
        thomasG.fillStyle(0xffffff, 1);
        thomasG.fillRect(9, 11, 4, 3);
        thomasG.fillRect(19, 11, 4, 3);
        thomasG.fillStyle(0x0f172a, 1);
        thomasG.fillRect(10, 11, 2, 3);
        thomasG.fillRect(20, 11, 2, 3);
        // Sparkle
        thomasG.fillStyle(0xffffff, 1);
        thomasG.fillRect(11, 11, 1, 1);
        thomasG.fillRect(21, 11, 1, 1);
        // Nose
        thomasG.fillStyle(0xd97706, 1);
        thomasG.fillRect(15, 14, 2, 2);
        // Neat Trimmed Mustache
        thomasG.fillStyle(0x451a03, 1);
        thomasG.fillRect(12, 16, 8, 2);
        // Friendly Smile
        thomasG.fillStyle(0x991b1b, 1);
        thomasG.fillRect(13, 18, 6, 2);
        thomasG.generateTexture('npc_thomas', 32, 44);

        // Ibu Sarah (Warga Rumah 2)
        const sarahG = this.make.graphics({ x: 0, y: 0, add: false });
        // Rose/Pink Country Dress & White Apron
        sarahG.fillStyle(0xec4899, 1);
        sarahG.fillRoundedRect(4, 18, 24, 18, 4);
        sarahG.fillStyle(0xfdf2f8, 1);
        sarahG.fillRect(8, 22, 16, 14); // Apron
        // Shoes
        sarahG.fillStyle(0x831843, 1);
        sarahG.fillRect(7, 39, 7, 4);
        sarahG.fillRect(18, 39, 7, 4);
        // Auburn Hair (Back & Framing)
        sarahG.fillStyle(0x92400e, 1);
        sarahG.fillRoundedRect(4, 3, 24, 18, 5);
        // Pretty Pale Face
        sarahG.fillStyle(0xffedd5, 1);
        sarahG.fillRoundedRect(6, 6, 20, 15, 4);
        // Front Hair Curls
        sarahG.fillStyle(0xb45309, 1);
        sarahG.fillRect(5, 4, 6, 12);
        sarahG.fillRect(21, 4, 6, 12);
        sarahG.fillRect(8, 2, 16, 5);
        // Soft Arched Eyebrows
        sarahG.fillStyle(0x78350f, 1);
        sarahG.fillRect(9, 9, 4, 1);
        sarahG.fillRect(19, 9, 4, 1);
        // Pretty Eyes with Eyelashes
        sarahG.fillStyle(0xffffff, 1);
        sarahG.fillRect(9, 11, 4, 3);
        sarahG.fillRect(19, 11, 4, 3);
        sarahG.fillStyle(0x1e293b, 1);
        sarahG.fillRect(10, 11, 2, 3);
        sarahG.fillRect(20, 11, 2, 3);
        // Sparkle
        sarahG.fillStyle(0xffffff, 1);
        sarahG.fillRect(11, 11, 1, 1);
        sarahG.fillRect(21, 11, 1, 1);
        // Rosy Cheeks
        sarahG.fillStyle(0xfb7185, 0.7);
        sarahG.fillRect(6, 14, 3, 2);
        sarahG.fillRect(23, 14, 3, 2);
        // Small Nose
        sarahG.fillStyle(0xf97316, 1);
        sarahG.fillRect(15, 14, 2, 1);
        // Sweet Pink Smiling Lips
        sarahG.fillStyle(0xdb2777, 1);
        sarahG.fillRect(13, 17, 6, 2);
        sarahG.generateTexture('npc_sarah', 32, 44);

        // Paman Bob (Warga Rumah 3)
        const bobG = this.make.graphics({ x: 0, y: 0, add: false });
        // Forest Green Vest & Earthy Shirt
        bobG.fillStyle(0x16a34a, 1);
        bobG.fillRoundedRect(4, 18, 24, 16, 4);
        bobG.fillStyle(0xd97706, 1);
        bobG.fillRect(11, 18, 10, 6); // Shirt collar
        // Pants & Shoes
        bobG.fillStyle(0x475569, 1);
        bobG.fillRect(6, 34, 8, 6);
        bobG.fillRect(18, 34, 8, 6);
        bobG.fillStyle(0x1e293b, 1);
        bobG.fillRect(5, 40, 10, 4);
        bobG.fillRect(17, 40, 10, 4);
        // Cheerful Round Face
        bobG.fillStyle(0xfed7aa, 1);
        bobG.fillRoundedRect(6, 6, 20, 15, 4);
        // Green Cap / Beret
        bobG.fillStyle(0x15803d, 1);
        bobG.fillRoundedRect(4, 2, 24, 8, 3);
        bobG.fillCircle(16, 2, 3);
        // Eyebrows
        bobG.fillStyle(0x5c2b09, 1);
        bobG.fillRect(9, 9, 4, 1);
        bobG.fillRect(19, 9, 4, 1);
        // Cheerful Smiling Eyes
        bobG.fillStyle(0xffffff, 1);
        bobG.fillRect(9, 11, 4, 3);
        bobG.fillRect(19, 11, 4, 3);
        bobG.fillStyle(0x0f172a, 1);
        bobG.fillRect(10, 11, 2, 3);
        bobG.fillRect(20, 11, 2, 3);
        bobG.fillStyle(0xffffff, 1);
        bobG.fillRect(11, 11, 1, 1);
        bobG.fillRect(21, 11, 1, 1);
        // Round Nose
        bobG.fillStyle(0xf97316, 1);
        bobG.fillCircle(16, 15, 1.5);
        // Big Jolly Wide Open Smile (Showing Teeth)
        bobG.fillStyle(0x000000, 1);
        bobG.fillRect(12, 17, 8, 3);
        bobG.fillStyle(0xffffff, 1);
        bobG.fillRect(13, 17, 6, 1); // Teeth
        bobG.fillStyle(0xef4444, 1);
        bobG.fillRect(14, 18, 4, 2); // Tongue
        bobG.generateTexture('npc_bob', 32, 44);
    }

    generateBlurredBackground() {
        if (this.textures.exists('menu_bg_blurred')) return;
        try {
            const srcImg = this.textures.get('menu_bg').getSourceImage();
            const canvas = this.textures.createCanvas('menu_bg_blurred', 800, 450);
            const ctx = canvas.getContext();
            ctx.filter = 'blur(6px) brightness(0.65) saturate(1.2)';
            ctx.drawImage(srcImg, -20, -15, 840, 480);
            canvas.refresh();
        } catch (e) {
            console.warn('Canvas blur fallback', e);
        }
    }

    create() {
        this.generateBlurredBackground();

        // Register Human Aksel Animations (from unified spritesheet)
        if (this.textures.exists('player_human')) {
            if (!this.anims.exists('aksel_human_idle')) {
                this.anims.create({
                    key: 'aksel_human_idle',
                    frames: [{ key: 'player_human', frame: 0 }],
                    frameRate: 1
                });
            }
            if (!this.anims.exists('aksel_human_walk')) {
                this.anims.create({
                    key: 'aksel_human_walk',
                    frames: this.anims.generateFrameNumbers('player_human', { start: 1, end: 4 }),
                    frameRate: 8,
                    repeat: -1
                });
            }
            if (!this.anims.exists('aksel_human_jump')) {
                this.anims.create({
                    key: 'aksel_human_jump',
                    frames: [{ key: 'player_human', frame: 5 }],
                    frameRate: 1
                });
            }
            if (!this.anims.exists('aksel_human_fall')) {
                this.anims.create({
                    key: 'aksel_human_fall',
                    frames: [{ key: 'player_human', frame: 6 }],
                    frameRate: 1
                });
            }
        }

        // Register Rachael idle animation (sitting in rocking chair)
        if (this.textures.exists('npc_rachael')) {
            if (!this.anims.exists('rachael_idle')) {
                this.anims.create({
                    key: 'rachael_idle',
                    frames: this.anims.generateFrameNumbers('npc_rachael', { start: 0, end: 2 }),
                    frameRate: 0.5,
                    repeat: -1,
                    yoyo: true
                });
            }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const targetScene = urlParams.get('scene');
        if (targetScene && this.scene.manager.getScene(targetScene)) {
            const goblinScenes = ['GrandmaGardenScene', 'BeeGardenScene', 'WoodshopScene', 'BakeryMillScene'];
            if (goblinScenes.includes(targetScene)) {
                this.registry.set('questState', {
                    chapter: 'BAB 1',
                    title: 'Bab 1: Bicara dengan Grandma Mary',
                    objective: 'Bicara dengan Grandma Mary di Halaman Rumahnya.',
                    questNumber: 1,
                    completedQuests: ['Prolog: Menyelinap ke Rumah Penyihir & Kutukan Goblin']
                });
            }
            this.scene.start(targetScene);
        } else {
            this.scene.start('TitleScene');
        }
    }
}

// -------------------------------------------------------------
// TITLE SCENE (MAIN MENU WITH PLAY & SETTINGS)
// -------------------------------------------------------------
