class Stats {
    constructor() {
        this.mode = 0;
        this.modes = 2;
        this.frames = 0;
        this.prevTime = 0;
        this.fpsMin = 1000;
        this.fpsMax = 0;
        this.currentMs = 0;
        this.msMin = 1000;
        this.msMax = 0;
        this.memoryUsage = 0;
        this.memMin = 1000;
        this.memMax = 0;
        this.domElement = document.createElement("div");

        // Style the container
        this.domElement.style.cursor = "pointer";
        this.domElement.style.width = "80px";
        this.domElement.style.opacity = "0.9";
        this.domElement.style.zIndex = "10001";

        // Colors for different stats modes
        this.colors = {
            fps: {
                bg: { r: 16, g: 16, b: 48 },
                fg: { r: 0, g: 255, b: 255 }
            },
            ms: {
                bg: { r: 16, g: 48, b: 16 },
                fg: { r: 0, g: 255, b: 0 }
            },
            mb: {
                bg: { r: 48, g: 16, b: 26 },
                fg: { r: 255, g: 0, b: 128 }
            }
        };

        // Create FPS panel
        this.fpsPanel = this.createPanel("FPS", this.colors.fps);
        this.msPanel = this.createPanel("MS", this.colors.ms);
        this.memPanel = this.createPanel("MB", this.colors.mb);

        // Set up click handler to toggle between panels
        this.domElement.addEventListener('click', () => {
            this.mode++;
            if (this.mode >= this.modes) this.mode = 0;

            this.fpsPanel.style.display = "none";
            this.msPanel.style.display = "none";
            this.memPanel.style.display = "none";

            switch (this.mode) {
                case 0: this.fpsPanel.style.display = "block"; break;
                case 1: this.msPanel.style.display = "block"; break;
                case 2: this.memPanel.style.display = "block"; break;
            }
        }, false);

        // Check if memory monitoring is available
        try {
            if (performance && performance.memory && performance.memory.totalJSHeapSize) {
                this.modes = 3;
            }
        } catch (e) { }

        // Initially show FPS panel
        this.msPanel.style.display = "none";
        this.memPanel.style.display = "none";
    }

    createPanel(name, colors) {
        const panel = document.createElement("div");
        panel.style.backgroundColor = `rgb(${Math.floor(colors.bg.r / 2)},${Math.floor(colors.bg.g / 2)},${Math.floor(colors.bg.b / 2)})`;
        panel.style.padding = "2px 0px 3px 0px";
        this.domElement.appendChild(panel);

        const label = document.createElement("div");
        label.style.fontFamily = "Helvetica, Arial, sans-serif";
        label.style.textAlign = "left";
        label.style.fontSize = "9px";
        label.style.color = `rgb(${colors.fg.r},${colors.fg.g},${colors.fg.b})`;
        label.style.margin = "0px 0px 1px 3px";
        label.innerHTML = `<span style="font-weight:bold">${name}</span>`;
        panel.appendChild(label);

        const canvas = document.createElement("canvas");
        canvas.width = 74;
        canvas.height = 30;
        canvas.style.display = "block";
        canvas.style.marginLeft = "3px";
        panel.appendChild(canvas);

        const context = canvas.getContext("2d");
        context.fillStyle = `rgb(${colors.bg.r},${colors.bg.g},${colors.bg.b})`;
        context.fillRect(0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        return {
            style: panel.style,
            label: label,
            canvas: canvas,
            context: context,
            imageData: imageData
        };
    }

    updateGraph(panel, value, colorName) {
        const data = panel.imageData.data;

        // Shift graph left
        for (let i = 0; i < 30; i++) {
            for (let j = 0; j < 73; j++) {
                const idx = (j + i * 74) * 4;
                data[idx] = data[idx + 4];
                data[idx + 1] = data[idx + 5];
                data[idx + 2] = data[idx + 6];
            }
        }

        // Make sure we have a valid color reference
        const color = this.colors[colorName] || this.colors.fps; // Default to fps colors if not found

        // Draw new column
        for (let i = 0; i < 30; i++) {
            const idx = (73 + i * 74) * 4;
            if (i < value) {
                data[idx] = color.bg.r;
                data[idx + 1] = color.bg.g;
                data[idx + 2] = color.bg.b;
            } else {
                data[idx] = color.fg.r;
                data[idx + 1] = color.fg.g;
                data[idx + 2] = color.fg.b;
            }
        }

        panel.context.putImageData(panel.imageData, 0, 0);
    }

    update() {
        this.frames++;
        const time = performance.now();

        // Update MS display
        this.currentMs = time - this.prevTime;
        this.msMin = Math.min(this.msMin, this.currentMs);
        this.msMax = Math.max(this.msMax, this.currentMs);

        this.updateGraph(this.msPanel, Math.min(30, 30 - (this.currentMs / 200) * 30), "ms");
        this.msPanel.label.innerHTML = `<span style="font-weight:bold">${Math.round(this.currentMs)} MS</span> (${Math.round(this.msMin)}-${Math.round(this.msMax)})`;

        // Update FPS display if a second has passed
        if (time > this.prevTime + 1000) {
            const fps = Math.round(this.frames * 1000 / (time - this.prevTime));
            this.fpsMin = Math.min(this.fpsMin, fps);
            this.fpsMax = Math.max(this.fpsMax, fps);

            this.updateGraph(this.fpsPanel, Math.min(30, 30 - (fps / 100) * 30), "fps");
            this.fpsPanel.label.innerHTML = `<span style="font-weight:bold">${fps} FPS</span> (${this.fpsMin}-${this.fpsMax})`;

            // Update memory if available
            if (this.modes === 3) {
                const memory = performance.memory.usedJSHeapSize * 9.54E-7;
                this.memMin = Math.min(this.memMin, memory);
                this.memMax = Math.max(this.memMax, memory);

                this.updateGraph(this.memPanel, Math.min(30, 30 - memory / 2), "mb");
                this.memPanel.label.innerHTML = `<span style="font-weight:bold">${Math.round(memory)} MB</span> (${Math.round(this.memMin)}-${Math.round(this.memMax)})`;
            }

            this.prevTime = time;
            this.frames = 0;
        }

        this.prevTime = time;
    }
}

// Helper functions
function getElement(id) { return document.getElementById(id); }
function hideElement(id) { getElement(id).style.visibility = 'hidden'; }
function showElement(id) { getElement(id).style.visibility = null; }
function setElementHTML(id, html) { getElement(id).innerHTML = html; }

function getCurrentTime() { return new Date().getTime(); }
function getRandomNumber(min, max) { return (min + (Math.random() * (max - min))); }
function getRandomChoice(choices) { return choices[Math.round(getRandomNumber(0, choices.length - 1))]; }

// Polyfill for requestAnimationFrame
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame =
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback, element) {
            window.setTimeout(callback, 1000 / 60);
        };
}

// Game constants
const KEYS = {
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
};

const DIRECTIONS = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
    MIN: 0,
    MAX: 3
};

const performanceStats = new Stats();
const gameCanvas = getElement('gameCanvas');
const gameContext = gameCanvas.getContext('2d');
const nextPieceCanvas = getElement('nextPieceCanvas');
const nextPieceContext = nextPieceCanvas.getContext('2d');

const gameSpeed = {
    start: 0.6,           // Initial speed (seconds per drop)
    decrement: 0.005,     // How much to speed up per row cleared
    min: 0.1              // Maximum speed (minimum time per drop)
};

const boardWidth = 10;  // Width of tetris board (in blocks)
const boardHeight = 20; // Height of tetris board (in blocks)
const previewSize = 5;  // Size of the next piece preview

// Game variables (initialized during reset)
let blockWidth, blockHeight;      // Pixel size of a single tetris block
let gameBoard;                    // 2D array representing the game board
let userActions;                  // Queue of user inputs
let isPlaying;                    // Game state flag
let deltaTime;                    // Time since starting this game
let currentPiece;                 // The active piece
let nextPiece;                    // The upcoming piece
let score;                        // Current score
let displayedScore;               // Visually displayed score (animates to catch up)
let rowsCleared;                  // Number of rows cleared in the current game
let dropInterval;                 // Time between piece drops

// Tetris piece definitions
const PIECE_I = {
    size: 4,
    blocks: [0x0F00, 0x2222, 0x00F0, 0x4444],
    color: 'cyan'
};

const PIECE_J = {
    size: 3,
    blocks: [0x44C0, 0x8E00, 0x6440, 0x0E20],
    color: 'blue'
};

const PIECE_L = {
    size: 3,
    blocks: [0x4460, 0x0E80, 0xC440, 0x2E00],
    color: 'orange'
};

const PIECE_O = {
    size: 2,
    blocks: [0xCC00, 0xCC00, 0xCC00, 0xCC00],
    color: 'yellow'
};

const PIECE_S = {
    size: 3,
    blocks: [0x06C0, 0x8C40, 0x6C00, 0x4620],
    color: 'green'
};

const PIECE_T = {
    size: 3,
    blocks: [0x0E40, 0x4C40, 0x4E00, 0x4640],
    color: 'purple'
};

const PIECE_Z = {
    size: 3,
    blocks: [0x0C60, 0x4C80, 0xC600, 0x2640],
    color: 'red'
};

// Process each block in a piece and apply the callback function
function forEachBlock(pieceType, x, y, dir, callback) {
    let bit = 0x8000;
    let row = 0;
    let col = 0;
    const blocks = pieceType.blocks[dir];

    for (; bit > 0; bit = bit >> 1) {
        if (blocks & bit) {
            callback(x + col, y + row);
        }

        if (++col === 4) {
            col = 0;
            ++row;
        }
    }
}

// Check if a piece can fit into a position on the board
function isPiecePositionOccupied(pieceType, x, y, dir) {
    let result = false;

    forEachBlock(pieceType, x, y, dir, (x, y) => {
        if ((x < 0) || (x >= boardWidth) || (y < 0) || (y >= boardHeight) || getBlock(x, y)) {
            result = true;
        }
    });

    return result;
}

function isPiecePositionFree(pieceType, x, y, dir) {
    return !isPiecePositionOccupied(pieceType, x, y, dir);
}

// Piece selection with "bag" randomization
let pieceBag = [];

function getRandomPiece() {
    if (pieceBag.length === 0) {
        // Refill the bag with 4 of each piece
        pieceBag = [
            PIECE_I, PIECE_I, PIECE_I, PIECE_I,
            PIECE_J, PIECE_J, PIECE_J, PIECE_J,
            PIECE_L, PIECE_L, PIECE_L, PIECE_L,
            PIECE_O, PIECE_O, PIECE_O, PIECE_O,
            PIECE_S, PIECE_S, PIECE_S, PIECE_S,
            PIECE_T, PIECE_T, PIECE_T, PIECE_T,
            PIECE_Z, PIECE_Z, PIECE_Z, PIECE_Z
        ];
    }

    const pieceType = pieceBag.splice(Math.floor(getRandomNumber(0, pieceBag.length - 1)), 1)[0];

    return {
        type: pieceType,
        dir: DIRECTIONS.UP,
        x: Math.round(getRandomNumber(0, boardWidth - pieceType.size)),
        y: 0
    };
}

// Main game loop
function runGame() {
    // Initialize performance counter
    showPerformanceStats();

    // Set up event listeners
    addEventListeners();

    let lastTime = getCurrentTime();
    let currentTime = lastTime;

    function gameLoop() {
        currentTime = getCurrentTime();
        updateGame(Math.min(1, (currentTime - lastTime) / 1000.0));
        drawGame();
        performanceStats.update();
        lastTime = currentTime;
        requestAnimationFrame(gameLoop, gameCanvas);
    }

    // Initialize the game
    handleResize();
    resetGame();
    gameLoop();
}

function showPerformanceStats() {
    performanceStats.domElement.id = 'statistics';
    getElement('sidePanel').appendChild(performanceStats.domElement);
}

function addEventListeners() {
    document.addEventListener('keydown', handleKeyPress, false);
    window.addEventListener('resize', handleResize, false);
}

function handleResize(event) {
    gameCanvas.width = gameCanvas.clientWidth;
    gameCanvas.height = gameCanvas.clientHeight;
    nextPieceCanvas.width = nextPieceCanvas.clientWidth;
    nextPieceCanvas.height = nextPieceCanvas.clientHeight;

    blockWidth = gameCanvas.width / boardWidth;
    blockHeight = gameCanvas.height / boardHeight;

    invalidateGameBoard();
    invalidateNextPiece();
}

function handleKeyPress(event) {
    let handled = false;

    if (isPlaying) {
        switch (event.keyCode) {
            case KEYS.LEFT:
                userActions.push(DIRECTIONS.LEFT);
                handled = true;
                break;
            case KEYS.RIGHT:
                userActions.push(DIRECTIONS.RIGHT);
                handled = true;
                break;
            case KEYS.UP:
                userActions.push(DIRECTIONS.UP);
                handled = true;
                break;
            case KEYS.DOWN:
                userActions.push(DIRECTIONS.DOWN);
                handled = true;
                break;
            case KEYS.ESC:
                endGame();
                handled = true;
                break;
        }
    } else if (event.keyCode == KEYS.SPACE) {
        startGame();
        handled = true;
    }

    if (handled) {
        event.preventDefault();
    }
}

// Game state management
function startGame() {
    hideElement('startButton');
    resetGame();
    isPlaying = true;
}

function endGame() {
    showElement('startButton');
    updateVisualScore();
    isPlaying = false;
}

function updateVisualScore(newScore) {
    displayedScore = newScore || score;
    invalidateScore();
}

function setScore(newScore) {
    score = newScore;
    updateVisualScore(newScore);
}

function addToScore(points) {
    score = score + points;
}

function clearScore() {
    setScore(0);
}

function clearRows() {
    setRows(0);
}

function setRows(newRows) {
    rowsCleared = newRows;
    dropInterval = Math.max(gameSpeed.min, gameSpeed.start - (gameSpeed.decrement * rowsCleared));
    invalidateRows();
}

function addRows(newRows) {
    setRows(rowsCleared + newRows);
}

function getBlock(x, y) {
    return (gameBoard && gameBoard[x] ? gameBoard[x][y] : null);
}

function setBlock(x, y, type) {
    gameBoard[x] = gameBoard[x] || [];
    gameBoard[x][y] = type;
    invalidateGameBoard();
}

function clearBlocks() {
    gameBoard = [];
    invalidateGameBoard();
}

function clearActions() {
    userActions = [];
}

function setCurrentPiece(piece) {
    currentPiece = piece || getRandomPiece();
    invalidateGameBoard();
}

function setNextPiece(piece) {
    nextPiece = piece || getRandomPiece();
    invalidateNextPiece();
}

function resetGame() {
    deltaTime = 0;
    clearActions();
    clearBlocks();
    clearRows();
    clearScore();
    setCurrentPiece(nextPiece);
    setNextPiece();
}

function updateGame(deltaTimeIncrement) {
    if (isPlaying) {
        // Animate score counter
        if (displayedScore < score) {
            updateVisualScore(displayedScore + 1);
        }

        // Process user input
        handleUserAction(userActions.shift());

        // Update game time and handle piece dropping
        deltaTime = deltaTime + deltaTimeIncrement;
        if (deltaTime > dropInterval) {
            deltaTime = deltaTime - dropInterval;
            dropPiece();
        }
    }
}

function handleUserAction(action) {
    switch (action) {
        case DIRECTIONS.LEFT:
            movePiece(DIRECTIONS.LEFT);
            break;
        case DIRECTIONS.RIGHT:
            movePiece(DIRECTIONS.RIGHT);
            break;
        case DIRECTIONS.UP:
            rotatePiece();
            break;
        case DIRECTIONS.DOWN:
            dropPiece();
            break;
    }
}

function movePiece(direction) {
    let newX = currentPiece.x;
    let newY = currentPiece.y;

    switch (direction) {
        case DIRECTIONS.RIGHT:
            newX = newX + 1;
            break;
        case DIRECTIONS.LEFT:
            newX = newX - 1;
            break;
        case DIRECTIONS.DOWN:
            newY = newY + 1;
            break;
    }

    if (isPiecePositionFree(currentPiece.type, newX, newY, currentPiece.dir)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        invalidateGameBoard();
        return true;
    } else {
        return false;
    }
}

function rotatePiece() {
    const newDirection = (currentPiece.dir == DIRECTIONS.MAX ? DIRECTIONS.MIN : currentPiece.dir + 1);

    if (isPiecePositionFree(currentPiece.type, currentPiece.x, currentPiece.y, newDirection)) {
        currentPiece.dir = newDirection;
        invalidateGameBoard();
    }
}

function dropPiece() {
    if (!movePiece(DIRECTIONS.DOWN)) {
        // Piece has landed
        addToScore(10);
        placePieceOnBoard();
        removeCompletedLines();
        setCurrentPiece(nextPiece);
        setNextPiece(getRandomPiece());
        clearActions();

        // Check for game over
        if (isPiecePositionOccupied(currentPiece.type, currentPiece.x, currentPiece.y, currentPiece.dir)) {
            endGame();
        }
    }
}

function placePieceOnBoard() {
    forEachBlock(currentPiece.type, currentPiece.x, currentPiece.y, currentPiece.dir, (x, y) => {
        setBlock(x, y, currentPiece.type);
    });
}

function removeCompletedLines() {
    let linesCleared = 0;

    for (let y = boardHeight; y > 0; --y) {
        let lineComplete = true;

        for (let x = 0; x < boardWidth; ++x) {
            if (!getBlock(x, y)) {
                lineComplete = false;
                break;
            }
        }

        if (lineComplete) {
            removeLine(y);
            y = y + 1; // Check the same line again (since lines above have moved down)
            linesCleared++;
        }
    }

    if (linesCleared > 0) {
        addRows(linesCleared);
        // Score increases exponentially with more lines cleared at once
        addToScore(100 * Math.pow(2, linesCleared - 1)); // 1: 100, 2: 200, 3: 400, 4: 800
    }
}

function removeLine(lineNumber) {
    for (let y = lineNumber; y >= 0; --y) {
        for (let x = 0; x < boardWidth; ++x) {
            setBlock(x, y, (y == 0) ? null : getBlock(x, y - 1));
        }
    }
}

// Rendering
const invalidationFlags = {
    board: true,
    nextPiece: true,
    score: true,
    rows: true
};

function invalidateGameBoard() { invalidationFlags.board = true; }
function invalidateNextPiece() { invalidationFlags.nextPiece = true; }
function invalidateScore() { invalidationFlags.score = true; }
function invalidateRows() { invalidationFlags.rows = true; }

function drawGame() {
    gameContext.save();
    gameContext.lineWidth = 1;
    gameContext.translate(0.5, 0.5); // For crisp 1px lines

    drawGameBoard();
    drawNextPiecePreview();
    drawScoreDisplay();
    drawRowsDisplay();

    gameContext.restore();
}

function drawGameBoard() {
    if (invalidationFlags.board) {
        gameContext.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

        // Draw the active piece
        if (isPlaying) {
            drawTetrisPiece(gameContext, currentPiece.type, currentPiece.x, currentPiece.y, currentPiece.dir);
        }

        // Draw the placed blocks
        for (let y = 0; y < boardHeight; y++) {
            for (let x = 0; x < boardWidth; x++) {
                const block = getBlock(x, y);
                if (block) {
                    drawBlock(gameContext, x, y, block.color);
                }
            }
        }

        // Draw the board boundary
        gameContext.strokeRect(0, 0, boardWidth * blockWidth - 1, boardHeight * blockHeight - 1);

        invalidationFlags.board = false;
    }
}

function drawNextPiecePreview() {
    if (invalidationFlags.nextPiece) {
        const padding = (previewSize - nextPiece.type.size) / 2; // Center the piece in preview

        nextPieceContext.save();
        nextPieceContext.translate(0.5, 0.5);
        nextPieceContext.clearRect(0, 0, previewSize * blockWidth, previewSize * blockHeight);

        drawTetrisPiece(nextPieceContext, nextPiece.type, padding, padding, nextPiece.dir);

        nextPieceContext.strokeStyle = 'black';
        nextPieceContext.strokeRect(0, 0, previewSize * blockWidth - 1, previewSize * blockHeight - 1);

        nextPieceContext.restore();

        invalidationFlags.nextPiece = false;
    }
}

function drawScoreDisplay() {
    if (invalidationFlags.score) {
        setElementHTML('scoreValue', ("00000" + Math.floor(displayedScore)).slice(-5));
        invalidationFlags.score = false;
    }
}

function drawRowsDisplay() {
    if (invalidationFlags.rows) {
        setElementHTML('rowsValue', rowsCleared);
        invalidationFlags.rows = false;
    }
}

function drawTetrisPiece(context, pieceType, x, y, direction) {
    forEachBlock(pieceType, x, y, direction, (x, y) => {
        drawBlock(context, x, y, pieceType.color);
    });
}

function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * blockWidth, y * blockHeight, blockWidth, blockHeight);
    context.strokeRect(x * blockWidth, y * blockHeight, blockWidth, blockHeight);
}

// Start the game
function startGame() {
    hideElement('startButton');
    resetGame();
    isPlaying = true;
}

// Initialize the game
runGame();