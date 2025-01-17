class Options extends Menu {
    optionIndex = 0;

    options = [
        {
            id:'sfx',
            func2: (game, value) => {
                game.seVolume = Math.max(0, Math.min(1, Math.round((game.seVolume + value) * 10) / 10));
                game.saveData.setOpt('se', game.seVolume);
            }
        },
        {
            id:'bgm',
            func2: (game, value) => {
                game.bgmVolume = Math.max(0, Math.min(1, Math.round((game.bgmVolume + value) * 10) / 10));
                game.saveData.setOpt('bgm', game.bgmVolume);
                if (game.bgm) game.bgm.updateVolume();
            }
        },
        {
            id:'fullscreen',
            values: ['no', 'yes'].map(a => new TextElem(Array.from(a), 'left')),
            func: (game, value) => {
                if (window.__TAURI__) {
                    window.__TAURI__.window.appWindow.isFullscreen().then(res => {
                        window.__TAURI__.window.appWindow.setFullscreen(!res);
                        game.fullscreen = !res;
                    });
                } else {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                    else if (document.exitFullscreen) document.exitFullscreen();
                }
            },
            func2: (game, value) => {
                if (window.__TAURI__) {
                    window.__TAURI__.window.appWindow.isFullscreen().then(res => {
                        window.__TAURI__.window.appWindow.setFullscreen(!res);
                        game.fullscreen = !res;
                    });
                } else {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                    else if (document.exitFullscreen) document.exitFullscreen();
                }
            }
        },
        {
            id:'integer scaling',
            values: ['no', 'yes'].map(a => new TextElem(Array.from(a), 'left')),
            func: (game, value) => {
                game.scale = !game.scale;
                game.resize();
            },
            func2: (game, value) => {
                game.scale = !game.scale;
                game.resize();
            }
        },
        {
            id:'delete save data',
            func: (game, value) => game.menu = new SaveMenu(game, game.menu, 'delete')
        },
        {
            id:'type',
            type: 'gamepad',
            values: ['a', 'b', 'c'].map(a => [a, new TextElem(Array.from(a), 'left')]),
            func2: (game, value) => {
                if (value > 0) {
                    if (GAMEPADTYPE === 'a') GAMEPADTYPE = 'b';
                    else if (GAMEPADTYPE === 'b') GAMEPADTYPE = 'c';
                    else if (GAMEPADTYPE === 'c') GAMEPADTYPE = 'a';
                } else {
                    if (GAMEPADTYPE === 'a') GAMEPADTYPE = 'c';
                    else if (GAMEPADTYPE === 'b') GAMEPADTYPE = 'a';
                    else if (GAMEPADTYPE === 'c') GAMEPADTYPE = 'b';
                }
            }
        }
    ];

    constructor(game, previousMenu=null) {
        super();
        this.previousMenu = previousMenu;
        this.options.find(opt => opt.id === 'sfx').value = game.seVolume;
        this.options.find(opt => opt.id === 'bgm').value = game.bgmVolume;

        this.titleText = new TextElem(Array.from('options'), 'center');
        Object.entries(KEYBOARDINPUT).forEach(([key, value]) => this.options.push({id:key, value:value, type:'keyboard', func: (game) => changeKeyKeyboard(game, key)}));
        this.options.forEach(option => option.text = new TextElem(Array.from(option.id), 'left'));
    }

    menuInit = game => {

    }

    update = game => {
        if (this.closeMenuBuffer && !game.keys.b) {
            this.closeMenuFrame--;
            if (!this.closeMenuFrame) {
                if (this.previousMenu) {
                    this.previousMenu.frameCount = 0;
                    this.previousMenu.progress = 0;
                }
                game.menu = this.previousMenu;
                game.ctx3.clearRect(0, 0, game.width, game.height);
            }
        } else if (game.keys.b && !selectedKey) this.closeMenuBuffer = true;
        else {
            const options = this.options.filter(opt => !opt.type || opt.type === KEYMODE);
            if (this.optionIndex >= options.length) this.optionIndex = 0;

            if (this.downBuffer && !game.keys.down) this.downBuffer = false;
            if (game.keys.down && !this.downBuffer) {
                this.downBuffer = true;
                this.optionIndex++;
                if (this.optionIndex === options.length) this.optionIndex = 0;
                game.playSound('menu_move');
            }

            if (this.upBuffer && !game.keys.up) this.upBuffer = false;
            if (game.keys.up && !this.upBuffer) {
                this.upBuffer = true;
                this.optionIndex--;
                if (this.optionIndex < 0) this.optionIndex = options.length - 1;
                game.playSound('menu_move');
            }

            if (this.leftBuffer && !game.keys.left) this.leftBuffer = false;
            if (this.rightBuffer && !game.keys.right) this.rightBuffer = false;
            if (options[this.optionIndex].func2) {
                if (game.keys.left && !this.leftBuffer) {
                    this.leftBuffer = true;
                    options[this.optionIndex].func2(game, -.1);
                    game.playSound('select');
                }
                if (game.keys.right && !this.rightBuffer) {
                    this.rightBuffer = true;
                    options[this.optionIndex].func2(game, .1);
                    game.playSound('select');
                }
            }

            if (this.aBuffer && !game.keys.a) this.aBuffer = false;
            if (game.keys.a && !this.aBuffer && options[this.optionIndex].func) {
                this.aBuffer = true;
                options[this.optionIndex].func(game, .1);
                game.playSound('select');
            }
        }
        
        this.frameCount++;
    }
    
    drawOptions = (game, cx) => {
        cx.save();

        this.titleText.draw(game, cx, new Vector2(game.width * .5, 8));

        cx.translate(game.width * .5 - 96, 24);

        cx.save();
        this.options.filter(opt => !opt.type || opt.type === KEYMODE).forEach((opt, i) => {
            opt.text.draw(game, cx, new Vector2(16, 0));

            cx.save();
            
            if (this.optionIndex === i) {
                cx.drawImage(game.assets.images['ui_arrow'], 0, 0, 8, 8, 8 - Math.floor(this.frameCount * .05) % 2, 0, 8, 8);
            }

            cx.translate(16, 0);
            switch (opt.id) {
                case 'sfx':
                case 'bgm':
                    const val = game[`${opt.id === 'sfx' ? 'se' : 'bgm'}Volume`];

                    cx.save();
                    cx.fillStyle = '#FFF';
                    cx.translate(96, 0);
                    for (let i = 0; i <= 10; i++) {
                        const currVal = i / 10;
                        if (val === currVal) cx.fillRect(i * 6, 0, 3, 7);
                        else if (val <= currVal) cx.fillRect(i * 6 + 1, 3, 1, 1);
                        else cx.fillRect(i * 6, 2, 3, 3);
                    }
                    cx.restore();
                    break;
                case 'integer scaling':
                case 'fullscreen':
                    opt.values[game[opt.id === 'integer scaling' ? 'scale' : opt.id] ? 1 : 0].draw(game, cx, new Vector2(96, 0));
                    break;
                case 'left':
                case 'right':
                case 'up':
                case 'down':
                case 'l':
                case 'r':
                case 'a':
                case 'b':
                case 'c':
                case 'start':
                    if (opt.value) new TextElem(Array.from(opt.value.toLowerCase()), 'left').draw(game, cx, new Vector2(96, 0));
                    break;
                case 'type':
                    new TextElem(Array.from(GAMEPADTYPE), 'left').draw(game, cx, new Vector2(96, 0));
                    cx.drawImage(game.assets.images[`opt_type_${GAMEPADTYPE}`], 0, 0, 110, 32, 24, 16, 110, 32);
                default:
                    break;
            }
            cx.restore();
            cx.translate(0, opt.type === 'keyboard' ? 8 : 12);
            if ([1, 3, 4].includes(i)) cx.translate(0, 8);
        });
        cx.restore();

        cx.restore();
    }
}