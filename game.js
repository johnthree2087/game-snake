import { GameScene, GAME_WIDTH, GAME_HEIGHT } from './scenes/GameScene.js';
import StartScene from './scenes/StartScene.js';
import { DIRECTION } from './entities/Snake.js';

// main game config (created after start)
const mainConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0f0f1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

// start scene config (separate Phaser instance attached to start-container)
const startConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'start-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [StartScene],
};

let mainGame = null;
let startGame = new Phaser.Game(startConfig);

// ensure canvas fills parent; Phaser RESIZE will update internal size, but set CSS
// so it occupies the full viewport area. Accept a selector to target different containers.
const setCanvasFull = (selector) => {
  const cvs = document.querySelector(selector + ' canvas');
  if (cvs) {
    cvs.style.width = '100%';
    cvs.style.height = '100%';
    cvs.style.display = 'block';
    return true;
  }
  return false;
};
// try to size both canvases when available
requestAnimationFrame(() => setCanvasFull('#start-container'));
requestAnimationFrame(() => setCanvasFull('#game-container'));

// Listen for the StartScene tap event to boot the main game
window.addEventListener('phaser-start', () => {
  // destroy the start game instance and create the main game
  try {
    if (startGame) {
      startGame.destroy(true);
      startGame = null;
    }
  } catch (e) {
    // ignore
  }

  mainGame = new Phaser.Game(mainConfig);
  // ensure main canvas fills its parent
  const tryMainCanvas = () => {
    if (!setCanvasFull('#game-container')) {
      requestAnimationFrame(tryMainCanvas);
    }
  };
  tryMainCanvas();

  // show controls
  document.getElementById('controls')?.classList.remove('hidden');

  // bind directional buttons after main game exists
  bindDirectionButton('btn-up', DIRECTION.UP);
  bindDirectionButton('btn-left', DIRECTION.LEFT);
  bindDirectionButton('btn-down', DIRECTION.DOWN);
  bindDirectionButton('btn-right', DIRECTION.RIGHT);
});

function bindDirectionButton(id, direction) {
  const button = document.getElementById(id);
  if (!button) {
    return;
  }

  const handlePress = (event) => {
    event.preventDefault();
    const scene = mainGame && mainGame.scene.getScene('GameScene');
    if (scene && !scene.isGameOver) {
      // small haptic feedback on supported devices
      try {
        if (navigator && typeof navigator.vibrate === 'function') {
          navigator.vibrate(10);
        }
      } catch (e) {
        // ignore vibration errors
      }
      scene.snake.setDirection(direction);
    }
  };

  button.addEventListener('click', handlePress);
  button.addEventListener('touchstart', handlePress, { passive: false });
}

bindDirectionButton('btn-up', DIRECTION.UP);
bindDirectionButton('btn-left', DIRECTION.LEFT);
bindDirectionButton('btn-down', DIRECTION.DOWN);
bindDirectionButton('btn-right', DIRECTION.RIGHT);

// long-press (2s) to enable dragging the dpad horizontally along the bottom
(() => {
  const controls = document.getElementById('controls');
  if (!controls) return;

  let longPressTimer = null;
  let dragActive = false;
  let pointerId = null;
  let controlsWidth = 0;

  const clearLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const onPointerDown = (e) => {
    // start long-press timer
    if (longPressTimer) clearLongPress();
    pointerId = e.pointerId;
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      // enter drag mode
      dragActive = true;
      const rect = controls.getBoundingClientRect();
      controlsWidth = rect.width;
      // switch to left-based positioning so we can set exact x
      controls.style.left = `${rect.left}px`;
      controls.style.right = 'auto';
      controls.classList.add('dragging');
      try { controls.setPointerCapture(pointerId); } catch (err) {}
    }, 2000);
  };

  const onPointerMove = (e) => {
    if (!dragActive) return;
    if (e.pointerId !== pointerId) return;
    e.preventDefault();
    const vw = window.innerWidth;
    const minLeft = 8;
    const maxLeft = Math.max(8, vw - controlsWidth - 8);
    const newLeft = Math.min(maxLeft, Math.max(minLeft, Math.round(e.clientX - controlsWidth / 2)));
    controls.style.left = `${newLeft}px`;
  };

  const endDrag = (e) => {
    clearLongPress();
    if (dragActive && e && e.pointerId === pointerId) {
      try { controls.releasePointerCapture(pointerId); } catch (err) {}
    }
    dragActive = false;
    pointerId = null;
    controls.classList.remove('dragging');
  };

  controls.addEventListener('pointerdown', onPointerDown, { passive: false });
  controls.addEventListener('pointermove', onPointerMove, { passive: false });
  controls.addEventListener('pointerup', endDrag);
  controls.addEventListener('pointercancel', endDrag);
  controls.addEventListener('pointerleave', endDrag);
  // also cancel on window blur to be safe
  window.addEventListener('blur', endDrag);
})();
