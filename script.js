class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        this.config = {
            road: {
                leftLane: this.canvas.width * 0.10,
                middleLane: this.canvas.width * 0.35,
                rightLane: this.canvas.width * 0.60,
                laneWidth: this.canvas.width * 0.25
            },
            player: {
                width: 30,
                height: 50,
                speed: 5,
                startY: this.canvas.height - 100,
                maxLives: 5
            },
            obstacles: {
                car: {
                    width: 30,
                    height: 50,
                    speed: { left: 6, middle: 4, right: 3 }
                },
                bottle: {
                    width: 15,
                    height: 30,
                    speed: 3
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
                x: this.canvas.width/2,
                targetX: this.canvas.width/2,
                y: this.config.player.startY,
                lives: 5,
                promille: 0,
                distance: 0
            },
            obstacles: [],
            lastInputTime: 0,
            active: false,
            paused: false,
            wobbleTime: 0,
            shakeOffset: { x: 0, y: 0 },
            lastDistanceUpdate: Date.now(),
            startTime: null,
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

        this.initEventListeners();
        this.gameLoop();
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            if(!this.state.active || this.state.paused) return;
            
            if(this.state.player.promille === 0) {
                if(e.key === 'ArrowLeft') this.movePlayer(-1);
                if(e.key === 'ArrowRight') this.movePlayer(1);
            } else {
                const now = Date.now();
                if(now - this.state.lastInputTime < this.config.effects.maxInputDelay * (this.state.player.promille/10)) return;
                
                if(e.key === 'ArrowLeft') this.movePlayer(-1);
                if(e.key === 'ArrowRight') this.movePlayer(1);
                this.state.lastInputTime = now;
            }
        });

        let touchStartX = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if(!this.state.active || this.state.paused) return;
            const touchEndX = e.touches[0].clientX;
            const delta = touchEndX - touchStartX;
            this.movePlayer(delta > 0 ? 1 : -1);
            touchStartX = touchEndX;
            e.preventDefault();
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.state.active = true;
            this.state.player.lives = 5;
            this.state.player.promille = 0;
            this.state.player.distance = 0;
            this.state.obstacles = [];
            this.state.startTime = Date.now();
            this.state.doubleVision.active = false;
            document.getElementById('startBtn').style.display = 'none';
            this.resizeCanvas();
        });

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.config.road.leftLane = this.canvas.width * 0.10;
            this.config.road.middleLane = this.canvas.width * 0.35;
            this.config.road.rightLane = this.canvas.width * 0.60;
            this.config.road.laneWidth = this.canvas.width * 0.25;
        });
    }

    movePlayer(direction) {
        const newTargetX = this.state.player.targetX + (this.config.player.speed * direction);
        const minX = this.config.road.leftLane;
        const maxX = (this.config.road.rightLane + this.config.road.laneWidth) - this.config.player.width;
        this.state.player.targetX = Math.max(minX, Math.min(maxX, newTargetX));
    }

    spawnObstacle() {
        if(Math.random() < this.config.obstacles.spawnRate) {
            const lanes = ['left', 'middle', 'right'];
            const lane = lanes[Math.floor(Math.random() * 3)];
            let laneX;

            switch(lane) {
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

        if(Math.random() < this.config.obstacles.bottleSpawnRate) {
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
            const duration = Math.random() * (this.config.effects.doubleVisionDuration.max - this.config.effects.doubleVisionDuration.min) 
                             + this.config.effects.doubleVisionDuration.min;
            this.state.doubleVision = {
                active: true,
                endTime: Date.now() + duration,
                strength: this.state.player.promille / 10
            };
        }
    }

    update() {
        if(!this.state.active || this.state.paused) return;

        if (this.state.startTime) {
            const now = Date.now();
            const elapsedTime = (now - this.state.startTime) / 1000;
            this.state.distance = (elapsedTime * 0.02).toFixed(1);
        }

        this.spawnObstacle();

        this.state.obstacles.forEach(obs => obs.y += obs.speed);

        this.state.obstacles = this.state.obstacles.filter(obs => 
            obs.y < this.canvas.height + (obs.type === 'car' ? this.config.obstacles.car.height : this.config.obstacles.bottle.height)
        );

        this.checkCollisions();

        if(this.state.distance % 10 < 0.1 && this.state.distance > 1) {
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

        if(this.state.player.promille > this.config.effects.shakeThreshold) {
            this.state.shakeOffset.x = (Math.random() - 0.5) * (this.state.player.promille - 4);
            this.state.shakeOffset.y = (Math.random() - 0.5) * (this.state.player.promille - 4);
        } else {
            this.state.shakeOffset.x = 0;
            this.state.shakeOffset.y = 0;
        }

        if(this.state.player.promille >= 10) {
            this.gameOver();
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

        // Draw road background
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

        // Draw obstacles - MODIFIED TO USE IMAGES
        this.state.obstacles.forEach(obs => {
            if(obs.type === 'car') {
                const carImg = this.images.obstacleCars[obs.lane];
                if (carImg.complete) {
                    this.ctx.drawImage(carImg, 
                        obs.x, 
                        obs.y, 
                        this.config.obstacles.car.width, 
                        this.config.obstacles.car.height);
                } else {
                    // Fallback to colored rectangle
                    this.ctx.fillStyle = 
                        obs.lane === 'left' ? '#e74c3c' : 
                        obs.lane === 'middle' ? '#3498db' : '#2ecc71';
                    this.ctx.fillRect(obs.x, obs.y, 
                        this.config.obstacles.car.width, 
                        this.config.obstacles.car.height);
                }
            } else if(obs.type === 'bottle') {
                if (this.images.bottle.complete) {
                    this.ctx.drawImage(this.images.bottle, 
                        obs.x, 
                        obs.y, 
                        this.config.obstacles.bottle.width, 
                        this.config.obstacles.bottle.height);
                } else {
                    // Fallback to colored rectangle
                    this.ctx.fillStyle = '#f1c40f';
                    this.ctx.fillRect(obs.x, obs.y, 
                        this.config.obstacles.bottle.width, 
                        this.config.obstacles.bottle.height);
                }
            }
        });

        // Draw player car - MODIFIED TO USE IMAGE
        const wobbleOffset = Math.sin(this.state.wobbleTime) * this.config.effects.wobbleIntensity * this.state.player.promille;
        
        if (this.images.playerCar.complete) {
            this.ctx.drawImage(this.images.playerCar, 
                this.state.player.x + wobbleOffset,
                this.state.player.y,
                this.config.player.width,
                this.config.player.height);
        } else {
            // Fallback to colored rectangle
            this.ctx.fillStyle = `hsl(200, 70%, ${70 - (this.state.player.promille * 5)}%)`;
            this.ctx.fillRect(
                this.state.player.x + wobbleOffset,
                this.state.player.y,
                this.config.player.width,
                this.config.player.height
            );
        }

        // Double vision effect
        if(this.state.doubleVision.active && this.images.playerCar.complete) {
            this.ctx.globalAlpha = 0.3 * this.state.doubleVision.strength;
            this.ctx.drawImage(this.images.playerCar, 
                this.state.player.x + wobbleOffset + 5 * this.state.doubleVision.strength,
                this.state.player.y + 2 * this.state.doubleVision.strength,
                this.config.player.width,
                this.config.player.height);
            this.ctx.globalAlpha = 1.0;
        }

        this.ctx.restore();
        
        // Update stats
        document.getElementById('stats').textContent = 
            `Distanse: ${this.state.distance} km | Liv: ${this.state.player.lives} | Promille: ${this.state.player.promille.toFixed(1)}‰`;

        // Apply blur filter
        this.ctx.filter = `blur(${(this.state.player.promille/10) * this.config.effects.maxBlur}px)`;
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
            if(selected === question.correct) {
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
        if(this.state.active) {
            this.update();
            this.draw();
        }
        requestAnimationFrame(() => this.gameLoop());
    }

    gameOver() {
        this.state.active = false;
        alert(`Game Over! Distanse: ${this.state.distance} km`);
        document.getElementById('startBtn').style.display = 'block';
    }
}

window.addEventListener('load', () => new Game());
window.addEventListener('resize', () => new Game().resizeCanvas());