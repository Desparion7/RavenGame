const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

const startBtn = document.querySelector('.btnStart');
const restartBtn = document.querySelector('.btnRestart');

let music = new Audio();
let score = 0;
let gameOver = false;
ctx.font = '50px Impact';

let timeToNextEnemy = 0;
let ravenInterval = 500;
let lastTime = 0;

let ravens = [];
let explosions = [];
let particles = [];

class Enemy {
	constructor() {
		this.directionX = Math.random() * 5 + 3;
		this.directionY = Math.random() * 5 - 2.5;
		this.imageRaven = new Image();
		this.imageRaven.src = 'raven.png';
		this.imageBat = new Image();
		this.imageBat.src = 'bat.png';
		this.image = this.directionX > 6 ? this.imageBat : this.imageRaven;
		this.spriteWidth = this.image === this.imageRaven ? 271 : 266;
		this.spriteHeight = this.image === this.imageRaven ? 194 : 188;
		this.sizeModifier = Math.random() * 0.6 + 0.4;
		this.width = this.spriteWidth * this.sizeModifier;
		this.height = this.spriteHeight * this.sizeModifier;
		this.x = canvas.width;
		this.y = Math.random() * (canvas.height - this.height);
		this.markedForDeletion = false;
		this.frame = 0;
		this.maxFrame = 4;
		this.timeSinceFlap = 0;
		this.flapInterval = 400 / this.directionX;
		this.randomColors = [
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
		];
		this.color = `rgb(${this.randomColors[0]},${this.randomColors[1]},${this.randomColors[2]})`;
		this.willFlower = this.directionX > 6;
	}
	update(deltatime) {
		if (this.y < 0 || this.y > canvas.height - this.height) {
			this.directionY = this.directionY * -1;
		}
		this.x -= this.directionX;
		this.y -= this.directionY;
		if (this.x < 0 - this.width) {
			this.markedForDeletion = true;
		}
		this.timeSinceFlap += deltatime;
		if (this.timeSinceFlap > this.flapInterval) {
			this.frame > this.maxFrame ? (this.frame = 0) : this.frame++;
			this.timeSinceFlap = 0;
			if (this.willFlower) {
				for (let i = 0; i < 5; i++) {
					particles.push(new Particle(this.x, this.y, this.width));
				}
			}
		}
		if (this.x < 0 - this.width) gameOver = true;
	}
	draw() {
		collisionCtx.fillStyle = this.color;
		collisionCtx.fillRect(this.x, this.y, this.width, this.height);
		ctx.drawImage(
			this.image,
			this.frame * this.spriteWidth,
			0,
			this.spriteWidth,
			this.spriteHeight,
			this.x,
			this.y,
			this.width,
			this.height
		);
	}
}

class Explosions {
	constructor(x, y, size) {
		this.image = new Image();
		this.image.src = 'boom.png';
		this.spriteWidth = 200;
		this.spriteHeight = 179;
		this.size = size;
		this.x = x;
		this.y = y;
		this.frame = 0;
		this.sound = new Audio();
		this.sound.src = 'boom.mp3';
		this.timeSinceLastFrame = 0;
		this.frameInterval = 100;
		this.markedForDeletion = false;
	}
	update(deltatime) {
		if (this.frame === 0) {
			this.sound.play();
		}
		this.timeSinceLastFrame += deltatime;
		if (this.timeSinceLastFrame > this.frameInterval) {
			this.frame++;
			this.timeSinceLastFrame = 0;
			if (this.frame > 5) {
				this.markedForDeletion = true;
			}
		}
	}
	draw() {
		ctx.drawImage(
			this.image,
			this.frame * this.spriteWidth,
			0,
			this.spriteWidth,
			this.spriteHeight,
			this.x,
			this.y - this.size / 4,
			this.size,
			this.size
		);
	}
}
class Particle {
	constructor(x, y, size) {
		this.size = size;
		this.x = x + this.size / 2;
		this.y = y + this.size / 3;
		this.radius = (Math.random() * this.size) / 10;
		this.maxRadius = Math.random() * 20 + 35;
		this.markedForDeletion = false;
		this.speedX = Math.random() * 1 + 0.5;
		this.color = 'rgb(128, 128, 128)';
	}
	update() {
		this.x += this.speedX;
		this.radius += 0.5;
		if (this.radius > this.maxRadius - 5) this.markedForDeletion = true;
	}
	draw() {
		ctx.save();
		ctx.globalAlpha = 1 - this.radius / this.maxRadius;
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
}

function drawScore() {
	ctx.fillStyle = 'black';
	ctx.fillText('Score: ' + score, 100, 75);
	ctx.fillStyle = 'white';
	ctx.fillText('Score: ' + score, 100, 80);
}

function drawGameOver() {
	ctx.textAlign = 'center';
	ctx.fillStyle = 'black';
	ctx.fillText(
		'GAME OVER, your score is' + score,
		canvas.width / 2,
		canvas.height / 2
	);
	ctx.fillStyle = 'white';
	ctx.fillText(
		'GAME OVER, your score is ' + score,
		canvas.width / 2 + 5,
		canvas.height / 2 + 5
	);
	restartBtn.style.display = 'block';
	music.pause();
	const overmusic = new Audio();
	overmusic.src = 'over.wav';
	overmusic.play();
}

window.addEventListener('click', function (e) {
	const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
	const pc = detectPixelColor.data;
	ravens.forEach((object) => {
		if (
			object.randomColors[0] === pc[0] &&
			object.randomColors[1] === pc[1] &&
			object.randomColors[2] === pc[2]
		) {
			// collisiondetected
			object.markedForDeletion = true;
			score++;
			explosions.push(new Explosions(object.x, object.y, object.width));
		}
	});
});

function animate(timestamp) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
	let deltatime = timestamp - lastTime;
	lastTime = timestamp;
	timeToNextEnemy += deltatime;
	if (timeToNextEnemy > ravenInterval) {
		ravens.push(new Enemy());
		timeToNextEnemy = 0;
		ravens.sort(function (a, b) {
			return a.width - b.width;
		});
	}
	drawScore();
	[...particles, ...ravens, ...explosions].forEach((object) => {
		object.update(deltatime);
		object.draw();
	});
	ravens = ravens.filter((object) => !object.markedForDeletion);
	explosions = explosions.filter((object) => !object.markedForDeletion);
	particles = particles.filter((object) => !object.markedForDeletion);
	if (!gameOver) requestAnimationFrame(animate);
	else {
		drawGameOver();
	}
}

startBtn.addEventListener('click', () => {
	animate(0);
	gameOver = false;
	startBtn.style.display = 'none';
	music.src = 'music.mp3';
	music.play();
});
restartBtn.addEventListener('click', () => {
	score = 0;
	gameOver = false;
	ravens = [];
	explosions = [];
	particles = [];
	timeToNextEnemy = 0;
	restartBtn.style.display = 'none';
	lastTime = performance.now();
	animate(lastTime);
	music.src = 'music.mp3';
	music.play();
});
