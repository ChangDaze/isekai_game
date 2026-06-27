// 1. Story data comes from scene.js (the single source of truth), loaded via a
//    <script> tag before this file. Convert the array into a dictionary so we
//    can look nodes up by id in O(1).
const storyNodes = {};
STORY_DATA.forEach((node) => {
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
