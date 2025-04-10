// Hjelpefunksjon for å begrense en verdi
function constrain(n, low, high) {
  return Math.max(low, Math.min(n, high));
}

// Add this at the top of your script, after variable declarations
let clouds = [];
let backgroundMusic, clickSound;
let menuMusic;

class Game {
    constructor() {
        try {
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
        } catch (error) {
            console.error('Error initializing game:', error);
            return; // Exit constructor if initialization fails
        }
        
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
                speed: 500,
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
                // Increased spawn rates for more frequent obstacles
                spawnRate: 0.08,      // Increased from 0.05
                bottleSpawnRate: 0.04 // Increased from 0.03
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
            },
            collisionShake: {
                active: false,
                intensity: 0,
                duration: 0,
                startTime: 0,
                offsetX: 0,
                offsetY: 0
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

        // Add this to the Game class initialization
        this.sounds = {
            click: () => {
                if (clickSound && clickSound.isLoaded()) {
                    clickSound.play();
                }
            }
        };
        
        this.initEventListeners();
        this.initUI();
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

        // Replace the touch controls with this simpler version
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.state.active || this.state.paused) return;
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            
            this.state.player.targetX = Math.max(
                this.config.road.leftLane,
                Math.min(
                    touchX - this.config.player.width / 2,
                    (this.config.road.rightLane + this.config.road.laneWidth) - this.config.player.width
                )
            );
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.state.active || this.state.paused) return;
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            
            this.state.player.targetX = Math.max(
                this.config.road.leftLane,
                Math.min(
                    touchX - this.config.player.width / 2,
                    (this.config.road.rightLane + this.config.road.laneWidth) - this.config.player.width
                )
            );
            e.preventDefault();
        }, { passive: false });

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

        // Wrap event listeners in null checks
        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                document.getElementById('gameOverScreen').style.display = 'none';
                this.state.active = true;
                this.state.player.lives = 5;
                this.state.player.promille = 0;
                this.state.player.distance = 0;
                this.state.obstacles = [];
                this.state.startTime = Date.now();
                this.state.doubleVision.active = false;
                this.resizeCanvas();
            });
        }

        const backToMenuBtn = document.getElementById('backToMenuBtn');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                document.getElementById('gameOverScreen').style.display = 'none';
                toggleGameMode(false); // Back to menu mode
                document.getElementById('mainTitle').style.display = 'block';
                document.getElementById('startScreen').style.display = 'flex';
                
                // Reset p5 canvas for background effects
                if (window.p5Canvas) {
                    window.p5Canvas.remove();
                }
                
                // Re-run setup to create a new canvas and clouds
                setTimeout(() => {
                    setup();
                }, 100);
            });
        }

        // Store a reference to this for use in event handlers
        const self = this;
        document.querySelectorAll('.menuBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (self.sounds && typeof self.sounds.click === 'function') {
                    self.sounds.click();
                }
            });
        });

        // Add this with your other button event listeners
        const introButton = document.getElementById('introButton');
        if (introButton) {
          introButton.addEventListener('click', () => {
            const introModal = document.getElementById('introModal');
            if (introModal) {
              introModal.style.display = 'block';
            }
            
            // Play click sound if available (global function)
            if (clickSound && typeof clickSound.play === 'function') {
              clickSound.play();
            }
          });
        }
    }

    getCurrentLane() {
        // Determine which lane the player is in based on x position
        const playerCenterX = this.state.player.x + (this.config.player.width / 2);
        
        if (playerCenterX < this.config.road.middleLane) {
            return 'left';
        } else if (playerCenterX < this.config.road.rightLane) {
            return 'middle';
        } else {
            return 'right';
        }
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
        // Convert lane name to number if it's a string
        if (typeof lane === 'string') {
            switch (lane) {
                case 'left': lane = 0; break;
                case 'middle': lane = 1; break;
                case 'right': lane = 2; break;
                default: lane = 1; // Default to middle
            }
        }
        
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
            
            // Add padding to make hitboxes smaller than visual elements
            const playerPadding = 10; // pixels of padding around player hitbox
            const obstaclePadding = 8; // pixels of padding around obstacle hitbox
            
            // Calculate actual hitbox dimensions with padding
            const playerHitbox = {
                x: player.x + playerPadding,
                y: player.y + playerPadding,
                width: this.config.player.width - (playerPadding * 2),
                height: this.config.player.height - (playerPadding * 2)
            };
            
            const obstacleWidth = obs.type === 'car' ? this.config.obstacles.car.width : this.config.obstacles.bottle.width;
            const obstacleHeight = obs.type === 'car' ? this.config.obstacles.car.height : this.config.obstacles.bottle.height;
            
            const obstacleHitbox = {
                x: obs.x + obstaclePadding,
                y: obs.y + obstaclePadding,
                width: obstacleWidth - (obstaclePadding * 2),
                height: obstacleHeight - (obstaclePadding * 2)
            };
            
            // More precise collision detection with smaller hitboxes
            const collision =
                playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
                playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
                playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
                playerHitbox.y + playerHitbox.height > obstacleHitbox.y;
            
            if (collision) {
                if (obs.type === 'car') {
                    this.state.player.lives--;
                    
                    // Enhanced collision shake effect
                    this.state.collisionShake = {
                        active: true,
                        intensity: 10,  // Increased from 8 for more impact
                        duration: 450,  // Slightly longer duration
                        startTime: Date.now(),
                        rotation: Math.random() * 0.06 - 0.03 // Add rotation effect (-3 to 3 degrees)
                    };
                    
                    // Add this after setting this.state.player.lives-- in the car collision section
                    const livesStat = document.getElementById('livesStat');
                    if (livesStat) {
                        livesStat.style.animation = 'none';
                        livesStat.offsetHeight; // Trigger reflow to restart animation
                        livesStat.style.animation = 'bounce 0.8s, shake 0.5s';
                    }
                    
                    // Add screen flash effect on collision
                    const gameCanvas = document.getElementById('gameCanvas');
                    if (gameCanvas) {
                        gameCanvas.classList.add('collision-flash');
                        setTimeout(() => {
                            gameCanvas.classList.remove('collision-flash');
                        }, 150);
                    }
                    
                    if (this.state.player.lives <= 0) this.gameOver();
                } else if (obs.type === 'bottle') {
                    this.state.player.promille = Math.min(this.state.player.promille + 0.2, 10);
                    
                    // Add this after setting this.state.player.promille in the bottle collision section
                    const promilleStat = document.getElementById('promilleStat');
                    if (promilleStat) {
                        promilleStat.style.animation = 'none';
                        promilleStat.offsetHeight; // Trigger reflow to restart animation
                        promilleStat.style.animation = 'bounce 0.6s';
                    }
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
        
        // Update player based on input
        this.updateInput(dt);
        
        // Update wobble effect based on promille
        this.state.wobbleTime += dt * (1 + this.state.player.promille);
        
        // Update shake effect if active
        if (this.state.player.promille > this.config.effects.shakeThreshold) {
            this.state.shakeOffset.x = (Math.random() * 2 - 1) * this.state.player.promille;
            this.state.shakeOffset.y = (Math.random() * 2 - 1) * this.state.player.promille;
        } else {
            this.state.shakeOffset.x = 0;
            this.state.shakeOffset.y = 0;
        }
        
        // Update collision shake effect
        if (this.state.collisionShake.active) {
            const elapsed = Date.now() - this.state.collisionShake.startTime;
            const progress = elapsed / this.state.collisionShake.duration;
            
            if (progress >= 1) {
                this.state.collisionShake.active = false;
                this.state.collisionShake.offsetX = 0;
                this.state.collisionShake.offsetY = 0;
            } else {
                // Enhanced shake pattern with directional bias based on impact
                const remainingIntensity = 1 - Math.pow(progress, 2); // Quadratic ease-out
                const currentIntensity = this.state.collisionShake.intensity * remainingIntensity;
                
                // Create a more chaotic but controlled shake pattern
                const shakePhase = progress * 20; // Increase frequency
                const xBias = Math.sin(shakePhase) * 0.7; // Horizontal bias component
                const yBias = Math.cos(shakePhase * 1.3) * 0.7; // Vertical bias component with different frequency
                
                // Apply random component + directional bias
                this.state.collisionShake.offsetX = (Math.random() * 0.3 + xBias) * currentIntensity;
                this.state.collisionShake.offsetY = (Math.random() * 0.3 + yBias) * currentIntensity;
            }
        }
        
        // Update double vision effect
        if (this.state.doubleVision.active) {
            if (Date.now() > this.state.doubleVision.endTime) {
                this.state.doubleVision.active = false;
            } else if (Math.random() < 0.01) {
                this.state.doubleVision.strength = this.state.player.promille / 5;
            }
        } else if (this.state.player.promille > this.config.effects.doubleVisionThreshold && Math.random() < 0.01) {
            this.activateDoubleVision();
        }
        
        // Update obstacles
        for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
            const obs = this.state.obstacles[i];
            obs.y += obs.speed;
            
            if (obs.y > this.canvas.height) {
                this.state.obstacles.splice(i, 1);
            }
        }
        
        // Spawn new obstacles (increased from 0.08 to 0.12)
        if (Math.random() < 0.12) {
            this.spawnObstacle();
        }
        
        // Update distance calculation
        if (this.state.startTime) {
            const now = Date.now();
            const elapsedSeconds = (now - this.state.startTime) / 1000;
            // Increased factor for more realistic distance progression
            const distanceFactor = 0.08; 
            this.state.distance = (elapsedSeconds * distanceFactor * (1 + this.state.player.promille / 5)).toFixed(1);
        }
        
        // After updating this.state.distance
        const wholeDist = Math.floor(parseFloat(this.state.distance));
        if (wholeDist > 0 && wholeDist % 5 === 0) { // Every 5km
            // Check if we haven't triggered this milestone yet
            const milestone = `milestone-${wholeDist}`;
            if (!this.state.milestones || !this.state.milestones.includes(milestone)) {
                // Add milestone to tracked milestones
                if (!this.state.milestones) this.state.milestones = [];
                this.state.milestones.push(milestone);
                
                // Create milestone celebration
                const statsContainer = document.getElementById('statsContainer');
                if (statsContainer) {
                    const celebration = document.createElement('div');
                    celebration.className = 'milestone-celebration';
                    celebration.textContent = `${wholeDist} KM!`;
                    document.body.appendChild(celebration);
                    
                    // Remove after animation
                    setTimeout(() => {
                        document.body.removeChild(celebration);
                    }, 2000);
                }
            }
        }
        
        this.checkCollisions();
        
        // Changed from 5 to 3 to show questions every 3km
        if (this.state.distance % 3 < 0.1 && this.state.distance > 1 && !isNaN(this.state.distance)) {
            this.showQuestion();
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

    // In the draw method, update the shake application:
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        // Apply combined shake effects with rotation
        let totalShakeX = this.state.shakeOffset.x;
        let totalShakeY = this.state.shakeOffset.y;
        let rotation = 0;
        
        if (this.state.collisionShake.active) {
            const elapsed = Date.now() - this.state.collisionShake.startTime;
            const progress = elapsed / this.state.collisionShake.duration;
            const easeOut = 1 - Math.pow(progress, 2); // Quadratic ease out for smoother finish
            
            totalShakeX += this.state.collisionShake.offsetX;
            totalShakeY += this.state.collisionShake.offsetY;
            
            // Apply rotation with easing
            if (this.state.collisionShake.rotation) {
                rotation = this.state.collisionShake.rotation * easeOut * Math.sin(progress * Math.PI * 8);
            }
        }
        
        // Move canvas center to apply rotation properly
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate(rotation);
        this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        
        // Then apply the shake translation
        this.ctx.translate(totalShakeX, totalShakeY);
        
        // Rest of your drawing code...
        
        // Road background
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

        // Draw obstacles
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

        // Draw player car with wobble
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
        
        // Update stats display - new fancy version
        const distanceValue = document.getElementById('distanceValue');
        const livesValue = document.getElementById('livesValue');
        const promilleValue = document.getElementById('promilleValue');
        const promilleBar = document.getElementById('promilleBar');
        const statsContainer = document.getElementById('statsContainer');

        if (distanceValue && livesValue && promilleValue && promilleBar) {
            // Update distance
            if (distanceValue.textContent !== `${this.state.distance} km`) {
                distanceValue.textContent = `${this.state.distance} km`;
                distanceValue.classList.add('stat-change');
                setTimeout(() => distanceValue.classList.remove('stat-change'), 500);
            }
            
            // Update lives with animation if changed
            if (livesValue.textContent !== `${this.state.player.lives}`) {
                livesValue.textContent = this.state.player.lives;
                livesValue.classList.add('stat-change');
                setTimeout(() => livesValue.classList.remove('stat-change'), 500);
            }
            
            // Update promille
            promilleValue.textContent = `${this.state.player.promille.toFixed(1)}‰`;
            
            // Update promille bar (scales to 10.0 max)
            const barWidth = Math.min(100, (this.state.player.promille / 10) * 100);
            promilleBar.style.width = `${barWidth}%`;
            
            // Add warning effect for high promille
            if (this.state.player.promille > 5.0) {
                statsContainer.classList.add('promille-warning');
            } else {
                statsContainer.classList.remove('promille-warning');
            }
        }
        
        // Apply blur based on promille
        this.ctx.filter = `blur(${(this.state.player.promille / 10) * this.config.effects.maxBlur}px)`;
    }

    showQuestion() {
        try {
            // Make sure questionPool exists and has items
            if (!questionPool || questionPool.length === 0) {
                console.error('Question pool is empty or undefined');
                return;
            }
            
            const questionIndex = Math.floor(Math.random() * questionPool.length);
            const question = questionPool[questionIndex];
            
            if (!question) {
                console.error('Selected question is undefined');
                return;
            }

            this.state.paused = true;
            
            const questionText = document.getElementById('questionText');
            const answer1 = document.getElementById('answer1');
            const answer2 = document.getElementById('answer2');
            const questionPopup = document.getElementById('questionPopup');
            
            if (!questionText || !answer1 || !answer2 || !questionPopup) {
                console.error('Question UI elements not found');
                this.state.paused = false;
                return;
            }
            
            questionText.textContent = question.question;
            answer1.textContent = question.answers[0];
            answer2.textContent = question.answers[1];
            questionPopup.style.display = 'block';
            
            // Store reference to this for event handlers
            const self = this;

            const handleAnswer = (selected) => {
                if (selected === question.correct) {
                    self.state.player.lives = Math.min(self.state.player.lives + 1, 5);
                } else {
                    self.state.player.promille = Math.min(self.state.player.promille + 0.5, 10);
                }
                questionPopup.style.display = 'none';
                self.state.paused = false;
            };

            // Clear previous listeners to prevent duplicates
            const oldAnswer1 = answer1.cloneNode(true);
            const oldAnswer2 = answer2.cloneNode(true);
            answer1.parentNode.replaceChild(oldAnswer1, answer1);
            answer2.parentNode.replaceChild(oldAnswer2, answer2);
            
            oldAnswer1.onclick = () => handleAnswer(0);
            oldAnswer2.onclick = () => handleAnswer(1);
        } catch (error) {
            console.error('Error showing question:', error);
            this.state.paused = false;
        }
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
        
        // Update the final distance display
        document.getElementById('finalDistance').textContent = this.state.distance;
        
        // Show game over screen
        document.getElementById('gameOverScreen').style.display = 'block';
        
        // Start button only appears in game over screen, not during gameplay
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.style.display = 'block';
        }
    }

    initUI() {
        // Initially hide the restart button
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.style.display = 'none';
        }
    }
}

// --- Global UI og p5 bakgrunnshåndtering ---

function calculateBAC() {
    const weight = parseFloat(document.getElementById('weight').value);
    const gender = document.getElementById('gender').value;
    const hours = parseFloat(document.getElementById('hours').value);
    
    let totalAlcohol = 0;
    // Get all drink inputs
    document.querySelectorAll('.drinkInput').forEach(input => {
        const amount = parseInt(input.value);
        const type = input.dataset.type;
        
        if (amount > 0) {
            switch(type) {
                case 'beer': totalAlcohol += amount * 14; break; // 0.33L 4.5%
                case 'strongbeer': totalAlcohol += amount * 26; break; // 0.5L 6.5%
                case 'wine': totalAlcohol += amount * 12; break; // 1 glass 12%
                case 'spirits': totalAlcohol += amount * 12.8; break; // 4cl 40%
                case 'cooler': totalAlcohol += amount * 12.4; break; // 0.33L 4.7%
            }
        }
    });
    
    // Factor for gender
    const genderFactor = gender === 'male' ? 0.7 : 0.6;
    
    // Calculate BAC
    let bac = totalAlcohol / (weight * genderFactor);
    
    // Reduce by metabolism (about 0.15 per hour)
    bac = Math.max(0, bac - (hours * 0.15));
    
    // Update the result
    const bacResult = document.getElementById('bacResult');
    const bacBar = document.getElementById('bacBar');
    const bacEmoji = document.getElementById('bacEmoji');
    
    bacResult.textContent = `Din promille er ca. ${bac.toFixed(2)}‰`;
    
    // Update visual bar (max 5.0)
    const barWidth = Math.min(100, (bac / 5) * 100);
    bacBar.style.width = `${barWidth}%`;
    
    // Set color based on BAC level
    if (bac < 0.2) {
        bacBar.style.background = 'green';
        bacEmoji.textContent = '🙂';
    } else if (bac < 0.5) {
        bacBar.style.background = 'yellow';
        bacEmoji.textContent = '🥴';
    } else if (bac < 1.0) {
        bacBar.style.background = 'orange';
        bacEmoji.textContent = '🍺';
    } else {
        bacBar.style.background = 'red';
        bacEmoji.textContent = '😵';
    }
}

// Modify the setup function to properly initialize p5 
function setup() {
  try {
    // Create the p5 canvas with a specific ID
    window.p5Canvas = createCanvas(windowWidth, windowHeight);
    p5Canvas.id('cloudCanvas');
    
    // Safely load sounds
    try {
      userStartAudio();
      backgroundMusic = loadSound('sounds/relaxing-guitar-looop.mp3', checkSoundsReady);
      clickSound = loadSound('sounds/button-press.mp3', checkSoundsReady);
    } catch (e) {
      console.error('Error loading sounds:', e);
      // Continue without sounds if loading fails
      document.getElementById('loadingMessage').style.display = 'none';
      document.getElementById('startScreen').style.display = 'flex'; 
    }
    
    resetClouds();
    
    // Position the cloud canvas
    const canvas = document.getElementById('cloudCanvas');
    if (canvas) {
      canvas.style.zIndex = '0';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
    }
  } catch (error) {
    console.error('Error in setup:', error);
  }
}

// Safer cloud reset function
function resetClouds() {
  try {
    // Clear existing clouds
    clouds = [];
    
    // Cloud content options
    const emojis = ['😎', '😴', '🥰', '😮‍💨', '😂', '🗿', '🦇', '🦄', '🐼'];
    const textMessages = [
      'never gonna give you up, never gonna let you down', 
      'sigma sigma sigmaboy', 
      'r u winning son?', 
      '!', 
      'vær ansvarlig.... bitchass', 
      'grensa e 0.2‰'
    ];
    
    // Only proceed if p5 width and random functions are available
    if (typeof width !== 'undefined' && typeof random === 'function') {
      for (let i = 0; i < 6; i++) {
        // Randomly choose between emoji and text
        const useEmoji = Math.random() > 0.5;
        const cloudContent = useEmoji ? 
          emojis[Math.floor(Math.random() * emojis.length)] : 
          textMessages[Math.floor(Math.random() * textMessages.length)];
          
        clouds.push({
          x: random(width),
          y: random(50, 200),
          size: random(60, 120),
          speed: random(0.2, 0.6),
          face: cloudContent,
          isText: !useEmoji
        });
      }
    }
  } catch (error) {
    console.error('Error resetting clouds:', error);
  }
}

function draw() {
  try {
    clear();
    
    // Check if clouds array exists and has items
    if (!clouds || clouds.length === 0) {
      resetClouds();
    }
    
    // Draw and move clouds if they exist
    if (clouds && clouds.length > 0) {
      for (let cloud of clouds) {
        drawCloud(cloud);
        cloud.x += cloud.speed;
        if (cloud.x > width + 100) {
          cloud.x = -100;
          cloud.y = random(50, 200);
          // Sometimes change cloud content when it reappears
          if (Math.random() > 0.7) {
            const useEmoji = Math.random() > 0.5;
            const emojis = ['😎', '😴', '🥰', '😮‍💨', '😂'];
            const textMessages = ['tralalero tralala', 'sigma', 'r u winning son?', 'ikke fyllekjør!'];
            cloud.face = useEmoji ? 
              emojis[Math.floor(Math.random() * emojis.length)] : 
              textMessages[Math.floor(Math.random() * textMessages.length)];
            cloud.isText = !useEmoji;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in draw:', error);
  }
}

function drawCloud(cloud) {
  try {
    if (typeof noStroke !== 'function' || typeof fill !== 'function' || typeof ellipse !== 'function') {
      console.error('P5 drawing functions not available');
      return;
    }
    
    noStroke();
    fill(255, 255, 255, 200);
    let s = cloud.size;
    
    // Check if the cloud contains text that needs extended width
    let isTextCloud = typeof cloud.face === 'string' && cloud.face.length > 2;
    let cloudTextWidth = 0;
    
    if (isTextCloud) {
      textSize(s / 4);
      textAlign(CENTER, CENTER);
      // Fix: Use textWidth function directly
      cloudTextWidth = textWidth(cloud.face);
      
      // Adjust cloud size based on text length
      let baseWidth = s * 0.7;
      let stretchFactor = Math.max(1, cloudTextWidth / baseWidth);
      
      // Draw a wider cloud for text
      ellipse(cloud.x, cloud.y, s * 0.6 * stretchFactor, s * 0.6);
      ellipse(cloud.x - s * 0.3 * stretchFactor, cloud.y + s * 0.1, s * 0.5, s * 0.5);
      ellipse(cloud.x + s * 0.3 * stretchFactor, cloud.y + s * 0.1, s * 0.5, s * 0.5);
      ellipse(cloud.x, cloud.y + s * 0.2, s * 0.7 * stretchFactor, s * 0.5);
    } else {
      // Standard cloud for emojis
      ellipse(cloud.x, cloud.y, s * 0.6, s * 0.6);
      ellipse(cloud.x - s * 0.3, cloud.y + s * 0.1, s * 0.5, s * 0.5);
      ellipse(cloud.x + s * 0.3, cloud.y + s * 0.1, s * 0.5, s * 0.5);
      ellipse(cloud.x, cloud.y + s * 0.2, s * 0.7, s * 0.5);
    }
    
    // Draw the text/emoji
    textSize(s / 4);
    textAlign(CENTER, CENTER);
    
    // Use dark text for strings, regular color for emojis
    if (isTextCloud) {
      fill(0, 0, 0, 220); // Dark text for better readability
    } else {
      fill(0); // Standard black for emojis
    }
    
    text(cloud.face, cloud.x, cloud.y);
  } catch (error) {
    console.error('Error drawing cloud:', error);
  }
}

function checkSoundsReady() {
    // Count loaded sounds
    let loadedSounds = 0;
    if (backgroundMusic && backgroundMusic.isLoaded()) loadedSounds++;
    if (clickSound && clickSound.isLoaded()) loadedSounds++;
    
    // If all sounds are loaded, hide loading message and show start screen
    if (loadedSounds === 2) {
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
    }
}

// Add this function to properly handle transitions between menu and game
function toggleGameMode(inGame) {
  try {
    const cloudCanvas = document.getElementById('cloudCanvas');
    
    if (inGame) {
      // Hide clouds when in game
      if (cloudCanvas) cloudCanvas.style.display = 'none';
      
      // Show game elements
      const gameCanvas = document.getElementById('gameCanvas');
      const gameUI = document.getElementById('gameUI');
      
      if (gameCanvas) gameCanvas.style.display = 'block';
      if (gameUI) gameUI.style.display = 'block';
      
      // Reset any other game-related states
      document.getElementById('startBtn').style.display = 'none';
    } else {
      // Show clouds in menu
      if (cloudCanvas) cloudCanvas.style.display = 'block';
      
      // Hide game elements
      const gameCanvas = document.getElementById('gameCanvas');
      const gameUI = document.getElementById('gameUI');
      
      if (gameCanvas) gameCanvas.style.display = 'none';
      if (gameUI) gameUI.style.display = 'none';
      
      // Show title and menu
      const mainTitle = document.getElementById('mainTitle');
      const startScreen = document.getElementById('startScreen');
      
      if (mainTitle) mainTitle.style.display = 'block';
      if (startScreen) startScreen.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error toggling game mode:', error);
  }
}

// Add this at the end of your script for proper initialization
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize background animation
    // Game will be initialized when the Start button is clicked
    
    // Add event listeners for menu buttons
    const startButton = document.getElementById('startButton');
    const soberButton = document.getElementById('soberButton');
    const settingsButton = document.getElementById('settingsButton');
    const aboutButton = document.getElementById('aboutButton');
    const youthButton = document.getElementById('youthButton');
    
    if (startButton) {
      startButton.addEventListener('click', () => {
        try {
          // First, prevent the click sound that's triggered by the generic button handler
          event.stopPropagation();
          
          // Play car honk sound before starting the game
          let carHonk = loadSound('sounds/car-honk.mp3', () => {
            carHonk.play();
          });
          
          toggleGameMode(true); // Enter game mode
          
          const mainTitle = document.getElementById('mainTitle');
          const startScreen = document.getElementById('startScreen');
          
          if (mainTitle) mainTitle.style.display = 'none';
          if (startScreen) startScreen.style.display = 'none';
          
          // Initialize the game
          window.game = new Game();
          
          // Do NOT play the regular click sound here
          // Instead the car honk will play
          
          if (menuMusic && menuMusic.isPlaying()) {
            menuMusic.stop();
          }
        } catch (error) {
          console.error('Error starting game:', error);
        }
      });
    }
    
    if (soberButton) {
      soberButton.addEventListener('click', () => {
        const soberModal = document.getElementById('soberModal');
        if (soberModal) soberModal.style.display = 'block';
        
        // Play click sound if available (global function)
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }
    
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        const settingsMenu = document.getElementById('settingsMenu');
        if (settingsMenu) settingsMenu.style.display = 'block';
        
        // Play click sound if available (global function)
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }
    
    if (aboutButton) {
      aboutButton.addEventListener('click', () => {
        const aboutModal = document.getElementById('aboutModal');
        if (aboutModal) aboutModal.style.display = 'block';
        
        // Play click sound if available (global function)
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }
    
    if (youthButton) {
      youthButton.addEventListener('click', () => {
        window.open('https://trafikksikkerhetsforeningen.no/om-ung-i-trafikken/', '_blank');
        
        // Play click sound if available (global function)
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }

    // Add this with your other button event listeners
    const introButton = document.getElementById('introButton');
    if (introButton) {
      introButton.addEventListener('click', () => {
        const introModal = document.getElementById('introModal');
        if (introModal) {
          introModal.style.display = 'block';
        }
        
        // Play click sound if available (global function)
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }
    
    // Initialize p5 canvas
    if (typeof setup === 'function') {
      setup();
    }
    
    // Initialize menu music after user interaction
    if (typeof userStartAudio === 'function') {
      userStartAudio().then(() => {
        initMenuMusic();
      });
    }
  } catch (error) {
    console.error('Error in DOMContentLoaded event:', error);
  }
});

// Define question pool before it's used
const questionPool = [
    {
        question: "Hva er lovlig promillegrense for førerkortinnehavere under 20 år?",
        answers: ["0.2‰", "0.0‰"],
        correct: 0
    },
    {
        question: "Hva skjer ved en promille på 0.5-0.8?",
        answers: ["Økt risikovillighet", "Nedsatt syn"],
        correct: 0
    },
    {
        question: "Når er du edru etter en fest?",
        answers: ["Etter en god natts søvn", "Når promillen er 0.0"],
        correct: 1
    },
    {
        question: "Hva risikerer man for fyllekjøring i Norge?",
        answers: ["Kraftig bot og tap av førerkort", "Bot, tap av førerkort og fengsel"],
        correct: 1
    }
];

// In your setup or initialization code
function initMenuMusic() {
  try {
    menuMusic = loadSound('sounds/relaxing-guitar-looop.mp3', () => {
      menuMusic.setLoop(true);
      menuMusic.setVolume(0.5);
      menuMusic.play();
    });
  } catch (error) {
    console.error('Error loading menu music:', error);
  }
}