// 1. Paste your JSON array here!
const storyData = [
  {
    id: "start",
    sceneText:
      "You awake in mid-air, slamming hard into a bed of jagged, glowing crystals. This isn't a grand throne room—it's a magical disposal chute. The air reeks of volatile mana and ozone. Above you, the cavern ceiling groans, and a massive petrified boulder dislodges, plummeting directly toward your head. At the same time, a strange, instinctual energy begins to pulse hotly in your hands.",
    imagePrompt:
      "Anime style, high fantasy action. First-person view looking up from the ground in a dark, subterranean cavern glowing with jagged purple crystals. A massive, jagged boulder is falling directly toward the camera. Debris and glowing dust float in the air.",
    choices: [
      {
        text: "Focus the strange energy to repel the rock (Use Kinetic Inversion).",
        nextId: "invert_boulder",
      },
      {
        text: "Roll desperately out of the way into an adjacent ravine.",
        nextId: "dive_away",
      },
    ],
  },
  {
    id: "invert_boulder",
    sceneText:
      "You thrust your hands upward. A shockwave warps the air! The boulder's momentum violently snaps in reverse, shooting back into the ceiling with a deafening crash. Sunlight bleeds through the newly created hole. But the noise has awakened something. A mechanical roar shakes the cavern, and a hound made of black glass—the Obsidian Vanguard—steps from the shadows, its red core locking onto you.",
    imagePrompt:
      "Anime style, epic fantasy. A dark subterranean cavern illuminated by a dramatic shaft of sunlight from a shattered ceiling. In the shadows below, a terrifying, massive robotic hound made of glossy black obsidian with a glowing red core prepares to pounce.",
    choices: [
      {
        text: "Scramble up the falling debris toward the sunlight.",
        nextId: "climb_shaft",
      },
      {
        text: "Hold your ground and prepare to fight the beast.",
        nextId: "hide_shadows",
      },
    ],
  },
  {
    id: "dive_away",
    sceneText:
      "You tuck and roll, skinning your knees on petrified roots as the boulder obliterates the ground where you just lay. You're trapped in a narrow, dead-end ravine. The dust settles, revealing heavy, metallic footsteps. The Obsidian Vanguard rounds the corner, its faceless glass snout tracking the rapid, otherworldly thumping of your heart.",
    imagePrompt:
      "Anime style, tense thriller. A claustrophobic, narrow canyon of petrified wood and dark crystals. A terrifying mechanical hound made of black glass is slowly stalking around the corner, its red inner light illuminating the dust.",
    choices: [
      {
        text: "Use Kinetic Inversion on the floating dust to blind it, then reposition.",
        nextId: "hide_shadows",
      },
      {
        text: "Charge the beast with a jagged crystal shard.",
        nextId: "game_over",
      },
    ],
  },
  {
    id: "climb_shaft",
    sceneText:
      "You leap onto the shifting rubble, climbing desperately toward the surface. The Vanguard lunges, its black glass jaws snapping inches from your ankles. You can feel the intense heat of its mana core. It gathers kinetic energy into its hind legs for a final, lethal pounce that will skewer you against the cavern wall.",
    imagePrompt:
      "Anime style, dynamic action shot. Low angle looking up at a protagonist scrambling up a steep pile of glowing rubble toward a beam of daylight. Directly behind them, a massive obsidian hound is mid-leap, jaws open, glowing with intense red magical energy.",
    choices: [
      {
        text: "Invert its upward momentum to slam it violently into the floor!",
        nextId: "victory",
      },
      {
        text: "Try to kick a loose boulder down into its jaws.",
        nextId: "game_over",
      },
    ],
  },
  {
    id: "hide_shadows",
    sceneText:
      "You face the beast head-on. The Vanguard doesn't hesitate—it launches itself at you like a ballistic missile, front claws extended to impale you. Time seems to slow down as its immense weight bears down on your position. This is the moment to test the absolute limits of your strange new power.",
    imagePrompt:
      "Anime style, high-stakes combat. A dramatic, slow-motion shot of a massive black glass mechanical hound lunging forward with razor-sharp claws extended. The protagonist stands in the foreground, hands raised, glowing with a fierce blue, space-warping kinetic energy.",
    choices: [
      {
        text: "Invert the beast's kinetic force, turning its own attack inward!",
        nextId: "victory",
      },
      {
        text: "Attempt to dodge at the very last second.",
        nextId: "game_over",
      },
    ],
  },
];

// 2. Convert Array to Dictionary for O(1) lookups
const storyNodes = {};
storyData.forEach((node) => {
  storyNodes[node.id] = node;
});

// 3. UI Element References
const pageEl = document.getElementById("page");
const imageEl = document.getElementById("scene-image");
const textEl = document.getElementById("text-container");
const choicesEl = document.getElementById("choices-container");
const muteBtn = document.getElementById("mute-btn");
const coverEl = document.getElementById("cover-screen");
const beginBtn = document.getElementById("begin-btn");

// 3b. Background Music
const bgm = new Audio("assets/bgm.mp3");
bgm.loop = true; // restart automatically when it ends
bgm.volume = 0.4; // 0.0 (silent) to 1.0 (full)

// Browsers block autoplay until the user interacts with the page.
// So we start the music on the first click anywhere, one time only.
function startMusicOnce() {
  bgm.play().catch(() => {}); // ignore if the file is missing/blocked
  document.removeEventListener("click", startMusicOnce);
}
document.addEventListener("click", startMusicOnce);

// Mute toggle: flip bgm.muted and swap the icon.
muteBtn.onclick = () => {
  bgm.muted = !bgm.muted;
  muteBtn.innerText = bgm.muted ? "🔇" : "🔊";
};

// 4. The Core Game Loop
// renderScene plays a page-turn, swapping the content while the page is
// edge-on to the viewer so the change is hidden inside the flip.
let isTurning = false;
function renderScene(nodeId) {
  // Ignore rapid clicks while a page is mid-turn.
  if (isTurning) return;
  isTurning = true;

  pageEl.classList.add("turning");

  // Swap content at the midpoint of the flip, then turn the page back in.
  const swap = () => {
    populateScene(nodeId);
    // Force a reflow so removing the class animates from the flipped state.
    void pageEl.offsetWidth;
    pageEl.classList.remove("turning");
  };

  // Fall back to a timer in case transitionend doesn't fire.
  let done = false;
  const onMidpoint = () => {
    if (done) return;
    done = true;
    pageEl.removeEventListener("transitionend", onMidpoint);
    swap();
  };
  pageEl.addEventListener("transitionend", onMidpoint);
  setTimeout(onMidpoint, 360);

  // Release the lock once the page has fully turned back.
  setTimeout(() => {
    isTurning = false;
  }, 760);
}

// Populates the page with a node's content (no animation).
function populateScene(nodeId) {
  // Handle Endings gracefully
  if (nodeId === "game_over") {
    showEnding("Game Over! The Obsidian Vanguard got you.", false);
    return;
  }
  if (nodeId === "victory") {
    showEnding("Victory! You survived the cavern.", true);
    return;
  }

  // Fetch current state
  const node = storyNodes[nodeId];

  // Update View
  imageEl.style.display = "block"; // ensure image is visible for normal scenes
  imageEl.src = `assets/${node.id}.webp`;
  textEl.innerText = node.sceneText;

  // Clear old buttons
  choicesEl.innerHTML = "";

  // Generate new buttons
  node.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.innerText = choice.text;
    // Attach the event listener to transition state
    btn.onclick = () => renderScene(choice.nextId);
    choicesEl.appendChild(btn);
  });
}

// Helper function for dead-ends
function showEnding(message, isVictory) {
  imageEl.style.display = "none"; // hide image (avoids broken-image icon)
  textEl.innerText = message;
  choicesEl.innerHTML = "";

  const restartBtn = document.createElement("button");
  restartBtn.innerText = "Restart Adventure";
  restartBtn.style.backgroundColor = isVictory ? "#4CAF50" : "#d32f2f";
  restartBtn.onclick = () => renderScene("start");
  choicesEl.appendChild(restartBtn);
}

// 5. Initialize Game
// Render the opening scene underneath the cover so it's ready, but keep
// the story page hidden until the player presses "Begin".
pageEl.style.display = "none";
renderScene("start");

// Begin: fade the cover out first, then swap in the story page once the
// cover is gone so the two never overlap (no layout jump).
beginBtn.onclick = () => {
  coverEl.classList.add("hidden");
  bgm.play().catch(() => {}); // first user gesture, so autoplay is allowed
  setTimeout(() => {
    coverEl.style.display = "none";
    pageEl.style.display = "block";
  }, 500); // matches the cover fade-out transition
};
