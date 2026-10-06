// PLAYER  

const player = document.querySelector("#player");
// vitesse du vaisseau
const acceleration = 1000; // pixels/s²
const maxSpeed = 300;     // pixels/s
const friction = 250;     // ralentissement en pixels/s²
// Variables de position et de vélocité
let x = 380;
let y = 280;
let vx = 0;
let vy = 0;


// ASTEROID

const asteroids = [];
let asteroidSpawnTimer = -1;
let asteroidSuperSpawnTimer = 0;
let asteroidSuperSpawnNumber = 3;
const asteroidSpawnInterval = 0.5;
let asteroidSuperSpawnInterval = 10;
const asteroidMaxSpeed = 200;

// STARS

const stars = [];

// SCORE

const scoreElement = document.querySelector("#score");
let score = 0;
let scoreTimer = 0;

// INPUT

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    z: false,
    q: false,
    s: false,
    d: false
};

document.addEventListener("keydown", (event) => {
    if (event.key in keys) {
        event.preventDefault();
        keys[event.key] = true;
    }
});

document.addEventListener("keyup", (event) => {
    if (event.key in keys) {
        event.preventDefault();
        keys[event.key] = false;
    }
});


// GAME LOOP

// Temps en miliseconde écoulé depuis le dernier point de réference (Utile pour le calcul du deltatime lors de la première frame de la boucle de jeu)
let lastTime = performance.now();

function gameLoop(currentTime) {

    // currentTime - lastTime permet d'obtenir le temps écoulé entre 2 frames
    // Le résultat est divisé par 1000 pour obtenir ce temps en seconde.
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    updateStars(deltaTime);
    updatePlayer(deltaTime);
    updateAsteroidSpawn(deltaTime);
    updateAsteroids(deltaTime);
    checkCollisions();
    updateScore(deltaTime);
   
    requestAnimationFrame(gameLoop);
}

function updatePlayer(deltaTime) {

    // Récupération des dimensions de l'écran de jeu afin que d'obtenir la limite de déplacement du vaisseau
    const game = document.querySelector("#game");
    const maxX = game.clientWidth - player.offsetWidth;
    const maxY = game.clientHeight - player.offsetHeight;


    // Direction du vaisseau
    let dx = 0;
    let dy = 0;

    // Mise à jour du vecteur de déplacement (x, y) en fonction des inputs
    if (keys.ArrowLeft || keys.q)   dx -= 1;
    if (keys.ArrowRight || keys.d)  dx += 1;
    if (keys.ArrowUp || keys.z)     dy -= 1;
    if (keys.ArrowDown || keys.s)   dy += 1;

    // Normalisation du vecteur
    const length = Math.hypot(dx, dy);
    if (length > 0) {
        dx /= length;
        dy /= length;

        // Accélération
        vx += dx * acceleration * deltaTime;
        vy += dy * acceleration * deltaTime;
    } else {
        // Inertie
        const currentSpeed = Math.hypot(vx, vy);

        if (currentSpeed > 0) {
            const newSpeed = Math.max(
                0,
                currentSpeed - friction * deltaTime
            );

            vx = vx / currentSpeed * newSpeed;
            vy = vy / currentSpeed * newSpeed;
        }
    }

    // Limite de vitesse
    const currentSpeed = Math.hypot(vx, vy);

    if (currentSpeed > maxSpeed) {
        vx = vx / currentSpeed * maxSpeed;
        vy = vy / currentSpeed * maxSpeed;
    }

    // Mise à jour de la position du vaisseau (direction multiplié par la vitesse, multiplié par le delta entre 2 frames)
    x += vx * deltaTime;
    y += vy * deltaTime;
    // Limitation des coordonnées à l'écran de jeu
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    // Mise à jour de l'affichage
    player.style.left = `${x}px`;
    player.style.top = `${y}px`;
    // Mise à jour de l'orientation du vaisseau en fonction de la direction lorsque le vaissea use déplace
    if (Math.hypot(vx, vy) > 1) {
        const angle = Math.atan2(vy, vx) * 180 / Math.PI + 90;

        player.style.transform = `rotate(${angle}deg)`;
    }
}

function spawnAsteroid() {
    // Création de l'alément et ajout dans le DOM
    const element = document.createElement("div");
    element.classList.add("asteroid");
    element.style.width = 40 + Math.random() * 40 + "px";
    element.style.height = element.style.width
    game.appendChild(element);

    // Taille de l'astéroide (width suffit car l'élement ets carré)
    const size = element.offsetWidth;
    // Nombre Aléatoire entre 1 et 4 qui permettra de décider de quel côté l'astéroide apparaît
    const side = Math.floor(Math.random() * 4);
    // vitesse de l'astéroide
    const speed = 120 + Math.random() * asteroidMaxSpeed;
    // variation dans la direction
    const fluctuation = 1;
    // Direction de rotation aléatoire
    const rotationDirection = Math.random() < 0.5 ? -1 : 1;
    // Rotation de l'astéroide
    let rotation = 0;

    // Variables de position et de vélocité
    let x;
    let y;
    let vx;
    let vy;

    // Pour chaque cas, l'atéroide apparaît d'un côté de l'écran et le traverse dans la direction opposée.
    switch (side) {
        case 0: // gauche
            x = -size;
            y = Math.random() * game.clientHeight;

            vx = speed;
            vy = (Math.random() - fluctuation) * speed;
            break;

        case 1: // droite
            x = game.clientWidth;
            y = Math.random() * game.clientHeight;

            vx = -speed;
            vy = (Math.random() - fluctuation) * speed;
            break;

        case 2: // haut
            x = Math.random() * game.clientWidth;
            y = -size;

            vx = (Math.random() - fluctuation) * speed;
            vy = speed;
            break;

        case 3: // bas
            x = Math.random() * game.clientWidth;
            y = game.clientHeight;

            vx = (Math.random() - fluctuation) * speed;
            vy = -speed;
            break;
    }

    // Ajout d'alétoire pour qu'environ 25% des astéroide prennent la position du joueur au moment de leur spawn comme direction,
    // afin d'éviter que le joueur reste trop passif.
    const targetPlayer = Math.random() < 0.25;
    if (targetPlayer) {
        const playerRect = player.getBoundingClientRect();
        const gameRect = game.getBoundingClientRect();

        // Calcul de la position du joueur par rapport au cadre de jeu car getBoundingClientRect() donne des coordonnées par rapport 
        // à la fenêtre du navigateur.
        const playerX = playerRect.left - gameRect.left + playerRect.width / 2;
        const playerY = playerRect.top - gameRect.top + playerRect.height / 2;

        const asteroidX = x + size / 2;
        const asteroidY = y + size / 2;

        let dx = playerX - asteroidX;
        let dy = playerY - asteroidY;

        const length = Math.hypot(dx, dy);

        dx /= length;
        dy /= length;

        vx = dx * speed;
        vy = dy * speed;
    }

    asteroids.push({
        element,
        x,
        y,
        vx,
        vy,
        rotationDirection,
        rotation
    });
}

function updateAsteroidSpawn(deltaTime) {
    asteroidSpawnTimer += deltaTime;
    asteroidSuperSpawnTimer += deltaTime;

    if (asteroidSpawnTimer >= asteroidSpawnInterval) {
        spawnAsteroid();
        asteroidSpawnTimer = 0;
    }

    if(asteroidSuperSpawnTimer >= asteroidSuperSpawnInterval) {
        console.log("mega spawn !")
        for (let i = 0; i < asteroidSuperSpawnNumber; i++) {
            spawnAsteroid();
        }
        asteroidSuperSpawnTimer = 0;

        if (asteroidSuperSpawnInterval > 2) {
            asteroidSuperSpawnInterval -= 0.5
        } 
    }
}

function updateAsteroids(deltaTime) {

    // mise à jour de la position de l'astéroide
    for (const asteroid of asteroids) {
        asteroid.x += asteroid.vx * deltaTime;
        asteroid.y += asteroid.vy * deltaTime;

        // Vitesse réel de l'astéroide
        const speed = Math.hypot(asteroid.vx, asteroid.vy);
        // Ajout de la rotation de l'asteroide en fonction de sa vitesse.
        asteroid.rotation += asteroid.rotationDirection * speed * deltaTime * 0.5

        asteroid.element.style.left = `${asteroid.x}px`;
        asteroid.element.style.top = `${asteroid.y}px`;
        asteroid.element.style.transform = `rotate(${asteroid.rotation}deg)`;
    }

    // Suppression les astéroides qui sortent de l'écran
    // Parcours de la listre dans le sens inverse afin de ne pas perturber l'odre des index lors de la mise à jour de position
    for (let i = asteroids.length - 1; i >= 0; i--) {

        const asteroid = asteroids[i];

        // Marge laissé avant de considérer que l'astéroide quitte l'écran.
        const outsideMargin = 200
        const outside =
            asteroid.x > game.clientWidth + outsideMargin ||
            asteroid.x + asteroid.element.offsetWidth < - outsideMargin
            asteroid.y > game.clientHeight + outsideMargin ||
            asteroid.y + asteroid.element.offsetHeight < - outsideMargin;

        if (outside) {
            // Suppression de l'élement du DOM
            asteroid.element.remove();
            // Suppression de l'astéroide dans la liste
            asteroids.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Test de collision pour chaque astéroide
    for (const asteroid of asteroids) {
        if (isColliding(player, asteroid)) {
            // Si une collision à lieu le joueur perd la partie et on redémarre le jeu.
            alert(`BOUM votre vaisseau à explosé ! \n Votre score : ${score}`);
            window.location.reload();
        }
    }
}

function isColliding(player, asteroid) {
    // Rectangle contenant le vaisseau à l'écran
    const playerRect = player.getBoundingClientRect();
    // Rectangle contenant l'astéroide à l'écran
    const asteroidRect = asteroid.element.getBoundingClientRect();

    // Origine du vaisseau
    const playerCenterX = playerRect.left + playerRect.width / 2;
    const playerCenterY = playerRect.top + playerRect.height / 2;

    // Origine de l'astéroide
    const asteroidCenterX = asteroidRect.left + asteroidRect.width / 2;
    const asteroidCenterY = asteroidRect.top + asteroidRect.height / 2;

    // Distance entre le vaisseau et l'astéroide
    const dx = playerCenterX - asteroidCenterX;
    const dy = playerCenterY - asteroidCenterY;

    // Hypoténuse de la distance
    const distance = Math.hypot(dx, dy);

    // La boîte de collision correspond à un cercle plus petit que ce qui es taffiché à l'écran afin que le feeling soit plus agréable et permissif
    const playerRadius = playerRect.width * 0.3;
    const asteroidRadius = asteroidRect.width * 0.35;

    // Entre en collision si la distance entre le vaisseau et l'asteroide est inférieur à la somme de leur rayon.
    return distance < playerRadius + asteroidRadius;
}

function updateScore(deltaTime) {
    scoreTimer += deltaTime;

    if (scoreTimer >= 1) {
        score += 10;
        scoreTimer = 0;
        scoreElement.textContent = `Score : ${score}`;
    }
}

function createStars(count) {
    // Création des étoiles servant de background dynamique
    for (let i = 0; i < count; i++) {
        const element = document.createElement("div");
        element.classList.add("star");

        // taille alétoire entre 1 et 4 pixels
        const size = 1 + Math.random() * 3;

        element.style.width = `${size}px`;
        element.style.height = `${size}px`;

        // Création d'une étoile avec position et vitesse aléatoire
        const star = {
            element,
            x: Math.random() * game.clientWidth,
            y: Math.random() * game.clientHeight,
            speed: 20 + Math.random() * 60
        };

        game.appendChild(element);
        stars.push(star);
    }
}

function updateStars(deltaTime) {
    for (const star of stars) {
        // Mise à jour de la position de l'étoile
        star.y += star.speed * deltaTime;

        // Si l'étoile sort de l'écran on rétinitialise sa position en haut de l'écran et alétoirement sur l'axe horizontale.
        if (star.y > game.clientHeight) {
            star.y = 0;
            star.x = Math.random() * game.clientWidth;
        }

        star.element.style.left = `${star.x}px`;
        star.element.style.top = `${star.y}px`;
    }
}

createStars(80);
requestAnimationFrame(gameLoop);