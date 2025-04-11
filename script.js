// Hjelpefunksjon for å begrense en verdi
function constrain(n, low, high) {
  return Math.max(low, Math.min(n, high));
}

// Globale variabler
let clouds = [];
let backgroundMusic, clickSound;
let menuMusic;

// Define question pool before it's used
const questionPool = [
    {
        question: "Hvor mange dødsfall i trafikken knyttes årlig til ruskjøring i Norge?",
        answers: ["Om lag 30–50 dødsfall", "Ingen dødsfall registreres"],
        correct: 0,
        explanation: "Offentlig statistikk viser at 30-50 dødsfall årlig involverer rus."
    },
    {
        question: "Hvor mye øker risikoen for en alvorlig ulykke med en promille over 1,0?",
        answers: ["Risikoen kan bli opptil 8 ganger høyere", "Det er ingen merkbar endring"],
        correct: 0,
        explanation: "Ruskjøring ved promille over 1,0 gir kraftig forhøyet ulykkesrisiko."
    },
    {
        question: "Hvor stor andel av dødsulykkene i trafikken er relatert til ruspåvirket kjøring?",
        answers: ["Over 25%", "Under 10%"],
        correct: 0,
        explanation: "Mer enn en av fire dødsulykker skyldes rus som medvirkende faktor."
    },
    {
        question: "Hva blir ofte konsekvensen av å bli tatt for ruskjøring i Norge?",
        answers: ["Tap av førerkort, bøter og mulig fengsel", "Ingen alvorlige reaksjoner"],
        correct: 0,
        explanation: "Ruskjøring kan føre til tap av førerkort, bøter og fengsel."
    },
    {
        question: "Hvorfor er sidesynet spesielt viktig under kjøring?",
        answers: ["Det hjelper deg å registrere farer ved siden av veien", "Det har ingen praktisk betydning"],
        correct: 0,
        explanation: "Sidesynet hjelper deg å registrere farer ved siden av veien."
    },
    {
        question: "Hva skjer med reaksjonstiden når du kjører i beruset tilstand?",
        answers: ["Den blir betydelig lengre", "Den forblir uendret"],
        correct: 0,
        explanation: "Reaksjonstiden blir betydelig lengre når du er beruset."
    },
    {
        question: "Kan sterke medisiner som påvirker bevisstheten gi samme straff som alkoholpåvirkning?",
        answers: ["Ja, loven regner alt som ruskjøring", "Nei, medisiner er unntatt"],
        correct: 0,
        explanation: "Sterke medisiner som påvirker bevisstheten regnes som ruskjøring."
    },
    {
        question: "Hvor stor del av dødsulykkene i trafikken er relatert til ruspåvirket kjøring?",
        answers: ["En betydelig andel", "Nesten ingen"],
        correct: 0,
        explanation: "En betydelig andel av dødsulykkene i trafikken er relatert til ruspåvirket kjøring."
    },
    {
        question: "Hva er en av de mest alvorlige effektene av ruskjøring på kjøreferdigheter?",
        answers: ["Sterk redusert dømmekraft", "Økt årvåkenhet"],
        correct: 0,
        explanation: "Ruskjøring fører til sterkt redusert dømmekraft."
    },
    {
        question: "Hvorfor tar mange ruskjørere feil avgjørelser i kritiske situasjoner?",
        answers: ["Alkohol og rusmidler svekker hjernens reaksjonsevne", "De blir alltid flinkere av rus"],
        correct: 0,
        explanation: "Alkohol og rusmidler svekker hjernens reaksjonsevne."
    },
    {
        question: "Hva er den tryggeste promillenivået for å kjøre bil?",
        answers: ["0.0 – ingen rus i det hele tatt", "Rett under lovlig grense er helt greit"],
        correct: 0,
        explanation: "Den tryggeste promillenivået for å kjøre bil er 0.0 – ingen rus i det hele tatt."
    }
];

// Ekstra spørsmål
questionPool.push(
  {
    question: "Hvordan kan et rusmiddel svekke evnen din til å vurdere risiko?",
    answers: ["Det gjør deg mer uforsiktig", "Det gjør deg mer forsiktig"],
    correct: 0,
    explanation: "Unge førere under påvirkning av rus tar ofte større sjanser i trafikken."
  },
  {
    question: "Hvorfor er reaksjonstiden spesielt kritisk for unge, ferske sjåfører?",
    answers: ["De har mindre erfaring", "De har bedre reflekser enn de fleste"],
    correct: 0,
    explanation: "Uerfarne sjåfører trenger rask reaksjon, og rus svekker den ytterligere."
  },
  {
    question: "Hvilken faktor gjør ruskjøring ekstra farlig for personer mellom 16-20 år?",
    answers: ["Lite kjøreerfaring", "At de kjører saktere enn eldre"],
    correct: 0,
    explanation: "Manglende erfaring pluss rusmidler kan gi alvorlige konsekvenser."
  },
  {
    question: "Hva kan bli en sosial konsekvens av å bli tatt for ruskjøring i ung alder?",
    answers: ["Tap av venner og dårlig rykte", "Ingen sosial endring"],
    correct: 0,
    explanation: "Mange opplever å miste både tillit og relasjoner etter ruskjøring."
  },
  {
    question: "Hvorfor er kombinasjonen av høy fart og rus ofte forbundet med unge trafikanter?",
    answers: ["Følelse av udødelighet", "De kjører alltid lovlig"],
    correct: 0,
    explanation: "Unge tar ofte sjanser og undervurderer risikoen, noe rus forsterker."
  },
  {
    question: "Kan tilsynelatende 'milde' rusmidler som cannabis påvirke kjøring?",
    answers: ["Ja, de kan svekke koordinasjon og reaksjonsevne", "Nei, det er ufarlig"],
    correct: 0,
    explanation: "Cannabis kan blant annet forringe tidsoppfattelse og konsentrasjon."
  },
  {
    question: "Hvor mye øker risikoen for ulykke når unge kombinerer festkjøring og kjøreerfaring under 2 år?",
    answers: ["Den kan mangedobles", "Ingen økning"],
    correct: 0,
    explanation: "Lite kjøreerfaring pluss rusmidler øker ulykkesfaren dramatisk."
  },
  {
    question: "Hva kan langvarige konsekvenser av et ruskjøringsgebyr eller fengselsdom være for unge?",
    answers: ["Begrensede jobbmuligheter", "Ingen effekt på fremtiden"],
    correct: 0,
    explanation: "Et rulleblad kan hindre både jobb, studier og reiser."
  },
  {
    question: "Hvorfor er holdningsendringer blant unge så viktige for trafikksikkerhet?",
    answers: ["De forhindrer at dårlige vaner etableres", "De har ingen effekt"],
    correct: 0,
    explanation: "Positive holdninger forebygger risikofylt atferd, spesielt i ung alder."
  },
  {
    question: "Hvordan kan venner påvirke din beslutning om å ikke kjøre i rus?",
    answers: ["De kan motivere deg til å være ansvarlig", "Venner har ingen innflytelse"],
    correct: 0,
    explanation: "Gruppepress kan være positivt om vennene støtter forsvarlig kjøring."
  }
);

// --- Game-klasse ---
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
        leftLane: this.canvas.width * 0.125,
        middleLane: this.canvas.width * 0.375,
        rightLane: this.canvas.width * 0.625,
        laneWidth: this.canvas.width * 0.25
      },
      player: {
        width: 50,
        height: 70,
        speed: 500, // px/sec (justeres med dt)
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
        spawnRate: 0.15,
        bottleSpawnRate: 0.06
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
      },
      lastQuestionDistance: 0
    };

    // Bilde-laster
    this.images = {
      playerCar: new Image(),
      obstacleCars: {
        left: new Image(),
        middle: new Image(),
        right: new Image()
      },
      bottle: new Image()
    };
    this.images.playerCar.src = 'images/player-car.png';
    this.images.obstacleCars.left.src = 'images/red-car.png';
    this.images.obstacleCars.middle.src = 'images/blue-car.png';
    this.images.obstacleCars.right.src = 'images/green-car.png';
    this.images.bottle.src = 'images/bottle.png';

    // Lyd
    this.sounds = {
      click: () => {
        if (clickSound && clickSound.isLoaded()) {
          clickSound.play();
        }
      },
      menuMusic: null,
      buttonPress: null,
      carHonk: null
    };

    this.input = { left: false, right: false };
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

    // Touch controls
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

    // Vindu-endring
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      // Oppdater lane-verdier
      this.config.road.leftLane = this.canvas.width * 0.125;
      this.config.road.middleLane = this.canvas.width * 0.375;
      this.config.road.rightLane = this.canvas.width * 0.625;
      this.config.road.laneWidth = this.canvas.width * 0.25;
    });

    // Mus/touchpad klikk
    this.canvas.addEventListener('click', (e) => {
      if (!this.state.active || this.state.paused) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;

      if (clickX < this.config.road.middleLane) {
        this.moveToLane('left');
      } else if (clickX < this.config.road.rightLane) {
        this.moveToLane('middle');
      } else {
        this.moveToLane('right');
      }
    });

    // Mouse move (touchpad for laptops)
    document.addEventListener('mousemove', (e) => {
      if (!this.state.active || this.state.paused) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      this.state.player.targetX = Math.max(
        this.config.road.leftLane,
        Math.min(
          mouseX - this.config.player.width / 2,
          (this.config.road.rightLane + this.config.road.laneWidth) - this.config.player.width
        )
      );
    });

    // Game over-knapper
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
        toggleGameMode(false);
        document.getElementById('mainTitle').style.display = 'block';
        document.getElementById('startScreen').style.display = 'flex';
        if (window.p5Canvas) {
          window.p5Canvas.remove();
        }
        setTimeout(() => {
          setup();
        }, 100);
      });
    }

    // Andre knapper med klikk-lyd
    const self = this;
    document.querySelectorAll('.menuBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (self.sounds && typeof self.sounds.click === 'function') {
          self.sounds.click();
        }
      });
    });

    // Intro-knapp
    const introButton = document.getElementById('introButton');
    if (introButton) {
      introButton.addEventListener('click', () => {
        const introModal = document.getElementById('introModal');
        if (introModal) {
          introModal.style.display = 'block';
        }
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }

    // Start-knappen (fra meny)
    const startButton = document.getElementById('startButton');
    if (startButton) {
      startButton.addEventListener('click', () => {
        if (this.sounds.carHonk) this.sounds.carHonk.play();
      });
    }

    // Andre menyknapper
    const otherMenuButtons = document.querySelectorAll('.menuBtn:not(#startButton)');
    otherMenuButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.sounds.buttonPress) this.sounds.buttonPress.play();
      });
    });
  }

  initUI() {
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.style.display = 'none';
      startBtn.style.visibility = 'hidden';
    }
  }

  getCurrentLane() {
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
    const moveIncrement = this.config.road.laneWidth * 0.2;
    const newTargetX = this.state.player.targetX + (moveIncrement * direction);
    const minX = this.config.road.leftLane;
    const maxX = (this.config.road.rightLane + this.config.road.laneWidth) - this.config.player.width;
    this.state.player.targetX = constrain(newTargetX, minX, maxX);
  }

  moveToLane(lane) {
    if (typeof lane === 'string') {
      switch (lane) {
        case 'left': lane = 0; break;
        case 'middle': lane = 1; break;
        case 'right': lane = 2; break;
        default: lane = 1;
      }
    }
    lane = Math.max(0, Math.min(2, lane));

    let targetX;
    switch (lane) {
      case 0:
        targetX = this.config.road.leftLane + (this.config.road.laneWidth / 2);
        break;
      case 1:
        targetX = this.config.road.middleLane + (this.config.road.laneWidth / 2);
        break;
      case 2:
        targetX = this.config.road.rightLane + (this.config.road.laneWidth / 2);
        break;
    }
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

      const safeDistance = 150;
      let isSafeToSpawn = true;
      for (let obs of this.state.obstacles) {
        if (obs.type === 'car' && obs.lane === lane && obs.y > -safeDistance) {
          isSafeToSpawn = false;
          break;
        }
      }
      if (isSafeToSpawn) {
        this.state.obstacles.push({
          type: 'car',
          x: laneX + Math.random() * (this.config.road.laneWidth - this.config.obstacles.car.width),
          y: -this.config.obstacles.car.height,
          speed: this.config.obstacles.car.speed[lane],
          lane: lane
        });
      }
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

      const playerPadding = 10;
      const obstaclePadding = 8;

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

      const collision =
        playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
        playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
        playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
        playerHitbox.y + playerHitbox.height > obstacleHitbox.y;

      if (collision) {
        if (obs.type === 'car') {
          this.state.player.lives--;
          this.state.collisionShake = {
            active: true,
            intensity: 10,
            duration: 450,
            startTime: Date.now(),
            rotation: Math.random() * 0.06 - 0.03
          };

          const livesStat = document.getElementById('livesStat');
          if (livesStat) {
            livesStat.style.animation = 'none';
            livesStat.offsetHeight;
            livesStat.style.animation = 'bounce 0.8s, shake 0.5s';
          }

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

          const promilleStat = document.getElementById('promilleStat');
          if (promilleStat) {
            promilleStat.style.animation = 'none';
            promilleStat.offsetHeight;
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

    this.updateInput(dt);

    this.state.wobbleTime += dt * (1 + this.state.player.promille);

    if (this.state.player.promille > this.config.effects.shakeThreshold) {
      this.state.shakeOffset.x = (Math.random() * 2 - 1) * this.state.player.promille;
      this.state.shakeOffset.y = (Math.random() * 2 - 1) * this.state.player.promille;
    } else {
      this.state.shakeOffset.x = 0;
      this.state.shakeOffset.y = 0;
    }

    if (this.state.collisionShake.active) {
      const elapsed = Date.now() - this.state.collisionShake.startTime;
      const progress = elapsed / this.state.collisionShake.duration;
      if (progress >= 1) {
        this.state.collisionShake.active = false;
        this.state.collisionShake.offsetX = 0;
        this.state.collisionShake.offsetY = 0;
      } else {
        const remainingIntensity = 1 - Math.pow(progress, 2);
        const currentIntensity = this.state.collisionShake.intensity * remainingIntensity;
        const shakePhase = progress * 20;
        const xBias = Math.sin(shakePhase) * 0.7;
        const yBias = Math.cos(shakePhase * 1.3) * 0.7;

        this.state.collisionShake.offsetX = (Math.random() * 0.3 + xBias) * currentIntensity;
        this.state.collisionShake.offsetY = (Math.random() * 0.3 + yBias) * currentIntensity;
      }
    }

    if (this.state.doubleVision.active) {
      if (Date.now() > this.state.doubleVision.endTime) {
        this.state.doubleVision.active = false;
      } else if (Math.random() < 0.01) {
        this.state.doubleVision.strength = this.state.player.promille / 5;
      }
    } else if (this.state.player.promille > this.config.effects.doubleVisionThreshold && Math.random() < 0.01) {
      this.activateDoubleVision();
    }

    for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
      const obs = this.state.obstacles[i];
      obs.y += obs.speed;
      if (obs.y > this.canvas.height) {
        this.state.obstacles.splice(i, 1);
      }
    }

    if (Math.random() < 0.2) {
      this.spawnObstacle();
    }

    if (this.state.startTime) {
      const now = Date.now();
      const elapsedSeconds = (now - this.state.startTime) / 1000;
      const distanceFactor = 0.08;
      this.state.distance = (elapsedSeconds * distanceFactor * (1 + this.state.player.promille / 5)).toFixed(1);
    }

    const wholeDist = Math.floor(parseFloat(this.state.distance));
    if (wholeDist > 0 && wholeDist % 5 === 0) {
      const milestone = `milestone-${wholeDist}`;
      if (!this.state.milestones || !this.state.milestones.includes(milestone)) {
        if (!this.state.milestones) this.state.milestones = [];
        this.state.milestones.push(milestone);

        const statsContainer = document.getElementById('statsContainer');
        if (statsContainer) {
          const celebration = document.createElement('div');
          celebration.className = 'milestone-celebration';
          celebration.textContent = `${wholeDist} KM!`;
          document.body.appendChild(celebration);

          setTimeout(() => {
            document.body.removeChild(celebration);
          }, 2000);
        }
      }
    }

    const currentDistance = parseFloat(this.state.distance);
    const questionInterval = 3;
    const nextQuestionPoint = Math.ceil(this.state.lastQuestionDistance / 3) * 3 + 3;

    if (
      currentDistance > 1 &&
      currentDistance >= nextQuestionPoint - 0.1 &&
      !isNaN(currentDistance) &&
      !this.state.paused
    ) {
      this.showQuestion();
      this.state.lastQuestionDistance = currentDistance;
    }

    this.checkCollisions();
  }

  updateInput(dt) {
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

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();

    let totalShakeX = this.state.shakeOffset.x;
    let totalShakeY = this.state.shakeOffset.y;
    let rotation = 0;

    if (this.state.collisionShake.active) {
      const elapsed = Date.now() - this.state.collisionShake.startTime;
      const progress = elapsed / this.state.collisionShake.duration;
      const easeOut = 1 - Math.pow(progress, 2);

      totalShakeX += this.state.collisionShake.offsetX;
      totalShakeY += this.state.collisionShake.offsetY;

      if (this.state.collisionShake.rotation) {
        rotation = this.state.collisionShake.rotation * easeOut * Math.sin(progress * Math.PI * 8);
      }
    }

    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.rotate(rotation);
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    this.ctx.translate(totalShakeX, totalShakeY);

    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(
      this.config.road.leftLane,
      0,
      this.config.road.laneWidth * 3,
      this.canvas.height
    );

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
          this.ctx.fillStyle =
            obs.lane === 'left' ? '#e74c3c' :
            obs.lane === 'middle' ? '#3498db' :
            '#2ecc71';
          this.ctx.fillRect(obs.x, obs.y, this.config.obstacles.car.width, this.config.obstacles.car.height);
        }
      } else if (obs.type === 'bottle') {
        if (this.images.bottle.complete) {
          this.ctx.drawImage(this.images.bottle, obs.x, obs.y, this.config.obstacles.bottle.width, this.config.obstacles.bottle.height);
        } else {
          this.ctx.fillStyle = '#f1c40f';
          this.ctx.fillRect(obs.x, obs.y, this.config.obstacles.bottle.width, this.config.obstacles.bottle.height);
        }
      }
    }

    const wobbleOffset = Math.sin(this.state.wobbleTime) * this.config.effects.wobbleIntensity * this.state.player.promille;
    if (this.images.playerCar.complete) {
      this.ctx.drawImage(
        this.images.playerCar,
        this.state.player.x + wobbleOffset,
        this.state.player.y,
        this.config.player.width,
        this.config.player.height
      );
    } else {
      this.ctx.fillStyle = `hsl(200, 70%, ${70 - (this.state.player.promille * 5)}%)`;
      this.ctx.fillRect(
        this.state.player.x + wobbleOffset,
        this.state.player.y,
        this.config.player.width,
        this.config.player.height
      );
    }

    if (this.state.doubleVision.active && this.images.playerCar.complete) {
      this.ctx.globalAlpha = 0.3 * this.state.doubleVision.strength;
      this.ctx.drawImage(
        this.images.playerCar,
        this.state.player.x + wobbleOffset + 5 * this.state.doubleVision.strength,
        this.state.player.y + 2 * this.state.doubleVision.strength,
        this.config.player.width,
        this.config.player.height
      );
      this.ctx.globalAlpha = 1.0;
    }

    this.ctx.restore();

    const distanceValue = document.getElementById('distanceValue');
    const livesValue = document.getElementById('livesValue');
    const promilleValue = document.getElementById('promilleValue');
    const promilleBar = document.getElementById('promilleBar');
    const statsContainer = document.getElementById('statsContainer');

    if (distanceValue && livesValue && promilleValue && promilleBar) {
      if (distanceValue.textContent !== `${this.state.distance} km`) {
        distanceValue.textContent = `${this.state.distance} km`;
        distanceValue.classList.add('stat-change');
        setTimeout(() => distanceValue.classList.remove('stat-change'), 500);
      }
      if (livesValue.textContent !== `${this.state.player.lives}`) {
        livesValue.textContent = this.state.player.lives;
        livesValue.classList.add('stat-change');
        setTimeout(() => livesValue.classList.remove('stat-change'), 500);
      }
      promilleValue.textContent = `${this.state.player.promille.toFixed(1)}‰`;

      const barWidth = Math.min(100, (this.state.player.promille / 10) * 100);
      promilleBar.style.width = `${barWidth}%`;

      if (this.state.player.promille > 5.0) {
        statsContainer.classList.add('promille-warning');
      } else {
        statsContainer.classList.remove('promille-warning');
      }
    }

    this.ctx.filter = `blur(${(this.state.player.promille / 10) * this.config.effects.maxBlur}px)`;
  }

  showQuestion() {
    try {
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
      const questionPopup = document.getElementById('questionPopup');
      if (!questionPopup) {
        console.error('Question UI element not found');
        this.state.paused = false;
        return;
      }

      // Tommer popup for eventuelt gammelt innhold
      questionPopup.innerHTML = '';
      questionPopup.style.backgroundColor = '#f8f9fa';
      questionPopup.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
      questionPopup.style.borderRadius = '20px';
      questionPopup.style.padding = '25px';
      questionPopup.style.transition = 'all 0.3s ease';
      questionPopup.style.transform = 'scale(0.95)';

      questionPopup.style.position = 'fixed';
      questionPopup.style.left = '50%';
      questionPopup.style.top = '50%';
      questionPopup.style.transform = 'translate(-50%, -50%) scale(0.95)';
      questionPopup.style.zIndex = '1000';
      questionPopup.style.maxWidth = '90%';
      questionPopup.style.width = '500px';

      const questionHeader = document.createElement('h3');
      questionHeader.textContent = 'Trafikkspørsmål';
      questionHeader.style.textAlign = 'center';
      questionHeader.style.marginBottom = '15px';
      questionHeader.style.color = '#333';
      questionHeader.style.borderBottom = '2px dashed #ddd';
      questionHeader.style.paddingBottom = '10px';

      const questionElement = document.createElement('p');
      questionElement.textContent = question.question;
      questionElement.style.fontSize = '18px';
      questionElement.style.fontWeight = 'bold';
      questionElement.style.marginBottom = '20px';
      questionElement.style.padding = '10px';
      questionElement.style.backgroundColor = '#e9f7fe';
      questionElement.style.borderRadius = '10px';
      questionElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';

      const answerContainer = document.createElement('div');
      answerContainer.style.display = 'flex';
      answerContainer.style.flexDirection = 'column';
      answerContainer.style.gap = '10px';

      const createAnswerButton = (text, index) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.padding = '12px 20px';
        button.style.border = 'none';
        button.style.borderRadius = '12px';
        button.style.backgroundColor = '#e6e6fa';
        button.style.cursor = 'pointer';
        button.style.transition = 'all 0.2s ease';
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';
        button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

        button.onmouseover = () => {
          button.style.backgroundColor = '#d8d8f0';
          button.style.transform = 'translateY(-2px)';
        };
        button.onmouseout = () => {
          button.style.backgroundColor = '#e6e6fa';
          button.style.transform = 'translateY(0)';
        };
        button.onclick = () => handleAnswer(index);
        return button;
      };

      const answerBtn1 = createAnswerButton(question.answers[0], 0);
      const answerBtn2 = createAnswerButton(question.answers[1], 1);

      answerContainer.appendChild(answerBtn1);
      answerContainer.appendChild(answerBtn2);

      questionPopup.appendChild(questionHeader);
      questionPopup.appendChild(questionElement);
      questionPopup.appendChild(answerContainer);

      questionPopup.style.display = 'block';
      setTimeout(() => {
        questionPopup.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 10);

      const self = this;

      function handleAnswer(selected) {
        const isCorrect = (selected === question.correct);
        questionPopup.style.backgroundColor = isCorrect ? '#aaffaa' : '#ffaaaa';

        const resultContainer = document.createElement('div');
        resultContainer.style.textAlign = 'center';
        resultContainer.style.marginTop = '20px';

        const emoji = document.createElement('div');
        emoji.textContent = isCorrect ? '👍' : '👎';
        emoji.style.fontSize = '48px';
        emoji.style.margin = '10px 0';
        emoji.style.animation = 'bounce 0.6s';

        if (!document.getElementById('emojiAnimationStyle')) {
          const style = document.createElement('style');
          style.id = 'emojiAnimationStyle';
          style.textContent = `
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-20px); }
              60% { transform: translateY(-10px); }
            }
          `;
          document.head.appendChild(style);
        }

        const explanationBubble = document.createElement('div');
        explanationBubble.style.backgroundColor = 'white';
        explanationBubble.style.borderRadius = '15px';
        explanationBubble.style.padding = '15px';
        explanationBubble.style.position = 'relative';
        explanationBubble.style.marginTop = '25px';
        explanationBubble.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
        explanationBubble.style.border = '2px solid #ddd';

        const bubbleTail = document.createElement('div');
        bubbleTail.style.width = '20px';
        bubbleTail.style.height = '20px';
        bubbleTail.style.backgroundColor = 'white';
        bubbleTail.style.position = 'absolute';
        bubbleTail.style.top = '-10px';
        bubbleTail.style.left = '50%';
        bubbleTail.style.transform = 'translateX(-50%) rotate(45deg)';
        bubbleTail.style.borderLeft = '2px solid #ddd';
        bubbleTail.style.borderTop = '2px solid #ddd';
        explanationBubble.appendChild(bubbleTail);

        const explanationText = document.createElement('p');
        explanationText.textContent = question.explanation || '';
        explanationText.style.margin = '0';
        explanationText.style.fontStyle = 'italic';
        explanationText.style.fontSize = '16px';
        explanationText.style.color = '#333';
        explanationBubble.appendChild(explanationText);

        const factLabel = document.createElement('div');
        factLabel.textContent = 'FAKTA';
        factLabel.style.position = 'absolute';
        factLabel.style.top = '-10px';
        factLabel.style.right = '10px';
        factLabel.style.backgroundColor = '#ffcc00';
        factLabel.style.color = 'black';
        factLabel.style.fontSize = '12px';
        factLabel.style.fontWeight = 'bold';
        factLabel.style.padding = '3px 8px';
        factLabel.style.borderRadius = '10px';
        explanationBubble.appendChild(factLabel);

        const countdownElement = document.createElement('p');
        countdownElement.innerText = "Fortsetter spillet om 4 sekunder...";
        countdownElement.style.margin = '20px 0 15px 0';

        const continueButton = document.createElement('button');
        continueButton.textContent = "Fortsett...";
        continueButton.style.padding = '10px 20px';
        continueButton.style.backgroundColor = '#4CAF50';
        continueButton.style.color = 'white';
        continueButton.style.border = 'none';
        continueButton.style.borderRadius = '8px';
        continueButton.style.cursor = 'pointer';
        continueButton.style.fontSize = '16px';
        continueButton.style.fontWeight = 'bold';
        continueButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        continueButton.style.transition = 'all 0.2s ease';

        continueButton.onmouseover = () => {
          continueButton.style.backgroundColor = '#3e8e41';
          continueButton.style.transform = 'translateY(-2px)';
        };
        continueButton.onmouseout = () => {
          continueButton.style.backgroundColor = '#4CAF50';
          continueButton.style.transform = 'translateY(0)';
        };

        resultContainer.appendChild(emoji);
        resultContainer.appendChild(explanationBubble);
        resultContainer.appendChild(countdownElement);
        resultContainer.appendChild(continueButton);

        answerContainer.innerHTML = '';
        questionPopup.appendChild(resultContainer);

        let countdown = 4;
        const timer = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(timer);
            closeQuestionPopup();
          } else {
            countdownElement.innerText = `Fortsetter spillet om ${countdown} sekunder...`;
          }
        }, 1000);

        continueButton.onclick = () => {
          clearInterval(timer);
          closeQuestionPopup();
        };

        function closeQuestionPopup() {
          if (isCorrect) {
            self.state.player.lives = Math.min(self.state.player.lives + 1, 5);
          } else {
            self.state.player.promille = Math.min(self.state.player.promille + 0.5, 10);
          }
          questionPopup.style.transform = 'translate(-50%, -50%) scale(0.9)';
          questionPopup.style.opacity = '0';
          setTimeout(() => {
            questionPopup.style.display = 'none';
            questionPopup.style.opacity = '1';
            questionPopup.innerHTML = '';
            self.state.paused = false;
          }, 300);
        }
      }
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
    const gameOverScreen = document.getElementById('gameOverScreen');

    gameOverScreen.style.backgroundColor = '#f8f9fa';
    gameOverScreen.style.borderRadius = '20px';
    gameOverScreen.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    gameOverScreen.style.padding = '25px';
    gameOverScreen.style.textAlign = 'center';
    gameOverScreen.style.border = '3px solid #ff6b6b';

    const finalDistance = document.getElementById('finalDistance');
    if (finalDistance) {
      finalDistance.textContent = this.state.distance;
      finalDistance.style.fontWeight = 'bold';
      finalDistance.style.color = '#ff6b6b';
      finalDistance.style.fontSize = '24px';
    }
    const gameOverTitle = gameOverScreen.querySelector('h2');
    if (gameOverTitle) {
      gameOverTitle.style.color = '#ff6b6b';
      gameOverTitle.style.fontWeight = 'bold';
      gameOverTitle.style.marginBottom = '20px';
      gameOverTitle.style.borderBottom = '2px dashed #ddd';
      gameOverTitle.style.paddingBottom = '10px';
    }

    const playAgainBtn = document.getElementById('playAgainBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');

    if (playAgainBtn) {
      playAgainBtn.style.backgroundColor = '#4CAF50';
      playAgainBtn.style.color = 'white';
      playAgainBtn.style.border = 'none';
      playAgainBtn.style.borderRadius = '12px';
      playAgainBtn.style.padding = '12px 24px';
      playAgainBtn.style.margin = '10px';
      playAgainBtn.style.fontSize = '16px';
      playAgainBtn.style.fontWeight = 'bold';
      playAgainBtn.style.cursor = 'pointer';
      playAgainBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      playAgainBtn.style.transition = 'all 0.2s';

      playAgainBtn.onmouseover = () => {
        playAgainBtn.style.backgroundColor = '#3e8e41';
        playAgainBtn.style.transform = 'translateY(-2px)';
      };
      playAgainBtn.onmouseout = () => {
        playAgainBtn.style.backgroundColor = '#4CAF50';
        playAgainBtn.style.transform = 'translateY(0)';
      };

      playAgainBtn.onclick = () => {
        gameOverScreen.style.display = 'none';
        this.state.active = true;
        this.state.player.lives = 5;
        this.state.player.promille = 0;
        this.state.player.distance = 0;
        this.state.obstacles = [];
        this.state.startTime = Date.now();
        this.state.doubleVision.active = false;
        this.state.lastQuestionDistance = 0;
        this.resizeCanvas();
      };
    }

    if (backToMenuBtn) {
      backToMenuBtn.style.backgroundColor = '#ff6b6b';
      backToMenuBtn.style.color = 'white';
      backToMenuBtn.style.border = 'none';
      backToMenuBtn.style.borderRadius = '12px';
      backToMenuBtn.style.padding = '12px 24px';
      backToMenuBtn.style.margin = '10px';
      backToMenuBtn.style.fontSize = '16px';
      backToMenuBtn.style.fontWeight = 'bold';
      backToMenuBtn.style.cursor = 'pointer';
      backToMenuBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      backToMenuBtn.style.transition = 'all 0.2s';

      backToMenuBtn.onmouseover = () => {
        backToMenuBtn.style.backgroundColor = '#e74c3c';
        backToMenuBtn.style.transform = 'translateY(-2px)';
      };
      backToMenuBtn.onmouseout = () => {
        backToMenuBtn.style.backgroundColor = '#ff6b6b';
        backToMenuBtn.style.transform = 'translateY(0)';
      };

      backToMenuBtn.onclick = () => {
        gameOverScreen.style.display = 'none';
        toggleGameMode(false);
        document.getElementById('mainTitle').style.display = 'block';
        document.getElementById('startScreen').style.display = 'flex';
        if (window.p5Canvas) {
          window.p5Canvas.remove();
        }
        setTimeout(() => {
          setup();
        }, 100);
      };
    }

    let cuteMessage = document.getElementById('cuteGameOverMessage');
    if (!cuteMessage) {
      cuteMessage = document.createElement('p');
      cuteMessage.id = 'cuteGameOverMessage';
      gameOverScreen.insertBefore(cuteMessage, gameOverScreen.querySelector('.buttons') || gameOverScreen.lastChild);
    }
    const messages = [
      "Oi sann, det gikk ikke så bra! 🙈",
      "Husk at i virkeligheten er det ingen restart-knapp! 🚗",
      "Promille og kjøring er en farlig kombinasjon! 🚫🍺",
      "Du klarer å kjøre mer ansvarlig enn så! 💪",
      "Trafikksikkerhet er viktig - både i spill og virkelighet! 🛣️"
    ];
    cuteMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    cuteMessage.style.fontStyle = 'italic';
    cuteMessage.style.margin = '20px 0';
    cuteMessage.style.color = '#666';

    gameOverScreen.style.display = 'block';
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.style.display = 'none';
    }
  }
}

// --- Globale funksjoner og p5-oppsett ---

function calculateBAC() {
  const weight = parseFloat(document.getElementById('weight').value);
  const gender = document.getElementById('gender').value;
  const hours = parseFloat(document.getElementById('hours').value);

  let totalAlcohol = 0;
  document.querySelectorAll('.drinkInput').forEach(input => {
    const amount = parseInt(input.value);
    const type = input.dataset.type;
    if (amount > 0) {
      switch(type) {
        case 'beer': totalAlcohol += amount * 14; break;
        case 'strongbeer': totalAlcohol += amount * 26; break;
        case 'wine': totalAlcohol += amount * 12; break;
        case 'spirits': totalAlcohol += amount * 12.8; break;
        case 'cooler': totalAlcohol += amount * 12.4; break;
      }
    }
  });

  const genderFactor = (gender === 'male') ? 0.7 : 0.6;
  let bac = totalAlcohol / (weight * genderFactor);
  bac = Math.max(0, bac - (hours * 0.15));

  const bacResult = document.getElementById('bacResult');
  const bacBar = document.getElementById('bacBar');
  const bacEmoji = document.getElementById('bacEmoji');
  bacResult.textContent = `Din promille er ca. ${bac.toFixed(2)}‰`;

  const barWidth = Math.min(100, (bac / 5) * 100);
  bacBar.style.width = `${barWidth}%`;

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

function setup() {
  try {
    if (window.p5Instance) {
      return;
    }
    new p5(function(p) {
      p.setup = function() {
        window.p5Canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        p5Canvas.id('cloudCanvas');

        if (!window.audioInitialized) {
          try {
            p.userStartAudio().then(() => {
              window.audioInitialized = true;
              backgroundMusic = p.loadSound('sounds/relaxing-guitar-looop.mp3', checkSoundsReady);
              clickSound = p.loadSound('sounds/button-press.mp3', checkSoundsReady);
            });
          } catch (e) {
            console.error('Error initializing audio:', e);
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('startScreen').style.display = 'flex';
          }
        }
        resetClouds();
        const canvas = document.getElementById('cloudCanvas');
        if (canvas) {
          canvas.style.zIndex = '0';
          canvas.style.position = 'fixed';
          canvas.style.top = '0';
          canvas.style.left = '0';
        }
      };

      p.draw = function() {
        draw();
      };
      window.p5Instance = p;
    });
  } catch (error) {
    console.error('Error in setup:', error);
  }
}

function resetClouds() {
  try {
    clouds = [];
    const emojis = ['😎', '😴', '🥰', '😮‍💨', '😂', '🗿', '🦇', '🦄', '🐼'];
    const textMessages = [
      'wecommended amount of wam?',
      'sigma sigma sigmaboy',
      'r u winning son?',
      '!',
      'vær ansvarlig.... bitchass',
      'grensa e 0.2‰',
      'bombagyatt'
    ];
    if (typeof width !== 'undefined' && typeof random === 'function') {
      for (let i = 0; i < 6; i++) {
        const useEmoji = Math.random() > 0.5;
        const cloudContent = useEmoji
          ? emojis[Math.floor(Math.random() * emojis.length)]
          : textMessages[Math.floor(Math.random() * textMessages.length)];

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
    if (!window.p5Instance) return;
    const p = window.p5Instance;
    p.clear();
    if (!clouds || clouds.length === 0) {
      resetClouds();
    }
    if (clouds && clouds.length > 0) {
      for (let cloud of clouds) {
        drawCloud(cloud);
        cloud.x += cloud.speed;
        if (cloud.x > p.width + 100) {
          cloud.x = -100;
          cloud.y = p.random(50, 200);
          if (Math.random() > 0.2) {
            const useEmoji = Math.random() > 0.5;
            const emojis = ['😎', '😴', '🥰', '😮‍💨', '😂', '🗿', '🦇', '🦄', '🐼'];
            const textMessages = [
              'wecommended amount of wam?',
              'sigma sigma sigmaboy',
              'r u winning son?',
              '!',
              'vær ansvarlig.... bitchass',
              'grensa e 0.2‰',
              'bombagyatt'
            ];
            cloud.face = useEmoji
              ? emojis[Math.floor(Math.random() * emojis.length)]
              : textMessages[Math.floor(Math.random() * textMessages.length)];
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
    if (!window.p5Instance) return;
    const p = window.p5Instance;
    p.noStroke();
    p.fill(255, 255, 255, 200);
    let s = cloud.size;

    let isTextCloud = typeof cloud.face === 'string' && cloud.face.length > 2;
    let cloudTextWidth = 0;

    if (isTextCloud) {
      p.textSize(s / 4);
      p.textAlign(p.CENTER, p.CENTER);
      cloudTextWidth = p.textWidth(cloud.face);
      p.ellipse(cloud.x, cloud.y, s * 0.6, s * 0.6);
      p.ellipse(cloud.x - s * 0.3, cloud.y + s * 0.1, s * 0.5, s * 0.5);
      p.ellipse(cloud.x + s * 0.3, cloud.y + s * 0.1, s * 0.5, s * 0.5);
      p.ellipse(cloud.x, cloud.y + s * 0.2, s * 0.7, s * 0.5);

      p.fill(0);
      p.text(cloud.face, cloud.x, cloud.y);
    }
  } catch (error) {
    console.error('Error drawing cloud:', error);
  }
}

function checkSoundsReady() {
  let loadedSounds = 0;
  if (backgroundMusic && backgroundMusic.isLoaded()) loadedSounds++;
  if (clickSound && clickSound.isLoaded()) loadedSounds++;

  if (loadedSounds === 2) {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
  }
}

function toggleGameMode(inGame) {
  try {
    const cloudCanvas = document.getElementById('cloudCanvas');
    if (inGame) {
      if (cloudCanvas) cloudCanvas.style.display = 'none';
      const gameCanvas = document.getElementById('gameCanvas');
      const gameUI = document.getElementById('gameUI');
      if (gameCanvas) gameCanvas.style.display = 'block';
      if (gameUI) gameUI.style.display = 'block';
      document.getElementById('startBtn').style.display = 'none';
    } else {
      if (cloudCanvas) cloudCanvas.style.display = 'block';
      const gameCanvas = document.getElementById('gameCanvas');
      const gameUI = document.getElementById('gameUI');
      if (gameCanvas) gameCanvas.style.display = 'none';
      if (gameUI) gameUI.style.display = 'none';
      const mainTitle = document.getElementById('mainTitle');
      const startScreen = document.getElementById('startScreen');
      if (mainTitle) mainTitle.style.display = 'block';
      if (startScreen) startScreen.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error toggling game mode:', error);
  }
}

// Meny-musikk
function initMenuMusic() {
  try {
    if (!window.menuMusicInitialized) {
      menuMusic = loadSound('sounds/relaxing-guitar-looop.mp3', () => {
        menuMusic.setLoop(true);
        menuMusic.setVolume(0.5);
        menuMusic.play();
      });
      window.menuMusicInitialized = true;
    }
  } catch (error) {
    console.error('Error loading menu music:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const startButton = document.getElementById('startButton');
    const soberButton = document.getElementById('soberButton');
    const settingsButton = document.getElementById('settingsButton');
    const aboutButton = document.getElementById('aboutButton');
    const youthButton = document.getElementById('youthButton');

    if (startButton) {
      startButton.addEventListener('click', (event) => {
        try {
          event.stopPropagation();
          let carHonk = loadSound('sounds/car-honk.mp3', () => {
            carHonk.play();
          });
          toggleGameMode(true);
          const mainTitle = document.getElementById('mainTitle');
          const startScreen = document.getElementById('startScreen');
          if (mainTitle) mainTitle.style.display = 'none';
          if (startScreen) startScreen.style.display = 'none';
          window.game = new Game();
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
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }

    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        const settingsMenu = document.getElementById('settingsMenu');
        if (settingsMenu) settingsMenu.style.display = 'block';
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }

    if (aboutButton) {
      aboutButton.addEventListener('click', () => {
        const aboutModal = document.getElementById('aboutModal');
        if (aboutModal) aboutModal.style.display = 'block';
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }

    if (youthButton) {
      youthButton.addEventListener('click', () => {
        window.open('https://trafikksikkerhetsforeningen.no/om-ung-i-trafikken/', '_blank');
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }

    const introButton = document.getElementById('introButton');
    if (introButton) {
      introButton.addEventListener('click', () => {
        const introModal = document.getElementById('introModal');
        if (introModal) {
          introModal.style.display = 'block';
        }
        if (clickSound && typeof clickSound.play === 'function') {
          clickSound.play();
        }
      });
    }

    if (typeof setup === 'function') {
      setup();
    }

    if (typeof userStartAudio === 'function') {
      userStartAudio().then(() => {
        initMenuMusic();
      });
    }
  } catch (error) {
    console.error('Error in DOMContentLoaded event:', error);
  }
});
