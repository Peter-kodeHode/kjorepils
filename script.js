document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
  
    // Overlay for meldinger
    const messageOverlay = document.getElementById("messageOverlay");
    function showMessage(text, durationSec) {
      messageOverlay.textContent = text;
      messageOverlay.classList.add("show");
      setTimeout(() => {
        messageOverlay.classList.remove("show");
      }, durationSec * 1000);
    }
  
    // Score/poeng-visning
    const scoreDisplay = document.getElementById("scoreDisplay");
  
    // Sett opp logisk bredde/høyde
    canvas.width = 600;
    canvas.height = 800;
  
    // ---- Tastestyring ----
    const keys = {};
    document.addEventListener("keydown", e => { keys[e.code] = true; });
    document.addEventListener("keyup", e => { keys[e.code] = false; });
  
    // ---- Spillvariabler ----
    let gameOver = false;
    let score = 0;
  
    // Bil (spiller)
    const player = {
      x: canvas.width / 2 - 20, // Bilen er 40px bred
      y: canvas.height - 100,
      width: 40,
      height: 60,
      color: "red",
      speed: 6 // sideveis
    };
  
    // Veisegmenter – ligner litt på forrige, men renere oppsett
    // Hvert segment: topY, botY, centerX, roadWidth
    let roadSegments = [];
  
    // Konstanter for vei
    const SEGMENT_HEIGHT = 100; 
    const ROAD_SPEED = 2; 
    const MIN_ROAD_WIDTH = 100;
    const MAX_ROAD_WIDTH = 300;
    const SWING_RANGE = 50; // Max sving
  
    // Fiender: Samme type data, men “y = -100” etc. spawner på veien
    // ex: { x, y, w, h, color, speedY }
    let enemies = [];
  
    // Oppstart
    function initGame() {
      roadSegments = [];
      enemies = [];
      score = 0;
      gameOver = false;
  
      generateInitialRoad();
      // Evt. spawn et par fiender
      spawnEnemy();
      spawnEnemy();
  
      player.x = canvas.width / 2 - player.width / 2;
      player.y = canvas.height - 120;
    }
  
    // Lag start-segmenter
    function generateInitialRoad() {
      let currentTop = 0;
      let centerX = canvas.width / 2; // start i midten
      let roadWidth = 200; // passelig startbredde
  
      // Lag 12 segmenter for å fylle canvas
      for (let i = 0; i < 12; i++) {
        let seg = {
          topY: currentTop,
          bottomY: currentTop + SEGMENT_HEIGHT,
          centerX: centerX,
          roadWidth: roadWidth
        };
        roadSegments.push(seg);
  
        currentTop += SEGMENT_HEIGHT;
  
        // Sving litt random
        centerX += (Math.random() * 2 - 1) * SWING_RANGE;
        // Klemm senter
        const half = roadWidth / 2;
        if (centerX < half) centerX = half;
        if (centerX > canvas.width - half) centerX = canvas.width - half;
  
        // Varier bredde
        roadWidth += (Math.random() * 2 - 1) * 30;
        if (roadWidth < MIN_ROAD_WIDTH) roadWidth = MIN_ROAD_WIDTH;
        if (roadWidth > MAX_ROAD_WIDTH) roadWidth = MAX_ROAD_WIDTH;
      }
    }
  
    // Legg til nytt segment oppe (over top)
    function addRoadSegment() {
      let last = roadSegments[roadSegments.length - 1];
      let newTop = last.bottomY;
      let newBottom = newTop + SEGMENT_HEIGHT;
  
      let centerX = last.centerX + (Math.random() * 2 - 1) * SWING_RANGE;
      let roadWidth = last.roadWidth + (Math.random() * 2 - 1) * 30;
  
      if (roadWidth < MIN_ROAD_WIDTH) roadWidth = MIN_ROAD_WIDTH;
      if (roadWidth > MAX_ROAD_WIDTH) roadWidth = MAX_ROAD_WIDTH;
  
      const half = roadWidth / 2;
      if (centerX < half) centerX = half;
      if (centerX > canvas.width - half) centerX = canvas.width - half;
  
      roadSegments.push({
        topY: newTop,
        bottomY: newBottom,
        centerX: centerX,
        roadWidth: roadWidth
      });
    }
  
    // Fiender spawner random på veien
    function spawnEnemy() {
      // Finn top av nest siste segment
      let seg = roadSegments[roadSegments.length - 2]; 
      if (!seg) return;
  
      // Finn random x innefor veien
      const half = seg.roadWidth / 2;
      const leftX = seg.centerX - half;
      const rightX = seg.centerX + half;
  
      let enemyX = Math.random() * (rightX - leftX - 40) + leftX;
      let enemyY = seg.topY - 100; // litt foran skjermen
  
      // Legg fiende i array
      enemies.push({
        x: enemyX,
        y: enemyY,
        width: 40,
        height: 40,
        color: "yellow",
        speedY: ROAD_SPEED // Samme scrollfart
      });
    }
  
    // Oppdater fiender (scroll + kollisjon)
    function updateEnemies() {
      for (let e of enemies) {
        // Flytt fienden ned
        e.y += e.speedY;
        // Kollisjon med spiller?
        if (isColliding(player, e)) {
          gameOver = true;
          showMessage("Du krasjet i en fiende! GAME OVER!", 3);
          setTimeout(() => initGame(), 3000);
        }
      }
      // Fjern fiender som har gått forbi bunnen
      enemies = enemies.filter(e => e.y < canvas.height + 200);
    }
  
    // Hoved-løkke
    function gameLoop() {
      if (!gameOver) {
        update();
        draw();
      }
      requestAnimationFrame(gameLoop);
    }
  
    function update() {
      handleInput();
  
      // Scroll veien
      for (let seg of roadSegments) {
        seg.topY += ROAD_SPEED;
        seg.bottomY += ROAD_SPEED;
      }
  
      // Fjern segmenter som har passert bunnen
      while (roadSegments.length > 0 && roadSegments[0].bottomY < 0) {
        roadSegments.shift();
        // Gi poeng for passert segment
        score += 10;
        // Av og til spawn fiende
        if (Math.random() < 0.3) {
          spawnEnemy();
        }
      }
  
      // Legg til nye segmenter på toppen
      while (roadSegments[roadSegments.length - 1].bottomY < canvas.height) {
        addRoadSegment();
      }
  
      // Sjekk om spilleren er på veien
      if (!isOnRoad()) {
        gameOver = true;
        showMessage("Du kjørte ut av veien! GAME OVER!", 3);
        setTimeout(() => initGame(), 3000);
      }
  
      // Oppdater fiender
      updateEnemies();
  
      // Oppdater score i UI
      scoreDisplay.textContent = "Score: " + score;
    }
  
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Tegn veien (asfalt) for hvert segment
      for (let seg of roadSegments) {
        let topY = seg.topY;
        let botY = seg.bottomY;
        let cX = seg.centerX;
        let half = seg.roadWidth / 2;
  
        ctx.fillStyle = "#666"; // Asfalt
        ctx.beginPath();
        ctx.moveTo(cX - half, topY);
        ctx.lineTo(cX + half, topY);
        ctx.lineTo(cX + half, botY);
        ctx.lineTo(cX - half, botY);
        ctx.closePath();
        ctx.fill();
      }
  
      // Tegn fiender
      for (let e of enemies) {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.width, e.height);
      }
  
      // Tegn spiller
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }
  
    // Sjekk kollisjon
    function isColliding(a, b) {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }
  
    // Returnerer om spillerens “nederste midtpunkt” er på asfalten
    function isOnRoad() {
      // midt i bunnen av spilleren
      let px = player.x + player.width / 2;
      let py = player.y + player.height;
  
      // Finn segmentet som har topY <= py < bottomY
      let seg = roadSegments.find(s => (py >= s.topY && py < s.bottomY));
      if (!seg) return false;
  
      let leftEdge = seg.centerX - seg.roadWidth / 2;
      let rightEdge = seg.centerX + seg.roadWidth / 2;
      return (px >= leftEdge && px <= rightEdge);
    }
  
    // Håndter venstre/høyre
    function handleInput() {
      if (keys["ArrowLeft"]) {
        player.x -= player.speed;
      }
      if (keys["ArrowRight"]) {
        player.x += player.speed;
      }
  
      // Stopper ved sidene av canvas
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
      }
    }
  
    // Init og start
    initGame();
    gameLoop();
  });
  