import Phaser from 'phaser';
import {
    FONT_TITLE,
    FONT_BODY,
    isMobileDevice,
    getInventory,
    getQuestState,
    MAX_PLAYER_HP,
    getPlayerHP,
    setPlayerHP
} from '../utils/gameState.js';
import { GameAudio } from '../audio/GameAudio.js';
import { DisplayManager } from '../utils/DisplayManager.js';

export class BaseScene extends Phaser.Scene {
    createVisualInventoryUI() {
        // Inisialisasi dan jalankan chill ambient backsound
        GameAudio.init();
        if (GameAudio.bgmEnabled && !GameAudio.bgmPlaying) {
            GameAudio.startAmbientBGM();
        }
        if (!this._audioPointerListenerAttached) {
            this._audioPointerListenerAttached = true;
            this.input.on('pointerdown', () => {
                GameAudio.resume();
                if (GameAudio.bgmEnabled && !GameAudio.bgmPlaying) {
                    GameAudio.startAmbientBGM();
                }
            });
        }

        // Hamburger Menu Button (Top Right HUD - Clean, compact & modern)
        this.menuBtnContainer = this.add.container(765, 26).setDepth(25);

        const menuBtnBg = this.add.rectangle(0, 0, 36, 36, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });

        // Vector 3 lines of hamburger menu
        const line1 = this.add.rectangle(0, -6, 18, 2.5, 0xf8fafc, 1);
        const line2 = this.add.rectangle(0, 0, 18, 2.5, 0xf8fafc, 1);
        const line3 = this.add.rectangle(0, 6, 18, 2.5, 0xf8fafc, 1);

        this.menuBtnContainer.add([menuBtnBg, line1, line2, line3]);

        menuBtnBg.on('pointerover', () => {
            menuBtnBg.setFillStyle(0x1e293b, 1);
            menuBtnBg.setStrokeStyle(2, 0xf59e0b);
            line1.setFillStyle(0xfde047);
            line2.setFillStyle(0xfde047);
            line3.setFillStyle(0xfde047);
            this.tweens.add({ targets: this.menuBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 120, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        menuBtnBg.on('pointerout', () => {
            menuBtnBg.setFillStyle(0x0f172a, 0.9);
            menuBtnBg.setStrokeStyle(2, 0x64748b);
            line1.setFillStyle(0xf8fafc);
            line2.setFillStyle(0xf8fafc);
            line3.setFillStyle(0xf8fafc);
            this.tweens.add({ targets: this.menuBtnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut' });
        });

        menuBtnBg.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettingsModal();
        });

        // Bag / Inventory Button (Top Right HUD - Next to Settings, Pure White Vector Style)
        this.bagBtnContainer = this.add.container(720, 26).setDepth(25);

        const bagBtnBg = this.add.rectangle(0, 0, 36, 36, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });

        // Plain minimalist white bag icon (Vector Graphics)
        const bagGraphics = this.add.graphics();
        const drawBagIcon = (color = 0xf8fafc) => {
            bagGraphics.clear();
            bagGraphics.lineStyle(2, color, 1);
            // Top handle / loop
            bagGraphics.beginPath();
            bagGraphics.arc(0, -6.5, 3.5, Math.PI, 0, false);
            bagGraphics.strokePath();
            // Bag main body (rounded rectangle)
            bagGraphics.strokeRoundedRect(-8.5, -5.5, 17, 16, 2.5);
            // Horizontal flap line
            bagGraphics.beginPath();
            bagGraphics.moveTo(-8.5, 0);
            bagGraphics.lineTo(8.5, 0);
            bagGraphics.strokePath();
            // Center latch / buckle
            bagGraphics.fillStyle(color, 1);
            bagGraphics.fillRect(-2, -2, 4, 4);
        };
        drawBagIcon(0xf8fafc);

        // Small indicator badge for item count
        this.bagBadgeBg = this.add.circle(13, -12, 7, 0x10b981, 1).setVisible(false);
        this.bagBadgeText = this.add.text(13, -12, '0', {
            fontSize: '9px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5).setVisible(false);

        this.bagBtnContainer.add([bagBtnBg, bagGraphics, this.bagBadgeBg, this.bagBadgeText]);

        bagBtnBg.on('pointerover', () => {
            bagBtnBg.setFillStyle(0x1e293b, 1);
            bagBtnBg.setStrokeStyle(2, 0xf59e0b);
            drawBagIcon(0xfde047);
            this.tweens.add({ targets: this.bagBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 120, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        bagBtnBg.on('pointerout', () => {
            bagBtnBg.setFillStyle(0x0f172a, 0.9);
            bagBtnBg.setStrokeStyle(2, 0x64748b);
            drawBagIcon(0xf8fafc);
            this.tweens.add({ targets: this.bagBtnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut' });
        });

        bagBtnBg.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleInventoryModal();
        });

        // Mobile Controls HUD Toggle Button (Top Right HUD)
        this.createMobileHUDButton();

        // Slot sprites kept hidden in memory for compatibility with any existing calls
        this.slotSprites = [];
        this.slotTexts = [];
        for (let i = 0; i < 4; i++) {
            const dummyBox = this.add.rectangle(0, 0, 1, 1, 0x000000, 0).setVisible(false);
            const dummyText = this.add.text(0, 0, '', { fontSize: '1px' }).setVisible(false);
            this.slotSprites.push(dummyBox);
            this.slotTexts.push(dummyText);
        }

        // Full Inventory Modal Container (5x4 Grid Pixel RPG Style matching user screenshot)
        this.invModalOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.65)
            .setDepth(30).setVisible(false).setInteractive();
        this.invModalOverlay.on('pointerdown', () => this.toggleInventoryModal(false));

        this.invModalContainer = this.add.container(400, 225).setDepth(31).setVisible(false);

        // Window Base Dimensions: 318 x 350
        // Window Graphics: Dark Navy background + mottled diagonal pixel bands + cyan-blue border
        const invBgGraphics = this.add.graphics();
        // Base dark navy fill
        invBgGraphics.fillStyle(0x0b1a32, 0.98);
        invBgGraphics.fillRoundedRect(-159, -175, 318, 350, 4);

        // Diagonal painterly streaks matching user screenshot
        invBgGraphics.fillStyle(0x0e2444, 0.45);
        invBgGraphics.beginPath();
        invBgGraphics.moveTo(-159, -60);
        invBgGraphics.lineTo(-40, -175);
        invBgGraphics.lineTo(20, -175);
        invBgGraphics.lineTo(-159, 0);
        invBgGraphics.closePath();
        invBgGraphics.fillPath();

        invBgGraphics.beginPath();
        invBgGraphics.moveTo(-159, 60);
        invBgGraphics.lineTo(80, -175);
        invBgGraphics.lineTo(140, -175);
        invBgGraphics.lineTo(-159, 120);
        invBgGraphics.closePath();
        invBgGraphics.fillPath();

        invBgGraphics.beginPath();
        invBgGraphics.moveTo(-90, 175);
        invBgGraphics.lineTo(159, -70);
        invBgGraphics.lineTo(159, -10);
        invBgGraphics.lineTo(-30, 175);
        invBgGraphics.closePath();
        invBgGraphics.fillPath();

        invBgGraphics.beginPath();
        invBgGraphics.moveTo(30, 175);
        invBgGraphics.lineTo(159, 50);
        invBgGraphics.lineTo(159, 100);
        invBgGraphics.lineTo(80, 175);
        invBgGraphics.closePath();
        invBgGraphics.fillPath();

        // Outer Dark Border
        invBgGraphics.lineStyle(2, 0x050c18, 1);
        invBgGraphics.strokeRoundedRect(-159, -175, 318, 350, 4);

        // Inner Vibrant Steel/Cyan Blue Border (classic pixel RPG window frame)
        invBgGraphics.lineStyle(3, 0x0d5683, 1);
        invBgGraphics.strokeRoundedRect(-157, -173, 314, 346, 3);

        // Header Title: "Inventory" on left
        const invTitle = this.add.text(-136, -145, 'Inventory', {
            fontSize: '18px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: '"Press Start 2P", Consolas, "Courier New", monospace'
        }).setOrigin(0, 0.5);

        // Header Close Button: "X" on right
        this.invCloseX = this.add.text(136, -145, 'X', {
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#ffffff',
            fontFamily: '"Press Start 2P", Consolas, "Courier New", monospace'
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        this.invCloseX.on('pointerover', () => this.invCloseX.setFill('#f87171'));
        this.invCloseX.on('pointerout', () => this.invCloseX.setFill('#ffffff'));
        this.invCloseX.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleInventoryModal(false);
        });

        // Add background and header first so slots appear on top!
        this.invModalContainer.add([invBgGraphics, invTitle, this.invCloseX]);

        // 5x4 Grid (20 Slot Boxes)
        this.invSlotBoxes = [];
        this.invSlotImages = [];
        this.invSlotTexts = [];

        const cols = 5;
        const rows = 4;
        const colStartX = -108;
        const colStep = 54;
        const rowStartY = -88;
        const rowStep = 54;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                const slotX = colStartX + (c * colStep);
                const slotY = rowStartY + (r * rowStep);

                const slotCont = this.add.container(slotX, slotY);

                // Recessed black slot box (48 x 48)
                const box = this.add.rectangle(0, 0, 48, 48, 0x04070e, 0.98)
                    .setStrokeStyle(2.5, 0x153154)
                    .setInteractive({ useHandCursor: true });

                // Inner bevel highlight top-left
                const bevelTL = this.add.graphics();
                bevelTL.lineStyle(1.5, 0x1a3a63, 0.7);
                bevelTL.beginPath();
                bevelTL.moveTo(-22, 22);
                bevelTL.lineTo(-22, -22);
                bevelTL.lineTo(22, -22);
                bevelTL.strokePath();

                // Inner bevel shadow bottom-right
                const bevelBR = this.add.graphics();
                bevelBR.lineStyle(1.5, 0x020408, 0.7);
                bevelBR.beginPath();
                bevelBR.moveTo(22, -22);
                bevelBR.lineTo(22, 22);
                bevelBR.lineTo(-22, 22);
                bevelBR.strokePath();

                // Sprite image holder
                const img = this.add.image(0, 0, 'item_potion')
                    .setScale(1.35)
                    .setVisible(false);

                // Text fallback holder
                const txt = this.add.text(0, 0, '', {
                    fontSize: '20px'
                }).setOrigin(0.5).setVisible(false);

                slotCont.add([box, bevelTL, bevelBR, img, txt]);
                this.invModalContainer.add(slotCont);

                this.invSlotBoxes.push(box);
                this.invSlotImages.push(img);
                this.invSlotTexts.push(txt);

                // Hover & click interaction on slot
                box.on('pointerover', () => {
                    box.setStrokeStyle(2.5, 0x38bdf8);
                    const inv = getInventory(this.registry);
                    if (idx < inv.length) {
                        img.setScale(1.5);
                        this.showItemDetail(inv[idx]);
                        GameAudio.playHover();
                    } else {
                        this.showItemDetail(null);
                    }
                });

                box.on('pointerout', () => {
                    img.setScale(1.35);
                    this.renderInventorySlots();
                    this.showItemDetail(null);
                });

                box.on('pointerdown', () => {
                    const inv = getInventory(this.registry);
                    if (idx < inv.length) {
                        GameAudio.playClick();
                        this.showItemDetail(inv[idx]);
                    }
                });
            }
        }

        // Bottom Item Detail Bar (compact & neat, underneath row 4)
        const detailBarBg = this.add.rectangle(0, 136, 274, 40, 0x060f1e, 0.95)
            .setStrokeStyle(1.5, 0x142b47);

        this.invDetailTitle = this.add.text(0, 126, 'INVENTARIS GOBLIN (0/20)', {
            fontSize: '15px',
            fontStyle: 'bold',
            fill: '#38bdf8',
            fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        this.invDetailText = this.add.text(0, 143, 'Sorot kotak untuk melihat informasi barang.', {
            fontSize: '11px',
            fill: '#94a3b8',
            fontFamily: FONT_BODY,
            align: 'center',
            wordWrap: { width: 265 }
        }).setOrigin(0.5);

        this.invModalContainer.add([detailBarBg, this.invDetailTitle, this.invDetailText]);
        this.isInvOpen = false;

        // Keyboard triggers: Key '1' and 'I' to toggle full inventory
        this.input.keyboard.on('keydown-ONE', () => {
            if (!this.isTalking) this.toggleInventoryModal();
        });
        this.input.keyboard.on('keydown-NUMPAD_ONE', () => {
            if (!this.isTalking) this.toggleInventoryModal();
        });
        this.input.keyboard.on('keydown-I', () => {
            if (!this.isTalking) this.toggleInventoryModal();
        });

        this.renderInventorySlots();
        this.createSettingsUI();
        this.createMobileControlsUI();
        this.createHealthUI();
    }

    createMobileHUDButton() {
        if (!isMobileDevice()) return;

        // Mobile / Touch Controls HUD Toggle Button (Top Right HUD - Next to Bag at 720)
        this.mobileToggleBtnContainer = this.add.container(675, 26).setDepth(25);

        const mobBtnBg = this.add.rectangle(0, 0, 36, 36, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });

        // Smartphone icon
        const mobIcon = this.add.text(0, 0, '📱', {
            fontSize: '17px'
        }).setOrigin(0.5);

        // Status Indicator Dot (Green if active, Gray if inactive)
        this.mobStatusDot = this.add.circle(12, -12, 4.5, 0x10b981, 1);

        this.mobileToggleBtnContainer.add([mobBtnBg, mobIcon, this.mobStatusDot]);

        mobBtnBg.on('pointerover', () => {
            mobBtnBg.setFillStyle(0x1e293b, 1);
            mobBtnBg.setStrokeStyle(2, 0x38bdf8);
            this.tweens.add({ targets: this.mobileToggleBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 120, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        mobBtnBg.on('pointerout', () => {
            mobBtnBg.setFillStyle(0x0f172a, 0.9);
            mobBtnBg.setStrokeStyle(2, 0x64748b);
            this.updateMobileToggleHUD();
            this.tweens.add({ targets: this.mobileToggleBtnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut' });
        });

        mobBtnBg.on('pointerdown', () => {
            GameAudio.playClick();
            const current = this.isMobileControlsEnabled();
            this.setMobileControlsEnabled(!current);
            this.showToastNotice(!current ? '📱 Tombol HP: AKTIF' : '📱 Tombol HP: NONAKTIF');
        });

        this.updateMobileToggleHUD();
    }

    isMobileControlsEnabled() {
        if (!isMobileDevice()) return false;
        if (this.registry && this.registry.get('touchControlsEnabled') !== undefined) {
            return !!this.registry.get('touchControlsEnabled');
        }
        let enabled = true;
        try {
            const saved = localStorage.getItem('touchControlsEnabled');
            if (saved !== null) {
                enabled = saved === 'true';
            }
        } catch (e) {}
        if (this.registry) this.registry.set('touchControlsEnabled', enabled);
        return enabled;
    }

    setMobileControlsEnabled(enabled) {
        if (this.registry) this.registry.set('touchControlsEnabled', enabled);
        try {
            localStorage.setItem('touchControlsEnabled', enabled ? 'true' : 'false');
        } catch (e) {}
        this.updateMobileControlsVisibility();
        this.updateMobileToggleHUD();
        if (this.mobileSettingsBtn && this.mobileSettingsBtnText) {
            this.mobileSettingsBtn.setFillStyle(enabled ? 0x16a34a : 0xdc2626, 0.9);
            this.mobileSettingsBtnText.setText(enabled ? 'AKTIF [ON]' : 'MATI [OFF]');
        }
    }

    updateMobileToggleHUD() {
        const isEnabled = this.isMobileControlsEnabled();
        if (this.mobStatusDot) {
            this.mobStatusDot.setFillStyle(isEnabled ? 0x10b981 : 0x64748b, 1);
        }
    }

    updateMobileControlsVisibility() {
        if (!this.mobileControlsContainer) return;
        const isModalOrDialogueActive = this.isTalking || this.isSettingsOpen || this.isInvOpen || this.isQuestModalOpen;
        if (isModalOrDialogueActive) {
            this.mobileControlsContainer.setVisible(false);
        } else {
            this.mobileControlsContainer.setVisible(this.isMobileControlsEnabled());
        }
    }

    showToastNotice(text) {
        const toast = this.add.container(400, 70).setDepth(100);
        const bg = this.add.rectangle(0, 0, 240, 30, 0x0f172a, 0.94)
            .setStrokeStyle(1.5, 0x38bdf8);
        const txt = this.add.text(0, 0, text, {
            fontSize: '11px', fontStyle: 'bold', fill: '#f8fafc', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        toast.add([bg, txt]);
        this.tweens.add({
            targets: toast,
            y: 58,
            alpha: 0,
            duration: 1200,
            delay: 450,
            ease: 'Cubic.easeIn',
            onComplete: () => toast.destroy()
        });
    }

    createMobileControlsUI() {
        this.touchState = {
            left: false,
            right: false,
            jump: false
        };

        if (!isMobileDevice()) return;

        this.mobileControlsContainer = this.add.container(0, 0).setDepth(28);

        // ==========================================
        // LEFT & RIGHT D-PAD (Bottom Left HUD)
        // ==========================================
        // 1. Tombol Kiri (Left)
        this.leftBtnContainer = this.add.container(62, 390);
        const leftBg = this.add.rectangle(0, 0, 56, 56, 0x0f172a, 0.78)
            .setStrokeStyle(2, 0x475569)
            .setInteractive(new Phaser.Geom.Rectangle(-10, -10, 76, 76), Phaser.Geom.Rectangle.Contains);
        const leftIcon = this.add.text(0, 0, '◀', {
            fontSize: '24px', fontStyle: 'bold', fill: '#f8fafc', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        this.leftBtnContainer.add([leftBg, leftIcon]);

        leftBg.on('pointerdown', () => {
            this.touchState.left = true;
            leftBg.setFillStyle(0x2563eb, 0.9);
            leftBg.setStrokeStyle(2.5, 0x60a5fa);
            leftIcon.setFill('#ffffff');
            this.tweens.add({ targets: this.leftBtnContainer, scaleX: 0.94, scaleY: 0.94, duration: 80 });
            GameAudio.playHover();
        });
        const releaseLeft = () => {
            this.touchState.left = false;
            leftBg.setFillStyle(0x0f172a, 0.78);
            leftBg.setStrokeStyle(2, 0x475569);
            leftIcon.setFill('#f8fafc');
            this.tweens.add({ targets: this.leftBtnContainer, scaleX: 1, scaleY: 1, duration: 80 });
        };
        leftBg.on('pointerup', releaseLeft);
        leftBg.on('pointerout', releaseLeft);

        // 2. Tombol Kanan (Right)
        this.rightBtnContainer = this.add.container(134, 390);
        const rightBg = this.add.rectangle(0, 0, 56, 56, 0x0f172a, 0.78)
            .setStrokeStyle(2, 0x475569)
            .setInteractive(new Phaser.Geom.Rectangle(-10, -10, 76, 76), Phaser.Geom.Rectangle.Contains);
        const rightIcon = this.add.text(0, 0, '▶', {
            fontSize: '24px', fontStyle: 'bold', fill: '#f8fafc', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        this.rightBtnContainer.add([rightBg, rightIcon]);

        rightBg.on('pointerdown', () => {
            this.touchState.right = true;
            rightBg.setFillStyle(0x2563eb, 0.9);
            rightBg.setStrokeStyle(2.5, 0x60a5fa);
            rightIcon.setFill('#ffffff');
            this.tweens.add({ targets: this.rightBtnContainer, scaleX: 0.94, scaleY: 0.94, duration: 80 });
            GameAudio.playHover();
        });
        const releaseRight = () => {
            this.touchState.right = false;
            rightBg.setFillStyle(0x0f172a, 0.78);
            rightBg.setStrokeStyle(2, 0x475569);
            rightIcon.setFill('#f8fafc');
            this.tweens.add({ targets: this.rightBtnContainer, scaleX: 1, scaleY: 1, duration: 80 });
        };
        rightBg.on('pointerup', releaseRight);
        rightBg.on('pointerout', releaseRight);

        // ==========================================
        // ACTION & JUMP BUTTONS (Bottom Right HUD)
        // ==========================================
        // 3. Tombol Aksi / Interaksi [E] (Action)
        this.actionBtnContainer = this.add.container(660, 390);
        this.actionBg = this.add.rectangle(0, 0, 58, 58, 0x1e1b4b, 0.85)
            .setStrokeStyle(2, 0xf59e0b)
            .setInteractive(new Phaser.Geom.Rectangle(-10, -10, 78, 78), Phaser.Geom.Rectangle.Contains);
        this.actionIcon = this.add.text(0, -7, '⚡', {
            fontSize: '18px', fill: '#fde047'
        }).setOrigin(0.5);
        this.actionText = this.add.text(0, 13, 'AKSI [E]', {
            fontSize: '9px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        this.actionBtnContainer.add([this.actionBg, this.actionIcon, this.actionText]);

        this.actionBg.on('pointerdown', () => {
            GameAudio.playClick();
            this.tweens.add({
                targets: this.actionBtnContainer,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 70,
                yoyo: true
            });
            if (this.isTalking) {
                this.nextDialogue();
            } else if (this.handleActionKey) {
                this.handleActionKey();
            }
        });

        // 4. Tombol Lompat [W / SPASI] (Jump)
        this.jumpBtnContainer = this.add.container(738, 390);
        const jumpBg = this.add.rectangle(0, 0, 58, 58, 0x064e3b, 0.85)
            .setStrokeStyle(2.5, 0x10b981)
            .setInteractive(new Phaser.Geom.Rectangle(-10, -10, 78, 78), Phaser.Geom.Rectangle.Contains);
        const jumpIcon = this.add.text(0, -7, '▲', {
            fontSize: '18px', fontStyle: 'bold', fill: '#6ee7b7', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        const jumpText = this.add.text(0, 13, 'LOMPAT', {
            fontSize: '9px', fontStyle: 'bold', fill: '#a7f3d0', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        this.jumpBtnContainer.add([jumpBg, jumpIcon, jumpText]);

        jumpBg.on('pointerdown', () => {
            this.touchState.jump = true;
            jumpBg.setFillStyle(0x059669, 0.95);
            jumpBg.setStrokeStyle(3, 0x34d399);
            this.tweens.add({ targets: this.jumpBtnContainer, scaleX: 0.92, scaleY: 0.92, duration: 70 });
            if (this.player && this.player.body && (this.player.body.touching.down || this.player.body.blocked.down)) {
                this.player.setVelocityY(-450);
                GameAudio.playHover();
            }
        });
        const releaseJump = () => {
            this.touchState.jump = false;
            jumpBg.setFillStyle(0x064e3b, 0.85);
            jumpBg.setStrokeStyle(2.5, 0x10b981);
            this.tweens.add({ targets: this.jumpBtnContainer, scaleX: 1, scaleY: 1, duration: 70 });
        };
        jumpBg.on('pointerup', releaseJump);
        jumpBg.on('pointerout', releaseJump);

        // Global release failsafe
        this.input.on('pointerup', () => {
            const anyActive = this.input.manager.pointers.some(p => p.isDown);
            if (!anyActive) {
                releaseLeft();
                releaseRight();
                releaseJump();
            }
        });

        this.mobileControlsContainer.add([
            this.leftBtnContainer,
            this.rightBtnContainer,
            this.actionBtnContainer,
            this.jumpBtnContainer
        ]);

        this.updateMobileControlsVisibility();
    }

    updateMobileActionHighlight() {
        if (!this.actionBg || !this.actionText || !this.actionIcon) return;
        if (this.nearTarget) {
            this.actionBg.setFillStyle(0xb45309, 0.95);
            this.actionBg.setStrokeStyle(3, 0xfde047);
            this.actionIcon.setText('✦').setFill('#fef08a');
            this.actionText.setText('AKSI [E]').setFill('#ffffff');
        } else {
            this.actionBg.setFillStyle(0x1e1b4b, 0.85);
            this.actionBg.setStrokeStyle(2, 0xf59e0b);
            this.actionIcon.setText('⚡').setFill('#fde047');
            this.actionText.setText('AKSI [E]').setFill('#fbbf24');
        }
    }

    createHealthUI() {
        if (this.healthContainer) {
            this.healthContainer.destroy();
        }

        this.healthContainer = this.add.container(16, 12).setDepth(20);

        // Pill background (132 x 26) — no visible border
        const hpBg = this.add.rectangle(66, 12, 132, 25, 0x0f172a, 0.85)
            .setInteractive({ useHandCursor: true });

        // Tooltip hint on click
        hpBg.on('pointerdown', () => {
            const hp = getPlayerHP(this.registry);
            this.showToastNotice(`❤️ Kesehatan Aksel: ${hp}/${MAX_PLAYER_HP} HP`);
        });

        const hpLabel = this.add.text(8, 4, 'HP', {
            fontSize: '11px',
            fontStyle: 'bold',
            fill: '#f43f5e',
            fontFamily: FONT_TITLE
        });

        this.hpHeartTexts = [];
        for (let i = 0; i < MAX_PLAYER_HP; i++) {
            const heart = this.add.text(32 + i * 22, 4, '❤️', {
                fontSize: '14px'
            });
            this.hpHeartTexts.push(heart);
        }

        this.hpNumericText = this.add.text(102, 5, '3/3', {
            fontSize: '11px',
            fontStyle: 'bold',
            fill: '#fda4af',
            fontFamily: FONT_BODY
        });

        this.healthContainer.add([hpBg, hpLabel, ...this.hpHeartTexts, this.hpNumericText]);

        this.isInvulnerable = false;
        this.updateHealthHUD();
    }

    updateHealthHUD() {
        const hp = getPlayerHP(this.registry);
        if (this.hpHeartTexts) {
            for (let i = 0; i < MAX_PLAYER_HP; i++) {
                if (this.hpHeartTexts[i]) {
                    if (i < hp) {
                        this.hpHeartTexts[i].setText('❤️');
                        this.hpHeartTexts[i].setAlpha(1);
                    } else {
                        this.hpHeartTexts[i].setText('🖤');
                        this.hpHeartTexts[i].setAlpha(0.5);
                    }
                }
            }
        }
        if (this.hpNumericText) {
            this.hpNumericText.setText(`${hp}/${MAX_PLAYER_HP}`);
            if (hp <= 1) {
                this.hpNumericText.setFill('#ef4444');
            } else {
                this.hpNumericText.setFill('#fda4af');
            }
        }
    }

    takeDamage(amount = 1, knockbackX = 0) {
        if (this.isInvulnerable || !this.player || !this.player.active || this.isRespawning) return;

        const currentHP = getPlayerHP(this.registry);
        const newHP = Math.max(0, currentHP - amount);
        setPlayerHP(this.registry, newHP);
        this.updateHealthHUD();

        GameAudio.playHurt();

        // Screen red flash
        this.cameras.main.flash(180, 225, 29, 72, false);

        if (newHP <= 0) {
            this.handlePlayerDeath();
            return;
        }

        // Apply knockback
        if (this.player.body) {
            if (knockbackX !== 0) {
                this.player.setVelocityX(knockbackX);
            }
            this.player.setVelocityY(-160);
        }

        // Invulnerability frames
        this.isInvulnerable = true;
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            yoyo: true,
            repeat: 5,
            duration: 100,
            onComplete: () => {
                if (this.player) {
                    this.player.setAlpha(1);
                }
                this.isInvulnerable = false;
            }
        });

        this.showToastNotice(`💥 Aksel terkena rintangan! (-${amount} HP)`);
    }

    healPlayer(amount = 1) {
        const currentHP = getPlayerHP(this.registry);
        if (currentHP >= MAX_PLAYER_HP) return false;

        const newHP = Math.min(MAX_PLAYER_HP, currentHP + amount);
        setPlayerHP(this.registry, newHP);
        this.updateHealthHUD();

        GameAudio.playRespawn();
        this.showToastNotice(`✨ Aksel pulih! (+${amount} HP)`);

        // Healing green shine tween
        if (this.player) {
            this.tweens.add({
                targets: this.player,
                tint: 0x4ade80,
                duration: 200,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    if (this.player) this.player.clearTint();
                }
            });
        }
        return true;
    }

    handlePlayerDeath() {
        if (this.isRespawning) return;
        this.isRespawning = true;
        this.isInvulnerable = true;

        if (this.player && this.player.body) {
            this.player.setVelocity(0, 0);
            this.player.setTint(0xef4444);
        }

        this.showToastNotice('💀 Aksel pingsan karena kehabisan darah! Memulihkan diri...');

        // Screen fade to dark red
        this.cameras.main.fadeOut(400, 40, 10, 20);

        this.time.delayedCall(500, () => {
            // Restore HP to full without restarting the game
            setPlayerHP(this.registry, MAX_PLAYER_HP);
            this.updateHealthHUD();
            GameAudio.playRespawn();

            if (typeof this.respawnPlayer === 'function') {
                this.respawnPlayer();
            } else if (this.player) {
                this.player.setPosition(60, 380);
                this.player.setVelocity(0, 0);
                this.player.clearTint();
            }

            this.cameras.main.fadeIn(400, 0, 0, 0);

            // Brief invulnerability post-respawn
            if (this.player) {
                this.tweens.add({
                    targets: this.player,
                    alpha: 0.4,
                    yoyo: true,
                    repeat: 4,
                    duration: 120,
                    onComplete: () => {
                        if (this.player) {
                            this.player.setAlpha(1);
                            this.player.clearTint();
                        }
                        this.isInvulnerable = false;
                        this.isRespawning = false;
                    }
                });
            } else {
                this.isInvulnerable = false;
                this.isRespawning = false;
            }

            this.showToastNotice('❤️ Aksel pulih dan bangkit kembali!');
        });
    }

    createSettingsUI() {
        this.isSettingsOpen = false;

        // Dark modal backdrop
        this.settingsModalOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.75)
            .setDepth(50)
            .setVisible(false)
            .setInteractive();

        this.settingsModalOverlay.on('pointerdown', () => this.toggleSettingsModal(false));

        // Settings Container
        this.settingsModalBox = this.add.container(400, 225).setDepth(51).setVisible(false);

        const isMobile = isMobileDevice();
        const modalHeight = isMobile ? 415 : 390;
        const headerY = isMobile ? -178 : -165;
        const bgmY = isMobile ? -135 : -125;
        const sfxY = isMobile ? -99 : -89;
        const resY = isMobile ? -63 : -53;
        const dividerY = isMobile ? 7 : -21;
        const ctrlTitleY = isMobile ? 20 : -7;
        const ctrlListY = isMobile ? 35 : 8;
        const actionY = isMobile ? 138 : 125;
        const locY = isMobile ? 178 : 165;

        // Modal Frame
        const modalBg = this.add.rectangle(0, 0, 560, modalHeight, 0x0f172a, 0.98)
            .setStrokeStyle(3, 0xf59e0b);
        const headerBg = this.add.rectangle(0, headerY, 560, 42, 0x1e1b4b, 1)
            .setStrokeStyle(1.5, 0x6366f1);
        const title = this.add.text(0, headerY, '⚙️ PENGATURAN & JEDA PERMAINAN', {
            fontSize: '18px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        // 1. Audio BGM
        const bgmLabel = this.add.text(-240, bgmY, '🎵 Musik Latar (BGM):', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const bgmBtn = this.add.rectangle(45, bgmY + 8, 75, 26, GameAudio.bgmEnabled ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const bgmText = this.add.text(45, bgmY + 8, GameAudio.bgmEnabled ? 'ON' : 'OFF', {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const bgmMinusBtn = this.add.rectangle(105, bgmY + 8, 26, 26, 0x334155, 0.95)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const bgmMinusText = this.add.text(105, bgmY + 8, '➖', { fontSize: '10px' }).setOrigin(0.5);

        const bgmVolText = this.add.text(152, bgmY + 8, `${Math.round(GameAudio.bgmVolume * 100)}%`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#38bdf8', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const bgmPlusBtn = this.add.rectangle(200, bgmY + 8, 26, 26, 0x334155, 0.95)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const bgmPlusText = this.add.text(200, bgmY + 8, '➕', { fontSize: '10px' }).setOrigin(0.5);

        bgmMinusBtn.on('pointerdown', () => {
            GameAudio.setBGMVolume(GameAudio.bgmVolume - 0.1);
            bgmVolText.setText(`${Math.round(GameAudio.bgmVolume * 100)}%`);
            GameAudio.playClick();
        });

        bgmPlusBtn.on('pointerdown', () => {
            GameAudio.setBGMVolume(GameAudio.bgmVolume + 0.1);
            bgmVolText.setText(`${Math.round(GameAudio.bgmVolume * 100)}%`);
            GameAudio.playClick();
        });

        bgmBtn.on('pointerdown', () => {
            GameAudio.bgmEnabled = !GameAudio.bgmEnabled;
            if (GameAudio.bgmEnabled) {
                GameAudio.startAmbientBGM();
                bgmBtn.setFillStyle(0x16a34a, 0.9);
                bgmText.setText('ON');
            } else {
                GameAudio.stopAmbientBGM();
                bgmBtn.setFillStyle(0xdc2626, 0.9);
                bgmText.setText('OFF');
            }
            GameAudio.updateGainValues();
            GameAudio.playClick();
        });

        // 2. Audio SFX
        const sfxLabel = this.add.text(-240, sfxY, '🔊 Efek Suara (SFX):', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const sfxBtn = this.add.rectangle(45, sfxY + 8, 75, 26, GameAudio.sfxEnabled ? 0x16a34a : 0xdc2626, 0.9)
            .setStrokeStyle(1.5, 0xffffff)
            .setInteractive({ useHandCursor: true });
        const sfxText = this.add.text(45, sfxY + 8, GameAudio.sfxEnabled ? 'ON' : 'OFF', {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const sfxMinusBtn = this.add.rectangle(105, sfxY + 8, 26, 26, 0x334155, 0.95)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const sfxMinusText = this.add.text(105, sfxY + 8, '➖', { fontSize: '10px' }).setOrigin(0.5);

        const sfxVolText = this.add.text(152, sfxY + 8, `${Math.round(GameAudio.sfxVolume * 100)}%`, {
            fontSize: '12px', fontStyle: 'bold', fill: '#4ade80', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        const sfxPlusBtn = this.add.rectangle(200, sfxY + 8, 26, 26, 0x334155, 0.95)
            .setStrokeStyle(1.5, 0x64748b)
            .setInteractive({ useHandCursor: true });
        const sfxPlusText = this.add.text(200, sfxY + 8, '➕', { fontSize: '10px' }).setOrigin(0.5);

        sfxMinusBtn.on('pointerdown', () => {
            GameAudio.setSFXVolume(GameAudio.sfxVolume - 0.1);
            sfxVolText.setText(`${Math.round(GameAudio.sfxVolume * 100)}%`);
            GameAudio.playClick();
        });

        sfxPlusBtn.on('pointerdown', () => {
            GameAudio.setSFXVolume(GameAudio.sfxVolume + 0.1);
            sfxVolText.setText(`${Math.round(GameAudio.sfxVolume * 100)}%`);
            GameAudio.playClick();
        });

        sfxBtn.on('pointerdown', () => {
            GameAudio.sfxEnabled = !GameAudio.sfxEnabled;
            if (GameAudio.sfxEnabled) {
                sfxBtn.setFillStyle(0x16a34a, 0.9);
                sfxText.setText('ON');
                GameAudio.playClick();
            } else {
                sfxBtn.setFillStyle(0xdc2626, 0.9);
                sfxText.setText('OFF');
            }
            GameAudio.updateGainValues();
        });

        // 3. Ukuran Layar / Resolusi
        const resLabel = this.add.text(-240, resY, '🖥️ Resolusi Layar:', {
            fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
        });
        const resBtn = this.add.rectangle(115, resY + 8, 200, 26, 0x1e3a8a, 0.95)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setInteractive({ useHandCursor: true });
        const resText = this.add.text(115, resY + 8, DisplayManager.current.label, {
            fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        resBtn.on('pointerover', () => resBtn.setFillStyle(0x2563eb, 1));
        resBtn.on('pointerout', () => resBtn.setFillStyle(0x1e3a8a, 0.95));
        resBtn.on('pointerdown', () => {
            const nextRes = DisplayManager.cycleNext();
            resText.setText(nextRes.label);
            GameAudio.playClick();
        });

        // Fullscreen Icon Button
        const fsBtn = this.add.rectangle(235, resY + 8, 32, 26, 0x334155, 0.9)
            .setStrokeStyle(1.5, 0x94a3b8)
            .setInteractive({ useHandCursor: true });
        const fsIcon = this.add.text(235, resY + 8, '⛶', {
            fontSize: '13px', fill: '#ffffff'
        }).setOrigin(0.5);

        fsBtn.on('pointerover', () => fsBtn.setFillStyle(0x475569, 1));
        fsBtn.on('pointerout', () => fsBtn.setFillStyle(0x334155, 0.9));
        fsBtn.on('pointerdown', () => {
            DisplayManager.toggleFullscreen(this);
            GameAudio.playClick();
        });

        const settingsElements = [
            modalBg, headerBg, title,
            bgmLabel, bgmBtn, bgmText, bgmMinusBtn, bgmMinusText, bgmVolText, bgmPlusBtn, bgmPlusText,
            sfxLabel, sfxBtn, sfxText, sfxMinusBtn, sfxMinusText, sfxVolText, sfxPlusBtn, sfxPlusText,
            resLabel, resBtn, resText, fsBtn, fsIcon
        ];

        if (isMobile) {
            // 4. Mobile Controls Toggle (Khusus HP/Tablet)
            const mobLabel = this.add.text(-240, -27, '📱 Tombol Layar HP (Touch):', {
                fontSize: '13px', fill: '#f8fafc', fontFamily: FONT_BODY
            });
            const isMobActive = this.isMobileControlsEnabled();
            this.mobileSettingsBtn = this.add.rectangle(160, -19, 130, 26, isMobActive ? 0x16a34a : 0xdc2626, 0.9)
                .setStrokeStyle(1.5, 0xffffff)
                .setInteractive({ useHandCursor: true });
            this.mobileSettingsBtnText = this.add.text(160, -19, isMobActive ? 'AKTIF [ON]' : 'MATI [OFF]', {
                fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
            }).setOrigin(0.5);

            this.mobileSettingsBtn.on('pointerdown', () => {
                const next = !this.isMobileControlsEnabled();
                this.setMobileControlsEnabled(next);
                GameAudio.playClick();
            });

            settingsElements.push(mobLabel, this.mobileSettingsBtn, this.mobileSettingsBtnText);
        }

        // Divider
        const divider = this.add.rectangle(0, dividerY, 500, 1, 0x334155);

        // Controls List
        const ctrlTitle = this.add.text(0, ctrlTitleY, '🎮 PANDUAN KONTROL PERMAINAN', {
            fontSize: '12px', fontStyle: 'bold', fill: '#93c5fd', fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        const ctrlListStr = isMobile
            ? '▶ [A] / [D] / [◀] [▶] : Bergerak Kiri / Kanan\n' +
              '▶ [W] / [SPASI] / [▲] : Melompat\n' +
              '▶ [E] / [⚡ AKSI]     : Berinteraksi dengan Karakter / Objek\n' +
              '▶ [1] / [I] / [Tas]   : Buka Daftar Lengkap Tas Inventory\n' +
              '▶ [Q] / [Quest Bar]   : Buka / Tutup Catatan Misi / Quest\n' +
              '▶ [📱 Icon HP]        : Tombol Sentuh On-Screen Pengguna HP'
            : '▶ [A] / [D]        : Bergerak Kiri / Kanan\n' +
              '▶ [W] / [SPASI]    : Melompat\n' +
              '▶ [E]              : Berinteraksi dengan Karakter / Objek\n' +
              '▶ [1] / [I]        : Buka Daftar Lengkap Tas Inventory\n' +
              '▶ [Q]              : Buka / Tutup Catatan Misi / Quest\n' +
              '▶ [☰] / [ESC]     : Buka / Tutup Pengaturan & Jeda';

        const ctrlList = this.add.text(-240, ctrlListY, ctrlListStr, {
            fontSize: '11px', fill: '#cbd5e1', fontFamily: FONT_BODY, lineSpacing: 3
        });

        // Action Buttons: Resume & Quit to Title
        const resumeBtn = this.add.rectangle(-130, actionY, 220, 36, 0x2563eb, 0.95)
            .setStrokeStyle(2, 0x93c5fd)
            .setInteractive({ useHandCursor: true });
        const resumeText = this.add.text(-130, actionY, '▶ LANJUTKAN [ESC]', {
            fontSize: '13px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        resumeBtn.on('pointerover', () => resumeBtn.setFillStyle(0x3b82f6, 1));
        resumeBtn.on('pointerout', () => resumeBtn.setFillStyle(0x2563eb, 0.95));
        resumeBtn.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettingsModal(false);
        });

        // Quit to Title Menu Button
        const quitBtn = this.add.rectangle(130, actionY, 220, 36, 0x991b1b, 0.95)
            .setStrokeStyle(2, 0xf87171)
            .setInteractive({ useHandCursor: true });
        const quitText = this.add.text(130, actionY, '🚪 KELUAR KE MENU', {
            fontSize: '13px', fontStyle: 'bold', fill: '#ffffff', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        quitBtn.on('pointerover', () => quitBtn.setFillStyle(0xdc2626, 1));
        quitBtn.on('pointerout', () => quitBtn.setFillStyle(0x991b1b, 0.95));
        quitBtn.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleSettingsModal(false);
            this.cameras.main.fadeOut(350, 0, 0, 0);
            this.time.delayedCall(400, () => {
                this.scene.start('TitleScene');
            });
        });

        // Bottom Location Info Badge (Moved from Top Left HUD into Hamburger Menu)
        const locBadgeBg = this.add.rectangle(0, locY, 510, 26, 0x060f1e, 0.95)
            .setStrokeStyle(1.5, 0x1e3a8a);
        this.settingsLocationText = this.add.text(0, locY, '📍 Lokasi: Rumah Aksel & Rachael (Halaman Teras)', {
            fontSize: '13px', fontStyle: 'bold', fill: '#4ade80', fontFamily: FONT_TITLE
        }).setOrigin(0.5);

        settingsElements.push(
            divider, ctrlTitle, ctrlList,
            resumeBtn, resumeText,
            quitBtn, quitText,
            locBadgeBg, this.settingsLocationText
        );

        this.settingsModalBox.add(settingsElements);

        // Key [P] listener for settings
        this.input.keyboard.on('keydown-P', () => {
            this.toggleSettingsModal();
        });
    }

    toggleSettingsModal(forceState = null) {
        if (this.isTalking) return;
        const nextState = forceState !== null ? forceState : !this.isSettingsOpen;
        if (nextState) {
            if (this.isInvOpen) this.toggleInventoryModal();
            if (this.isQuestModalOpen) this.toggleQuestModal();
            if (this.player && this.player.body) this.player.setVelocity(0, 0);
        }
        this.isSettingsOpen = nextState;
        this.settingsModalOverlay.setVisible(nextState);
        this.settingsModalBox.setVisible(nextState);
        this.updateMobileControlsVisibility();

        if (nextState) {
            this.settingsModalBox.setScale(0.92);
            this.tweens.add({
                targets: this.settingsModalBox,
                scaleX: 1,
                scaleY: 1,
                duration: 180,
                ease: 'Back.out'
            });
        }
    }

    getItemTextureKey(item) {
        if (!item) return null;
        const name = (typeof item === 'string' ? item : item.id || '').toLowerCase();
        if (name.includes('ramuan') || name.includes('cure') || name.includes('potion') || name.includes('obat')) return 'item_potion';
        if (name.includes('kunci') || name.includes('key')) return 'item_key';
        if (name.includes('seed') || name.includes('permata') || name.includes('gem') || name.includes('kristal') || name.includes('diamond')) return 'item_gem';
        if (name.includes('pisau') || name.includes('belati') || name.includes('dagger') || name.includes('pedang')) return 'item_dagger';
        if (name.includes('magic bread') || name.includes('roti magis')) return 'item_magic_bread';
        if (name.includes('roti') || name.includes('bread')) return 'item_bread';
        if (name.includes('madu') || name.includes('honey')) return 'item_honey';
        if (name.includes('smoker') || name.includes('asap')) return 'item_smoker';
        if (name.includes('tepung') || name.includes('flour')) return 'item_flour';
        if (name.includes('kayu') || name.includes('firewood')) return 'special_firewood';
        return null;
    }

    getItemFallbackEmoji(item) {
        if (!item) return '';
        const name = (typeof item === 'string' ? item : item.id || '').toLowerCase();
        if (name.includes('ramuan') || name.includes('potion')) return '🧪';
        if (name.includes('kunci') || name.includes('key')) return '🗝️';
        if (name.includes('gem') || name.includes('seed')) return '💎';
        if (name.includes('pisau') || name.includes('dagger')) return '🗡️';
        if (name.includes('roti') || name.includes('bread')) return '🍞';
        if (name.includes('madu') || name.includes('honey')) return '🍯';
        if (name.includes('kayu')) return '🪵';
        return '📦';
    }

    renderInventorySlots() {
        const inv = getInventory(this.registry);

        // Update bag badge count indicator in HUD
        if (this.bagBadgeBg && this.bagBadgeText) {
            if (inv.length > 0) {
                this.bagBadgeBg.setVisible(true);
                this.bagBadgeText.setText(inv.length.toString()).setVisible(true);
            } else {
                this.bagBadgeBg.setVisible(false);
                this.bagBadgeText.setVisible(false);
            }
        }

        // Update 20 Grid Slot Boxes (5x4)
        if (this.invSlotBoxes) {
            for (let i = 0; i < this.invSlotBoxes.length; i++) {
                const box = this.invSlotBoxes[i];
                const img = this.invSlotImages ? this.invSlotImages[i] : null;
                const txt = this.invSlotTexts ? this.invSlotTexts[i] : null;

                if (!box) continue;

                if (i < inv.length) {
                    const item = inv[i];
                    box.setFillStyle(0x050a14, 0.98);
                    box.setStrokeStyle(2.5, 0x1b416e);

                    const texKey = this.getItemTextureKey(item);
                    if (texKey && this.textures && this.textures.exists(texKey)) {
                        if (img) {
                            img.setTexture(texKey).setVisible(true).setScale(1.35);
                        }
                        if (txt) txt.setVisible(false);
                    } else {
                        if (txt) {
                            txt.setText(this.getItemFallbackEmoji(item)).setVisible(true);
                        }
                        if (img) img.setVisible(false);
                    }
                } else {
                    box.setFillStyle(0x04070e, 0.98);
                    box.setStrokeStyle(2.5, 0x153154);
                    if (img) img.setVisible(false);
                    if (txt) txt.setVisible(false);
                }
            }
        }

        // Show default header info in detail bar when not hovering a specific item
        if (this.invDetailTitle && this.invDetailText) {
            this.showItemDetail(null);
        }
    }

    showItemDetail(item) {
        if (!this.invDetailTitle || !this.invDetailText) return;
        if (item) {
            const displayName = typeof item === 'string' ? item : item.id;
            const desc = (typeof item === 'object' && item.desc) ? item.desc : 'Item penting dalam perjalanan Aksel.';
            this.invDetailTitle.setText(`🔹 ${displayName.toUpperCase()}`).setFill('#38bdf8');
            this.invDetailText.setText(`"${desc}"`).setFill('#cbd5e1');
        } else {
            const inv = getInventory(this.registry);
            this.invDetailTitle.setText(`📦 INVENTARIS (${inv.length}/20 Slot)`).setFill('#94a3b8');
            this.invDetailText.setText('Sorot kotak untuk melihat informasi barang.').setFill('#64748b');
        }
    }

    toggleInventoryModal(forceState = null) {
        if (this.isTalking) return;
        const nextState = forceState !== null ? forceState : !this.isInvOpen;
        if (nextState) {
            if (this.isQuestModalOpen) this.toggleQuestModal();
            if (this.isSettingsOpen) this.toggleSettingsModal(false);
            if (this.player && this.player.body) this.player.setVelocity(0, 0);
        }
        this.isInvOpen = nextState;
        this.invModalOverlay.setVisible(nextState);
        this.invModalContainer.setVisible(nextState);
        this.updateMobileControlsVisibility();

        if (nextState) {
            GameAudio.playClick();
            if (this.settingsLocationText) {
                const loc = this.currentLocationName || this.registry.get('currentLocationName') || 'Rumah Aksel & Rachael (Halaman Teras)';
                this.settingsLocationText.setText(`📍 Lokasi: ${loc.replace(/^📍\s*/, '')}`);
            }
            this.renderInventorySlots();
            this.invModalContainer.setScale(0.92);
            this.tweens.add({
                targets: this.invModalContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 160,
                ease: 'Back.out'
            });
        }
    }

    createQuestUI() {
        // Quest button (Top Left HUD, aligned with HP / right-side HUD buttons)
        this.questBtnContainer = this.add.container(190, 26).setDepth(25);

        const questBtnBg = this.add.rectangle(0, 0, 72, 36, 0x0f172a, 0.9)
            .setStrokeStyle(2, 0x64748b)
            .setInteractive({ useHandCursor: true });

        const questBtnText = this.add.text(0, 0, 'Quest', {
            fontSize: '14px',
            fontStyle: 'bold',
            fill: '#f8fafc',
            fontFamily: FONT_BODY
        }).setOrigin(0.5);

        this.questBtnContainer.add([questBtnBg, questBtnText]);

        questBtnBg.on('pointerover', () => {
            questBtnBg.setFillStyle(0x1e293b, 1);
            questBtnBg.setStrokeStyle(2, 0xf59e0b);
            questBtnText.setFill('#fde047');
            this.tweens.add({ targets: this.questBtnContainer, scaleX: 1.08, scaleY: 1.08, duration: 120, ease: 'Sine.easeOut' });
            GameAudio.playHover();
        });

        questBtnBg.on('pointerout', () => {
            questBtnBg.setFillStyle(0x0f172a, 0.9);
            questBtnBg.setStrokeStyle(2, 0x64748b);
            questBtnText.setFill('#f8fafc');
            this.tweens.add({ targets: this.questBtnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut' });
        });

        questBtnBg.on('pointerdown', () => {
            GameAudio.playClick();
            this.toggleQuestModal();
        });

        this.questModalOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.6).setDepth(30).setVisible(false);
        this.questModalBox = this.add.rectangle(400, 225, 520, 320, 0x1e1b4b, 0.98).setStrokeStyle(3, 0x818cf8).setDepth(31).setVisible(false);
        this.questTitleText = this.add.text(400, 95, '📜 CATATAN QUEST & OBJEKTIF', { fontSize: '17px', fontStyle: 'bold', fill: '#a5b4fc', fontFamily: FONT_BODY }).setOrigin(0.5).setDepth(32).setVisible(false);
        this.questContentText = this.add.text(170, 135, '', { fontSize: '14px', fill: '#f8fafc', fontFamily: FONT_BODY, lineSpacing: 8 }).setDepth(32).setVisible(false);
        this.questCloseHint = this.add.text(400, 360, 'Tekan [Q] atau Klik untuk Tutup', { fontSize: '12px', fill: '#94a3b8' }).setOrigin(0.5).setDepth(32).setVisible(false);

        this.questModalOverlay.setInteractive();
        this.questModalOverlay.on('pointerdown', () => this.toggleQuestModal());
        this.isQuestModalOpen = false;

        this.updateQuestHUD();
    }

    updateQuestHUD() {
        // Quest details live in the modal; HUD is a compact button only.
    }

    toggleQuestModal() {
        if (this.isInvOpen) this.toggleInventoryModal();
        if (this.isSettingsOpen) this.toggleSettingsModal(false);
        this.isQuestModalOpen = !this.isQuestModalOpen;
        const visible = this.isQuestModalOpen;
        this.questModalOverlay.setVisible(visible);
        this.questModalBox.setVisible(visible);
        this.questTitleText.setVisible(visible);
        this.questContentText.setVisible(visible);
        this.questCloseHint.setVisible(visible);
        this.updateMobileControlsVisibility();

        if (visible) {
            const qState = getQuestState(this.registry);
            let txt = `Bab/Status :  ${qState.chapter}\n`;
            txt += `Misi Aktif  :  ${qState.title}\n\n`;
            txt += `📌 OBJEKTIF UTAMA:\n   ${qState.objective}\n\n`;
            
            if (qState.completedQuests && qState.completedQuests.length > 0) {
                txt += `✅ QUEST SELESAI:\n`;
                qState.completedQuests.forEach(q => {
                    txt += `   ✔ ${q}\n`;
                });
            } else {
                txt += `💡 Tips: Ikuti alur cerita & bicaralah dengan NPC.`;
            }
            
            this.questContentText.setText(txt);
        }
    }

    showChapterBanner(titleText, subText = '') {
        const bannerContainer = this.add.container(400, -80).setDepth(40);
        const bg = this.add.rectangle(0, 0, 800, 80, 0x0f172a, 0.95).setStrokeStyle(3, 0xf59e0b);
        const txt = this.add.text(0, -12, titleText, { fontSize: '22px', fontStyle: 'bold', fill: '#fbbf24', fontFamily: FONT_BODY }).setOrigin(0.5);
        const sub = this.add.text(0, 16, subText, { fontSize: '13px', fill: '#cbd5e1', fontFamily: FONT_BODY }).setOrigin(0.5);
        
        bannerContainer.add([bg, txt, sub]);

        this.tweens.add({
            targets: bannerContainer,
            y: 70,
            duration: 800,
            ease: 'Back.out',
            onComplete: () => {
                this.time.delayedCall(2500, () => {
                    this.tweens.add({
                        targets: bannerContainer,
                        y: -80,
                        duration: 600,
                        ease: 'Power2',
                        onComplete: () => bannerContainer.destroy()
                    });
                });
            }
        });
    }

    createDialogueUI() {
        // Speaker-to-portrait key mapping
        this.portraitMap = {
            'Rachael': 'portrait_rachael',
            'Nenek': 'portrait_nenek',
            'Aksel': 'portrait_aksel',
            'Aksel (Goblin)': 'portrait_aksel_goblin',
            'Aksel (Dalam Hati)': 'portrait_aksel',
            'Madam Joanne': 'portrait_penyihir',
            'Madam Joanne (Penyihir)': 'portrait_penyihir',
            'Penyihir': 'portrait_penyihir',
            'Grandma Mary': 'portrait_mary',
            'Nenek Mary': 'portrait_mary',
            'Mr. Heinreich': 'portrait_heinreich',
            'Heinreich': 'portrait_heinreich',
            'Mr. Breado': 'portrait_breado',
            'Breado': 'portrait_breado',
            'Pemburu Desa': 'portrait_hunter',
            'Pemburu': 'portrait_hunter',
            'Hunter': 'portrait_hunter',
            'Pak Thomas': 'portrait_thomas',
            'Thomas': 'portrait_thomas',
            'Ibu Sarah': 'portrait_sarah',
            'Sarah': 'portrait_sarah',
            'Paman Bob': 'portrait_bob',
            'Bob': 'portrait_bob',
            'Rachael (Sembuh)': 'portrait_rachael_sembuh'
        };

        // Track previous speaker for animation direction
        this._prevSpeaker = null;

        // ===== OVERLAY (dim background) =====
        this.dialogueOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.45).setDepth(20).setVisible(false);

        // ===== ORNATE DIALOGUE BOX (Fire Emblem style golden frame) =====
        const boxY = 382;
        const boxW = 720;
        const boxH = 120;

        // Outer golden frame border (thick)
        this.dialogueFrameOuter = this.add.rectangle(400, boxY, boxW + 12, boxH + 12, 0x8b6914, 1)
            .setDepth(21).setVisible(false);

        // Inner golden accent border
        this.dialogueFrameInner = this.add.rectangle(400, boxY, boxW + 4, boxH + 4, 0xd4a017, 1)
            .setDepth(21).setVisible(false);

        // Main dialogue box background (dark navy)
        this.dialogueBox = this.add.rectangle(400, boxY, boxW, boxH, 0x0a0e27, 0.97)
            .setStrokeStyle(2, 0xb8941f)
            .setDepth(21).setVisible(false);

        // Corner ornaments (golden diamond accents at 4 corners)
        const cornerOffsetX = boxW / 2 + 2;
        const cornerOffsetY = boxH / 2 + 2;
        this.cornerOrnaments = [];
        const cornerPositions = [
            { x: 400 - cornerOffsetX, y: boxY - cornerOffsetY },
            { x: 400 + cornerOffsetX, y: boxY - cornerOffsetY },
            { x: 400 - cornerOffsetX, y: boxY + cornerOffsetY },
            { x: 400 + cornerOffsetX, y: boxY + cornerOffsetY }
        ];
        cornerPositions.forEach(pos => {
            const ornament = this.add.rectangle(pos.x, pos.y, 10, 10, 0xf5c842, 1)
                .setAngle(45).setDepth(22).setVisible(false);
            this.cornerOrnaments.push(ornament);
        });

        // Horizontal decorative gold lines (top & bottom of box)
        this.decoLineTop = this.add.rectangle(400, boxY - boxH / 2, boxW - 30, 2, 0xd4a017, 0.6)
            .setDepth(22).setVisible(false);
        this.decoLineBottom = this.add.rectangle(400, boxY + boxH / 2, boxW - 30, 2, 0xd4a017, 0.6)
            .setDepth(22).setVisible(false);

        // ===== SPEAKER NAME TAB (centered ornamental banner) =====
        const nameTabY = boxY - boxH / 2 - 5;

        // Name tab background (golden banner shape)
        this.nameTabBg = this.add.rectangle(400, nameTabY, 180, 28, 0x1a1440, 0.97)
            .setStrokeStyle(2, 0xd4a017)
            .setDepth(22).setVisible(false);

        // Name tab side ornaments (small golden diamonds on each side)
        this.nameTabOrnL = this.add.rectangle(400 - 95, nameTabY, 8, 8, 0xf5c842, 1)
            .setAngle(45).setDepth(22).setVisible(false);
        this.nameTabOrnR = this.add.rectangle(400 + 95, nameTabY, 8, 8, 0xf5c842, 1)
            .setAngle(45).setDepth(22).setVisible(false);

        // Speaker name text
        this.speakerText = this.add.text(400, nameTabY, '', {
            fontSize: '14px', fontStyle: 'bold', fill: '#f5c842', fontFamily: FONT_BODY
        }).setOrigin(0.5).setDepth(23).setVisible(false);

        // ===== DIALOGUE BODY TEXT =====
        this.dialogueBodyText = this.add.text(400, boxY + 2, '', {
            fontSize: '15px', fill: '#f0f0f0', fontFamily: FONT_BODY,
            wordWrap: { width: boxW - 60 }, align: 'center', lineSpacing: 4
        }).setOrigin(0.5, 0.5).setDepth(23).setVisible(false);

        // ===== CHARACTER PORTRAIT (FE-style, body behind dialogue box) =====
        const portraitDisplayH = 270;
        const portraitDisplayW = 250;
        // Portrait positioned left, body overlaps behind dialogue box
        const portraitBaseX = 155;
        const portraitBaseY = boxY - boxH / 2 - portraitDisplayH / 2 + 65;

        this.portraitImage = this.add.image(portraitBaseX, portraitBaseY, 'portrait_aksel')
            .setDisplaySize(portraitDisplayW, portraitDisplayH)
            .setDepth(20)
            .setVisible(false);

        // Store portrait base position for animations
        this._portraitBaseX = portraitBaseX;
        this._portraitBaseY = portraitBaseY;
        this._portraitDisplayW = portraitDisplayW;
        this._portraitDisplayH = portraitDisplayH;

        // Subtle portrait shadow/glow effect underneath
        this.portraitShadow = this.add.ellipse(portraitBaseX, boxY - boxH / 2 + 10, 130, 16, 0x000000, 0.35)
            .setDepth(19).setVisible(false);

        // Fallback speaker icon (for speakers without portrait e.g. Narator)
        this.portraitFallbackIcon = this.add.text(portraitBaseX, portraitBaseY + 20, '💬', {
            fontSize: '32px'
        }).setOrigin(0.5).setDepth(20).setVisible(false);

        // ===== SKIP BUTTON (top-right of dialogue frame) =====
        this.skipBtn = this.add.rectangle(720, nameTabY, 100, 24, 0x1a1440, 0.9)
            .setStrokeStyle(1.5, 0xd4a017)
            .setDepth(22)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        this.skipBtnText = this.add.text(720, nameTabY, '⏩ SKIP [S]', {
            fontSize: '10px', fontStyle: 'bold', fill: '#f5c842', fontFamily: FONT_BODY
        }).setOrigin(0.5).setDepth(23).setVisible(false);

        this.skipBtn.on('pointerover', () => {
            this.skipBtn.setFillStyle(0x2a2460, 1);
            this.skipBtn.setStrokeStyle(2, 0xf5c842);
        });
        this.skipBtn.on('pointerout', () => {
            this.skipBtn.setFillStyle(0x1a1440, 0.9);
            this.skipBtn.setStrokeStyle(1.5, 0xd4a017);
        });
        this.skipBtn.on('pointerdown', (pointer, localX, localY, event) => {
            if (event && event.stopPropagation) event.stopPropagation();
            this.skipDialogue();
        });

        // ===== CONTINUE PROMPT =====
        this.continuePrompt = this.add.text(400, boxY + boxH / 2 - 8, '▼  Sentuh Layar / E / SPASI', {
            fontSize: '10px', fontStyle: 'bold', fill: '#d4a017', fontFamily: FONT_BODY
        }).setOrigin(0.5, 1).setDepth(23).setVisible(false);

        // Blinking animation for continue prompt
        this._continueBlinkTween = null;

        // ===== CLICK DIALOGUE BOX TO ADVANCE =====
        this.dialogueBox.setInteractive({ useHandCursor: true });
        this.dialogueBox.on('pointerdown', () => {
            if (this.isTalking) this.nextDialogue();
        });

        // ===== KEYBOARD SHORTCUTS =====
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isTalking) {
                this.skipDialogue();
            } else if (this.isSettingsOpen) {
                this.toggleSettingsModal(false);
            } else if (this.isInvOpen) {
                this.toggleInventoryModal();
            } else if (this.isQuestModalOpen) {
                this.toggleQuestModal();
            } else {
                this.toggleSettingsModal(true);
            }
        });
        this.input.keyboard.on('keydown-S', () => {
            if (this.isTalking) this.skipDialogue();
        });
    }

    startDialogue(dialogueList, onCompleteCallback = null) {
        if (!dialogueList || dialogueList.length === 0) {
            if (onCompleteCallback) onCompleteCallback();
            return;
        }

        this.isTalking = true;
        this.activeDialogueList = dialogueList;
        this.currentDialogueIndex = 0;
        this.onDialogueComplete = onCompleteCallback;
        this._prevSpeaker = null;
        GameAudio.playDialogue();
        if (this.player && this.player.body) this.player.setVelocityX(0);
        this.updateMobileControlsVisibility();

        // Show all dialogue UI elements
        const showElements = [
            this.dialogueOverlay, this.dialogueFrameOuter, this.dialogueFrameInner,
            this.dialogueBox, this.decoLineTop, this.decoLineBottom,
            this.nameTabBg, this.nameTabOrnL, this.nameTabOrnR,
            this.speakerText, this.dialogueBodyText, this.continuePrompt,
            this.skipBtn, this.skipBtnText, this.portraitShadow
        ];
        showElements.forEach(el => { if (el) el.setVisible(true); });
        this.cornerOrnaments.forEach(o => o.setVisible(true));
        if (this.promptText) this.promptText.setVisible(false);

        // Start blinking continue prompt
        if (this._continueBlinkTween) this._continueBlinkTween.stop();
        this._continueBlinkTween = this.tweens.add({
            targets: this.continuePrompt,
            alpha: { from: 1, to: 0.3 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Entrance animation: box slides up from below
        const targets = [this.dialogueFrameOuter, this.dialogueFrameInner, this.dialogueBox];
        targets.forEach(t => { if (t) { t.setAlpha(0); t.y += 30; } });
        this.tweens.add({
            targets,
            y: '-=30',
            alpha: 1,
            duration: 250,
            ease: 'Back.easeOut'
        });

        this.displayCurrentDialogue();
    }

    displayCurrentDialogue() {
        const currentData = this.activeDialogueList[this.currentDialogueIndex];
        this.speakerText.setText(currentData.speaker);
        this.dialogueBodyText.setText('');

        // Update character portrait based on speaker or explicit override
        this.updatePortrait(currentData.speaker, currentData.portrait);

        let charIndex = 0;
        if (this.typeTimer) this.typeTimer.remove();

        this.typeTimer = this.time.addEvent({
            delay: 22,
            callback: () => {
                this.dialogueBodyText.setText(currentData.text.substring(0, charIndex));
                charIndex++;
            },
            repeat: currentData.text.length
        });
    }

    updatePortrait(speakerName, explicitPortrait = null) {
        let portraitKey = explicitPortrait || this.portraitMap[speakerName];
        if (!explicitPortrait && speakerName === 'Rachael' && this.registry && this.registry.get('rachaelHealed')) {
            portraitKey = 'portrait_rachael_sembuh';
        }
        if (!portraitKey && speakerName) {
            if (speakerName.includes('Madam Joanne') || speakerName.includes('Penyihir')) {
                portraitKey = 'portrait_penyihir';
            } else if (speakerName.startsWith('Aksel')) {
                portraitKey = 'portrait_aksel';
            } else if (speakerName.startsWith('Rachael')) {
                portraitKey = (this.registry && this.registry.get('rachaelHealed')) ? 'portrait_rachael_sembuh' : 'portrait_rachael';
            }
        }
        const isSameSpeaker = (this._prevSpeaker === (explicitPortrait ? `${speakerName}_${explicitPortrait}` : speakerName));
        this._prevSpeaker = (explicitPortrait ? `${speakerName}_${explicitPortrait}` : speakerName);

        if (portraitKey && this.textures.exists(portraitKey)) {
            // Show the character portrait image
            this.portraitImage.setTexture(portraitKey);
            this.portraitImage.setDisplaySize(this._portraitDisplayW, this._portraitDisplayH);
            const targetScaleX = this.portraitImage.scaleX;
            const targetScaleY = this.portraitImage.scaleY;
            this.portraitImage.setVisible(true);
            if (this.portraitFallbackIcon) this.portraitFallbackIcon.setVisible(false);
            if (this.portraitShadow) this.portraitShadow.setVisible(true);

            if (!isSameSpeaker) {
                // Slide-in animation from the left (Fire Emblem style entrance)
                this.portraitImage.setAlpha(0);
                this.portraitImage.x = this._portraitBaseX - 40;
                this.portraitImage.y = this._portraitBaseY;
                this.portraitImage.setScale(targetScaleX * 0.9, targetScaleY * 0.9);

                this.tweens.add({
                    targets: this.portraitImage,
                    x: this._portraitBaseX,
                    alpha: 1,
                    duration: 280,
                    ease: 'Back.easeOut'
                });

                // Subtle scale bounce retaining correct display size
                this.tweens.add({
                    targets: this.portraitImage,
                    scaleX: targetScaleX,
                    scaleY: targetScaleY,
                    duration: 300,
                    ease: 'Back.easeOut',
                    delay: 50
                });
            }
        } else {
            // No portrait available - show fallback icon
            this.portraitImage.setVisible(false);
            if (this.portraitShadow) this.portraitShadow.setVisible(false);
            if (this.portraitFallbackIcon) this.portraitFallbackIcon.setVisible(true);
        }
    }

    nextDialogue() {
        const currentData = this.activeDialogueList[this.currentDialogueIndex];
        if (this.dialogueBodyText.text.length < currentData.text.length) {
            if (this.typeTimer) this.typeTimer.remove();
            this.dialogueBodyText.setText(currentData.text);
            return;
        }

        this.currentDialogueIndex++;
        if (this.currentDialogueIndex < this.activeDialogueList.length) {
            GameAudio.playDialogue();
            this.displayCurrentDialogue();
        } else {
            this.endDialogue();
        }
    }

    skipDialogue() {
        if (!this.isTalking) return;
        if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
        }
        this.endDialogue();
    }

    endDialogue() {
        this.isTalking = false;
        this._prevSpeaker = null;
        if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
        }

        // Stop blinking
        if (this._continueBlinkTween) {
            this._continueBlinkTween.stop();
            this._continueBlinkTween = null;
        }

        // Hide all dialogue UI elements
        const hideElements = [
            this.dialogueOverlay, this.dialogueFrameOuter, this.dialogueFrameInner,
            this.dialogueBox, this.decoLineTop, this.decoLineBottom,
            this.nameTabBg, this.nameTabOrnL, this.nameTabOrnR,
            this.speakerText, this.dialogueBodyText, this.continuePrompt,
            this.skipBtn, this.skipBtnText,
            this.portraitImage, this.portraitShadow, this.portraitFallbackIcon
        ];
        hideElements.forEach(el => { if (el) el.setVisible(false); });
        if (this.cornerOrnaments) this.cornerOrnaments.forEach(o => o.setVisible(false));

        this.updateMobileControlsVisibility();
        if (this.onDialogueComplete) {
            const cb = this.onDialogueComplete;
            this.onDialogueComplete = null;
            cb();
        }
    }

    showMapLockedNotice(message) {
        if (this.lockedNoticeActive) return;
        this.lockedNoticeActive = true;

        const noticeBox = this.add.container(400, 100).setDepth(35);
        const bg = this.add.rectangle(0, 0, 540, 50, 0x7f1d1d, 0.95).setStrokeStyle(2, 0xef4444);
        const txt = this.add.text(0, -7, '🔒 MAP TERKUNCI! QUEST BELUM SELESAI', {
            fontSize: '12px', fontStyle: 'bold', fill: '#f87171', fontFamily: FONT_BODY
        }).setOrigin(0.5);
        const sub = this.add.text(0, 11, message, {
            fontSize: '11px', fill: '#fecaca', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        noticeBox.add([bg, txt, sub]);

        this.tweens.add({
            targets: noticeBox,
            y: 110,
            duration: 350,
            ease: 'Back.out',
            onComplete: () => {
                this.time.delayedCall(2200, () => {
                    this.tweens.add({
                        targets: noticeBox,
                        alpha: 0,
                        y: 85,
                        duration: 400,
                        onComplete: () => {
                            noticeBox.destroy();
                            this.lockedNoticeActive = false;
                        }
                    });
                });
            }
        });
    }

    checkMapGate({ targetScene, targetData, reqQuestNum, reqItem, lockMessage, direction }) {
        const qState = getQuestState(this.registry);
        const inv = getInventory(this.registry);

        let isLocked = false;

        if (reqQuestNum !== undefined && qState.questNumber < reqQuestNum) {
            isLocked = true;
        }

        if (reqItem && !inv.some(item => item.id === reqItem)) {
            isLocked = true;
        }

        if (isLocked) {
            this.showMapLockedNotice(lockMessage || 'Selesaikan quest di map ini terlebih dahulu!');
            if (direction === 'right') {
                this.player.setX(740);
                this.player.setVelocityX(-150);
            } else if (direction === 'left') {
                this.player.setX(40);
                this.player.setVelocityX(150);
            }
            return false;
        }

        this.scene.start(targetScene, targetData);
        return true;
    }

    drawMapLockIndicator(x, y, labelText) {
        const barrierContainer = this.add.container(x, y).setDepth(12);
        const bg = this.add.rectangle(0, 0, 120, 24, 0x991b1b, 0.9).setStrokeStyle(2, 0xef4444);
        const txt = this.add.text(0, 0, labelText || '🔒 MAP TERKUNCI', {
            fontSize: '10px', fontStyle: 'bold', fill: '#fef2f2', fontFamily: FONT_BODY
        }).setOrigin(0.5);

        barrierContainer.add([bg, txt]);

        this.tweens.add({
            targets: barrierContainer,
            alpha: 0.5,
            yoyo: true,
            repeat: -1,
            duration: 900
        });
    }

    handlePlayerMovementAndBoundaries({
        canExitLeft = false,
        canExitRight = false,
        onExitLeft = null,
        onExitRight = null,
        minX = 20,
        maxX = 780
    } = {}) {
        if (!this.player || !this.player.body) return;

        // Failsafe: bila karakter terdorong keluar atau jatuh dari platform, kembalikan posisi secara aman ke platform
        if (this.player.y > 435) {
            if (typeof this.onPlayerFallHazard === 'function') {
                this.onPlayerFallHazard();
                return;
            }
            this.player.setVelocity(0, 0);
            this.player.setY(380);
            this.player.setX(Phaser.Math.Clamp(this.player.x, 35, 765));
        }

        // Sesuaikan ukuran physics body sesuai bentuk aktif (Aksel Manusia vs Goblin)
        if (this.player.texture && this.player.texture.key === 'player_human') {
            if (this.player._currentTextureKey !== 'player_human') {
                this.player._currentTextureKey = 'player_human';
                this.player.body.setSize(24, 52);
                this.player.body.setOffset(10, 14);
            }
        } else if (this.player.texture && this.player.texture.key === 'player_goblin') {
            if (this.player._currentTextureKey !== 'player_goblin') {
                this.player._currentTextureKey = 'player_goblin';
                this.player.body.setSize(36, 44);
                this.player.body.setOffset(0, 0);
            }
        }

        if (this.isTalking || this.isInvOpen || this.isQuestModalOpen || this.isSettingsOpen) {
            this.player.setVelocityX(0);
            if (this.player.texture && this.player.texture.key === 'player_human' && this.anims.exists('aksel_human_idle')) {
                this.player.anims.play('aksel_human_idle', true);
            }
            return;
        }

        this.updateMobileActionHighlight();

        const touchLeft = this.touchState && this.touchState.left;
        const touchRight = this.touchState && this.touchState.right;
        const touchJump = this.touchState && this.touchState.jump;

        const left = (this.cursors && this.cursors.left && this.cursors.left.isDown) || (this.keys && this.keys.a && this.keys.a.isDown) || touchLeft;
        const right = (this.cursors && this.cursors.right && this.cursors.right.isDown) || (this.keys && this.keys.d && this.keys.d.isDown) || touchRight;
        const jump = (this.cursors && this.cursors.up && this.cursors.up.isDown) || (this.keys && this.keys.w && this.keys.w.isDown) || (this.keys && this.keys.space && this.keys.space.isDown) || touchJump;

        const onGround = this.player.body.touching.down || this.player.body.blocked.down;

        if (this._playerWasInAir && onGround) {
            GameAudio.playLand();
        }
        this._playerWasInAir = !onGround;

        if (left) {
            this.player.setVelocityX(-200);
            this.player.setFlipX(true);
        } else if (right) {
            this.player.setVelocityX(200);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        if (jump && onGround) {
            this.player.setVelocityY(-450);
            GameAudio.playJump();
        }

        // Animasi karakter Aksel Manusia
        if (this.player.texture && this.player.texture.key === 'player_human' && this.anims.exists('aksel_human_idle')) {
            if (!onGround) {
                if (this.player.body.velocity.y < 0) {
                    this.player.anims.play('aksel_human_jump', true);
                } else {
                    this.player.anims.play('aksel_human_fall', true);
                }
            } else if (left || right) {
                this.player.anims.play('aksel_human_walk', true);
            } else {
                this.player.anims.play('aksel_human_idle', true);
            }
        }

        // Batas Layar Kiri (Left Boundary)
        const leftLimit = minX !== undefined ? minX : 20;
        const leftThreshold = canExitLeft ? 30 : leftLimit;
        if (this.player.x <= leftThreshold) {
            if (canExitLeft && onExitLeft) {
                GameAudio.playTransition();
                onExitLeft();
                return;
            } else {
                this.player.setX(leftLimit + 2);
                if (this.player.body.velocity.x < 0) {
                    this.player.setVelocityX(0);
                }
            }
        }

        // Batas Layar Kanan (Right Boundary)
        const rightLimit = maxX !== undefined ? maxX : 770;
        const rightThreshold = canExitRight ? 765 : rightLimit;
        if (this.player.x >= rightThreshold) {
            if (canExitRight && onExitRight) {
                GameAudio.playTransition();
                onExitRight();
                return;
            } else {
                this.player.setX(rightLimit - 2);
                if (this.player.body.velocity.x > 0) {
                    this.player.setVelocityX(0);
                }
            }
        }
    }

    createForestAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Vertical Deep Forest Gradient Sky
        bgG.fillGradientStyle(0x03170e, 0x03170e, 0x082618, 0x082618, 1);
        bgG.fillRect(0, 0, 800, 450);

        // 2. Light Shafts / Sunbeams filtering through high canopy
        bgG.fillStyle(0x6ee7b7, 0.04);
        bgG.beginPath();
        bgG.moveTo(100, 0);
        bgG.lineTo(240, 0);
        bgG.lineTo(330, 420);
        bgG.lineTo(150, 420);
        bgG.closePath();
        bgG.fillPath();

        bgG.beginPath();
        bgG.moveTo(490, 0);
        bgG.lineTo(630, 0);
        bgG.lineTo(730, 420);
        bgG.lineTo(550, 420);
        bgG.closePath();
        bgG.fillPath();

        // 3. Deep Distant Forest Silhouettes (Pine / Conifers)
        const distantPines = [
            { x: 50, w: 70, h: 260 },
            { x: 170, w: 85, h: 290 },
            { x: 290, w: 75, h: 240 },
            { x: 480, w: 90, h: 280 },
            { x: 620, w: 80, h: 250 },
            { x: 730, w: 95, h: 300 }
        ];
        distantPines.forEach(t => {
            bgG.fillStyle(0x062114, 0.95);
            bgG.fillRect(t.x + t.w * 0.42, 418 - t.h, t.w * 0.16, t.h);
            bgG.fillStyle(0x082c1b, 0.9);
            bgG.fillTriangle(t.x, 418 - t.h * 0.25, t.x + t.w * 0.5, 418 - t.h, t.x + t.w, 418 - t.h * 0.25);
            bgG.fillTriangle(t.x - 8, 418 - t.h * 0.05, t.x + t.w * 0.5, 418 - t.h * 0.65, t.x + t.w + 8, 418 - t.h * 0.05);
        });

        // 4. Midground Detailed Forest Trees (Trunks & Canopies)
        const midTrees = [
            { x: 30, trunkW: 24, leafColor: 0x144225 },
            { x: 135, trunkW: 28, leafColor: 0x16532d },
            { x: 500, trunkW: 26, leafColor: 0x144225 },
            { x: 615, trunkW: 30, leafColor: 0x166534 },
            { x: 745, trunkW: 32, leafColor: 0x14532d }
        ];

        midTrees.forEach(tree => {
            // Tree Trunk
            bgG.fillStyle(0x271910, 1);
            bgG.fillRect(tree.x, 0, tree.trunkW, 418);
            // Bark texture highlight
            bgG.fillStyle(0x3e2719, 0.7);
            bgG.fillRect(tree.x + 4, 0, 4, 418);

            // Branches
            bgG.fillStyle(0x271910, 1);
            bgG.fillTriangle(tree.x, 100, tree.x - 30, 70, tree.x, 85);
            bgG.fillTriangle(tree.x + tree.trunkW, 130, tree.x + tree.trunkW + 35, 100, tree.x + tree.trunkW, 115);

            // Foliage clusters
            bgG.fillStyle(tree.leafColor, 0.95);
            bgG.fillCircle(tree.x + tree.trunkW / 2, 40, 55);
            bgG.fillCircle(tree.x - 20, 70, 40);
            bgG.fillCircle(tree.x + tree.trunkW + 25, 90, 45);
        });

        // 5. Overhanging Canopy Ceiling
        bgG.fillStyle(0x0f3e21, 0.95);
        for (let x = -20; x <= 820; x += 50) {
            bgG.fillCircle(x, 10, 45);
        }
        bgG.fillStyle(0x15803d, 0.7);
        for (let x = 10; x <= 800; x += 65) {
            bgG.fillCircle(x, 25, 32);
        }

        // 6. Forest Floor Decor: Bushes, Grass Tufts, Magic Mushrooms
        const bushes = [
            { x: 10, y: 405, r: 26, color: 0x14532d },
            { x: 80, y: 412, r: 20, color: 0x166534 },
            { x: 260, y: 408, r: 24, color: 0x14532d },
            { x: 330, y: 414, r: 18, color: 0x15803d },
            { x: 530, y: 407, r: 25, color: 0x14532d },
            { x: 700, y: 410, r: 22, color: 0x166534 }
        ];
        bushes.forEach(b => {
            bgG.fillStyle(b.color, 0.95);
            bgG.fillCircle(b.x, b.y, b.r);
            bgG.fillCircle(b.x + b.r * 0.6, b.y + 4, b.r * 0.75);
            bgG.fillCircle(b.x - b.r * 0.5, b.y + 6, b.r * 0.7);
        });

        // Grass blades
        bgG.fillStyle(0x22c55e, 0.85);
        for (let gx = 25; gx < 780; gx += 35) {
            bgG.fillTriangle(gx, 418, gx + 4, 404, gx + 8, 418);
            bgG.fillTriangle(gx + 12, 418, gx + 17, 406, gx + 22, 418);
        }

        // Magic Mushrooms
        const mushrooms = [
            { x: 110, y: 413, color: 0xef4444 },
            { x: 118, y: 415, color: 0xef4444 },
            { x: 460, y: 413, color: 0x38bdf8 },
            { x: 670, y: 414, color: 0xa855f7 }
        ];
        mushrooms.forEach(m => {
            bgG.fillStyle(0xf8fafc, 1);
            bgG.fillRect(m.x + 2, m.y, 3, 6);
            bgG.fillStyle(m.color, 1);
            bgG.fillCircle(m.x + 3.5, m.y, 5);
            bgG.fillStyle(0xffffff, 0.9);
            bgG.fillCircle(m.x + 2, m.y - 1, 1.2);
            bgG.fillCircle(m.x + 5, m.y - 1, 1.2);
        });

        // 7. Ambient Glowing Magic Spores / Fireflies
        for (let i = 0; i < 18; i++) {
            const fx = Phaser.Math.Between(30, 770);
            const fy = Phaser.Math.Between(90, 390);
            const firefly = this.add.circle(fx, fy, Phaser.Math.Between(2, 3), 0xa7f3d0, 0.75).setDepth(1);

            this.tweens.add({
                targets: firefly,
                x: fx + Phaser.Math.Between(-30, 30),
                y: fy + Phaser.Math.Between(-25, 25),
                alpha: { from: 0.2, to: 0.9 },
                scale: { from: 0.8, to: 1.4 },
                duration: Phaser.Math.Between(2200, 4500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createWitchYardAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Mystical Twilight / Midnight Sky Gradient
        bgG.fillGradientStyle(0x0a0618, 0x130a2a, 0x271142, 0x3b1456, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Stars
        for (let i = 0; i < 36; i++) {
            const sx = Phaser.Math.Between(15, 785);
            const sy = Phaser.Math.Between(10, 180);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.3, 0.9)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.15, to: 0.95 },
                scale: { from: 0.8, to: 1.3 },
                duration: Phaser.Math.Between(1800, 3800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 3. Eerie Glowing Full Moon (Upper Left, x: 190, y: 75)
        bgG.fillStyle(0xa855f7, 0.06);
        bgG.fillCircle(190, 75, 58);
        bgG.fillStyle(0x38bdf8, 0.08);
        bgG.fillCircle(190, 75, 42);
        bgG.fillStyle(0xfef9c3, 0.15);
        bgG.fillCircle(190, 75, 32);
        bgG.fillStyle(0xfef08a, 0.95);
        bgG.fillCircle(190, 75, 25);
        bgG.fillStyle(0xca8a04, 0.35);
        bgG.fillCircle(182, 70, 5);
        bgG.fillCircle(196, 81, 6);
        bgG.fillCircle(198, 68, 3.5);
        bgG.fillCircle(185, 84, 4);

        // 4. Eerie violet mist clouds drifting slowly
        const clouds = [
            { x: 90, y: 85, w: 140, h: 22 },
            { x: 340, y: 60, w: 170, h: 26 },
            { x: 580, y: 110, w: 130, h: 20 }
        ];
        clouds.forEach(c => {
            bgG.fillStyle(0x581c87, 0.22);
            bgG.fillRoundedRect(c.x, c.y, c.w, c.h, 10);
            bgG.fillCircle(c.x + c.w * 0.35, c.y - 4, c.h * 0.7);
            bgG.fillCircle(c.x + c.w * 0.65, c.y - 6, c.h * 0.85);
        });

        // 5. Distant jagged mountain crags & spooky pine forest silhouette
        bgG.fillStyle(0x110724, 0.95);
        bgG.fillTriangle(0, 418, 140, 230, 280, 418);
        bgG.fillTriangle(190, 418, 360, 210, 530, 418);
        bgG.fillTriangle(440, 418, 590, 240, 740, 418);

        const distantPines = [
            { x: 20, w: 35, h: 140 }, { x: 70, w: 40, h: 160 },
            { x: 260, w: 42, h: 150 }, { x: 310, w: 36, h: 135 },
            { x: 440, w: 45, h: 165 }, { x: 490, w: 38, h: 140 }
        ];
        distantPines.forEach(p => {
            bgG.fillStyle(0x190b33, 0.9);
            bgG.fillRect(p.x + p.w * 0.4, 418 - p.h, p.w * 0.2, p.h);
            bgG.fillTriangle(p.x, 418 - p.h * 0.3, p.x + p.w * 0.5, 418 - p.h, p.x + p.w, 418 - p.h * 0.3);
            bgG.fillTriangle(p.x - 4, 418 - p.h * 0.1, p.x + p.w * 0.5, 418 - p.h * 0.65, p.x + p.w + 4, 418 - p.h * 0.1);
        });

        // 6. Gnarled Twisted Witch Forest Trees (Left side: x: 30-140)
        bgG.fillStyle(0x1a0f28, 1);
        bgG.beginPath();
        bgG.moveTo(45, 418);
        bgG.lineTo(35, 260);
        bgG.lineTo(25, 140);
        bgG.lineTo(40, 140);
        bgG.lineTo(55, 260);
        bgG.lineTo(75, 418);
        bgG.closePath();
        bgG.fillPath();

        bgG.fillTriangle(30, 230, -5, 180, 25, 205);
        bgG.fillTriangle(48, 200, 95, 150, 42, 185);
        bgG.fillTriangle(32, 150, 10, 100, 36, 130);
        bgG.fillTriangle(38, 140, 60, 90, 45, 120);

        bgG.fillStyle(0x28133f, 0.85);
        bgG.fillCircle(15, 130, 30);
        bgG.fillCircle(75, 125, 34);
        bgG.fillCircle(40, 95, 32);

        // Mid-left tree
        bgG.fillStyle(0x160c22, 1);
        bgG.fillRect(345, 180, 18, 238);
        bgG.fillTriangle(345, 270, 305, 220, 345, 250);
        bgG.fillTriangle(363, 250, 405, 210, 363, 235);
        bgG.fillStyle(0x220f35, 0.8);
        bgG.fillCircle(335, 190, 28);
        bgG.fillCircle(375, 180, 26);
        bgG.fillCircle(355, 160, 30);

        // 7. Spooky Weathered Wooden Fence (x: 80 to 590)
        for (let fx = 90; fx <= 590; fx += 55) {
            bgG.fillStyle(0x261738, 0.95);
            bgG.fillRect(fx, 360, 8, 58);
            bgG.fillTriangle(fx - 1, 360, fx + 4, 348, fx + 9, 360);
        }
        bgG.fillStyle(0x35214d, 0.85);
        bgG.fillRect(80, 375, 520, 6);
        bgG.fillRect(80, 395, 520, 6);

        // 8. THE WITCH'S COTTAGE (Right Side: x: 610 to 800)
        bgG.fillStyle(0x241530, 1);
        bgG.fillRect(620, 210, 180, 208);
        // Timber planks vertical lines
        bgG.fillStyle(0x170b20, 0.9);
        for (let px = 635; px < 800; px += 24) {
            bgG.fillRect(px, 210, 2, 208);
        }
        // Heavy timber frame beams
        bgG.fillStyle(0x1a0f24, 1);
        bgG.fillRect(620, 210, 10, 208);
        bgG.fillRect(620, 210, 180, 12);
        bgG.fillRect(620, 330, 180, 8);

        // Stone Chimney rising from roof
        bgG.fillStyle(0x2b2236, 1);
        bgG.fillRect(745, 60, 32, 150);
        bgG.fillStyle(0x3d324c, 1);
        bgG.fillRect(740, 54, 42, 10);
        bgG.fillStyle(0x181220, 0.8);
        for (let cy = 70; cy < 200; cy += 16) {
            bgG.fillRect(745, cy, 32, 2);
        }

        // Crooked Steep Gable Roof
        bgG.fillStyle(0x150b22, 1);
        bgG.fillTriangle(595, 218, 705, 65, 815, 218);
        bgG.fillStyle(0x37194f, 1);
        bgG.fillTriangle(605, 214, 705, 75, 805, 214);
        bgG.fillStyle(0x28103c, 0.8);
        for (let sy = 95; sy <= 200; sy += 18) {
            const spread = (sy - 75) * 1.0;
            bgG.fillRect(705 - spread, sy, spread * 2, 4);
        }

        // Glowing stained-glass diamond window (Left of door, x: 645, y: 275)
        bgG.fillStyle(0xa855f7, 0.25);
        bgG.fillCircle(648, 280, 28);
        bgG.fillStyle(0xfde047, 0.9);
        bgG.fillRoundedRect(634, 265, 28, 36, 12);
        bgG.fillStyle(0xa855f7, 0.6);
        bgG.fillRect(637, 270, 22, 26);
        bgG.fillStyle(0x1f112e, 1);
        bgG.fillRect(647, 265, 3, 36);
        bgG.fillRect(634, 281, 28, 3);

        // Porch roof canopy right above the door
        bgG.fillStyle(0x190d26, 1);
        bgG.fillTriangle(665, 350, 700, 330, 735, 350);
        bgG.fillStyle(0x35194d, 1);
        bgG.fillRect(665, 348, 70, 5);

        // Hanging magical lantern by the door
        bgG.fillStyle(0xf59e0b, 0.3);
        bgG.fillCircle(665, 365, 14);
        bgG.fillStyle(0xfef08a, 0.95);
        bgG.fillCircle(665, 365, 4);
        bgG.fillStyle(0x1f112e, 1);
        bgG.fillRect(664, 352, 2, 10);
        bgG.strokeRect(661, 360, 8, 10);

        // 9. Ground Path & Natural Details
        const steppingStones = [
            { x: 380, y: 422, w: 26, h: 8 },
            { x: 440, y: 420, w: 32, h: 9 },
            { x: 510, y: 423, w: 28, h: 8 },
            { x: 575, y: 421, w: 34, h: 9 },
            { x: 640, y: 422, w: 30, h: 8 },
            { x: 695, y: 420, w: 36, h: 10 }
        ];
        steppingStones.forEach(s => {
            bgG.fillStyle(0x40364d, 0.85);
            bgG.fillRoundedRect(s.x, s.y, s.w, s.h, 4);
            bgG.fillStyle(0x615473, 0.6);
            bgG.fillRoundedRect(s.x + 2, s.y + 1, s.w - 4, 3, 2);
        });

        // Wild overgrown grass tufts along ground edge (y: 418)
        bgG.fillStyle(0x3b1c5a, 0.9);
        for (let gx = 15; gx < 790; gx += 28) {
            bgG.fillTriangle(gx, 418, gx + 4, 404, gx + 8, 418);
            bgG.fillTriangle(gx + 10, 418, gx + 15, 407, gx + 20, 418);
        }
        bgG.fillStyle(0x15803d, 0.6);
        for (let gx = 30; gx < 770; gx += 45) {
            bgG.fillTriangle(gx, 418, gx + 3, 408, gx + 6, 418);
        }

        // Bioluminescent Witch Mushrooms
        const mushrooms = [
            { x: 140, y: 413, col: 0xa855f7, glow: 0xd8b4fe },
            { x: 152, y: 415, col: 0x06b6d4, glow: 0x67e8f9 },
            { x: 280, y: 414, col: 0xa855f7, glow: 0xd8b4fe },
            { x: 420, y: 414, col: 0x22c55e, glow: 0x86efac },
            { x: 615, y: 413, col: 0xa855f7, glow: 0xd8b4fe },
            { x: 624, y: 415, col: 0x06b6d4, glow: 0x67e8f9 }
        ];
        mushrooms.forEach(m => {
            bgG.fillStyle(0xf1f5f9, 0.9);
            bgG.fillRect(m.x + 2, m.y, 3, 6);
            bgG.fillStyle(m.col, 1);
            bgG.fillCircle(m.x + 3.5, m.y, 6);
            bgG.fillStyle(0xffffff, 0.9);
            bgG.fillCircle(m.x + 2, m.y - 1.5, 1.2);
            bgG.fillCircle(m.x + 5.5, m.y - 1.5, 1.2);

            const mGlow = this.add.circle(m.x + 3.5, m.y, 14, m.glow, 0.25).setDepth(0);
            this.tweens.add({
                targets: mGlow,
                alpha: { from: 0.1, to: 0.4 },
                scale: { from: 0.85, to: 1.25 },
                duration: Phaser.Math.Between(1500, 2600),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 10. Chimney Animated Smoke Puffs
        for (let i = 0; i < 6; i++) {
            const smoke = this.add.circle(760, 50, Phaser.Math.Between(5, 9), 0xa855f7, 0.4).setDepth(0);
            this.tweens.add({
                targets: smoke,
                x: 760 - Phaser.Math.Between(20, 60),
                y: 50 - Phaser.Math.Between(40, 80),
                scale: { from: 0.8, to: 2.2 },
                alpha: { from: 0.4, to: 0 },
                duration: 3000 + i * 400,
                delay: i * 500,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 11. Ambient Floating Mana Wisps / Magic Fireflies
        for (let i = 0; i < 22; i++) {
            const fx = Phaser.Math.Between(25, 775);
            const fy = Phaser.Math.Between(80, 395);
            const col = Phaser.Math.RND.pick([0xc084fc, 0x5eead4, 0xfde047, 0xa7f3d0]);
            const wisp = this.add.circle(fx, fy, Phaser.Math.Between(2, 3), col, 0.8).setDepth(1);

            this.tweens.add({
                targets: wisp,
                x: fx + Phaser.Math.Between(-35, 35),
                y: fy + Phaser.Math.Between(-25, 25),
                alpha: { from: 0.2, to: 0.9 },
                scale: { from: 0.7, to: 1.4 },
                duration: Phaser.Math.Between(2000, 4200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createWitchCottageAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Cozy yet Mystical Room Gradient
        bgG.fillGradientStyle(0x0e0618, 0x160a26, 0x220e38, 0x12071f, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Wooden Wall Paneling
        bgG.fillStyle(0x180d24, 1);
        bgG.fillRect(0, 50, 800, 368);
        bgG.fillStyle(0x231333, 0.8);
        for (let px = 0; px <= 800; px += 26) {
            bgG.fillRect(px, 50, 2, 368);
        }
        // Baseboard and chair rail trim
        bgG.fillStyle(0x2e1840, 1);
        bgG.fillRect(0, 404, 800, 14);
        bgG.fillRect(0, 220, 800, 8);

        // 3. Heavy Timber Ceiling Beams
        bgG.fillStyle(0x1a0e26, 1);
        bgG.fillRect(0, 0, 800, 50);
        bgG.fillStyle(0x2a163d, 1);
        for (let bx = 60; bx < 800; bx += 140) {
            bgG.fillRect(bx, 0, 18, 55);
            // Hanging dried herbs & charms
            bgG.fillStyle(Phaser.Math.RND.pick([0xa855f7, 0x10b981, 0xf59e0b]), 0.85);
            bgG.fillCircle(bx + 9, 70, 7);
            bgG.fillCircle(bx + 9, 82, 5);
            bgG.fillStyle(0x78350f, 1);
            bgG.fillRect(bx + 8, 55, 2, 15);
        }

        // 4. Arched Stone Fireplace & Glowing Hearth (Center x: 300-430, y: 220-418)
        bgG.fillStyle(0x292133, 1);
        bgG.fillRect(295, 220, 140, 198);
        bgG.fillStyle(0x130e1a, 1);
        bgG.fillRoundedRect(315, 270, 100, 148, 16);
        // Stone blocks pattern
        bgG.fillStyle(0x3d324c, 0.7);
        for (let fy = 230; fy < 410; fy += 20) {
            bgG.fillRect(295, fy, 140, 2);
        }
        // Fireplace mantel shelf
        bgG.fillStyle(0x4a3b5c, 1);
        bgG.fillRect(285, 215, 160, 14);

        // Glowing fire embers in hearth
        bgG.fillStyle(0xef4444, 0.8);
        bgG.fillCircle(365, 410, 24);
        bgG.fillStyle(0xf59e0b, 0.95);
        bgG.fillCircle(365, 412, 14);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillCircle(365, 413, 7);

        // 5. Bubbling Iron Cauldron over fire
        bgG.fillStyle(0x18181b, 1);
        bgG.fillCircle(365, 360, 28);
        bgG.fillRect(337, 340, 56, 16);
        bgG.fillStyle(0x27272a, 1);
        bgG.fillRect(333, 336, 64, 6);
        // Cauldron bubbling green magic surface
        bgG.fillStyle(0x10b981, 0.95);
        bgG.fillEllipse(365, 340, 24, 7);

        // Animated cauldron potion bubbles
        for (let i = 0; i < 5; i++) {
            const bubble = this.add.circle(365 + Phaser.Math.Between(-16, 16), 338, Phaser.Math.Between(3, 5), 0x34d399, 0.8).setDepth(0);
            this.tweens.add({
                targets: bubble,
                y: 338 - Phaser.Math.Between(25, 55),
                alpha: { from: 0.8, to: 0 },
                scale: { from: 0.8, to: 1.5 },
                duration: 1800 + i * 300,
                delay: i * 400,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // 6. Glowing Arcane Rune Circle on Floorboards
        const runeG = this.add.graphics().setDepth(0);
        runeG.lineStyle(2, 0xa855f7, 0.4);
        runeG.strokeCircle(365, 415, 60);
        runeG.strokeCircle(365, 415, 44);
        runeG.strokeRect(335, 385, 60, 60);
        this.tweens.add({
            targets: runeG,
            alpha: { from: 0.25, to: 0.85 },
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 7. Bookshelves & Alchemical Cabinets (Left and Right background)
        // Left cabinet (x: 80 to 180, y: 180 to 418)
        bgG.fillStyle(0x351947, 1);
        bgG.fillRect(80, 180, 110, 238);
        bgG.fillStyle(0x1c0c28, 1);
        bgG.fillRect(86, 186, 98, 226);
        // Shelves
        for (let sy = 230; sy <= 380; sy += 50) {
            bgG.fillStyle(0x4a2364, 1);
            bgG.fillRect(86, sy, 98, 6);
            // Colorful potion bottles on shelves
            const bottleCols = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xa855f7, 0xec4899];
            for (let bx = 95; bx < 175; bx += 18) {
                const col = Phaser.Math.RND.pick(bottleCols);
                bgG.fillStyle(col, 0.9);
                bgG.fillRect(bx, sy - 14, 10, 14);
                bgG.fillStyle(0xf8fafc, 0.8);
                bgG.fillRect(bx + 3, sy - 18, 4, 4);
            }
        }

        // 8. Wall Candle Sconces (x: 230 and x: 500)
        [230, 500].forEach(cx => {
            bgG.fillStyle(0x78350f, 1);
            bgG.fillRect(cx - 3, 190, 6, 20);
            bgG.fillStyle(0xfef08a, 0.9);
            bgG.fillCircle(cx, 185, 4);
            const flameGlow = this.add.circle(cx, 185, 16, 0xf59e0b, 0.25).setDepth(0);
            this.tweens.add({
                targets: flameGlow,
                scale: { from: 0.8, to: 1.25 },
                alpha: { from: 0.15, to: 0.35 },
                duration: Phaser.Math.Between(800, 1500),
                yoyo: true,
                repeat: -1
            });
        });

        // 9. Floating Mana Wisps in room
        for (let i = 0; i < 12; i++) {
            const mx = Phaser.Math.Between(50, 750);
            const my = Phaser.Math.Between(100, 390);
            const wisp = this.add.circle(mx, my, Phaser.Math.Between(2, 3), 0xc084fc, 0.7).setDepth(1);
            this.tweens.add({
                targets: wisp,
                y: my + Phaser.Math.Between(-15, 15),
                alpha: { from: 0.2, to: 0.85 },
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createGrandmaGardenAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Cheerful Countryside Morning Sky
        bgG.fillGradientStyle(0x38bdf8, 0x60a5fa, 0x93c5fd, 0xfef08a, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Warm Sun with soft halos (x: 710, y: 70)
        bgG.fillStyle(0xfef08a, 0.15);
        bgG.fillCircle(710, 70, 52);
        bgG.fillStyle(0xfde047, 0.35);
        bgG.fillCircle(710, 70, 36);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillCircle(710, 70, 22);

        // 3. Fluffy White Cumulus Clouds
        const clouds = [
            { x: 90, y: 65, w: 120, h: 26 },
            { x: 280, y: 45, w: 150, h: 30 },
            { x: 490, y: 80, w: 110, h: 24 }
        ];
        clouds.forEach(c => {
            bgG.fillStyle(0xffffff, 0.85);
            bgG.fillRoundedRect(c.x, c.y, c.w, c.h, 12);
            bgG.fillCircle(c.x + c.w * 0.35, c.y - 6, c.h * 0.8);
            bgG.fillCircle(c.x + c.w * 0.65, c.y - 8, c.h);
        });

        // 4. Distant Rolling Green Hills
        bgG.fillStyle(0x15803d, 0.7);
        bgG.fillCircle(180, 420, 240);
        bgG.fillCircle(500, 420, 280);
        bgG.fillStyle(0x166534, 0.9);
        bgG.fillCircle(340, 430, 220);
        bgG.fillCircle(720, 420, 200);

        // 5. Grandma Mary's Cozy Countryside Cottage (Left Side: x: 0 to 180, y: 180 to 418)
        bgG.fillStyle(0xfef3c7, 1);
        bgG.fillRect(0, 220, 180, 198);
        // Half-timber wood beams
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(0, 220, 180, 10);
        bgG.fillRect(170, 220, 10, 198);
        bgG.fillRect(85, 220, 8, 198);
        bgG.fillTriangle(0, 310, 85, 230, 85, 310);
        bgG.fillTriangle(85, 230, 170, 310, 85, 310);

        // Cottage Thatched Roof
        bgG.fillStyle(0xb45309, 1);
        bgG.fillTriangle(-20, 225, 90, 110, 200, 225);
        bgG.fillStyle(0xd97706, 1);
        bgG.fillTriangle(-10, 220, 90, 120, 190, 220);

        // Stone Chimney with White Smoke
        bgG.fillStyle(0x475569, 1);
        bgG.fillRect(130, 90, 24, 60);
        bgG.fillStyle(0x64748b, 1);
        bgG.fillRect(126, 84, 32, 8);
        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(142, 80, Phaser.Math.Between(4, 7), 0xffffff, 0.6).setDepth(0);
            this.tweens.add({
                targets: smoke,
                x: 142 + Phaser.Math.Between(15, 40),
                y: 80 - Phaser.Math.Between(30, 60),
                scale: { from: 0.8, to: 2.0 },
                alpha: { from: 0.6, to: 0 },
                duration: 2500 + i * 400,
                delay: i * 600,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // Cottage Window with blooming Flower Box
        bgG.fillStyle(0x38bdf8, 0.85);
        bgG.fillRoundedRect(35, 270, 36, 40, 6);
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(51, 270, 4, 40);
        bgG.fillRect(35, 288, 36, 4);
        // Flower box
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRect(30, 310, 46, 12);
        // Red and yellow flowers
        bgG.fillStyle(0xef4444, 1);
        bgG.fillCircle(38, 308, 4);
        bgG.fillCircle(52, 308, 4);
        bgG.fillCircle(68, 308, 4);
        bgG.fillStyle(0xfde047, 1);
        bgG.fillCircle(45, 306, 3.5);
        bgG.fillCircle(60, 306, 3.5);

        // 6. White Wooden Picket Fence (x: 180 to 800)
        for (let fx = 180; fx <= 800; fx += 32) {
            bgG.fillStyle(0xf8fafc, 0.95);
            bgG.fillRect(fx, 365, 8, 53);
            bgG.fillTriangle(fx - 1, 365, fx + 4, 354, fx + 9, 365);
        }
        bgG.fillStyle(0xe2e8f0, 0.9);
        bgG.fillRect(180, 380, 620, 6);
        bgG.fillRect(180, 400, 620, 6);

        // 7. Bountiful Apple Tree on Far Right (x: 720, y: 418)
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(715, 230, 26, 188);
        bgG.fillStyle(0x15803d, 0.95);
        bgG.fillCircle(728, 200, 55);
        bgG.fillCircle(690, 220, 42);
        bgG.fillCircle(765, 220, 42);
        // Red apples
        const apples = [{ x: 700, y: 190 }, { x: 740, y: 180 }, { x: 715, y: 220 }, { x: 755, y: 230 }, { x: 680, y: 235 }];
        apples.forEach(a => {
            bgG.fillStyle(0xef4444, 1);
            bgG.fillCircle(a.x, a.y, 4.5);
            bgG.fillStyle(0x22c55e, 1);
            bgG.fillRect(a.x - 1, a.y - 6, 2, 2);
        });

        // 8. Vegetable Garden Beds & Flowers on Ground
        // Vegetable soil patch (x: 320 to 520, y: 414)
        bgG.fillStyle(0x78350f, 0.85);
        bgG.fillRoundedRect(310, 412, 220, 10, 4);
        // Sprouting carrots
        for (let cx = 325; cx < 420; cx += 22) {
            bgG.fillStyle(0xf97316, 1);
            bgG.fillTriangle(cx, 416, cx + 3, 412, cx + 6, 416);
            bgG.fillStyle(0x22c55e, 1);
            bgG.fillTriangle(cx + 1, 412, cx + 3, 404, cx + 5, 412);
        }
        // Round cabbages
        for (let cbx = 440; cbx < 520; cbx += 26) {
            bgG.fillStyle(0x16a34a, 1);
            bgG.fillCircle(cbx, 411, 7);
            bgG.fillStyle(0x86efac, 1);
            bgG.fillCircle(cbx, 410, 4);
        }

        // Flower patches along fence
        const flowers = [
            { x: 210, col: 0xef4444 }, { x: 235, col: 0xfde047 },
            { x: 550, col: 0xec4899 }, { x: 580, col: 0x38bdf8 },
            { x: 610, col: 0xfde047 }, { x: 640, col: 0xef4444 }
        ];
        flowers.forEach(f => {
            bgG.fillStyle(0x16a34a, 1);
            bgG.fillRect(f.x + 2, 406, 2, 12);
            bgG.fillStyle(f.col, 1);
            bgG.fillCircle(f.x + 3, 404, 5);
            bgG.fillStyle(0xffffff, 1);
            bgG.fillCircle(f.x + 3, 404, 2);
        });

        // 9. Fluttering Butterflies
        const butterflyCols = [0xfde047, 0x38bdf8, 0xf472b6];
        for (let i = 0; i < 3; i++) {
            const bx = Phaser.Math.Between(220, 680);
            const by = Phaser.Math.Between(260, 360);
            const bFly = this.add.circle(bx, by, 3, butterflyCols[i], 0.9).setDepth(1);
            this.tweens.add({
                targets: bFly,
                x: bx + Phaser.Math.Between(-40, 40),
                y: by + Phaser.Math.Between(-30, 30),
                scaleX: { from: 0.5, to: 1.3 },
                duration: Phaser.Math.Between(1500, 2500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createBeeGardenAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Golden Sunny Meadow Sky
        bgG.fillGradientStyle(0x38bdf8, 0x86efac, 0xfef08a, 0xca8a04, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Rolling Meadow Hills
        bgG.fillStyle(0x16a34a, 0.7);
        bgG.fillCircle(150, 420, 250);
        bgG.fillCircle(450, 420, 300);
        bgG.fillStyle(0x15803d, 0.9);
        bgG.fillCircle(300, 430, 260);
        bgG.fillCircle(680, 430, 240);

        // 3. ANCIENT OAK TREE ON THE RIGHT (Holds Beehive at x: 650, y: 320)
        bgG.fillStyle(0x451a03, 1);
        // Massive Trunk
        bgG.beginPath();
        bgG.moveTo(710, 418);
        bgG.lineTo(690, 250);
        bgG.lineTo(670, 100);
        bgG.lineTo(760, 100);
        bgG.lineTo(780, 418);
        bgG.closePath();
        bgG.fillPath();
        // Sturdy branch extending left to hold the beehive at (650, 320)
        bgG.beginPath();
        bgG.moveTo(690, 280);
        bgG.lineTo(610, 310);
        bgG.lineTo(610, 326);
        bgG.lineTo(690, 302);
        bgG.closePath();
        bgG.fillPath();

        // Lush Oak Leaves Canopy
        bgG.fillStyle(0x14532d, 0.95);
        bgG.fillCircle(730, 110, 75);
        bgG.fillCircle(650, 140, 65);
        bgG.fillCircle(610, 200, 55);
        bgG.fillCircle(640, 250, 45);
        bgG.fillStyle(0x16a34a, 0.85);
        bgG.fillCircle(710, 90, 60);
        bgG.fillCircle(660, 120, 50);

        // 4. Wooden Apiary Bee Boxes on Stilts (x: 460, y: 370)
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(455, 380, 4, 38);
        bgG.fillRect(485, 380, 4, 38);
        bgG.fillStyle(0xfef3c7, 1);
        bgG.fillRect(445, 350, 50, 32);
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRect(442, 346, 56, 6);
        bgG.fillRect(442, 362, 56, 4);
        bgG.fillStyle(0x1c1917, 1);
        bgG.fillRect(464, 372, 12, 4);

        // 5. Wildflower Meadow across Ground
        // Giant Sunflowers (x: 80, 200, 330)
        [80, 200, 330].forEach(sx => {
            bgG.fillStyle(0x15803d, 1);
            bgG.fillRect(sx, 320, 4, 98);
            // Yellow petals
            bgG.fillStyle(0xfacc15, 1);
            bgG.fillCircle(sx + 2, 320, 18);
            // Dark seed center
            bgG.fillStyle(0x713f12, 1);
            bgG.fillCircle(sx + 2, 320, 9);
        });

        // Purple Lavender Spikes & Daisies
        for (let lx = 30; lx < 600; lx += 45) {
            bgG.fillStyle(0x16a34a, 1);
            bgG.fillRect(lx + 2, 370, 2, 48);
            bgG.fillStyle(0xa855f7, 0.95);
            bgG.fillCircle(lx + 3, 370, 5);
            bgG.fillCircle(lx + 3, 378, 4);
            bgG.fillCircle(lx + 3, 386, 4);
        }

        // 6. Cute Animated Bees Buzzing around Hive (at 650, 320) and Flowers
        for (let i = 0; i < 6; i++) {
            const beeContainer = this.add.container(650 + Phaser.Math.Between(-60, 40), 310 + Phaser.Math.Between(-30, 40)).setDepth(1);
            // Bee body (striped)
            const beeBody = this.add.circle(0, 0, 3.5, 0xfacc15);
            const beeStripe = this.add.rectangle(0, 0, 2, 5, 0x18181b);
            const beeWing = this.add.circle(0, -3, 2, 0xffffff, 0.8);
            beeContainer.add([beeBody, beeStripe, beeWing]);

            this.tweens.add({
                targets: beeContainer,
                x: beeContainer.x + Phaser.Math.Between(-35, 35),
                y: beeContainer.y + Phaser.Math.Between(-25, 25),
                duration: Phaser.Math.Between(1000, 2000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // 7. Floating Golden Pollen Particles
        for (let i = 0; i < 18; i++) {
            const px = Phaser.Math.Between(40, 760);
            const py = Phaser.Math.Between(120, 390);
            const pollen = this.add.circle(px, py, Phaser.Math.Between(1, 2), 0xfef08a, 0.75).setDepth(0);
            this.tweens.add({
                targets: pollen,
                y: py + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.2, to: 0.8 },
                duration: Phaser.Math.Between(2000, 3500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createWoodshopAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Warm Golden Hour Sunset Sky
        bgG.fillGradientStyle(0x451a03, 0x7c2d12, 0xc2410c, 0xf59e0b, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Distant Forest Pine Ridge Silhouette
        bgG.fillStyle(0x291206, 0.9);
        const pines = [
            { x: 30, h: 180 }, { x: 80, h: 210 }, { x: 140, h: 190 },
            { x: 440, h: 220 }, { x: 500, h: 185 }, { x: 570, h: 230 },
            { x: 650, h: 200 }, { x: 720, h: 240 }
        ];
        pines.forEach(p => {
            bgG.fillTriangle(p.x, 418, p.x + 30, 418 - p.h, p.x + 60, 418);
        });

        // 3. Mr. Heinreich's Rustic Lumber Workshop Shed (Left: x: 40 to 280, y: 180 to 418)
        bgG.fillStyle(0x271306, 1);
        bgG.fillRect(50, 220, 220, 198);
        // Heavy timber beams
        bgG.fillStyle(0x3e1f0a, 1);
        bgG.fillRect(50, 220, 16, 198);
        bgG.fillRect(254, 220, 16, 198);
        bgG.fillRect(150, 220, 14, 198);
        bgG.fillRect(50, 220, 220, 14);

        // Shed Roof
        bgG.fillStyle(0x1c0b03, 1);
        bgG.fillTriangle(30, 225, 160, 130, 290, 225);
        bgG.fillStyle(0x5c2b0c, 1);
        bgG.fillTriangle(40, 220, 160, 140, 280, 220);

        // Tool Rack on Wall (Saws, Axes, Hammers)
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(80, 260, 60, 8);
        // Crosscut saw
        bgG.fillStyle(0x94a3b8, 1);
        bgG.fillRect(85, 272, 4, 35);
        bgG.fillTriangle(85, 307, 100, 295, 85, 285);
        // Broad axe
        bgG.fillStyle(0x64748b, 1);
        bgG.fillRect(115, 272, 4, 30);
        bgG.fillStyle(0xc084fc, 0.9);
        bgG.fillRect(110, 270, 14, 8);

        // Hanging Oil Lantern with Warm Glow
        bgG.fillStyle(0xf59e0b, 0.35);
        bgG.fillCircle(160, 235, 20);
        bgG.fillStyle(0xfef08a, 1);
        bgG.fillCircle(160, 235, 4);
        bgG.fillStyle(0x1c1917, 1);
        bgG.fillRect(158, 220, 4, 12);

        // 4. Stacks of Cut Timber Logs (Right background: x: 440 to 620)
        const logStackY = [390, 366, 342];
        const logStackCols = [0x92400e, 0x78350f, 0xa16207];
        logStackY.forEach((ly, rowIdx) => {
            const count = 5 - rowIdx;
            const startX = 460 + rowIdx * 14;
            for (let i = 0; i < count; i++) {
                const lx = startX + i * 28;
                bgG.fillStyle(logStackCols[rowIdx], 1);
                bgG.fillCircle(lx, ly, 13);
                // Tree growth rings
                bgG.fillStyle(0xfef3c7, 0.4);
                bgG.strokeCircle(lx, ly, 8);
                bgG.strokeCircle(lx, ly, 4);
                bgG.fillStyle(0x451a03, 1);
                bgG.fillCircle(lx, ly, 2);
            }
        });

        // 5. Tree Stump with Axe Embedded (Center: x: 360, y: 395)
        bgG.fillStyle(0x5c2b0c, 1);
        bgG.fillRoundedRect(350, 395, 28, 23, 4);
        bgG.fillStyle(0xfef3c7, 0.4);
        bgG.fillEllipse(364, 395, 13, 5);
        // Axe handle & blade
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRect(362, 372, 4, 24);
        bgG.fillStyle(0x94a3b8, 1);
        bgG.fillRect(356, 370, 10, 7);

        // 6. Sawhorse & Golden Sawdust on Ground
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(660, 390, 6, 28);
        bgG.fillRect(690, 390, 6, 28);
        bgG.fillRect(650, 386, 55, 6);
        // Pine log on sawhorse
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRoundedRect(645, 376, 65, 12, 4);
        // Sawdust scatter
        bgG.fillStyle(0xfde047, 0.7);
        for (let dx = 330; dx < 740; dx += 18) {
            bgG.fillCircle(dx, 417, Phaser.Math.Between(1, 2.5));
        }
    }

    createFirewoodForestAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Twilight Deep Forest Gradient
        bgG.fillGradientStyle(0x091e17, 0x0f2d22, 0x144030, 0x1b4d3a, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Light Shafts / Moonlight piercing through trees
        bgG.fillStyle(0x6ee7b7, 0.04);
        bgG.beginPath();
        bgG.moveTo(120, 0);
        bgG.lineTo(260, 0);
        bgG.lineTo(360, 420);
        bgG.lineTo(180, 420);
        bgG.closePath();
        bgG.fillPath();

        bgG.beginPath();
        bgG.moveTo(520, 0);
        bgG.lineTo(660, 0);
        bgG.lineTo(760, 420);
        bgG.lineTo(580, 420);
        bgG.closePath();
        bgG.fillPath();

        // 3. Layered Giant Spruce & Pine Trees
        const trees = [
            { x: 80, w: 42, h: 360, leaves: 0x064e3b },
            { x: 230, w: 36, h: 320, leaves: 0x065f46 },
            { x: 420, w: 48, h: 370, leaves: 0x047857 },
            { x: 610, w: 38, h: 340, leaves: 0x064e3b },
            { x: 740, w: 44, h: 380, leaves: 0x065f46 }
        ];

        trees.forEach(t => {
            // Trunk
            bgG.fillStyle(0x1c1917, 1);
            bgG.fillRect(t.x, 418 - t.h, t.w, t.h);
            bgG.fillStyle(0x292524, 0.8);
            bgG.fillRect(t.x + 4, 418 - t.h, 6, t.h);

            // Layered pine boughs
            for (let by = 418 - t.h; by < 320; by += 48) {
                bgG.fillStyle(t.leaves, 0.95);
                bgG.fillTriangle(t.x - 32, by + 45, t.x + t.w / 2, by, t.x + t.w + 32, by + 45);
            }
        });

        // 4. Forest Floor: Mossy Boulders, Ferns, Fallen Logs
        // Mossy Boulder
        bgG.fillStyle(0x334155, 1);
        bgG.fillCircle(170, 415, 24);
        bgG.fillStyle(0x15803d, 0.8);
        bgG.fillCircle(170, 404, 15);

        // Fallen Log
        bgG.fillStyle(0x451a03, 1);
        bgG.fillRoundedRect(490, 408, 90, 14, 4);
        bgG.fillStyle(0x15803d, 0.7);
        bgG.fillRoundedRect(510, 406, 50, 5, 2);

        // Ferns
        for (let fx = 30; fx < 780; fx += 80) {
            bgG.fillStyle(0x059669, 0.85);
            bgG.fillTriangle(fx, 418, fx - 10, 400, fx + 4, 418);
            bgG.fillTriangle(fx + 4, 418, fx + 14, 398, fx + 8, 418);
        }

        // 5. Ambient Glowing Forest Fireflies
        for (let i = 0; i < 20; i++) {
            const fx = Phaser.Math.Between(30, 770);
            const fy = Phaser.Math.Between(100, 390);
            const firefly = this.add.circle(fx, fy, Phaser.Math.Between(2, 3), 0xa7f3d0, 0.8).setDepth(1);
            this.tweens.add({
                targets: firefly,
                x: fx + Phaser.Math.Between(-30, 30),
                y: fy + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.2, to: 0.95 },
                scale: { from: 0.7, to: 1.4 },
                duration: Phaser.Math.Between(2200, 4500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createBakeryMillAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Warm Village Morning Sky
        bgG.fillGradientStyle(0x1e3a5f, 0x2563eb, 0x93c5fd, 0xfef08a, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Soft Clouds
        const clouds = [
            { x: 120, y: 55, w: 130, h: 26 },
            { x: 420, y: 70, w: 160, h: 30 }
        ];
        clouds.forEach(c => {
            bgG.fillStyle(0xffffff, 0.85);
            bgG.fillRoundedRect(c.x, c.y, c.w, c.h, 12);
            bgG.fillCircle(c.x + c.w * 0.4, c.y - 6, c.h * 0.8);
            bgG.fillCircle(c.x + c.w * 0.7, c.y - 8, c.h);
        });

        // 3. Stone Windmill Tower (Right side: x: 620 to 760, y: 120 to 418)
        bgG.fillStyle(0x475569, 1);
        bgG.beginPath();
        bgG.moveTo(640, 418);
        bgG.lineTo(660, 160);
        bgG.lineTo(720, 160);
        bgG.lineTo(740, 418);
        bgG.closePath();
        bgG.fillPath();
        // Windmill Cap
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillTriangle(645, 165, 690, 110, 735, 165);
        // Windmill 4 Blades
        bgG.fillStyle(0x92400e, 1);
        bgG.fillRect(688, 70, 4, 140);
        bgG.fillRect(620, 138, 140, 4);
        // Blade sails
        bgG.fillStyle(0xfef3c7, 0.7);
        bgG.fillRect(692, 70, 16, 60);
        bgG.fillRect(692, 142, 16, 60);
        bgG.fillRect(620, 142, 60, 16);
        bgG.fillRect(700, 122, 60, 16);
        // Center hub
        bgG.fillStyle(0x78350f, 1);
        bgG.fillCircle(690, 140, 7);

        // 4. Mr. Breado's Bakery Shopfront (Left: x: 60 to 280, y: 190 to 418)
        bgG.fillStyle(0x9a3412, 1);
        bgG.fillRect(60, 220, 220, 198);
        // Brick texture pattern
        bgG.fillStyle(0x7c2d12, 0.8);
        for (let by = 230; by < 410; by += 16) {
            bgG.fillRect(60, by, 220, 2);
        }

        // Red and White Striped Bakery Awning
        const awningStripes = 8;
        const stripeW = 220 / awningStripes;
        for (let i = 0; i < awningStripes; i++) {
            bgG.fillStyle(i % 2 === 0 ? 0xef4444 : 0xf8fafc, 1);
            bgG.fillRect(60 + i * stripeW, 200, stripeW, 25);
            bgG.fillCircle(60 + i * stripeW + stripeW / 2, 225, stripeW / 2);
        }

        // Brick Chimney with White Smoke
        bgG.fillStyle(0x7c2d12, 1);
        bgG.fillRect(80, 130, 28, 70);
        bgG.fillStyle(0x9a3412, 1);
        bgG.fillRect(76, 124, 36, 8);
        for (let i = 0; i < 4; i++) {
            const smoke = this.add.circle(94, 115, Phaser.Math.Between(4, 7), 0xffffff, 0.6).setDepth(0);
            this.tweens.add({
                targets: smoke,
                x: 94 + Phaser.Math.Between(15, 35),
                y: 115 - Phaser.Math.Between(30, 60),
                scale: { from: 0.8, to: 2.0 },
                alpha: { from: 0.6, to: 0 },
                duration: 2600 + i * 400,
                delay: i * 600,
                repeat: -1,
                ease: 'Sine.easeOut'
            });
        }

        // Hanging Bakery Sign (Pretzel / Bread)
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRect(200, 230, 44, 24);
        bgG.fillStyle(0xfde047, 1);
        bgG.fillCircle(215, 242, 6);
        bgG.fillCircle(229, 242, 6);

        // 5. Stacks of Flour Sacks & Wooden Barrels
        // Flour Sacks (x: 290 to 350)
        bgG.fillStyle(0xf1f5f9, 1);
        bgG.fillRoundedRect(290, 386, 24, 32, 6);
        bgG.fillRoundedRect(310, 390, 24, 28, 6);
        bgG.fillStyle(0xd97706, 1);
        bgG.fillRect(296, 390, 12, 4);
        bgG.fillRect(316, 394, 12, 4);

        // Wooden Barrel
        bgG.fillStyle(0x78350f, 1);
        bgG.fillRoundedRect(480, 380, 28, 38, 4);
        bgG.fillStyle(0x475569, 1);
        bgG.fillRect(480, 388, 28, 3);
        bgG.fillRect(480, 404, 28, 3);
    }

    createVillageResidentialAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Village Twilight Sky
        bgG.fillGradientStyle(0x0f172a, 0x1e1b4b, 0x312e81, 0x475569, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Stars
        for (let i = 0; i < 26; i++) {
            const sx = Phaser.Math.Between(20, 780);
            const sy = Phaser.Math.Between(10, 150);
            const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xfef08a, Phaser.Math.FloatBetween(0.3, 0.8)).setDepth(0);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.2, to: 0.9 },
                duration: Phaser.Math.Between(1600, 3200),
                yoyo: true,
                repeat: -1
            });
        }

        // 3. Distant Village Ridge & Church Spire
        bgG.fillStyle(0x1e1b4b, 0.8);
        bgG.fillTriangle(30, 418, 120, 260, 210, 418);
        // Church steeple
        bgG.fillRect(520, 240, 30, 178);
        bgG.fillTriangle(515, 240, 535, 170, 555, 240);
        bgG.fillCircle(535, 220, 6);

        // 4. Cobblestone Paved Ground along platform
        for (let cx = 10; cx < 790; cx += 28) {
            bgG.fillStyle(0x334155, 0.9);
            bgG.fillRoundedRect(cx, 419, 24, 10, 3);
            bgG.fillStyle(0x475569, 0.6);
            bgG.fillRoundedRect(cx + 2, 420, 20, 4, 2);
        }

        // 5. Victorian Ornate Street Lamp Posts with Glowing Warm Light
        const lampX = [100, 320, 540, 750];
        lampX.forEach(lx => {
            // Post
            bgG.fillStyle(0x0f172a, 1);
            bgG.fillRect(lx - 2, 290, 5, 128);
            bgG.fillRect(lx - 6, 412, 13, 6);
            // Lantern head
            bgG.fillRect(lx - 6, 280, 13, 12);
            bgG.fillTriangle(lx - 8, 280, lx, 268, lx + 8, 280);

            // Glowing warm light pool
            bgG.fillStyle(0xfde047, 0.9);
            bgG.fillCircle(lx, 286, 5);

            const lampGlow = this.add.circle(lx, 286, 28, 0xf59e0b, 0.22).setDepth(0);
            this.tweens.add({
                targets: lampGlow,
                alpha: { from: 0.15, to: 0.32 },
                scale: { from: 0.9, to: 1.15 },
                duration: Phaser.Math.Between(1200, 2200),
                yoyo: true,
                repeat: -1
            });
        });
    }

    createEastForestAtmosphere() {
        const bgG = this.add.graphics().setDepth(0);

        // 1. Mystical Dusk Gradient
        bgG.fillGradientStyle(0x051f1a, 0x0a2f26, 0x163832, 0x274e44, 1);
        bgG.fillRect(0, 0, 800, 420);

        // 2. Ancient Monolith Runic Stones (Standing Stone at x: 260)
        bgG.fillStyle(0x1e293b, 1);
        bgG.fillRoundedRect(250, 280, 28, 138, 6);
        // Glowing cyan magical rune glyphs
        const runeGlyphs = [
            this.add.text(264, 305, 'ᚱ', { fontSize: '14px', fill: '#38bdf8' }).setOrigin(0.5).setDepth(0),
            this.add.text(264, 335, 'ᚦ', { fontSize: '14px', fill: '#2dd4bf' }).setOrigin(0.5).setDepth(0),
            this.add.text(264, 365, 'ᚨ', { fontSize: '14px', fill: '#38bdf8' }).setOrigin(0.5).setDepth(0)
        ];
        runeGlyphs.forEach(g => {
            this.tweens.add({
                targets: g,
                alpha: { from: 0.3, to: 1 },
                duration: 1800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 3. Ancient Giant Mossy Trees
        const forestTrees = [
            { x: 60, w: 36, foliage: 0x064e3b },
            { x: 480, w: 42, foliage: 0x065f46 },
            { x: 700, w: 38, foliage: 0x047857 }
        ];
        forestTrees.forEach(t => {
            bgG.fillStyle(0x14201a, 1);
            bgG.fillRect(t.x, 140, t.w, 278);
            // Root flares
            bgG.fillTriangle(t.x, 418, t.x - 18, 418, t.x, 380);
            bgG.fillTriangle(t.x + t.w, 418, t.x + t.w + 18, 418, t.x + t.w, 380);
            // Foliage clusters
            bgG.fillStyle(t.foliage, 0.95);
            bgG.fillCircle(t.x + t.w / 2, 130, 60);
            bgG.fillCircle(t.x - 20, 160, 45);
            bgG.fillCircle(t.x + t.w + 20, 160, 45);
        });

        // 4. Drifting Low Ground Mist
        for (let i = 0; i < 4; i++) {
            const mist = this.add.rectangle(100 + i * 180, 412, 180, 18, 0xa7f3d0, 0.12).setDepth(0);
            this.tweens.add({
                targets: mist,
                x: mist.x + 40,
                alpha: { from: 0.08, to: 0.2 },
                duration: 3500 + i * 500,
                yoyo: true,
                repeat: -1
            });
        }

        // 5. Floating Magic Spores
        for (let i = 0; i < 16; i++) {
            const fx = Phaser.Math.Between(20, 780);
            const fy = Phaser.Math.Between(100, 390);
            const spore = this.add.circle(fx, fy, Phaser.Math.Between(2, 3), 0x5eead4, 0.8).setDepth(1);
            this.tweens.add({
                targets: spore,
                x: fx + Phaser.Math.Between(-30, 30),
                y: fy + Phaser.Math.Between(-20, 20),
                alpha: { from: 0.2, to: 0.95 },
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}

// -------------------------------------------------------------
// SCENE 1: HOME SCENE (PROLOGUE ONLY)
// -------------------------------------------------------------
