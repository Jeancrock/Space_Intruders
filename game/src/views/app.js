import { Player } from "../entities/Player.js";
import { set, dickSounds } from "../entities/Set.js";
import { Bullet } from "../entities/Bullet.js";
import { Rect } from "../entities/Rect.js";
import { Vector2 } from "../entities/Vector.js";
import { Monster } from "../entities/Monster.js";

import { GetTimeLeft, timerStart } from "../entities/Timer.js";
import { level, infiniteLevel, generateMapMonster } from "../entities/Level.js";

import { CorrectSpaceKeys, GetActionFromKey, GetKeyFromAction, UpdateKeys, LoadKeys, GetAction } from "../entities/Keyboard.js";
import { SetInterfaceVisibility } from "../entities/InterfaceVisibility.js";
import { game } from "../entities/Nav.js";
import { DestroyAllBullets, monster, EndlessSelect } from "../entities/Nav.js";
import { MonsterRuntime, BulletRuntime, Shoot } from "../entities/Runtime.js";

let playerName = document.getElementById("form_username");
let formBtn = document.getElementById("formBtn")
let tabBodyScore = document.getElementById("tab_body_score");
set.chainP.innerHTML = "";
let lastUpdateTime = performance.now();
let chronoPlayerShoot = 0;


export let keyboardConfig = {
    right: "ArrowRight",
    left: "ArrowLeft",
    shoot: "Space",
    pause: "ArrowUp"
}

let keysPressed = {};

let bodyStyle = getComputedStyle(document.body);
let viewport = new Rect(bodyStyle.width, bodyStyle.height).Set(0, 0);

//ScoreBoard
let scores;
let datas;
function loadData(scores) {
    console.log("j'entre et score a pour valeur ", scores,)
    datas = scores
    loadScoreboard(0, 9);
};

export function loadScoreboard(minimum = Number, maximum = Number) {
    // Clear the existing scoreboard data before appending new data
    tabBodyScore.innerHTML = "";
    console.log("datas AVANT", datas)

    // Fonction de tri
    datas.sort((a, b) => {
        // Comparer les scores (en nombre, donc conversion avec Number)
        const scoreA = Number(a.score);
        const scoreB = Number(b.score);

        if (scoreA > scoreB) return -1;  // Si le score de a est plus grand
        if (scoreA < scoreB) return 1;   // Si le score de b est plus grand

        // Si les scores sont égaux, comparer les temps (en secondes)
        const timeA = a.time.split(':').reduce((acc, time) => (60 * acc) + +time);
        const timeB = b.time.split(':').reduce((acc, time) => (60 * acc) + +time);

        return timeA - timeB; // Tri du temps du plus petit au plus grand
    });
    console.log("datas APRES", datas)

    console.log(datas);

    for (let i = minimum; i <= maximum; i++) {
        let tabInfos = document.createElement("tr");

        let tabId = document.createElement("td");
        tabId.classList.add("tabLine");
        tabId.innerHTML = i + 1 + ".";

        let tabName = document.createElement("td");
        let tabTime = document.createElement("td");
        let tabScore = document.createElement("td");

        tabName.classList.add("tabLine");
        tabTime.classList.add("tabLine");
        tabScore.classList.add("tabLine");

        if (datas[i] == undefined) {
            tabName.innerHTML = "-";
            tabTime.innerHTML = "--:--";
            tabScore.innerHTML = "-";
        } else {
            tabName.innerHTML = datas[i]['name'];
            tabTime.innerHTML = datas[i]["time"];
            tabScore.innerHTML = datas[i]["score"];
        }

        // Etablissement du format/couleur des premières lignes
        switch (i) {
            case 0:
                tabInfos.style.color = "#d0c050";
                tabInfos.style.backgroundColor = "#aa1717";
                tabInfos.style.fontSize = "x-large";
                break;
            case 1:
                tabInfos.style.color = "#50d070";
                tabInfos.style.backgroundColor = "#dd621e";
                tabInfos.style.fontSize = "x-large";
                break;
            case 2:
                tabInfos.style.color = "#f14f50";
                tabInfos.style.backgroundColor = "#ffd81d";
                tabInfos.style.fontSize = "x-large";
                break;
            default:
                break;
        }


        tabInfos.appendChild(tabId);
        tabInfos.appendChild(tabName);
        tabInfos.appendChild(tabTime);
        tabInfos.appendChild(tabScore);
        tabBodyScore.appendChild(tabInfos);

    }
}
formBtn.addEventListener("click", function () {
    if (playerName.value === "") {
        // Afficher une alerte si le pseudo est vide
        alert("Veuillez entrer un pseudo pour vous enregistrer.");
        return;
    } else {
        document.getElementById("formBtn").disabled = true;
        playerName.innerHTML = '';
        set.form.style.visibility = "hidden"; // check
        restartBtn.style.visibility = "visible";
        SetInterfaceVisibility("scoreboard", set.currentLvl);

        // Créer un objet avec les données à envoyer
        const data = {
            mode: set.modeJson,
            score: set.score.toString(),
            time: GetTimeLeft(),
            name: playerName.value,
        };

        // Récupérer les scores existants du localStorage
        const scores = JSON.parse(localStorage.getItem(set.modeJson)) || [];

        // Ajouter le nouveau score
        scores.push(data);

        // Fonction de comparaison pour trier les scores
        const compareScores = (a, b) => {
            // Trier par score (number) en ordre décroissant
            if (a.score > b.score) return -1;
            if (a.score < b.score) return 1;

            // Si les scores sont égaux, trier par time (number) en ordre croissant
            return a.time - b.time;
        };

        // Trier les scores
        scores.sort(compareScores);

        // Sauvegarder les scores mis à jour dans le localStorage
        localStorage.setItem(set.modeJson, JSON.stringify(scores));

        // Simuler une mise à jour de l'interface
        refreshData();
    }
});

export function refreshData() {
    if (set.modeJson == "story" || set.modeJson == "") {
        scores = JSON.parse(localStorage.getItem(set.modeJson)) || [];
        console.log("le score story: ", scores)
        loadData(scores);
    } else {
        scores = JSON.parse(localStorage.getItem(set.modeJson)) || [];
        console.log("le score endless: ", scores)
        loadData(scores);
    }
}

// Initial load of data
refreshData();

document.addEventListener('keydown', (event) => {
    // keysPressed[event.code] = true;
    let e = CorrectSpaceKeys(event.key)
    keysPressed[e] = true;
});

document.addEventListener('keyup', (event) => {
    // delete keysPressed[event.code];
    let e = CorrectSpaceKeys(event.key)
    delete keysPressed[e];
});



export function updateGame(timestamp) {
    checkGameOver();
    set.extraVar.SetPosition();
    let elapsedTime = timestamp - lastUpdateTime;
    if (!set.isGameOver) {
        if (keysPressed[keyboardConfig.right]) {
            set.player.position.x += 10
            set.player.setPosition();
        } else if (keysPressed[keyboardConfig.left]) {
            set.player.position.x -= 10;
            set.player.setPosition();
        }
        if (keysPressed[keyboardConfig.shoot]) {
            if (chronoPlayerShoot == 0) {
                chronoPlayerShoot = set.MAXIMUM_PLAYER_SHOOT;
                Shoot("player");
            }
        }
        if (chronoPlayerShoot != 0) {
            chronoPlayerShoot -= (chronoPlayerShoot > 0);
        }
        if (elapsedTime >= 1000) {
            lastUpdateTime = timestamp;
            timerStart();
            if (set.monsterParent) {
                set.monsterParent.Move();
            }
        }
        BulletRuntime();
        MonsterRuntime();
    }
    set.loopGame = requestAnimationFrame(updateGame);
}


//Check if the gameplay still run or not
function checkGameOver() {
    if (set.isGameOver) {
        return;
    }
    if (set.player.Lives == 0 && !set.isGameOver) {
        if (set.isEndless) {
            DestroyAllBullets();
            set.isGameOver = true;
            SetInterfaceVisibility("congrats", set.currentLvl);
            SetInterfaceVisibility("score", set.currentLvl);
        } else {
            DestroyAllBullets();
            SetInterfaceVisibility("lose", set.currentLvl);
            set.isGameOver = true;
        }
    }
    if (set.remainingEnemies == null) {
        if (set.isEndless) {
            set.currentLvl++;

            EndlessSelect()
        } else {
            DestroyAllBullets();
            set.isWin = true;
            set.isGameOver = true;
            cancelAnimationFrame(set.loopGame);
            set.loopGame = 0;
            set.currentLvl++;
            SetInterfaceVisibility("win", set.currentLvl);
        }
    }

    if (set.divParentMonsters.querySelectorAll(".monster").length > 1) {
        if (set.divParentMonsters.offsetTop + set.divParentMonsters.offsetHeight > set.player.position.y) {
            DestroyAllBullets();
            set.isGameOver = true;
            SetInterfaceVisibility("lose", set.currentLvl);
        }
    }
}

export function PauseGame() {
    SetInterfaceVisibility("pause");
    set.inMenu = false;
    if (set.loopGame == 0) { // Animation stoppée : on la relance
        if (dickSounds.music != null) {
            dickSounds.music.currentTime = set.currentPlaybackTime;
            dickSounds.music.play();
        }
        updateGame();
    } else {  // Arrêt de l'animation
        cancelAnimationFrame(set.loopGame);
        set.loopGame = 0;
        if (dickSounds.music != null) {
            set.currentPlaybackTime = dickSounds.music.currentTime;
            dickSounds.music.pause();
        }
    }
}

function loadTools() {
    // if (!timer){
    let timer = document.createElement("div");
    timer.id = "time";
    timer.innerHTML = "00:00";
    set.gameDiv.appendChild(timer);
    // }

    set.livesCountDisplay.innerHTML = " x " + set.player.Lives;

    document.getElementById("bot").appendChild(set.livesDiv);
    set.livesDiv.appendChild(set.livesImgDisplay);
    set.livesDiv.appendChild(set.livesCountDisplay);

    set.displayScore.id = "score";
    set.displayScore.innerHTML = "Score:" + set.score;
    set.gameDiv.appendChild(set.displayScore);

    set.chainP.id = "chainNb";
    set.chainMult.appendChild(set.chainP);
}
//Called for loading bullets in game
function loadBullets() {
    let indexBullet = 0;
    document.querySelectorAll(".playerBullet").forEach((divElem) => {
        let bullet = new Bullet(viewport, "player", divElem, indexBullet);
        divElem.style.position = "absolute";
        set.bulletsObj.push(bullet)
        indexBullet++;
    });
    document.querySelectorAll(".monsterBullet").forEach((divElem) => {
        let bullet = new Bullet(viewport, "monster", divElem);
        divElem.style.position = "absolute";
        set.bulletsMonsterObj.push(bullet)
    });
}



let btnKeys = document.querySelectorAll(".btn_keys")
let idElement;
btnKeys.forEach((button) => {
    button.addEventListener("click", function () {
        SetInterfaceVisibility("change_keys", set.currentLvl, GetAction(button.id));
        let idElement = button.id;
        let keyPressPromise = new Promise((resolve, reject) => {
            let keydownListener = function (event) {
                document.removeEventListener("keydown", keydownListener);
                resolve(event.key); // Use event.key instead of event.code
            };
            document.addEventListener("keydown", keydownListener);
        });
        keyPressPromise.then((key) => { // Note that it's now the key, not keyCode
            let e = CorrectSpaceKeys(key)
            let keysAlreadyRegister = Object.values(keyboardConfig);
            if (!keysAlreadyRegister.includes(e)) {
                UpdateKeys(key, button.id); // Ensure UpdateKeys function can handle the change from event.code to event.key
                LoadKeys();
            } else {
                e = CorrectSpaceKeys(e);
                let conflictingAction = GetActionFromKey(e, keyboardConfig);

                let actionBtn = GetAction(button.id);
                let keyBtn = GetKeyFromAction(actionBtn, keyboardConfig);

                switch (actionBtn) {
                    case "right":
                        keyboardConfig.right = e;
                        break;
                    case "left":
                        keyboardConfig.left = e;
                        break;
                    case "shoot":
                        keyboardConfig.shoot = e;
                        break;
                    default: //pause
                        keyboardConfig.pause = e;
                        break;
                }
                switch (conflictingAction) {
                    case "right":
                        keyboardConfig.right = keyBtn;
                        break;
                    case "left":
                        keyboardConfig.left = keyBtn;
                        break;
                    case "shoot":
                        keyboardConfig.shoot = keyBtn;
                        break;
                    default: //pause
                        keyboardConfig.pause = keyBtn;
                        break;
                }
                LoadKeys();
                // swap les touches
            }
            SetInterfaceVisibility("keyboard");
        });
    });
});

//Pause Action
document.addEventListener('keydown', function (event) {
    if (event.key === keyboardConfig.pause) {
        if (!set.inMenu) {
            PauseGame();
        }
    }
});
function restartAudio() {
    dickSounds.music.currentTime = 0; // Réinitialiser au début de la piste
    dickSounds.music.play(); // Reprendre la lecture
}
// Écouter l'événement 'ended' de l'élément audio
if (dickSounds.music != null) {
    dickSounds.music.addEventListener('ended', restartAudio);
}

window.addEventListener("resize", function () {
    set.gameDivWidth = document.getElementById("game").offsetWidth;
    set.gameCenter = set.gameDivWidth / 2;
    set.posPlayerX = set.gameCenter - 30;
    set.posPlayerY = set.gameDiv.offsetHeight - 30 - document.getElementById("bot").offsetHeight;
    set.player.position.y = set.posPlayerY;
    set.player.setPosition();
    set.monsterParent.gameCenter = set.gameDivWidth;
})
loadTools();
loadBullets();
game();
