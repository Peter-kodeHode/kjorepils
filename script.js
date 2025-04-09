// Hjelpefunksjon for å begrense en verdi
function constrain(n, low, high) {
  return Math.max(low, Math.min(n, high));
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
    // Sett opp tid for delta-beregning
    this.lastUpdateTime = Date.now();

    // Spillkonfigurasjon
        this.config = {
            road: {
                leftLane: this.canvas.width * 0.10,
                middleLane: this.canvas.width * 0.35,
                rightLane: this.canvas.width * 0.60,
                laneWidth: this.canvas.width * 0.25
            },
            player: {
                width: 50,
                height: 70,
        // Hastigheten er i piksler per sekund (justeres med dt)
        speed: 200,
                startY: this.canvas.height - 100,
                maxLives: 5
            },
            obstacles: {
                car: {
                    width: 50,
                    height: 70,
          speed: { left: 10, middle: 7, right: 5 }
                },
                bottle: {
                    width: 30,
                    height: 50,
                    speed: 5
                },
                spawnRate: 0.03,
                bottleSpawnRate: 0.01
            },
            effects: {
                maxBlur: 15,
                maxInputDelay: 300,
                wobbleIntensity: 0.8,
                doubleVisionThreshold: 0.1,
                shakeThreshold: 5.0,
                doubleVisionDuration: { min: 2000, max: 5000 }
            }
        };

        this.state = {
            player: {
        x: this.canvas.width / 2,
        targetX: this.canvas.width / 2,
                y: this.config.player.startY,
                lives: 5,
                promille: 0,
                distance: 0
            },
            obstacles: [],
      active: true,
            paused: false,
            wobbleTime: 0,
            shakeOffset: { x: 0, y: 0 },
      startTime: Date.now(),
            doubleVision: {
                active: false,
                endTime: 0,
                strength: 0
            }
        };

        // Image loading setup - NEW CODE ADDED HERE
        this.images = {
            playerCar: new Image(),
            obstacleCars: {
                left: new Image(),
                middle: new Image(),
                right: new Image()
            },
            bottle: new Image()
        };
        
        // Set image sources - update these paths to match your actual image files
        this.images.playerCar.src = 'images/player-car.png';
        this.images.obstacleCars.left.src = 'images/red-car.png';
        this.images.obstacleCars.middle.src = 'images/blue-car.png';
        this.images.obstacleCars.right.src = 'images/green-car.png';
        this.images.bottle.src = 'images/bottle.png';

    // Sett opp input for tastatur
    this.input = { left: false, right: false };
        
        this.initEventListeners();
        this.gameLoop();
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
    if (container) {
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    } else {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    }

    initEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if(!this.state.active || this.state.paused) return;
        
        if(e.key === 'ArrowLeft' || e.key === 'a') {
            this.movePlayer(-1);
            e.preventDefault();
        }
        if(e.key === 'ArrowRight' || e.key === 'd') {
            this.movePlayer(1);
            e.preventDefault();
        }
    });

    // Touch controls with better handling
    let touchStartX = null;
    let lastTouchTime = 0;
    const touchThreshold = 30; // Minimum pixel movement to trigger

    this.canvas.addEventListener('touchstart', (e) => {
        if (!this.state.active || this.state.paused) return;
        touchStartX = e.touches[0].clientX;
        lastTouchTime = Date.now();
        e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
        if (!this.state.active || this.state.paused || touchStartX === null) return;
        
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - touchStartX;
        const currentTime = Date.now();
        
        // Only process touch if enough movement and time has passed
        if (Math.abs(deltaX) > touchThreshold && currentTime - lastTouchTime > 100) {
            if (deltaX > 0) {
                this.moveToLane(this.getCurrentLane() + 1);
            } else {
                this.moveToLane(this.getCurrentLane() - 1);
            }
            touchStartX = touchX;
            lastTouchTime = currentTime;
        }
        e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
        touchStartX = null;
    });

    // Click controls
    this.canvas.addEventListener('click', (e) => {
        if (!this.state.active || this.state.paused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        if (clickX < this.config.road.middleLane) {
            this.moveToLane(0); // Left lane
        } else if (clickX < this.config.road.rightLane) {
            this.moveToLane(1); // Middle lane
        } else {
            this.moveToLane(2); // Right lane
        }
    });

    // Restart-knapp
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
            this.state.active = true;
            this.state.player.lives = 5;
            this.state.player.promille = 0;
            this.state.player.distance = 0;
            this.state.obstacles = [];
            this.state.startTime = Date.now();
            this.state.doubleVision.active = false;
        startBtn.style.display = 'none';
            this.resizeCanvas();
        });
    }

    // Ved vindusendring
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.config.road.leftLane = this.canvas.width * 0.10;
            this.config.road.middleLane = this.canvas.width * 0.35;
            this.config.road.rightLane = this.canvas.width * 0.60;
            this.config.road.laneWidth = this.canvas.width * 0.25;
        });

        // Add mouse/touchpad support
    this.canvas.addEventListener('click', (e) => {
        if (!this.state.active || this.state.paused) return;
        
        // Get click position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        // Determine target lane based on click position
        if (clickX < this.config.road.middleLane) {
            this.moveToLane('left');
        } else if (clickX < this.config.road.rightLane) {
            this.moveToLane('middle');
        } else {
            this.moveToLane('right');
        }
    });
// Add touchpad/mouse move support (for laptops)
document.addEventListener('mousemove', (e) => {
  if (!this.state.active || this.state.paused) return;
  
  const rect = this.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  
  // Remove the height check to allow movement anywhere
  this.state.player.targetX = Math.max(
      this.config.road.leftLane,
      Math.min(
          mouseX - this.config.player.width / 2,
          (this.config.road.rightLane + this.config.road.laneWidth) - this.config.player.width
      )
  );
});
}

getCurrentLane() {
    const x = this.state.player.x + (this.config.player.width / 2);
    if (x < this.config.road.middleLane) return 0; // Left lane
    if (x < this.config.road.rightLane) return 1; // Middle lane
    return 2; // Right lane
}

movePlayer(direction) {
  // Smaller increment for smoother movement
  const moveIncrement = this.config.road.laneWidth * 0.2;
  const newTargetX = this.state.player.targetX + (moveIncrement * direction);
  const minX = this.config.road.leftLane;
  const maxX = (this.config.road.rightLane + this.config.road.laneWidth) - this.config.player.width;
  this.state.player.targetX = constrain(newTargetX, minX, maxX);
}

  moveToLane(lane) {
    // Constrain lane number between 0-2
    lane = Math.max(0, Math.min(2, lane));
    
    let targetX;
    switch (lane) {
        case 0: // Left
            targetX = this.config.road.leftLane + (this.config.road.laneWidth / 2);
            break;
        case 1: // Middle
            targetX = this.config.road.middleLane + (this.config.road.laneWidth / 2);
            break;
        case 2: // Right
            targetX = this.config.road.rightLane + (this.config.road.laneWidth / 2);
            break;
    }
    
    // Center the car in the lane
    this.state.player.targetX = targetX - (this.config.player.width / 2);
    }

    spawnObstacle() {
    if (Math.random() < this.config.obstacles.spawnRate) {
            const lanes = ['left', 'middle', 'right'];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
            let laneX;
      switch (lane) {
                case 'left': laneX = this.config.road.leftLane; break;
                case 'middle': laneX = this.config.road.middleLane; break;
                case 'right': laneX = this.config.road.rightLane; break;
            }

            this.state.obstacles.push({
                type: 'car',
                x: laneX + Math.random() * (this.config.road.laneWidth - this.config.obstacles.car.width),
                y: -this.config.obstacles.car.height,
                speed: this.config.obstacles.car.speed[lane],
                lane: lane
            });
        }
    if (Math.random() < this.config.obstacles.bottleSpawnRate) {
            const laneX = this.config.road.leftLane + Math.random() * (this.config.road.laneWidth * 3);
            this.state.obstacles.push({
                type: 'bottle',
                x: laneX,
                y: -this.config.obstacles.bottle.height,
                speed: this.config.obstacles.bottle.speed
            });
        }
    }

    activateDoubleVision() {
        if (!this.state.doubleVision.active && this.state.player.promille > this.config.effects.doubleVisionThreshold) {
      const duration = Math.random() * (this.config.effects.doubleVisionDuration.max - this.config.effects.doubleVisionDuration.min) + this.config.effects.doubleVisionDuration.min;
            this.state.doubleVision = {
                active: true,
                endTime: Date.now() + duration,
                strength: this.state.player.promille / 10
            };
        }
    }

  checkCollisions() {
    const player = this.state.player;
    for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
      const obs = this.state.obstacles[i];
      const collision =
        player.x < obs.x + (obs.type === 'car' ? this.config.obstacles.car.width : this.config.obstacles.bottle.width) &&
        player.x + this.config.player.width > obs.x &&
        player.y < obs.y + (obs.type === 'car' ? this.config.obstacles.car.height : this.config.obstacles.bottle.height) &&
        player.y + this.config.player.height > obs.y;
      if (collision) {
        if (obs.type === 'car') {
          this.state.player.lives--;
          if (this.state.player.lives <= 0) this.gameOver();
        } else if (obs.type === 'bottle') {
          this.state.player.promille = Math.min(this.state.player.promille + 0.5, 10);
        }
        this.state.obstacles.splice(i, 1);
      }
    }
  }



    update() {
    if (!this.state.active || this.state.paused) return;
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

   

    const baseSpeed = 0.02;
    const drunkSpeedBonus = 0.05;
    const smoothPromilleEffect = Math.min(1, this.state.player.promille / 5);
            const currentSpeed = baseSpeed + (drunkSpeedBonus * smoothPromilleEffect);
            // Calculate distance
            if (this.state.startTime) {
                const now = Date.now();
                const elapsedTime = (now - this.state.startTime) / 1000;
                this.state.distance = (elapsedTime * currentSpeed).toFixed(1);
            }

                  this.spawnObstacle();
    for (let obs of this.state.obstacles) {
      obs.y += obs.speed;
    }
        this.state.obstacles = this.state.obstacles.filter(obs => 
            obs.y < this.canvas.height + (obs.type === 'car' ? this.config.obstacles.car.height : this.config.obstacles.bottle.height)
        );

        this.checkCollisions();
    if (this.state.distance % 10 < 0.1 && this.state.distance > 1) {
            this.showQuestion();
        }

        if (Math.random() < 0.01) {
            this.activateDoubleVision();
        }

        if (this.state.doubleVision.active && Date.now() > this.state.doubleVision.endTime) {
            this.state.doubleVision.active = false;
        }

        const delayFactor = this.state.player.promille / 10;
        const lerpSpeed = 0.1 - (0.09 * delayFactor);
        this.state.player.x += (this.state.player.targetX - this.state.player.x) * lerpSpeed;
        this.state.wobbleTime += 0.1 * this.state.player.promille;
    if (this.state.player.promille > this.config.effects.shakeThreshold) {
            this.state.shakeOffset.x = (Math.random() - 0.5) * (this.state.player.promille - 4);
            this.state.shakeOffset.y = (Math.random() - 0.5) * (this.state.player.promille - 4);
        } else {
            this.state.shakeOffset.x = 0;
            this.state.shakeOffset.y = 0;
        }
        this.updateInput(dt);
    
        if (this.state.player.promille >= 10) {
            this.gameOver();
        }
        

 
    }

// Add this method inside the Game class
updateInput(dt) {
  // Smooth player movement
  if (this.state.player.targetX !== this.state.player.x) {
      const moveSpeed = this.config.player.speed * dt;
      const dx = this.state.player.targetX - this.state.player.x;
      const direction = Math.sign(dx);
      const distance = Math.abs(dx);
      
      if (distance > moveSpeed) {
          this.state.player.x += direction * moveSpeed;
      } else {
          this.state.player.x = this.state.player.targetX;
      }
  }
}

    checkCollisions() {
        const player = this.state.player;
        
        this.state.obstacles.forEach((obs, index) => {
            const collision = 
                player.x < obs.x + (obs.type === 'car' ? this.config.obstacles.car.width : this.config.obstacles.bottle.width) &&
                player.x + this.config.player.width > obs.x &&
                player.y < obs.y + (obs.type === 'car' ? this.config.obstacles.car.height : this.config.obstacles.bottle.height) &&
                player.y + this.config.player.height > obs.y;

            if(collision) {
                if(obs.type === 'car') {
                    this.state.player.lives--;
                    if(this.state.player.lives <= 0) this.gameOver();
                } else if(obs.type === 'bottle') {
                    this.state.player.promille = Math.min(this.state.player.promille + 0.5, 10);
                }
                this.state.obstacles.splice(index, 1);
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.state.shakeOffset.x, this.state.shakeOffset.y);
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(
            this.config.road.leftLane, 
            0, 
            this.config.road.laneWidth * 3, 
            this.canvas.height
        );

        // Draw lane dividers
        this.ctx.setLineDash([20, 30]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.road.leftLane + this.config.road.laneWidth, 0);
        this.ctx.lineTo(this.config.road.leftLane + this.config.road.laneWidth, this.canvas.height);
        this.ctx.moveTo(this.config.road.middleLane + this.config.road.laneWidth, 0);
        this.ctx.lineTo(this.config.road.middleLane + this.config.road.laneWidth, this.canvas.height);
        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

    for (let obs of this.state.obstacles) {
      if (obs.type === 'car') {
                const carImg = this.images.obstacleCars[obs.lane];
                if (carImg.complete) {
          this.ctx.drawImage(carImg, obs.x, obs.y, this.config.obstacles.car.width, this.config.obstacles.car.height);
                } else {
          this.ctx.fillStyle = obs.lane === 'left' ? '#e74c3c' : obs.lane === 'middle' ? '#3498db' : '#2ecc71';
          this.ctx.fillRect(obs.x, obs.y, this.config.obstacles.car.width, this.config.obstacles.car.height);
                }
      } else if (obs.type === 'bottle') {
                if (this.images.bottle.complete) {
          this.ctx.drawImage(this.images.bottle, obs.x, obs.y, this.config.obstacles.bottle.width, this.config.obstacles.bottle.height);
                } else {
                    // Fallback to colored rectangle
                    this.ctx.fillStyle = '#f1c40f';
          this.ctx.fillRect(obs.x, obs.y, this.config.obstacles.bottle.width, this.config.obstacles.bottle.height);
                }
            }
    }

        // Draw player car - MODIFIED TO USE IMAGE
        const wobbleOffset = Math.sin(this.state.wobbleTime) * this.config.effects.wobbleIntensity * this.state.player.promille;
        
        if (this.images.playerCar.complete) {
      this.ctx.drawImage(this.images.playerCar, this.state.player.x + wobbleOffset, this.state.player.y, this.config.player.width, this.config.player.height);
        } else {
            // Fallback to colored rectangle
            this.ctx.fillStyle = `hsl(200, 70%, ${70 - (this.state.player.promille * 5)}%)`;
      this.ctx.fillRect(this.state.player.x + wobbleOffset, this.state.player.y, this.config.player.width, this.config.player.height);
        }
    if (this.state.doubleVision.active && this.images.playerCar.complete) {
            this.ctx.globalAlpha = 0.3 * this.state.doubleVision.strength;
      this.ctx.drawImage(this.images.playerCar, this.state.player.x + wobbleOffset + 5 * this.state.doubleVision.strength, this.state.player.y + 2 * this.state.doubleVision.strength, this.config.player.width, this.config.player.height);
            this.ctx.globalAlpha = 1.0;
        }

        this.ctx.restore();
        
    const statsEl = document.getElementById('stats');
    if (statsEl) {
      statsEl.textContent = `Distanse: ${this.state.distance} km | Liv: ${this.state.player.lives} | Promille: ${this.state.player.promille.toFixed(1)}‰`;
    }

    this.ctx.filter = `blur(${(this.state.player.promille / 10) * this.config.effects.maxBlur}px)`;
    }

    showQuestion() {
        const question = {
            question: "Hva er lovlig promillegrense for førerkortinnehavere under 20 år?",
            answers: ["0.2‰", "0.0‰"],
            correct: 1
        };

        this.state.paused = true;
        document.getElementById('questionText').textContent = question.question;
        document.getElementById('answer1').textContent = question.answers[0];
        document.getElementById('answer2').textContent = question.answers[1];
        document.getElementById('questionPopup').style.display = 'block';

        const handleAnswer = (selected) => {
      if (selected === question.correct) {
                this.state.player.lives = Math.min(this.state.player.lives + 1, 5);
            } else {
                this.state.player.promille = Math.min(this.state.player.promille + 0.5, 10);
            }
            document.getElementById('questionPopup').style.display = 'none';
            this.state.paused = false;
        };

        document.getElementById('answer1').onclick = () => handleAnswer(0);
        document.getElementById('answer2').onclick = () => handleAnswer(1);
    }

    gameLoop() {
    if (this.state.active) {
            this.update();
            this.draw();
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    gameOver() {
        this.state.active = false;
        alert(`Game Over! Distanse: ${this.state.distance} km`);
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.style.display = 'block';
    }
  }
}

// --- Global UI og p5 bakgrunnshåndtering ---

function calculateBAC() {
  const weight = parseFloat(document.getElementById('weight').value);
  const gender = document.getElementById('gender').value;
  const hours = parseFloat(document.getElementById('hours').value);
  if (isNaN(weight) || isNaN(hours)) {
    document.getElementById('bacResult').textContent = 'Vennligst fyll inn alle felt.';
    return;
  }
  const drinkInputs = document.querySelectorAll('.drinkInput');
  let totalAlcohol = 0;
  drinkInputs.forEach(input => {
    let quantity = parseFloat(input.value);
    if (!isNaN(quantity)) {
      let type = input.getAttribute('data-type');
      let gramsPerUnit;
      switch (type) {
        case 'beer': gramsPerUnit = 13; break;
        case 'strongbeer': gramsPerUnit = 21; break;
        case 'wine': gramsPerUnit = 15; break;
        case 'spirits': gramsPerUnit = 12.8; break;
        case 'cooler': gramsPerUnit = 13.5; break;
        default: gramsPerUnit = 12.8;
      }
      totalAlcohol += quantity * gramsPerUnit;
    }
  });
  let bac = (totalAlcohol / (weight * 1000 * (gender === 'male' ? 0.68 : 0.55))) * 1000;
  bac -= hours * 0.15;
  bac = Math.max(0, bac);
  document.getElementById('bacResult').textContent = `Estimert promille: ${bac.toFixed(2)}‰`;
  const bar = document.getElementById('bacBar');
  const emoji = document.getElementById('bacEmoji');
  let color = 'green';
  let face = '🙂';
  if (bac >= 0.5 && bac < 1.0) { color = 'orange'; face = '😵'; }
  else if (bac >= 1.0 && bac < 2.0) { color = 'red'; face = '🥴'; }
  else if (bac >= 2.0) { color = 'purple'; face = '💀'; }
  bar.style.width = Math.min(bac * 20, 100) + '%';
  bar.style.backgroundColor = color;
  emoji.textContent = face;
}

let backgroundMusic, clickSound;
let soundsReady = false;
let clouds = [];

// p5-setup: Lag p5-bakgrunnskanvas og skyene med emoji
function setup() {
  window.p5Canvas = createCanvas(windowWidth, windowHeight);
  // p5.sound krever en brukerinteraksjon, så vi kaller userStartAudio her
  userStartAudio();
  backgroundMusic = loadSound('sounds/relaxing-guitar-looop.mp3', checkSoundsReady);
  clickSound = loadSound('sounds/button-press.mp3', checkSoundsReady);
  for (let i = 0; i < 6; i++) {
    clouds.push({
      x: random(width),
      y: random(50, 200),
      size: random(60, 120),
      speed: random(0.2, 0.6),
      face: random(['😎', '😴', '🥰', '😮‍💨', '😂', 'tralalero tralala', 'sigma'])
    });
  }
}

function checkSoundsReady() {
  if (backgroundMusic.isLoaded() && clickSound.isLoaded()) {
    soundsReady = true;
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
  }
}

function draw() {
  clear();
  for (let cloud of clouds) {
    drawCloud(cloud);
    cloud.x += cloud.speed;
    if (cloud.x > width + 50) {
      cloud.x = -100;
      cloud.y = random(50, 200);
    }
  }
}

function drawCloud(cloud) {
  noStroke();
  fill(255, 255, 255, 200);
  let s = cloud.size;
  ellipse(cloud.x, cloud.y, s * 0.6, s * 0.6);
  ellipse(cloud.x - s * 0.3, cloud.y + s * 0.1, s * 0.5, s * 0.5);
  ellipse(cloud.x + s * 0.3, cloud.y + s * 0.1, s * 0.5, s * 0.5);
  ellipse(cloud.x, cloud.y + s * 0.2, s * 0.7, s * 0.5);
  textSize(s / 4);
  textAlign(CENTER, CENTER);
  text(cloud.face, cloud.x, cloud.y);
}

function createPoof(button) {
  const emojis = ['🍻', '🍺', '🍷', '🍶', '🥂'];
  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.className = 'poof-particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * 40 + 20;
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.setProperty('--dx', `${dx}px`);
    el.style.setProperty('--dy', `${dy}px`);
    el.style.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
    button.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }
        }
        
// Håndterer alle menyknapper
document.querySelectorAll('.menuBtn').forEach(btn => {
  btn.addEventListener('click', (event) => {
    userStartAudio();
    if (soundsReady) {
      if (!backgroundMusic.isPlaying()) backgroundMusic.loop();
      if (clickSound.isLoaded()) clickSound.play();
    }
    createPoof(btn);
    const id = btn.id;
    if (id === 'aboutButton') {
      document.getElementById('aboutModal').style.display = 'block';
    }
    if (id === 'settingsButton') {
      document.getElementById('settingsMenu').style.display = 'block';
    }
    if (id === 'youthButton') {
      window.location.assign('https://www.ungitrafikken.no/');
    }
    if (id === 'soberButton') {
      document.getElementById('soberModal').style.display = 'block';
    }
    if (id === 'startButton') {
      document.getElementById('mainTitle').style.display = 'none';
      document.getElementById('startScreen').style.display = 'none';
      if (window.p5Canvas) {
        window.p5Canvas.remove();
      }
      document.getElementById('gameCanvas').style.display = 'block';
      document.getElementById('gameUI').style.display = 'block';
      const carHonk = new Audio('sounds/car-honk.mp3');
      carHonk.play();
      new Game();
    }
  });
});

// Hvis ønskelig, kan du også lytte på vindusendring for p5-bakgrunnen
window.addEventListener("resize", () => {
  // Hvis p5Canvas eksisterer, kan du forsøke å oppdatere den:
  if (window.p5Canvas && window.p5Canvas.resizeCanvas) {
    window.p5Canvas.resizeCanvas(windowWidth, windowHeight);
  }
});
