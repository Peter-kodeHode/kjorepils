class Game { // Main Game class
    constructor() { // Constructor initializes game state and config
        this.canvas = document.getElementById('gameCanvas'); // Reference to game canvas
        this.ctx = this.canvas.getContext('2d'); // 2D rendering context
        this.resizeCanvas(); // Adjust canvas size initially
        
        this.config = { // Configuration object for various game settings
            road: {
                leftLane: this.canvas.width * 0.10, // Position of the left lane
                middleLane: this.canvas.width * 0.35, // Position of the middle lane
                rightLane: this.canvas.width * 0.60, // Position of the right lane
                laneWidth: this.canvas.width * 0.25 // Width of each lane
            },
            player: {
                width: 30, // Player car width
                height: 50, // Player car height
                speed: 5, // Player lateral speed
                startY: this.canvas.height - 100, // Player's initial Y position
                maxLives: 5 // Maximum number of lives
            },
            obstacles: {
                car: {
                    width: 30, // Width of car obstacles
                    height: 50, // Height of car obstacles
                    speed: { left: 6, middle: 4, right: 3 } // Speed depending on lane
                },
                bottle: {
                    width: 15, // Width of bottle obstacles
                    height: 30, // Height of bottle obstacles
                    speed: 3 // Speed of bottles
                },
                spawnRate: 0.03, // Probability of spawning car obstacles
                bottleSpawnRate: 0.01 // Probability of spawning bottle obstacles
            },
            effects: {
                maxBlur: 15, // Max blur effect when promille is high
                maxInputDelay: 300, // Max input delay in ms
                wobbleIntensity: 0.8, // Wobble intensity factor
                doubleVisionThreshold: 0.1, // Threshold for double vision effect
                shakeThreshold: 5.0, // Threshold for screen shake
                doubleVisionDuration: { min: 2000, max: 5000 } // Duration range for double vision in ms
            }
        };

        this.state = { // State object holds dynamic variables
            player: {
                x: this.canvas.width/2, // Player's current X position
                targetX: this.canvas.width/2, // Player's target X (for lerp)
                y: this.config.player.startY, // Player's Y
                lives: 5, // Player lives
                promille: 0, // Promille level
                distance: 0 // Distance traveled
            },
            obstacles: [], // Array of spawned obstacles
            lastInputTime: 0, // Tracks the last time user input was processed
            active: false, // Whether the game is active
            paused: false, // Whether the game is paused (e.g., when a question is displayed)
            wobbleTime: 0, // Keeps track of time for wobble calculations
            shakeOffset: { x: 0, y: 0 }, // Offset for screen shake effect
            lastDistanceUpdate: Date.now(), // Time tracking for distance
            startTime: null, // Timestamp for when the game started
            doubleVision: { // Manages double vision effect
                active: false,
                endTime: 0,
                strength: 0
            }
        };

        this.initEventListeners(); // Set up keyboard/touch events
        this.gameLoop(); // Start the main game loop
    } // End constructor

    resizeCanvas() { // Adjusts canvas dimensions to container size
        const container = document.getElementById('gameContainer'); // Container reference
        this.canvas.width = container.clientWidth; // Match container width
        this.canvas.height = container.clientHeight; // Match container height
    } // End resizeCanvas

    initEventListeners() { // Sets up user input events for controls
        document.addEventListener('keydown', (e) => {
            if(!this.state.active || this.state.paused) return;
            
            if(this.state.player.promille === 0) { 
                // Normal input with no promille
                if(e.key === 'ArrowLeft') this.movePlayer(-1);
                if(e.key === 'ArrowRight') this.movePlayer(1);
            } else {
                // Input delay based on promille
                const now = Date.now();
                if(now - this.state.lastInputTime < this.config.effects.maxInputDelay * (this.state.player.promille/10)) return;
                
                if(e.key === 'ArrowLeft') this.movePlayer(-1);
                if(e.key === 'ArrowRight') this.movePlayer(1);
                this.state.lastInputTime = now;
            }
        }); // End keydown event

        let touchStartX = 0; // Keep track of initial touch position
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }); // End touchstart

        this.canvas.addEventListener('touchmove', (e) => {
            if(!this.state.active || this.state.paused) return;
            const touchEndX = e.touches[0].clientX;
            const delta = touchEndX - touchStartX;
            this.movePlayer(delta > 0 ? 1 : -1);
            touchStartX = touchEndX;
            e.preventDefault();
        }); // End touchmove

        document.getElementById('startBtn').addEventListener('click', () => {
            this.state.active = true;
            this.state.player.lives = 5;
            this.state.player.promille = 0;
            this.state.player.distance = 0;
            this.state.obstacles = [];
            this.state.startTime = Date.now();
            this.state.doubleVision.active = false;
            document.getElementById('startBtn').style.display = 'none';
            this.resizeCanvas(); // Ensures canvas is resized on start
        }); // End startBtn click

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.config.road.leftLane = this.canvas.width * 0.10;
            this.config.road.middleLane = this.canvas.width * 0.35;
            this.config.road.rightLane = this.canvas.width * 0.60;
            this.config.road.laneWidth = this.canvas.width * 0.25;
        }); // End window resize
    } // End initEventListeners

    movePlayer(direction) { // Moves the player left or right
        const newTargetX = this.state.player.targetX + (this.config.player.speed * direction);
        const minX = this.config.road.leftLane;
        const maxX = (this.config.road.rightLane + this.config.road.laneWidth) - this.config.player.width;
        this.state.player.targetX = Math.max(minX, Math.min(maxX, newTargetX));
    } // End movePlayer

    spawnObstacle() { // Randomly spawns obstacles (cars/bottles)
        if(Math.random() < this.config.obstacles.spawnRate) {
            const lanes = ['left', 'middle', 'right']; // Possible lanes
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
    } // End spawnObstacle

    activateDoubleVision() { // Activates double vision if conditions are met
        if (!this.state.doubleVision.active && this.state.player.promille > this.config.effects.doubleVisionThreshold) {
            const duration = Math.random() * (this.config.effects.doubleVisionDuration.max - this.config.effects.doubleVisionDuration.min) 
                             + this.config.effects.doubleVisionDuration.min;
            this.state.doubleVision = {
                active: true,
                endTime: Date.now() + duration,
                strength: this.state.player.promille / 10
            };
        }
    } // End activateDoubleVision

    update() { // Updates the game state on each frame
        if(!this.state.active || this.state.paused) return;

        if (this.state.startTime) {
            const now = Date.now();
            const elapsedTime = (now - this.state.startTime) / 1000; // Time in seconds
            this.state.distance = (elapsedTime * 0.02).toFixed(1); // Simple formula for distance
        }

        this.spawnObstacle(); // Attempt to spawn new obstacles

        // Move obstacles down the screen
        this.state.obstacles.forEach(obs => obs.y += obs.speed);

        // Keep only obstacles still on screen
        this.state.obstacles = this.state.obstacles.filter(obs => 
            obs.y < this.canvas.height + (obs.type === 'car' ? this.config.obstacles.car.height : this.config.obstacles.bottle.height)
        );

        this.checkCollisions(); // Check for collisions with obstacles

        // Show question at every ~10 km intervals (roughly)
        if(this.state.distance % 10 < 0.1 && this.state.distance > 1) {
            this.showQuestion();
        }

        // Randomly check if double vision should be activated
        if (Math.random() < 0.01) {
            this.activateDoubleVision();
        }

        // Deactivate double vision if time has passed
        if (this.state.doubleVision.active && Date.now() > this.state.doubleVision.endTime) {
            this.state.doubleVision.active = false;
        }

        // Lerp the player's X position toward targetX with speed based on promille
        const delayFactor = this.state.player.promille / 10;
        const lerpSpeed = 0.1 - (0.09 * delayFactor);
        this.state.player.x += (this.state.player.targetX - this.state.player.x) * lerpSpeed;

        this.state.wobbleTime += 0.1 * this.state.player.promille; // Increase wobble over time

        // Apply shake if promille above threshold
        if(this.state.player.promille > this.config.effects.shakeThreshold) {
            this.state.shakeOffset.x = (Math.random() - 0.5) * (this.state.player.promille - 4);
            this.state.shakeOffset.y = (Math.random() - 0.5) * (this.state.player.promille - 4);
        } else {
            this.state.shakeOffset.x = 0;
            this.state.shakeOffset.y = 0;
        }

        // End game if promille reaches 10
        if(this.state.player.promille >= 10) {
            this.gameOver();
        }
    } // End update

    checkCollisions() { // Detect collisions between player and obstacles
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
    } // End checkCollisions

    draw() { // Renders all game elements onto the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear the canvas
        
        // Save context state and apply screen shake offset
        this.ctx.save();
        this.ctx.translate(this.state.shakeOffset.x, this.state.shakeOffset.y);

        // Draw the road background
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

        // Draw obstacles (cars or bottles)
        this.state.obstacles.forEach(obs => {
            if(obs.type === 'car') {
                this.ctx.fillStyle = 
                    obs.lane === 'left' ? '#e74c3c' : 
                    obs.lane === 'middle' ? '#3498db' : '#2ecc71';
                this.ctx.fillRect(obs.x, obs.y, this.config.obstacles.car.width, this.config.obstacles.car.height);
            } else if(obs.type === 'bottle') {
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.fillRect(obs.x, obs.y, this.config.obstacles.bottle.width, this.config.obstacles.bottle.height);
            }
        });

        // Calculate wobble offset for player
        const wobbleOffset = Math.sin(this.state.wobbleTime) * this.config.effects.wobbleIntensity * this.state.player.promille;
        this.ctx.fillStyle = `hsl(200, 70%, ${70 - (this.state.player.promille * 5)}%)`;
        
        // Draw player car
        this.ctx.fillRect(
            this.state.player.x + wobbleOffset,
            this.state.player.y,
            this.config.player.width,
            this.config.player.height
        );

        // If double vision is active, draw a faint second image
        if(this.state.doubleVision.active) {
            this.ctx.globalAlpha = 0.3 * this.state.doubleVision.strength;
            this.ctx.fillRect(
                this.state.player.x + wobbleOffset + 5 * this.state.doubleVision.strength,
                this.state.player.y + 2 * this.state.doubleVision.strength,
                this.config.player.width,
                this.config.player.height
            );
            this.ctx.globalAlpha = 1.0;
        }

        this.ctx.restore(); // Restore context after shake and double-vision

        // Update stats on screen
        document.getElementById('stats').textContent = 
            `Distanse: ${this.state.distance} km | Liv: ${this.state.player.lives} | Promille: ${this.state.player.promille.toFixed(1)}‰`;

        // Apply blur filter based on promille level
        this.ctx.filter = `blur(${(this.state.player.promille/10) * this.config.effects.maxBlur}px)`;
    } // End draw

    showQuestion() { // Displays a question popup and pauses the game
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
    } // End showQuestion

    gameLoop() { // Main game loop: updates game state and draws
        if(this.state.active) {
            this.update(); // Update state
            this.draw(); // Render the frame
        }
        requestAnimationFrame(() => this.gameLoop()); // Request next frame
    } // End gameLoop

    gameOver() { // Handles end of the game, showing distance traveled
        this.state.active = false;
        alert(`Game Over! Distanse: ${this.state.distance} km`);
        document.getElementById('startBtn').style.display = 'block';
    } // End gameOver
} // End class Game

window.addEventListener('load', () => new Game()); // Create a new Game instance on page load
window.addEventListener('resize', () => new Game().resizeCanvas()); // Resize the canvas on window resize