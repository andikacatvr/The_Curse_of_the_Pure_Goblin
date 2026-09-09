import Phaser from 'phaser';

// Typography System (Google Fonts: Pirata One for Headings 1/2/3, Fredoka for Body Text)
const FONT_TITLE = '"Pirata One", cursive, serif';
const FONT_BODY = '"Fredoka", "Segoe UI", sans-serif';

// Configure Phaser text defaults to Fredoka & High-DPI Super-Sampling (Razor-sharp HD Text)
if (Phaser && Phaser.GameObjects && Phaser.GameObjects.Text) {
    const origSetStyle = Phaser.GameObjects.Text.prototype.setStyle;
    Phaser.GameObjects.Text.prototype.setStyle = function (style, updateText, setDefaults) {
        if (!style) style = {};
        if (!style.fontFamily) style.fontFamily = FONT_BODY;
        // High-DPI supersampling (renders text at 3x canvas resolution for crispness)
        if (style.resolution === undefined) {
            style.resolution = Math.max(3, (window.devicePixelRatio || 1) * 2);
        }
        return origSetStyle.call(this, style, updateText, setDefaults);
    };
}

function isMobileDevice() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();

    // 1. Deteksi mutlak Desktop / PC / Laptop (Windows, macOS Desktop, Linux Desktop) -> Wajib FALSE
    const isWindowsPC = /windows nt|win32|win64/i.test(ua);
    const isMacDesktop = /macintosh|mac os x/i.test(ua) && !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isLinuxDesktop = /linux/i.test(ua) && !/android/i.test(ua);

    if (isWindowsPC || isMacDesktop || isLinuxDesktop) {
        return false;
    }

    // 2. Deteksi Android, Tablet, iPad, & Mobile
    const isAndroid = /android/i.test(ua);
    const isIPad = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /ipad/i.test(ua);
    const isMobilePhone = /iphone|ipod|blackberry|iemobile|opera mini|mobile|crios/i.test(ua);
    const isTabletUA = /tablet|silk|kindle/i.test(ua);

    return isAndroid || isIPad || isMobilePhone || isTabletUA;
}

function getInventory(registry) {
    if (!registry.get('inventory')) {
        registry.set('inventory', []);
    }
    return registry.get('inventory');
}

function getQuestState(registry) {
    if (!registry.get('questState')) {
        registry.set('questState', {
            chapter: 'PROLOG',
            title: 'Mencari Kayu Bakar di Hutan Danau',
            objective: 'Jalan ke arah barat [◀] melintasi Hutan Danau hingga Ujung Danau Kaki Gunung untuk mencari 4 kayu bakar suruhan Nenek.',
            questNumber: 0,
            completedQuests: []
        });
    }
    return registry.get('questState');
}

function setQuestState(registry, newQuestObj) {
    const currentState = getQuestState(registry);
    const updated = { ...currentState, ...newQuestObj };
    registry.set('questState', updated);
}

const TOTAL_FIREWOOD = 4;

function getCollectedFirewoodIds(registry) {
    if (!registry.get('collectedFirewoodIds')) {
        const initial = [];
        const prevCount = registry.get('lakeFirewoodCount') || 0;
        if (prevCount >= 1) initial.push('lake_wood_1');
        if (prevCount >= 2) initial.push('lake_wood_2');
        if (prevCount >= 3) {
            initial.push('mountain_wood_1');
            initial.push('mountain_wood_2');
        }
        registry.set('collectedFirewoodIds', initial);
    }
    return registry.get('collectedFirewoodIds');
}

function isFirewoodCollected(registry, woodId) {
    return getCollectedFirewoodIds(registry).includes(woodId);
}

function addCollectedFirewood(registry, woodId) {
    const list = getCollectedFirewoodIds(registry);
    if (!list.includes(woodId)) {
        list.push(woodId);
        registry.set('collectedFirewoodIds', list);
        registry.set('lakeFirewoodCount', list.length);
    }
    return list.length;
}

function isAllFirewoodCollected(registry) {
    if (registry.get('hasCollectedFirewood')) return true;
    return getCollectedFirewoodIds(registry).length >= TOTAL_FIREWOOD;
}

const MAX_PLAYER_HP = 3;

function getPlayerHP(registry) {
    if (registry.get('playerHP') === undefined) {
        registry.set('playerHP', MAX_PLAYER_HP);
    }
    return registry.get('playerHP');
}

function setPlayerHP(registry, hp) {
    const clamped = Phaser.Math.Clamp(hp, 0, MAX_PLAYER_HP);
    registry.set('playerHP', clamped);
    return clamped;
}

export {
    FONT_TITLE,
    FONT_BODY,
    isMobileDevice,
    getInventory,
    getQuestState,
    setQuestState,
    TOTAL_FIREWOOD,
    getCollectedFirewoodIds,
    isFirewoodCollected,
    addCollectedFirewood,
    isAllFirewoodCollected,
    MAX_PLAYER_HP,
    getPlayerHP,
    setPlayerHP
};
