import gsap from "gsap";
import Draggable from "gsap/Draggable";

gsap.registerPlugin(Draggable);

document.addEventListener("DOMContentLoaded", () => {

  class ParallaxGame {
    constructor(config) {
      this.displaySpeed = config.displaySpeed;
      this.timerDuration = config.timerDuration;
      this.username = config.username;
      this.maxNonPrime = config.maxNonPrime;
      this.score = 0; // Nombre de non premiers attrapés
      this.primeIndex = 0;
      this.nonPrimeCount = 0;
      this.gameRunning = false;
      this.timerInterval = null;
      this.primeInterval = null;
      this.nonPrimeInterval = null;
      this.container = document.getElementById("container");
      this.dropZone = document.getElementById("dropZone");
      this.scoreDisplay = document.getElementById("score");
      this.timerDisplay = document.getElementById("timer");
      this.gameOverOverlay = document.getElementById("gameOverOverlay");
      this.gameOverDetails = document.getElementById("gameOverDetails");
      this.usernameDisplay = document.getElementById("usernameDisplay");

      this.primeNumbers = this.generatePrimes(1000);
      this.nonPrimeNumbers = this.generateNonPrimes(1000);

      this.usernameDisplay.textContent = this.username;
      this.container.addEventListener("mousemove", (e) => this.parallaxeHandler(e));
    }

    generatePrimes(max) {
      const primes = [];
      for (let num = 2; num <= max; num++) {
        let isPrime = true;
        for (let i = 2, limite = Math.sqrt(num); i <= limite; i++) {
          if (num % i === 0) { isPrime = false; break; }
        }
        if (isPrime) primes.push(num);
      }
      return primes;
    }

    generateNonPrimes(max) {
      const nonPrimes = [];
      for (let num = 1; num <= max; num++) {
        let isPrime = true;
        if (num < 2) isPrime = false;
        else {
          for (let i = 2, limite = Math.sqrt(num); i <= limite; i++) {
            if (num % i === 0) { isPrime = false; break; }
          }
        }
        if (!isPrime) nonPrimes.push(num);
      }
      return nonPrimes;
    }

    getRandomColor() {
      let color, r, g, b, brightness;
      do {
        r = Math.floor(Math.random() * 256);
        g = Math.floor(Math.random() * 256);
        b = Math.floor(Math.random() * 256);
        brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        color = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      } while (brightness < 150);
      return color;
    }

    createPrimeElement(prime) {
      const el = document.createElement("div");
      el.classList.add("prime");
      el.textContent = prime;
      el.style.fontSize = (Math.floor(Math.random() * 25) + 16) + "px";
      el.style.color = this.getRandomColor();
      const containerWidth = this.container.clientWidth;
      const containerHeight = this.container.clientHeight;
      el.style.left = (Math.random() * (containerWidth - 100)) + "px";
      el.style.top = (Math.random() * (containerHeight - 100)) + "px";
      el.dataset.parallaxFactor = Math.random() * 0.07 + 0.03;
      // Au clic, le nombre premier disparaît et 10 nouveaux sont ajoutés.
      el.addEventListener("click", () => {
        gsap.to(el, {
          duration: 0.5,
          opacity: 0,
          onComplete: () => { 
            el.remove(); 
            this.addRandomPrimes(10); 
          }
        });
      });
      this.container.appendChild(el);
    }

    createNonPrimeElement(num) {
      const el = document.createElement("div");
      el.classList.add("nonprime");
      el.textContent = num;
      el.style.fontSize = (Math.floor(Math.random() * 25) + 16) + "px";
      const originalColor = this.getRandomColor();
      el.style.color = originalColor;
      el.dataset.originalColor = originalColor;
      const containerWidth = this.container.clientWidth;
      const containerHeight = this.container.clientHeight;
      el.style.left = (Math.random() * (containerWidth - 100)) + "px";
      el.style.top = (Math.random() * (containerHeight - 100)) + "px";
      el.dataset.parallaxFactor = Math.random() * 0.07 + 0.03;
      el.addEventListener("mouseenter", () => {
        gsap.to(el, { duration: 0.3, scale: 3, ease: "power1.out" });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { duration: 0.3, scale: 1, ease: "power1.out" });
      });
      this.container.appendChild(el);
      Draggable.create(el, {
        type: "x,y",
        onDragEnd: () => {
          const elRect = el.getBoundingClientRect();
          const dropRect = this.dropZone.getBoundingClientRect();
          const elCenterX = elRect.left + elRect.width / 2;
          const elCenterY = elRect.top + elRect.height / 2;
          if (
            elCenterX >= dropRect.left &&
            elCenterX <= dropRect.right &&
            elCenterY >= dropRect.top &&
            elCenterY <= dropRect.bottom
          ) {
            gsap.to(el, {
              duration: 0.5,
              opacity: 0,
              onComplete: () => {
                el.remove();
                this.score++;
                this.scoreDisplay.textContent = "score : " + this.score;
                // Vérification de la condition de victoire
                if (this.score >= this.maxNonPrime) {
                  this.winGame();
                }
              }
            });
          }
        }
      });
    }

    addRandomPrimes(n) {
      for (let i = 0; i < n; i++) {
        if (this.primeIndex < this.primeNumbers.length) {
          this.createPrimeElement(this.primeNumbers[this.primeIndex]);
          this.primeIndex++;
        }
      }
    }

    addRandomNonPrimes(n) {
      for (let i = 0; i < n; i++) {
        const randomIndex = Math.floor(Math.random() * this.nonPrimeNumbers.length);
        this.createNonPrimeElement(this.nonPrimeNumbers[randomIndex]);
        this.nonPrimeCount++;
      }
    }

    startTimer() {
      let timeRemaining = this.timerDuration;
      this.timerDisplay.textContent = "Temps restant : " + timeRemaining;
      this.timerInterval = setInterval(() => {
        timeRemaining--;
        this.timerDisplay.textContent = "Temps restant : " + timeRemaining;
        if (timeRemaining <= 0) {
          clearInterval(this.timerInterval);
          // Fin de jeu si le timer arrive à 0 sans victoire
          this.endGame();
        }
      }, 1000);
    }

    parallaxeHandler(e) {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      document.querySelectorAll(".prime, .nonprime").forEach((el) => {
        const factor = parseFloat(el.dataset.parallaxFactor);
        const offsetX = (mouseX - centerX) * factor;
        const offsetY = (mouseY - centerY) * factor;
        gsap.to(el, { duration: 0.5, x: offsetX, y: offsetY, ease: "power1.out" });
      });
    }

    startGame() {
      // Réinitialisation
      this.primeIndex = 0;
      this.nonPrimeCount = 0;
      this.score = 0;
      this.scoreDisplay.textContent = "score : " + this.score;
      this.container.innerHTML = "";
      this.container.appendChild(this.dropZone);
      this.gameOverOverlay.style.display = "none";
      this.container.style.filter = "none";

      // Démarrage des intervalles d'ajout
      this.primeInterval = setInterval(() => {
        if (this.primeIndex < this.primeNumbers.length) {
          this.createPrimeElement(this.primeNumbers[this.primeIndex]);
          this.primeIndex++;
        }
      }, this.displaySpeed);

      this.nonPrimeInterval = setInterval(() => {
        if (this.nonPrimeCount < this.maxNonPrime) {
          const randomIndex = Math.floor(Math.random() * this.nonPrimeNumbers.length);
          this.createNonPrimeElement(this.nonPrimeNumbers[randomIndex]);
        }
      }, this.displaySpeed);

      // Arrêt de l'ajout des non premiers après 10% de la durée du jeu
      setTimeout(() => {
        clearInterval(this.nonPrimeInterval);
      }, this.timerDuration * 0.10 * 1000);

      this.startTimer();
      this.gameRunning = true;
    }

    endGame() {
      clearInterval(this.primeInterval);
      clearInterval(this.nonPrimeInterval);
      clearInterval(this.timerInterval);
      gsap.to(this.container, { duration: 0.5, filter: "blur(5px)" });
      this.container.removeEventListener("mousemove", this.parallaxeHandler);
      document.querySelector("#gameOverOverlay h1").textContent = "GAME OVER";
      this.gameOverDetails.innerHTML = "Bien joué " + this.username + "<br>Voici ton score : " + this.score;
      this.gameOverOverlay.style.display = "block";
    }

    winGame() {
      clearInterval(this.primeInterval);
      clearInterval(this.nonPrimeInterval);
      clearInterval(this.timerInterval);
      gsap.to(this.container, { duration: 0.5, filter: "blur(5px)" });
      this.container.removeEventListener("mousemove", this.parallaxeHandler);
      document.querySelector("#gameOverOverlay h1").textContent = "YOU WIN";
      this.gameOverDetails.innerHTML = "You win " + this.username + "!<br>Score : " + this.score;
      this.gameOverOverlay.style.display = "block";
    }

    resetGame() {
      clearInterval(this.primeInterval);
      clearInterval(this.nonPrimeInterval);
      clearInterval(this.timerInterval);
      this.gameRunning = false;
      document.getElementById("startContainer").style.display = "block";
      this.container.style.display = "none";
      document.getElementById("scoreContainer").style.display = "none";
      this.gameOverOverlay.style.display = "none";
    }
  }

  // Gestion du démarrage et du bouton Rejouer
  document.getElementById("startButton").addEventListener("click", () => {
    const config = {
      displaySpeed: parseInt(document.getElementById("displaySpeed").value),
      timerDuration: parseInt(document.getElementById("timerDuration").value),
      username: document.getElementById("username").value,
      maxNonPrime: parseInt(document.getElementById("maxNonPrime").value)
    };

    // Masquer le conteneur de configuration
    document.getElementById("startContainer").style.display = "none";

    // Afficher l'écran de décompte
    const countdownOverlay = document.getElementById("countdownOverlay");
    const countdownText = document.getElementById("countdownText");
    countdownText.textContent = "3";
    countdownOverlay.style.display = "flex";
    countdownOverlay.style.opacity = 1;
    countdownOverlay.style.background = "black";

    // Utilisation de GSAP.delayedCall pour gérer le décompte et le fondu
    gsap.delayedCall(1, () => { countdownText.textContent = "2"; });
    gsap.delayedCall(2, () => { countdownText.textContent = "1"; });
    gsap.delayedCall(3, () => {
      // Fondu vers le blanc pendant 1 seconde
      gsap.to(countdownOverlay, { duration: 1, background: "#fff" });
    });
    gsap.delayedCall(4, () => {
      // Fondu de l'overlay pour révéler le jeu
      gsap.to(countdownOverlay, { duration: 1, opacity: 0, onComplete: () => {
        countdownOverlay.style.display = "none";
        // Affichage de l'interface de jeu
        document.getElementById("container").style.display = "block";
        document.getElementById("scoreContainer").style.display = "block";
        // Démarrage du jeu
        const game = new ParallaxGame(config);
        game.startGame();
        document.getElementById("replayButton").addEventListener("click", () => {
          game.resetGame();
        });
      }});
    });
  });

});