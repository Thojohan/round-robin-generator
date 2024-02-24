// Erklærer variabler og henter HTML templates
const namesForm = document.getElementById("namesForm");
const input = document.querySelector('input[name="name"]');
const scheduleDiv = document.getElementById("schedule");
const printButton = document
  .getElementById("printButtonTemplate")
  .content.cloneNode(true).firstElementChild;
const nameFields = document.getElementById("nameFields");

// Flere globale mutable variabler for å håndtere nedtelling, reset, pause etc.
let schedule = [];
let movedElement;
let speachEl;
let isTicking = false;

// Samler clean-up som er felles for reset og når nedtelling er ferdig
function endHandler() {
  console.log(document.querySelectorAll(".round"));
  document.querySelectorAll(".round").forEach((el) => {
    el.style.backgroundColor = "white";
  });
  document.querySelectorAll(".clockDiv").forEach((el) => el.remove());
  document.querySelector(".buttonDiv").remove();
  document
    .querySelectorAll(".pre-button")
    .forEach((el) => (el.disabled = false));
  speachEl = "";
  isTicking = false;
  document.querySelector(".header-form").scrollIntoView({ behavior: "smooth" });
}

// Endre rekkefølge på rundene
function moveItemsHandler(e) {
  if (!e.target.dataset.dir) return;
  const number = Number(e.target.closest(".round").id.at(0));
  const direction = e.target.dataset.dir;
  if (number === 0 && direction === "up") return;
  if (number === schedule.length - 1 && direction === "down") return;
  const [cutElement] = schedule.splice(number, 1);
  movedElement = direction === "up" ? number - 1 : number + 1;
  schedule.splice(movedElement, 0, cutElement);
  displaySchedule();

  // Farger som indikerer at rekkefølgen endres mellom to komponenter + animasjon
  const changedElement = document.getElementById(`${movedElement}round`);
  const prevElement = document.getElementById(`${number}round`);
  prevElement.style.backgroundColor = "#f5dad7";
  prevElement.style.transform = "translateX(15px)";
  setTimeout(() => {
    changedElement.style.backgroundColor = "#f5dad7";
    changedElement.style.transform = "translateX(15px)";
  }, 150);
  setTimeout(() => {
    prevElement.style.backgroundColor = "white";
    prevElement.style.transform = "translateX(0px)";
  }, 300);
  setTimeout(() => {
    changedElement.style.backgroundColor = "white";
    changedElement.style.transform = "translateX(0px)";
  }, 500);
}

// Handler for å fjerne input-felt. Fjerner feltet, med mindre det er kun ett felt igjen.
// Da tømmes feltet istedet
function deleteInput(e) {
  if (document.querySelectorAll(".input-container").length < 2)
    return (e.target.closest(".input-container").querySelector("input").value =
      "");
  e.target.closest(".input-container").remove();
}

function addNameField() {
  // Legger til og fokuserer nytt navnefelt
  const newField = document
    .getElementById("newField")
    .content.cloneNode(true).firstElementChild;
  nameFields.appendChild(newField);
  newField.querySelector("input").focus();

  // Legger til delete-knapp, og legger til event-listener
  newField.querySelector(".delete-btn").addEventListener("click", deleteInput);
  newField.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!e.target.value) return;
      addNameField();
    }
  });
}

// Håndterer pause og reset
function stopHandler(e) {
  if (e.target.id === "pause") {
    const activeDiv = document.querySelector(".active");
    isTicking = !isTicking;
    isTicking
      ? (e.target.innerHTML = "Pause")
      : (e.target.innerHTML = "Fortsett");
    activeDiv.classList.toggle("animate");
  }
  if (e.target.id === "reset") {
    e.preventDefault();
    endHandler();
  }
}

// Håndtere opplesning av kamper
async function handleSpeach(roundNumb, headerText) {
  // Returnerer om den allerede leser opp (husk den kalles en gang per sekund)
  if (speachEl === roundNumb) return;
  speachEl = roundNumb;
  const text = [
    headerText,
    ...[...document.querySelectorAll(`.match${roundNumb}`)].map(
      (el) => el.innerHTML
    ),
  ];

  // Henter stemmer async
  const synth = window.speechSynthesis;
  async function getVoices() {
    const GET_VOICES_TIMEOUT = 2000;
    let voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      return voices;
    }
    let voiceschanged = new Promise((r) =>
      speechSynthesis.addEventListener("voiceschanged", r, { once: true })
    );
    let timeout = new Promise((r) => setTimeout(r, GET_VOICES_TIMEOUT));

    await Promise.race([voiceschanged, timeout]);
    return window.speechSynthesis.getVoices();
  }
  const voicePromise = getVoices();
  const voices = await voicePromise;

  Array.from(text).forEach((element) => {
    if (element !== "") {
      setTimeout(() => {
        // Rate og pitch på stemmen.
        // const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(element);
        utterance.voice = voices[0];
        utterance.rate = 0.75;
        utterance.pitch = 0.4;
        synth.speak(utterance);
      }, 1000);
    }
  });
}

// Håndterer nedtelling
function countDown(roundArray, speach, buttons, startRound) {
  // Setter start basert på valgt startrunde
  let tempArr = roundArray.map((el, i) => (i >= startRound * 2 - 2 ? el : -1));
  let active;

  function execute() {
    if (!isTicking) return;
    const activeIndex = tempArr.findIndex((el) => el >= 0);
    const roundNumb = Math.floor(Number(activeIndex / 2));
    const header = document.getElementById(`${roundNumb}header`);
    active = header.querySelector(".clockDiv") || null;
    const activeNumb = tempArr.at(activeIndex);
    document.querySelectorAll(".round").forEach((el) => {
      el.style.backgroundColor = "white";
    });

    const min = String(Math.floor(activeNumb / 60)).padStart(2, "0");
    const sec = String(activeNumb % 60).padStart(2, "0");
    const rounds = document.querySelectorAll(".clockDiv");
    rounds.forEach((el) => (el.innerHTML = ""));
    if (min === "00" && sec === "00" && activeIndex === tempArr.length - 1) {
      return endHandler();
    }
    active.innerHTML = `${
      min !== "00" && sec !== "00" ? "" : "-"
    }${min}:${sec}`;
    active.style.color = `${activeIndex % 2 === 0 ? "#d4264f" : "#0b7845"}`;
    active.closest(".round").style.backgroundColor = "#fcf2e8";

    const headerText = header.querySelector("h2").innerText;
    header.appendChild(buttons);
    active.scrollIntoView({ behavior: "smooth" });

    // Kaller talefunksjon hvis den er aktivert
    if (activeIndex % 2 === 0 && speach === "on")
      handleSpeach(roundNumb, headerText);
    active.classList.add("active");
    active.classList.add("animate");
    tempArr[activeIndex] = activeNumb - 1;
  }
  execute();

  // I stedet for å bruke en intervall-funksjon håndterer animasjonen i CSS nedtellingen.
  // Fordelen er at den er mer nøyaktig, og man slipper å koordinere to timere.
  active.addEventListener("animationiteration", execute);
}

// Starter nedtelling og genererer arrayet over varighet på runde/pause
function startHandler(e) {
  e.preventDefault();

  // Deaktiverer knapper (start, flytt opp, flytt ned) når rundene er i gang.
  document
    .querySelectorAll(".pre-button")
    .forEach((el) => (el.disabled = true));

  // Setter inn container for klokkevisning
  document
    .querySelectorAll(".header")
    .forEach((header) =>
      header.insertAdjacentHTML("beforeend", "<div class='clockDiv'></div>")
    );
  // Legger til knapper for reset og pause
  const buttons = document
    .getElementById("stopButtons")
    .content.cloneNode(true).firstElementChild;

  buttons.addEventListener("click", stopHandler);

  const {
    minutesBreak,
    minutesRound,
    secondsBreak,
    secondsRound,
    speach,
    startRound,
  } = Object.fromEntries(new FormData(e.currentTarget));

  const roundArray = [
    // Lagt inn default på 15 sek før start hvis tale er aktivert og 10 sek hvis ikke
    // (for at man skal rekke å få navnene lest opp)
    ...(speach === "on" ? [20] : [10]),
    ...schedule
      .reduce((acc, el, i) => {
        if (i < schedule.length - 1)
          return [
            ...acc,
            [
              Number(minutesRound) * 60 + Number(secondsRound),
              Number(minutesBreak) * 60 + Number(secondsBreak),
            ],
          ];
        return [...acc, [Number(minutesRound) * 60 + Number(secondsRound)]];
      }, [])
      .flat(),
  ];
  isTicking = true;
  countDown(roundArray, speach, buttons, startRound);
}

// Sender inn skjema og kaller funksjon for å generere oppsettet
namesForm.addEventListener("submit", function (e) {
  movedElement = "";
  e.preventDefault();
  generateSchedule();
});

// Genererer runder
function generateMatches(names) {
  if (names.length % 2 !== 0) {
    names.push("Rest");
  }

  const rounds = new Array(names.length - 1).fill(null).map((_el, i) => {
    const roundMatches = new Array(names.length / 2)
      .fill(null)
      .reduce((acc, _el, j) => {
        return [...acc, [names[j], names[names.length - 1 - j]]];
      }, []);
    names.splice(1, 0, names.pop());
    return roundMatches;
  });
  return rounds;
}

// Genererer oppsettet
function generateSchedule() {
  speachEl = "";
  isTicking = false;

  const names = Array.from(document.querySelectorAll('input[name="name"]'))
    .map((input) => input.value.trim())
    .filter((name) => name !== "");

  schedule = generateMatches(names);
  displaySchedule(schedule);
}

// Viser oppsettet
function displaySchedule() {
  const scheduleHeader = document
    .getElementById("scheduleHeader")
    .content.cloneNode(true).firstElementChild;
  scheduleDiv.innerHTML = "";
  scheduleDiv.appendChild(scheduleHeader);

  // Lager innmat til timer-selectorene (så man slipper å kode 240 option-elementer :p)
  const timeArr = new Array(60).fill(null);
  const timerSelectors = [...document.querySelectorAll(".timer")];
  timerSelectors.forEach((selector) => {
    timeArr.forEach((_el, i) =>
      selector.insertAdjacentHTML(
        "beforeEnd",
        `<option value=${i}>${String(i).padStart(2, "0")}</option>`
      )
    );
  });

  // Lager innmat til selector for runde
  const startArr = new Array(schedule.length).fill(null);
  const startSelect = document.querySelector(".startAt");
  startArr.forEach((_el, i) =>
    startSelect.insertAdjacentHTML(
      "beforeend",
      `<option value=${i + 1}>${String(i + 1)}</option>`
    )
  );

  // Lar deg velge tale hvis tilgjengelig i browseren
  const headerForm = document.querySelector(".header-form");
  "speechSynthesis" in window
    ? headerForm.insertAdjacentHTML(
        "afterBegin",
        "<div class='slider-wrapper'><span>Tekst til tale</span><span><label class='switch'><input type='checkbox' name='speach' checked><span class='slider circle'></span></label></span></div>"
      )
    : headerForm.insertAdjacentHTML(
        "afterBegin",
        "<div><span>Sorry, text to speach not supported</span></div>"
      );

  schedule.map((round, index) => {
    const buttons = document
      .getElementById("upDownButtons")
      .content.cloneNode(true).firstElementChild;
    const sortedMatches = round.sort((a, b) => {
      if (a.includes("Rest")) return 1;
      if (b.includes("Rest")) return -1;
      return 0;
    });

    scheduleDiv.insertAdjacentHTML(
      "beforeend",
      `<div class="round" id="${index}round">
      <header class="header" id="${index}header"><h2>Runde ${
        index + 1
      }</h2></header>
      </div>`
    );

    const roundDiv = document.getElementById(`${index}round`);
    const header = document.getElementById(`${index}header`);
    buttons.addEventListener("click", moveItemsHandler);

    // Legger til knapper for å endre rekkefølge om det er mer enn en runde
    if (schedule.length > 1) header.appendChild(buttons);
    sortedMatches.map((match) => {
      if (match.includes("Rest")) {
        const resting = match.at(0) === "Rest" ? match.at(1) : match.at(0);
        roundDiv.insertAdjacentHTML(
          "beforeend",
          `<div class="rest-round">${resting} har pause</div>`
        );
      } else {
        roundDiv.insertAdjacentHTML(
          "beforeend",
          `<div class="match match${index}">${match.at(0)} versus ${match.at(
            1
          )}</div>`
        );
      }
    });
  });

  scheduleHeader.addEventListener("submit", startHandler);

  // Leggeer til print-knappen
  scheduleDiv.appendChild(printButton);
  printButton.addEventListener("click", printSchedule);

  // Scroller til starten av schedule (eller flyttet element)
  !movedElement
    ? scheduleDiv.scrollIntoView({ behavior: "smooth" })
    : document
        .getElementById(`${movedElement}round`)
        .scrollIntoView({ behavior: "smooth" });
}

// Kaller printfunksjon
function printSchedule() {
  window.print();
}

// Generer første input-felt når siden laster
addNameField();
