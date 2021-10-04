"use strict";

const canvas = document.querySelector("canvas");
const scoreEl = document.querySelector("#scoreEl");
const startGameBtn = document.querySelector("#startGameBtn");
const modal = document.querySelector("#modal");
const modal_score = document.querySelector("#modal_score");
const bgGameMusic = new Audio("bgGameMusic.mp3");
const hitEffect = new Audio("hitEffect.wav");
const gameOver = new Audio("gameOver.wav");
const musicControl = document.querySelector("#musicControl");
const context = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

let projectiles = [];
let enemies = [];
let particles = [];
const x = canvas.width / 2;
const y = canvas.height / 2;

// Creating a player i.e. a circle at the center using context
class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }
}
let player = new Player(x, y, 10, "white");

//Creating projectiles that the player shoots
class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }

  //This is how the projectiles moves ie adding velocity to each porjectile.
  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

// After collision the enemy bursts into particles.
const friction = 0.99;
class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    context.save();
    context.globalAlpha = this.alpha;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
    context.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.01;
  }
}

//Game Inititalization function
const init = () => {
  player = new Player(x, y, 10, "white");
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  scoreEl.innerHTML = 0;
  modal_score.innerHTML = 0;
};

//Spawning Enemies randomly from the 4 sides of screen.
const spawnEnemies = () => {
  setInterval((e) => {
    const radius = Math.random() * (30 - 5) + 5;
    let x;
    let y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : 0 + radius + canvas.width;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : 0 + radius + canvas.height;
    }
    const color = `hsl(${Math.random() * 360},50%,50%)`;
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);

    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
};

// Below is Game LOOP
let animationId = 0;
let score = 0;
const animate = () => {
  animationId = requestAnimationFrame(animate);
  context.fillStyle = "rgba(0,0,0,0.1)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();

  //Removing particles(Enemy after collision) from screen with a fading effect
  particles.forEach((particle, particleIndex) => {
    if (particle.alpha <= 0) {
      particles.splice(particleIndex, 1);
    } else {
      particle.update();
    }
  });

  projectiles.forEach((projectile, projectileIndex) => {
    projectile.update();

    //Removing projectiles from array once they are off-scrren i.e not rendering them anymore
    if (
      projectile.x - projectile.radius < 0 ||
      projectile.x + projectile.radius > canvas.width ||
      projectile.y - projectile.radius < 0 ||
      projectile.y + projectile.radius > canvas.width
    ) {
      setTimeout(() => {
        projectiles.splice(projectileIndex, 1);
      }, 0);
    }
  });

  enemies.forEach((enemy, enemyIndex) => {
    enemy.update();

    // When an enemy hits a player. GAME ENDS
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist - player.radius - enemy.radius < 1) {
      cancelAnimationFrame(animationId);
      modal_score.innerHTML = score;
      modal.style.display = "flex";
      bgGameMusic.pause();
      gameOver.play();
    }

    //Collision Detection. When the projectile hits an enemy
    projectiles.forEach((projectile, projectileIndex) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (dist - projectile.radius - enemy.radius < 1) {
        hitEffect.currentTime = 0;
        hitEffect.play();
        // creating Particles on collision
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 4),
                y: (Math.random() - 0.5) * (Math.random() * 4),
              }
            )
          );
        }

        if (enemy.radius - 10 > 5) {
          score += 100;
          scoreEl.innerHTML = score;
          gsap.to(enemy, { radius: enemy.radius - 10 });
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1);
          }, 0);
        } else {
          score += 250;
          scoreEl.innerHTML = score;
          setTimeout(() => {
            enemies.splice(enemyIndex, 1);
            projectiles.splice(projectileIndex, 1);
          }, 0);
        }
      }
    });
  });
};

window.addEventListener("click", (e) => {
  // Calculating Angle
  //It accepts y coordinate as a first parameter. Then x coordinates.
  //   console.log(projectiles);
  const angle = Math.atan2(
    e.clientY - canvas.height / 2,
    e.clientX - canvas.width / 2
  );

  const velocity = {
    x: Math.cos(angle) * 4,
    y: Math.sin(angle) * 4,
  };
  projectiles.push(new Projectile(x, y, 5, "white", velocity));
});

startGameBtn.addEventListener("click", () => {
  bgGameMusic.play();
  init();
  animate();
  spawnEnemies();
  modal.style.display = "none";
});

musicControl.addEventListener("click", (e) => {
  if (bgGameMusic.paused) bgGameMusic.play();
  else bgGameMusic.pause();
});
