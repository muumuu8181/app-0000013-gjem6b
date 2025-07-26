// NEON TETRIS - Ultimate Block Experience

class NeonTetris {
    constructor() {
        // ゲーム設定
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 30;
        this.DROP_TIME = 1000;
        
        // テトロミノ定義
        this.TETROMINOS = {
            I: {
                shape: [[1,1,1,1]],
                color: '#00d4ff',
                glowColor: 'rgba(0, 212, 255, 0.6)'
            },
            O: {
                shape: [[1,1],[1,1]],
                color: '#ffff00',
                glowColor: 'rgba(255, 255, 0, 0.6)'
            },
            T: {
                shape: [[0,1,0],[1,1,1]],
                color: '#bc13fe',
                glowColor: 'rgba(188, 19, 254, 0.6)'
            },
            S: {
                shape: [[0,1,1],[1,1,0]],
                color: '#39ff14',
                glowColor: 'rgba(57, 255, 20, 0.6)'
            },
            Z: {
                shape: [[1,1,0],[0,1,1]],
                color: '#ff006e',
                glowColor: 'rgba(255, 0, 110, 0.6)'
            },
            J: {
                shape: [[1,0,0],[1,1,1]],
                color: '#00a8ff',
                glowColor: 'rgba(0, 168, 255, 0.6)'
            },
            L: {
                shape: [[0,0,1],[1,1,1]],
                color: '#ff9f00',
                glowColor: 'rgba(255, 159, 0, 0.6)'
            }
        };
        
        // ゲーム状態
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.heldPiece = null;
        this.canHold = true;
        this.gameActive = false;
        this.isPaused = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.dropTimer = 0;
        this.lastTime = 0;
        
        // パワーアップ
        this.powerUps = {
            bomb: 3,
            time: 2,
            laser: 2,
            ghost: 1
        };
        this.activePowerUp = null;
        this.slowMotionActive = false;
        
        // エフェクト
        this.particles = [];
        this.lineClears = [];
        this.shakeAmount = 0;
        
        // 実績
        this.achievements = {
            'first-line': false,
            'tetris': false,
            't-spin': false,
            'combo-king': false
        };
        
        // サウンド
        this.soundEnabled = true;
        this.audioContext = null;
        this.sounds = {};
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudio();
        this.initializeBoard();
    }
    
    initializeElements() {
        // キャンバス
        this.gameCanvas = document.getElementById('gameCanvas');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.effectCanvas = document.getElementById('effectCanvas');
        this.effectCtx = this.effectCanvas.getContext('2d');
        this.particleCanvas = document.getElementById('particleCanvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        // UI要素
        this.scoreElement = document.getElementById('score');
        this.linesElement = document.getElementById('lines');
        this.levelElement = document.getElementById('level');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.comboCount = document.getElementById('comboCount');
        this.gameOverlay = document.getElementById('gameOverlay');
        
        // パワーアップカウント
        this.bombCountElement = document.getElementById('bombCount');
        this.timeCountElement = document.getElementById('timeCount');
        this.laserCountElement = document.getElementById('laserCount');
        this.ghostCountElement = document.getElementById('ghostCount');
    }
    
    setupEventListeners() {
        // ボタン
        document.getElementById('playBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('soundBtn').addEventListener('click', () => this.toggleSound());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // パワーアップ
        document.getElementById('bombPower').addEventListener('click', () => this.activatePowerUp('bomb'));
        document.getElementById('timePower').addEventListener('click', () => this.activatePowerUp('time'));
        document.getElementById('laserPower').addEventListener('click', () => this.activatePowerUp('laser'));
        document.getElementById('ghostPower').addEventListener('click', () => this.activatePowerUp('ghost'));
        
        // キーボード
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // モバイルコントロール
        this.setupMobileControls();
        
        // タッチサポート検出
        if ('ontouchstart' in window) {
            document.getElementById('mobileControls').classList.add('active');
        }
    }
    
    setupMobileControls() {
        document.getElementById('mobileLeft').addEventListener('click', () => this.movePiece(-1, 0));
        document.getElementById('mobileRight').addEventListener('click', () => this.movePiece(1, 0));
        document.getElementById('mobileDown').addEventListener('click', () => this.movePiece(0, 1));
        document.getElementById('mobileDrop').addEventListener('click', () => this.hardDrop());
        document.getElementById('mobileRotate').addEventListener('click', () => this.rotatePiece(1));
        document.getElementById('mobileHold').addEventListener('click', () => this.holdPiece());
    }
    
    handleKeyPress(e) {
        if (!this.gameActive || this.isPaused) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                this.score += 1;
                break;
            case 'ArrowUp':
            case 'z':
            case 'Z':
                e.preventDefault();
                this.rotatePiece(1);
                break;
            case 'x':
            case 'X':
                e.preventDefault();
                this.rotatePiece(-1);
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'c':
            case 'C':
                e.preventDefault();
                this.holdPiece();
                break;
        }
    }
    
    initializeAudio() {
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createSounds();
            }
        }, { once: true });
    }
    
    createSounds() {
        // 移動音
        this.sounds.move = () => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'square';
            osc.frequency.value = 200;
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.1);
        };
        
        // 回転音
        this.sounds.rotate = () => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.15);
        };
        
        // ドロップ音
        this.sounds.drop = () => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        };
        
        // ライン消去音
        this.sounds.clear = (lines) => {
            for (let i = 0; i < lines; i++) {
                setTimeout(() => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.value = 440 * Math.pow(1.2, i);
                    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.start();
                    osc.stop(this.audioContext.currentTime + 0.5);
                }, i * 100);
            }
        };
        
        // テトリス音
        this.sounds.tetris = () => {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.start();
                    osc.stop(this.audioContext.currentTime + 0.3);
                }, i * 150);
            });
        };
    }
    
    playSound(type, ...args) {
        if (!this.soundEnabled || !this.audioContext || !this.sounds[type]) return;
        this.sounds[type](...args);
    }
    
    initializeBoard() {
        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
    }
    
    startGame() {
        this.gameActive = true;
        this.isPaused = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.initializeBoard();
        this.spawnPiece();
        this.nextPiece = this.getRandomPiece();
        this.updateDisplay();
        this.gameLoop();
        this.gameOverlay.classList.remove('active');
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameActive) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.dropTimer += deltaTime;
            
            const dropSpeed = this.slowMotionActive ? this.DROP_TIME * 3 : this.DROP_TIME / this.level;
            
            if (this.dropTimer >= dropSpeed) {
                this.dropTimer = 0;
                if (!this.movePiece(0, 1)) {
                    this.lockPiece();
                }
            }
        }
        
        this.render();
        this.updateParticles(deltaTime);
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    getRandomPiece() {
        const pieces = Object.keys(this.TETROMINOS);
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            type: type,
            shape: this.TETROMINOS[type].shape,
            color: this.TETROMINOS[type].color,
            glowColor: this.TETROMINOS[type].glowColor,
            x: Math.floor((this.COLS - this.TETROMINOS[type].shape[0].length) / 2),
            y: 0
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece || this.getRandomPiece();
        this.nextPiece = this.getRandomPiece();
        
        if (this.collides(this.currentPiece)) {
            this.gameOver();
        }
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return false;
        
        const newPiece = {
            ...this.currentPiece,
            x: this.currentPiece.x + dx,
            y: this.currentPiece.y + dy
        };
        
        if (!this.collides(newPiece)) {
            this.currentPiece = newPiece;
            if (dx !== 0) this.playSound('move');
            return true;
        }
        
        return false;
    }
    
    rotatePiece(direction) {
        if (!this.currentPiece) return;
        
        const rotated = this.rotate(this.currentPiece.shape, direction);
        const newPiece = { ...this.currentPiece, shape: rotated };
        
        // Wall kick
        const kicks = this.getWallKicks(this.currentPiece, newPiece);
        for (const kick of kicks) {
            const testPiece = {
                ...newPiece,
                x: this.currentPiece.x + kick.x,
                y: this.currentPiece.y + kick.y
            };
            
            if (!this.collides(testPiece)) {
                this.currentPiece = testPiece;
                this.playSound('rotate');
                
                // T-Spinチェック
                if (this.currentPiece.type === 'T' && this.isTSpin(testPiece)) {
                    this.unlockAchievement('t-spin');
                    this.createParticles(testPiece.x * this.BLOCK_SIZE, testPiece.y * this.BLOCK_SIZE, 20);
                }
                return;
            }
        }
    }
    
    rotate(matrix, direction) {
        const N = matrix.length;
        const M = matrix[0].length;
        const rotated = Array(M).fill(null).map(() => Array(N).fill(0));
        
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < M; j++) {
                if (direction > 0) {
                    rotated[j][N - 1 - i] = matrix[i][j];
                } else {
                    rotated[M - 1 - j][i] = matrix[i][j];
                }
            }
        }
        
        return rotated;
    }
    
    getWallKicks(oldPiece, newPiece) {
        // SRSウォールキックデータ
        return [
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: -1 },
            { x: 1, y: -1 }
        ];
    }
    
    isTSpin(piece) {
        if (piece.type !== 'T') return false;
        
        // T-Spin判定の簡易実装
        const corners = [
            { x: piece.x, y: piece.y },
            { x: piece.x + 2, y: piece.y },
            { x: piece.x, y: piece.y + 2 },
            { x: piece.x + 2, y: piece.y + 2 }
        ];
        
        let filledCorners = 0;
        for (const corner of corners) {
            if (corner.y >= 0 && corner.y < this.ROWS && 
                corner.x >= 0 && corner.x < this.COLS &&
                this.board[corner.y][corner.x]) {
                filledCorners++;
            }
        }
        
        return filledCorners >= 3;
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        
        this.score += dropDistance * 2;
        this.lockPiece();
        this.playSound('drop');
        
        // ハードドロップエフェクト
        this.shakeAmount = 10;
        this.createParticles(
            this.currentPiece.x * this.BLOCK_SIZE + (this.currentPiece.shape[0].length * this.BLOCK_SIZE) / 2,
            this.currentPiece.y * this.BLOCK_SIZE,
            15
        );
    }
    
    holdPiece() {
        if (!this.canHold || !this.currentPiece) return;
        
        this.canHold = false;
        
        const tempPiece = {
            type: this.currentPiece.type,
            shape: this.TETROMINOS[this.currentPiece.type].shape,
            color: this.TETROMINOS[this.currentPiece.type].color,
            glowColor: this.TETROMINOS[this.currentPiece.type].glowColor,
            x: Math.floor((this.COLS - this.TETROMINOS[this.currentPiece.type].shape[0].length) / 2),
            y: 0
        };
        
        if (this.heldPiece) {
            this.currentPiece = {
                ...this.heldPiece,
                x: Math.floor((this.COLS - this.heldPiece.shape[0].length) / 2),
                y: 0
            };
        } else {
            this.spawnPiece();
        }
        
        this.heldPiece = tempPiece;
        this.drawHoldPiece();
    }
    
    collides(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = piece.x + x;
                    const boardY = piece.y + y;
                    
                    if (boardX < 0 || boardX >= this.COLS || 
                        boardY >= this.ROWS ||
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        // ピースをボードに固定
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = {
                            color: this.currentPiece.color,
                            glowColor: this.currentPiece.glowColor
                        };
                    }
                }
            }
        }
        
        this.canHold = true;
        const clearedLines = this.clearLines();
        
        if (clearedLines > 0) {
            this.combo++;
            this.showCombo();
        } else {
            this.combo = 0;
        }
        
        this.spawnPiece();
        this.drawNextPiece();
    }
    
    clearLines() {
        const linesToClear = [];
        
        for (let y = this.ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }
        
        if (linesToClear.length > 0) {
            this.animateLineClear(linesToClear);
            
            // ラインを削除
            for (const line of linesToClear) {
                this.board.splice(line, 1);
                this.board.unshift(Array(this.COLS).fill(0));
            }
            
            // スコア計算
            const baseScore = [0, 100, 300, 500, 800];
            const score = baseScore[linesToClear.length] * this.level * (this.combo + 1);
            this.score += score;
            this.lines += linesToClear.length;
            
            // レベルアップ
            if (this.lines >= this.level * 10) {
                this.level++;
            }
            
            // 実績チェック
            if (this.lines >= 1 && !this.achievements['first-line']) {
                this.unlockAchievement('first-line');
            }
            
            if (linesToClear.length === 4) {
                this.unlockAchievement('tetris');
                this.playSound('tetris');
                this.shakeAmount = 20;
            } else {
                this.playSound('clear', linesToClear.length);
            }
            
            if (this.combo >= 5) {
                this.unlockAchievement('combo-king');
            }
            
            this.updateDisplay();
        }
        
        return linesToClear.length;
    }
    
    animateLineClear(lines) {
        for (const line of lines) {
            this.createLineClearEffect(line);
            
            // パーティクル生成
            for (let x = 0; x < this.COLS; x++) {
                this.createParticles(
                    x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
                    line * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
                    5
                );
            }
        }
    }
    
    createLineClearEffect(line) {
        this.lineClears.push({
            y: line * this.BLOCK_SIZE,
            life: 1,
            maxLife: 1
        });
    }
    
    createParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // 重力
            particle.life -= deltaTime / 1000;
            
            return particle.life > 0;
        });
        
        // ラインクリアエフェクト更新
        this.lineClears = this.lineClears.filter(effect => {
            effect.life -= deltaTime / 1000;
            return effect.life > 0;
        });
        
        // シェイク減衰
        if (this.shakeAmount > 0) {
            this.shakeAmount *= 0.9;
            if (this.shakeAmount < 0.1) this.shakeAmount = 0;
        }
    }
    
    showCombo() {
        this.comboDisplay.classList.add('active');
        this.comboCount.textContent = `×${this.combo}`;
        
        setTimeout(() => {
            this.comboDisplay.classList.remove('active');
        }, 2000);
    }
    
    activatePowerUp(type) {
        if (this.powerUps[type] <= 0 || !this.gameActive) return;
        
        this.powerUps[type]--;
        this.updatePowerUpDisplay();
        
        switch (type) {
            case 'bomb':
                this.useBombPower();
                break;
            case 'time':
                this.useTimePower();
                break;
            case 'laser':
                this.useLaserPower();
                break;
            case 'ghost':
                this.useGhostPower();
                break;
        }
    }
    
    useBombPower() {
        // 3x3範囲を消去
        const centerY = Math.floor(this.ROWS * 0.75);
        const centerX = Math.floor(this.COLS / 2);
        
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                const boardY = centerY + y;
                const boardX = centerX + x;
                
                if (boardY >= 0 && boardY < this.ROWS && 
                    boardX >= 0 && boardX < this.COLS) {
                    this.board[boardY][boardX] = 0;
                    this.createParticles(
                        boardX * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
                        boardY * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
                        10
                    );
                }
            }
        }
        
        this.shakeAmount = 15;
        this.score += 500;
    }
    
    useTimePower() {
        this.slowMotionActive = true;
        this.effectCanvas.style.filter = 'hue-rotate(180deg)';
        
        setTimeout(() => {
            this.slowMotionActive = false;
            this.effectCanvas.style.filter = 'none';
        }, 10000);
    }
    
    useLaserPower() {
        // 横一列を消去
        if (this.currentPiece) {
            const line = this.currentPiece.y;
            if (line >= 0 && line < this.ROWS) {
                for (let x = 0; x < this.COLS; x++) {
                    this.board[line][x] = 0;
                }
                this.createLineClearEffect(line);
                this.score += 300;
            }
        }
    }
    
    useGhostPower() {
        // 次の5ピースを半透明で表示
        // この実装では簡易的にスコアボーナスを付与
        this.score += 1000;
        this.updateDisplay();
    }
    
    updatePowerUpDisplay() {
        this.bombCountElement.textContent = this.powerUps.bomb;
        this.timeCountElement.textContent = this.powerUps.time;
        this.laserCountElement.textContent = this.powerUps.laser;
        this.ghostCountElement.textContent = this.powerUps.ghost;
        
        // ボタンの有効/無効
        document.getElementById('bombPower').disabled = this.powerUps.bomb <= 0;
        document.getElementById('timePower').disabled = this.powerUps.time <= 0;
        document.getElementById('laserPower').disabled = this.powerUps.laser <= 0;
        document.getElementById('ghostPower').disabled = this.powerUps.ghost <= 0;
    }
    
    render() {
        // キャンバスクリア
        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.effectCtx.clearRect(0, 0, this.effectCanvas.width, this.effectCanvas.height);
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // シェイク適用
        if (this.shakeAmount > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeAmount;
            const shakeY = (Math.random() - 0.5) * this.shakeAmount;
            this.gameCtx.save();
            this.gameCtx.translate(shakeX, shakeY);
        }
        
        // グリッド描画
        this.drawGrid();
        
        // ボード描画
        this.drawBoard();
        
        // ゴーストピース描画
        this.drawGhostPiece();
        
        // 現在のピース描画
        this.drawPiece();
        
        if (this.shakeAmount > 0) {
            this.gameCtx.restore();
        }
        
        // エフェクト描画
        this.drawEffects();
        
        // パーティクル描画
        this.drawParticles();
    }
    
    drawGrid() {
        this.gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.gameCtx.lineWidth = 1;
        
        for (let x = 0; x <= this.COLS; x++) {
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(x * this.BLOCK_SIZE, 0);
            this.gameCtx.lineTo(x * this.BLOCK_SIZE, this.ROWS * this.BLOCK_SIZE);
            this.gameCtx.stroke();
        }
        
        for (let y = 0; y <= this.ROWS; y++) {
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(0, y * this.BLOCK_SIZE);
            this.gameCtx.lineTo(this.COLS * this.BLOCK_SIZE, y * this.BLOCK_SIZE);
            this.gameCtx.stroke();
        }
    }
    
    drawBoard() {
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x].color, this.board[y][x].glowColor);
                }
            }
        }
    }
    
    drawPiece() {
        if (!this.currentPiece) return;
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.drawBlock(
                        this.currentPiece.x + x,
                        this.currentPiece.y + y,
                        this.currentPiece.color,
                        this.currentPiece.glowColor
                    );
                }
            }
        }
    }
    
    drawGhostPiece() {
        if (!this.currentPiece) return;
        
        let ghostPiece = { ...this.currentPiece };
        
        // ゴーストピースの位置を計算
        while (!this.collides({ ...ghostPiece, y: ghostPiece.y + 1 })) {
            ghostPiece.y++;
        }
        
        // 半透明で描画
        this.gameCtx.globalAlpha = 0.3;
        for (let y = 0; y < ghostPiece.shape.length; y++) {
            for (let x = 0; x < ghostPiece.shape[y].length; x++) {
                if (ghostPiece.shape[y][x]) {
                    this.drawBlock(
                        ghostPiece.x + x,
                        ghostPiece.y + y,
                        ghostPiece.color,
                        ghostPiece.glowColor,
                        true
                    );
                }
            }
        }
        this.gameCtx.globalAlpha = 1;
    }
    
    drawBlock(x, y, color, glowColor, isGhost = false) {
        const size = this.BLOCK_SIZE;
        const padding = 2;
        
        this.gameCtx.fillStyle = color;
        this.gameCtx.fillRect(
            x * size + padding,
            y * size + padding,
            size - padding * 2,
            size - padding * 2
        );
        
        if (!isGhost) {
            // グロー効果
            this.gameCtx.shadowColor = glowColor;
            this.gameCtx.shadowBlur = 10;
            this.gameCtx.fillRect(
                x * size + padding,
                y * size + padding,
                size - padding * 2,
                size - padding * 2
            );
            this.gameCtx.shadowBlur = 0;
            
            // ハイライト
            const gradient = this.gameCtx.createLinearGradient(
                x * size,
                y * size,
                x * size,
                (y + 1) * size
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.gameCtx.fillStyle = gradient;
            this.gameCtx.fillRect(
                x * size + padding,
                y * size + padding,
                size - padding * 2,
                size / 2
            );
        }
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const blockSize = 20;
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                if (this.nextPiece.shape[y][x]) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 2,
                        blockSize - 2
                    );
                }
            }
        }
    }
    
    drawHoldPiece() {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.heldPiece) return;
        
        const blockSize = 20;
        const offsetX = (this.holdCanvas.width - this.heldPiece.shape[0].length * blockSize) / 2;
        const offsetY = (this.holdCanvas.height - this.heldPiece.shape.length * blockSize) / 2;
        
        this.holdCtx.globalAlpha = this.canHold ? 1 : 0.5;
        
        for (let y = 0; y < this.heldPiece.shape.length; y++) {
            for (let x = 0; x < this.heldPiece.shape[y].length; x++) {
                if (this.heldPiece.shape[y][x]) {
                    this.holdCtx.fillStyle = this.heldPiece.color;
                    this.holdCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 2,
                        blockSize - 2
                    );
                }
            }
        }
        
        this.holdCtx.globalAlpha = 1;
    }
    
    drawEffects() {
        // ラインクリアエフェクト
        for (const effect of this.lineClears) {
            const alpha = effect.life / effect.maxLife;
            this.effectCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.effectCtx.fillRect(0, effect.y, this.gameCanvas.width, this.BLOCK_SIZE);
        }
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            this.particleCtx.globalAlpha = particle.life;
            this.particleCtx.fillStyle = particle.color;
            this.particleCtx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        }
        this.particleCtx.globalAlpha = 1;
    }
    
    updateDisplay() {
        this.scoreElement.textContent = this.score.toString().padStart(6, '0');
        this.linesElement.textContent = this.lines;
        this.levelElement.textContent = this.level;
    }
    
    unlockAchievement(id) {
        if (this.achievements[id]) return;
        
        this.achievements[id] = true;
        const element = document.querySelector(`[data-achievement="${id}"]`);
        if (element) {
            element.classList.add('unlocked');
        }
    }
    
    togglePause() {
        if (!this.gameActive) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '▶ PLAY' : '⏸ PAUSE';
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('soundBtn').textContent = this.soundEnabled ? '🔊 SOUND' : '🔇 MUTE';
    }
    
    gameOver() {
        this.gameActive = false;
        
        document.getElementById('finalScore').textContent = this.score.toString().padStart(6, '0');
        document.getElementById('finalLines').textContent = this.lines;
        document.getElementById('finalLevel').textContent = this.level;
        
        this.gameOverlay.classList.add('active');
    }
    
    restartGame() {
        this.resetPowerUps();
        this.startGame();
    }
    
    resetPowerUps() {
        this.powerUps = {
            bomb: 3,
            time: 2,
            laser: 2,
            ghost: 1
        };
        this.updatePowerUpDisplay();
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    new NeonTetris();
});