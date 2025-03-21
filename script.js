document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const W = canvas.width;   // 400
    const H = canvas.height;  // 600

    // Overlays
    const startOverlay = document.getElementById('startOverlay');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const gameOverMsg = document.getElementById('gameOverMsg');
    const finalScore = document.getElementById('finalScore');
    const btnStart = document.getElementById('btnStart');
    const btnRestart = document.getElementById('btnRestart');
    const scoreDisplay = document.getElementById('scoreDisplay');

    // Spilletilstand
    let gameState = 'menu';  // 'menu', 'play', 'gameover'
    let score = 0;
    let lives = 5;

    // Spiller
    let player = {
        x: W * 0.5 - 15,
        y: H - 80,
        width: 30,
        height: 50,
        color: 'red',
        velX: 0,
        maxVelX: 5,
        accel: 0.3,
        targetX: null
    };

    // Veisegmenter (øverste først i arrayet)
    let roadSegments = [];
    let segHeight = 40;
    let roadSpeed = 3;     // nedover
    let waveOffset = 0;
    let waveAmp = 50;
    let waveFreq = 0.002;
    let baseWidth = 150;
    let fluctWidth = 30;
    let widthFreq = 0.0015;

    // Start y-pos for toppen av veien (litt negativt = over canvas)
    let topSegmentY = -segHeight;

    // Fiender
    let enemies = [];
    let enemySpawnTimer = 0;
    let enemySpawnInterval = 90; // spawner fiende ca. hver 1.5 sek ved ~60 FPS

    // Input
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.code] = true; });
    document.addEventListener('keyup',   e => { keys[e.code] = false; });

    // Mus (lerp)
    canvas.addEventListener('mousemove', e => {
        if(gameState !== 'play') return;
        const rect = canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        player.targetX = mouseX - player.width * 0.5;
    });

    // Init
    function initGame() {
        score = 0;
        lives = 5;
        player.x = W * 0.5 - player.width * 0.5;
        player.y = H - 80;
        player.velX = 0;
        player.targetX = player.x;

        roadSegments = [];
        waveOffset = 0;
        topSegmentY = -segHeight;

        enemies = [];
        enemySpawnTimer = 0;

        // Fyll skjermen med segmenter ovenfra og ned
        while(topSegmentY < H) {
            addRoadSegment(topSegmentY);
            topSegmentY += segHeight;
        }
    }

    // Legg til segment *øverst* i arrayet med y = yPos
    // (unshift => første element i arrayet er segmentet som er lengst oppe)
    function addRoadSegment(yPos) {
        let sinArg = (yPos + waveOffset) * waveFreq;
        let centerX = W * 0.5 + waveAmp * Math.sin(sinArg);

        let sinArgW = (yPos + waveOffset) * widthFreq;
        let w = baseWidth + fluctWidth * Math.sin(sinArgW);
        if(w < 80) w = 80;
        if(w > 300) w = 300;

        roadSegments.unshift({
            y: yPos,
            centerX: centerX,
            roadWidth: w
        });
    }

    // Oppdater veien
    function updateRoad() {
        // Flytt segmenter ned
        for(let seg of roadSegments) {
            seg.y += roadSpeed;
        }

        // Fjern segmenter som har passert bunnen
        while(roadSegments.length > 0 && roadSegments[roadSegments.length - 1].y > H) {
            // Siste element i arrayet er nederst på skjermen
            roadSegments.pop();
            score += 10; // litt poeng per segment som "passerer"
        }

        // Sjekk øverste segmentet
        // Hvis det øverste segmentet er kommet så langt ned at det er på eller under topp (dvs y + segHeight >= 0),
        // så lager vi et nytt segment enda lenger opp for å fylle på.
        if(roadSegments.length > 0) {
            let topSeg = roadSegments[0];
            // Så lenge topp-segmentet er synlig eller nesten synlig, fortsett å legge til segmenter *enda* lengre opp
            while(topSeg.y + segHeight >= 0) {
                // Legg nytt segment over topSeg
                let newY = topSeg.y - segHeight;
                addRoadSegment(newY);
                topSeg = roadSegments[0]; // nå er det nye segmentet på indeks 0
            }
        } else {
            // Hvis alt ble fjernet (f.eks. i en pause), start en ny vei
            addRoadSegment(-segHeight);
        }

        waveOffset += 0.5;
    }

    // Tegn veien
    function drawRoad() {
        // Grønn bakgrunn (gress)
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0,0,W,H);

        // Tegn segmentene
        ctx.setLineDash([10,6]); // stiplet kant
        for(let seg of roadSegments) {
            let leftX = seg.centerX - seg.roadWidth * 0.5;
            ctx.fillStyle = '#666'; 
            ctx.fillRect(leftX, seg.y, seg.roadWidth, segHeight);

            // Hvite kantlinjer
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(leftX, seg.y);
            ctx.lineTo(leftX, seg.y + segHeight);
            ctx.moveTo(leftX + seg.roadWidth, seg.y);
            ctx.lineTo(leftX + seg.roadWidth, seg.y + segHeight);
            ctx.stroke();
        }
    }

    // Oppdater spiller
    function updatePlayer() {
        if(keys['ArrowLeft']) {
            player.velX -= player.accel;
        } else if(keys['ArrowRight']) {
            player.velX += player.accel;
        } else {
            if(Math.abs(player.velX) > 0.1) {
                player.velX *= 0.9;
            } else {
                player.velX = 0;
            }
        }
        if(player.velX > player.maxVelX) player.velX = player.maxVelX;
        if(player.velX < -player.maxVelX) player.velX = -player.maxVelX;

        // Mus-lerp
        if(player.targetX !== null) {
            let diff = (player.targetX - player.x);
            player.x += diff * 0.05;
            if(Math.abs(diff) < 0.5) {
                player.targetX = null;
            }
        }

        player.x += player.velX;

        // Avgrens sider
        if(player.x < 0) player.x = 0;
        if(player.x + player.width > W) player.x = W - player.width;
    }

    // Tegn spiller
    function drawPlayer() {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Fiender (spawner oppe, beveger seg ned)
    function spawnEnemy() {
        // Velg en posisjon helt øverst (fra øverste segment)
        if(roadSegments.length === 0) return;
        let seg = roadSegments[0]; // segmentet som er lengst opp
        let leftX = seg.centerX - seg.roadWidth * 0.5;
        let randomX = leftX + Math.random() * (seg.roadWidth - 30);

        // Fiende litt over selve segmentet
        enemies.push({
            x: randomX,
            y: seg.y - 60,
            width: 30,
            height: 50,
            color: 'blue',
            speed: roadSpeed + 1
        });
    }

    function updateEnemies() {
        enemySpawnTimer--;
        if(enemySpawnTimer <= 0) {
            spawnEnemy();
            enemySpawnTimer = enemySpawnInterval;
        }

        for(let i = enemies.length - 1; i >= 0; i--) {
            let en = enemies[i];
            en.y += en.speed;
            // Fjern hvis fienden er under skjermen
            if(en.y > H + en.height) {
                enemies.splice(i,1);
                continue;
            }
            // Kollisjon
            if(checkCollision(player, en)) {
                lives--;
                enemies.splice(i,1);
                if(lives <= 0) {
                    setGameOver("Du mistet alle liv!");
                }
            }
        }
    }

    function drawEnemies() {
        for(let en of enemies) {
            ctx.fillStyle = en.color;
            ctx.fillRect(en.x, en.y, en.width, en.height);
        }
    }

    function checkCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    // Sjekk om bilen er på asfalten
    function isOnRoad() {
        let px = player.x + player.width * 0.5;
        let py = player.y + player.height * 0.5;
        for(let seg of roadSegments) {
            if(py >= seg.y && py < seg.y + segHeight) {
                let leftX = seg.centerX - seg.roadWidth * 0.5;
                let rightX = leftX + seg.roadWidth;
                if(px < leftX || px > rightX) {
                    return false; // utenfor asfalten
                }
                return true; // på asfalten
            }
        }
        return true;
    }

    // Spillets løkke
    function gameLoop() {
        if(gameState !== 'play') return;
        requestAnimationFrame(gameLoop);

        ctx.clearRect(0,0,W,H);

        updateRoad();
        drawRoad();

        updatePlayer();
        drawPlayer();

        updateEnemies();
        drawEnemies();

        // Avkjøring
        if(!isOnRoad()) {
            setGameOver("Du kjørte av veien!");
        }

        scoreDisplay.textContent = "Score: " + Math.floor(score) + " | Liv: " + lives;
    }

    // Start
    function startGame() {
        startOverlay.classList.remove('show');
        gameOverOverlay.classList.remove('show');
        gameState = 'play';
        initGame();
        gameLoop();
    }

    function setGameOver(msg) {
        gameState = 'gameover';
        gameOverMsg.textContent = msg;
        finalScore.textContent = Math.floor(score);
        gameOverOverlay.classList.add('show');
    }

    function restartGame() {
        startGame();
    }

    btnStart.addEventListener('click', startGame);
    btnRestart.addEventListener('click', restartGame);

    // Vis startskjerm
    startOverlay.classList.add('show');
});