const heightBackground = 0;
const heightGround     = 1;
const heightFlying     = 2;

var playerX = 1;
var playerY = 1;

var keyLeftPressed = false;
var keyRightPressed = false;
var keyUpPressed = false;
var keyDownPressed = false;


const backgroundMusic = new Audio("sounds/background-music.mp3");
const musicVolumeSlider = document.getElementById("music-volume");
backgroundMusic.loop = true;

musicVolumeSlider.addEventListener("input", (event) =>
{
    backgroundMusic.volume = parseFloat(event.target.value / 100);
});

function StartBackgroundMusic()
{
    if (backgroundMusic.paused)
        backgroundMusic.play();
}

function UpdateKeyPresses(event, pressEventFlag)
{
    event.preventDefault();

    if (event.keyCode == 37) keyLeftPressed = pressEventFlag;
    if (event.keyCode == 39) keyRightPressed = pressEventFlag;
    if (event.keyCode == 38) keyUpPressed = pressEventFlag;
    if (event.keyCode == 40) keyDownPressed = pressEventFlag;
}

document.addEventListener("keydown", (event) =>
{
    UpdateKeyPresses(event, true);
    StartBackgroundMusic();
});

document.addEventListener("keyup", (event) =>
{
    UpdateKeyPresses(event, false);
    StartBackgroundMusic();
});

document.addEventListener("mousemove", () => StartBackgroundMusic());

function MapRange(inValue, inMin, inMax, outMin, outMax)
{
    return (inValue - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
}

class HeightMap
{
    constructor(loadedCallback)
    {
        this.image = new Image();
        this.image.src = "textures/heightmap.png";

        this.canvas = document.getElementById("height-map");
        this.context = this.canvas.getContext("2d");

        this.randomOffsetX = Math.floor(Math.random() * 20);
        this.randomOffsetY = Math.floor(Math.random() * 20);

        this.image.addEventListener("load", () =>
        {
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;

            this.context.drawImage(this.image, 0, 0);
            this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;

            loadedCallback();
        });
    }

    GetNormalizedHeight(x, y)
    {
        if (!this.imageData)
            return 0;

        return MapRange(this.imageData[4 * ((y + this.randomOffsetY) * this.canvas.width + x + this.randomOffsetX)], 0, 255, 0, 1);
    }
}

class Emoji
{
    constructor(character, x, y, height, backgroundTintR, backgroundTintG, backgroundTintB)
    {
        this.character = character;
        this.x = x; 
        this.y = y;
        this.height = height;

        this.backgroundTintR = backgroundTintR ? backgroundTintR : 1;
        this.backgroundTintG = backgroundTintG ? backgroundTintG : 1;
        this.backgroundTintB = backgroundTintB ? backgroundTintB : 1;
    }

    Update(playerX, playerY) {}
}

class Player extends Emoji
{
    constructor(x, y)
    {
        super('💗', x, y, heightGround);
    }

    Update(lol, lmao)
    {
        const speed = .1;
        if (keyLeftPressed) this.x -= speed;
        if (keyRightPressed) this.x += speed;
        if (keyUpPressed) this.y -= speed;
        if (keyDownPressed) this.y += speed;

        playerX = this.x;
        playerY = this.y;
    }
}

class Water extends Emoji
{
    constructor(x, y)
    {
        super('🌊', x, y, heightGround, .6, .6, 2);
    }
}

class Bunny extends Emoji
{
    constructor(x, y)
    {
        super('🐇', x, y, heightGround);
    }

    Update(playerX, playerY)
    {
        const basicSpeed = .0125;
        const randomSpeed = Math.random() * basicSpeed;

        if (randomSpeed > .008)
        {
            if (playerX < this.x) this.x -= randomSpeed;
            if (playerX > this.x) this.x += randomSpeed;
            if (playerY < this.y) this.y -= randomSpeed;
            if (playerY > this.y) this.y += randomSpeed;
        }
    }
}

class Eagle extends Emoji
{
    constructor(x, y)
    {
        super('🦅', x, y, heightGround);

        this.radius = MapRange(Math.random(), 0, 1, .02, .07);
        this.clockwise = Math.random() < .5 ? -1 : 1;
    }

    Update(playerX, playerY)
    {
        const speed = .0005;

        this.x += Math.sin(performance.now() * speed) * this.radius * this.clockwise;
        this.y += Math.cos(performance.now() * speed) * this.radius;
    }
}

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

canvas.width = window.innerWidth * .9;
canvas.height = window.innerHeight;

const emojiSize = 24;
const emojiSpacing = 7;

var emojis = [];
var emojisX = canvas.width / (emojiSize + emojiSpacing);
var emojisY = canvas.height / (emojiSize + emojiSpacing);

function GetRandomX()
{
    return Math.floor(Math.random() * emojisX);
}

function GetRandomY()
{
    return Math.floor(Math.random() * emojisY);
}

function GenerateRiverRecursively(x, y, visited, maxIterations, currentIteration)
{
    if (currentIteration++ >= maxIterations ||
        x < 0 || x >= emojisX || y < 0 || y >= emojisY) return;

    emojis.push(new Water(x, y));

    const currentHeight = heightMap.GetNormalizedHeight(x, y);

    const west = heightMap.GetNormalizedHeight(x - 1, y);
    const east = heightMap.GetNormalizedHeight(x + 1, y);
    const north = heightMap.GetNormalizedHeight(x, y - 1);
    const south = heightMap.GetNormalizedHeight(x, y + 1);

    if (west < currentHeight && !visited[y * canvas.width + x - 1])
    {
        visited[y * canvas.width + x - 1] = true;
        GenerateRiverRecursively(x - 1, y, visited, maxIterations, currentIteration);
    }
    if (east < currentHeight && !visited[y * canvas.width + x + 1])
    {
        visited[y * canvas.width + x - 1] = true;
        GenerateRiverRecursively(x + 1, y, visited, maxIterations, currentIteration);
    }
    if (north < currentHeight && !visited[(y - 1) * canvas.width + x])
    {
        visited[(y - 1) * canvas.width + x] = true;
        GenerateRiverRecursively(x, y - 1, visited, maxIterations, currentIteration);
    }
    if (south < currentHeight && !visited[(y + 1) * canvas.width + x])
    {
        visited[(y + 1) * canvas.width + x] = true;
        GenerateRiverRecursively(x, y + 1, visited, maxIterations, currentIteration);
    }
}

function GenerateRiver(x, y)
{
    const visited = [];
    
    for (var i = 0; i < emojisX * emojisY; i++)
        visited.push(false);

    GenerateRiverRecursively(x, y, visited, 10000, 0);
}

// Create a hight map.
const heightMap = new HeightMap(() =>
{
    // Create trees.
    for (var x = 0; x < emojisX; x++)
        for (var y = 0; y < emojisY; y++)
            emojis.push(new Emoji(Math.floor(Math.random() * 4) == 0 ? '🌲' : ' ', x, y, heightBackground));

    // Create flowers
    for (var i = 0; i < 10; i++)
        emojis.push(new Emoji('🌻', GetRandomX(), GetRandomY(), heightBackground));
    for (var i = 0; i < 10; i++)
        emojis.push(new Emoji('🌼', GetRandomX(), GetRandomY(), heightBackground));
    for (var i = 0; i < 10; i++)
        emojis.push(new Emoji('🌷', GetRandomX(), GetRandomY(), heightBackground));

    // Create rivers.
    for (var i = 0; i < 8; i++)
    {
        const x = GetRandomX();
        const y = GetRandomY();

        GenerateRiver(x, y);
    }

    // Create player.
    emojis.push(new Player(playerX, playerY));

    // Create bunnies.
    for (var i = 0; i < 10; i++)
        emojis.push(new Bunny(GetRandomX(), GetRandomY()));

    // Create eagles.
    for (var i = 0; i < 3; i++)
        emojis.push(new Eagle(GetRandomX(), GetRandomY()));

    context.font = emojiSize + "px serif";

    setInterval(() =>
    {
        // Update.

        emojis.sort((a, b) => { return a.height < b.height });

        for (var emoji of emojis)
            emoji.Update(playerX, playerY);

        // Draw.

        const size = emojiSize + emojiSpacing;
        const colorReduce = 3;

        for (var x = 0; x < emojisX; x++)
        {
            for (var y = 0; y < emojisY; y++)
            {
                // Draw green square but it has shades due to the heightmap.
                context.fillStyle = "rgb(" + MapRange(heightMap.GetNormalizedHeight(x, y), 0, 1, 0, 255 / colorReduce) + "," +
                                             MapRange(heightMap.GetNormalizedHeight(x, y), 0, 1, 0, 255) + "," +
                                             MapRange(heightMap.GetNormalizedHeight(x, y), 0, 1, 0, 255 / colorReduce) + ")";

                context.fillRect(x * size, y * size, size, size);
            }
        }

        for (var emoji of emojis)
            if (emoji.character != ' ')
            {
                const x = Math.round(emoji.x);
                const y = Math.round(emoji.y);

                // Draw green square but it has shades due to the heightmap.
                context.fillStyle = "rgb(" + MapRange(heightMap.GetNormalizedHeight(x, y), 0, 1, 0, 255 / colorReduce) * emoji.backgroundTintR + "," +
                                             MapRange(heightMap.GetNormalizedHeight(x, y), 0, 1, 0, 255) * emoji.backgroundTintG + "," +
                                             MapRange(heightMap.GetNormalizedHeight(x, y), 0, 1, 0, 255 / colorReduce) * emoji.backgroundTintB + ")";
                
                context.fillRect(x * size, y * size, size, size);

                // Draw emoji.
                context.fillText(emoji.character, x * size, y * size + emojiSize);
            }
        }, 10);
});