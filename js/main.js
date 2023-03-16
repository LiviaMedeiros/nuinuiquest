const NUIPARAMS = Object.fromEntries(new URLSearchParams(window.location.search).entries());
let DEBUGMODE = !!(NUIPARAMS.debugmode ?? false);
const TILENUMBERS = !!(NUIPARAMS.tilenumbers ?? false);
const NUIGURUMI = {
    getActor: (_ = Flare) => NUIGURUMI.game.scene.actors.find($ => $ instanceof _),
};

let SEMUTED = false;
let SEVOLUME = 0.5;
let BGMMUTED = false;
let BGMVOLUME = 0.75;

let SCREENDISPLAY = null;
let SCREENSHAKE = true;

let INFOENABLED = false;
const toggleInfo = () => {
    const container = document.getElementById("info-container");
    const toggle = container.style.display === 'none';
    container.style.display = toggle ? 'flex' : 'none';
    document.getElementById('info-icon').firstElementChild.src = `./img/${toggle ? 'icon_close' : 'icon_info'}.png`;
    INFOENABLED = !INFOENABLED;
}

const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
}

let SAVEENABLED = false;
const toggleSave = () => {
    const container = document.getElementById("save-container");
    const toggle = container.style.display === 'none';
    container.style.display = toggle ? 'flex' : 'none';
    document.getElementById('save-icon').firstElementChild.src = `./img/${toggle ? 'icon_close' : 'icon_save'}.png`;
    SAVEENABLED = !SAVEENABLED;
}

const storageAvailable = type => {
    let storage;
    try {
        storage = window[type];
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            e.code === 22 ||
            e.code === 1014 ||
            e.name === 'QuotaExceededError' ||
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            (storage && storage.length !== 0);
    }
}
const SAVEOK = storageAvailable('localStorage');

const confirmDialog = msg => {
    return new Promise((resolve, reject) => {
      let confirmed = window.confirm(msg);
      return confirmed ? resolve(true) : reject(false);
    });
}

const deleteSaveData = () => {
    if (typeof __TAURI__ !== 'undefined') {
        localStorage.clear();
        location.reload();
    } else {
        confirmDialog('Delete Save Data - セーブデータを消去する').then(() => {
            localStorage.clear();
            location.reload();
        }).catch(() => console.log('Save Data not deleted'));
    }
}

const debugSave = () => {
    localStorage.setItem('nuinui-save-stage-1', true);
    localStorage.setItem('nuinui-save-stage-2', true);
    localStorage.setItem('nuinui-save-stage-3', true);
    localStorage.setItem('nuinui-save-stage-4', true);
    localStorage.setItem('nuinui-save-stage-5', true);

    localStorage.setItem('nuinui-save-item-bow', true);
    localStorage.setItem('nuinui-save-item-gun', true);
    localStorage.setItem('nuinui-save-item-clock', true);
    localStorage.setItem('nuinui-save-item-jump', true);

    localStorage.setItem('nuinui-save-item-fire', true);
    localStorage.setItem('nuinui-save-item-rocket', true);
    localStorage.setItem('nuinui-save-item-petal', true);
    localStorage.setItem('nuinui-save-item-sword', true);
    localStorage.setItem('nuinui-save-item-shield', true);
    localStorage.setItem('nuinui-save-item-dual', true);
    
    localStorage.setItem('nuinui-save-achievement-1', true);
    localStorage.setItem('nuinui-save-achievement-2', true);
    localStorage.setItem('nuinui-save-achievement-3', true);
    localStorage.setItem('nuinui-save-achievement-4', true);

    localStorage.setItem('nuinui-save-achievement-5', true);
    localStorage.setItem('nuinui-save-achievement-6', true);
    localStorage.setItem('nuinui-save-achievement-7', true);
    localStorage.setItem('nuinui-save-achievement-8', true);

    localStorage.setItem('nuinui-save-achievement-9', true);
    localStorage.setItem('nuinui-save-achievement-10', true);
    localStorage.setItem('nuinui-save-achievement-11', true);
    localStorage.setItem('nuinui-save-achievement-12', true);

    localStorage.setItem('nuinui-save-achievement-13', true);
    localStorage.setItem('nuinui-save-achievement-14', true);
    localStorage.setItem('nuinui-save-achievement-15', true);
    localStorage.setItem('nuinui-save-achievement-16', true);

    localStorage.setItem('nuinui-save-achievement-17', true);
    localStorage.setItem('nuinui-save-achievement-18', true);
    localStorage.setItem('nuinui-save-achievement-19', true);
    localStorage.setItem('nuinui-save-achievement-20', true);
}

if (NUIPARAMS.debugsave) {
    debugSave();
}

window.addEventListener('load', () => {
    INPUTMANAGER = new InputManager();
    // Game
    fetch("save.json").then(res => res.json()).then(res => {
        console.log("game file loaded", res);
        const game = new Game(new Assets(), Object.freeze(res));
        NUIGURUMI.gamefile = res;
        NUIGURUMI.game = game;
        game.assets.load();
        game.start();
    });

    // Sound options
    document.getElementById("se-volume").onchange = e => SEVOLUME = e.target.value;
    document.getElementById("se-volume-icon").onclick = e => {
        SEMUTED = !SEMUTED;
        document.getElementById("se-volume-icon").firstElementChild.src = `./img/${SEMUTED ? 'icon_volume_off' : 'icon_volume_on'}.png`;
    }

    window.onblur = () => {
        if (KEYMODE === 'keyboard') {
            document.getElementById('focus-warning').style.display = 'flex';
            document.getElementById('game-container').style.boxShadow = '0 0 2px 1px #08f';
        }
    }
    window.onfocus = () => {
        document.getElementById('focus-warning').style.display = 'none';
        document.getElementById('game-container').style.boxShadow = '0 0 2px #000';
    }

    document.getElementById("bgm-volume").onchange = e => {
        BGMVOLUME = e.target.value;
    }
    document.getElementById("bgm-volume-icon").onclick = e => {
        BGMMUTED = !BGMMUTED;
        document.getElementById("bgm-volume-icon").firstElementChild.src = `./img/${BGMMUTED ? 'icon_volume_off' : 'icon_volume_on'}.png`;
    }

    if (typeof __TAURI__ !== 'undefined') {
        document.getElementById('fullscreen-icon').style.display = 'none';
    }

    // Navbar
    let mouseMoveTimeout = null;
    document.body.onmousemove = e => {
        document.body.style.cursor = "default";
        document.getElementById('navbar-container').style.top = 0;
        if(mouseMoveTimeout) clearTimeout(mouseMoveTimeout);
        mouseMoveTimeout = setTimeout(() => {
            if (INFOENABLED || OPTIONSENABLED || SAVEENABLED) return;
            document.getElementById('navbar-container').style.top = '-46px';
            document.body.style.cursor = "none";
        }, 1000);
    }
}, { once: true });
