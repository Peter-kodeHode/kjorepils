// Meny- og UI-logikk samt p5-bakgrunn for menyen

// Beregn promille-funksjon for promillekalkulatoren
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
  
  // Variabler for lyd og skyer
  let backgroundMusic, clickSound;
  let soundsReady = false;
  let clouds = [];
  
  // p5-setup: Lag bakgrunnskanvas med skyer (meny-bakgrunn)
  function setup() {
    window.p5Canvas = createCanvas(windowWidth, windowHeight);
    // Krever brukerinteraksjon – kall userStartAudio()
    userStartAudio();
    backgroundMusic = loadSound('sounds/relaxing-guitar-looop.mp3', checkSoundsReady);
    clickSound = loadSound('sounds/button-press.mp3', checkSoundsReady);
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: random(width),
        y: random(50, 200),
        size: random(60, 120),
        speed: random(0.2, 0.6),
        face: random(['😎', '😴', '🥰', '😮‍💨', '😂', 'funny tekst goes here'])
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
  
  // Håndterer menyknapper
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
        // Når brukeren trykker "Tutt og kjør!"
        document.getElementById('mainTitle').style.display = 'none';
        document.getElementById('startScreen').style.display = 'none';
        // Fjern p5-bakgrunnskanvasen med skyene
        if (window.p5Canvas) {
          window.p5Canvas.remove();
        }
        // Vis spill-canvas og spill UI
        document.getElementById('gameCanvas').style.display = 'block';
        document.getElementById('gameUI').style.display = 'block';
        const carHonk = new Audio('sounds/car-honk.mp3');
        carHonk.play();
        // Start spillet (Game-klassen er definert i script.js)
        new Game();
      }
    });
  });
  