# Trippples — Architecture

## 1. Goals

The first implementation is a small browser-based proof of concept using HTML, CSS and Canvas.

The POC should be:

* playable by two human players
* usable with mouse and touch input
* independent of a server
* independent of a database
* free of external frameworks and dependencies
* simple enough to run locally by opening `index.html`
* structured so that the game logic can later be reused by other clients

The architecture should not be tied to Canvas.

The intended long-term structure is:

```text
┌─────────────────────────┐
│          UI             │
│ HTML / Canvas / Input   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│       Game API          │
│                         │
│ move()                  │
│ undo()                  │
│ newGame()               │
│ getLegalMoves()         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│       Game Core         │
│                         │
│ rules                   │
│ state                   │
│ goals                   │
│ history                 │
└─────────────────────────┘
```

The same Game Core should eventually be usable by:

```text
Web UI
   │
   └────── Game Core

Android UI
   │
   └────── Game Core

Server
   │
   └────── Game Core
```

---

## 2. Initial Project Structure

The initial POC should use:

```text
trippples-poc/
├── index.html
├── style.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── board.js
│   ├── rules.js
│   └── ui.js
└── docs/
    ├── GAME_RULES.md
    └── ARCHITECTURE.md
```

No build system or framework is required initially.

The application should work from a local `index.html` wherever practical.

---

## 3. Responsibilities

### `main.js`

Application entry point.

Responsibilities:

* initialize the application
* create the Game instance
* initialize the UI
* connect UI events to the Game API
* start rendering

It should contain very little game-specific logic.

---

### `game.js`

Owns the game state and public game operations.

Conceptually:

```js
class Game {
    newGame();
    move(from, to);
    undo();

    getState();
    getLegalMoves(player);
    getCurrentGoal(player);
}
```

`Game` coordinates the rules and state transitions.

It should not know about:

* Canvas
* DOM elements
* mouse events
* touch events
* CSS
* animation

---

### `board.js`

Responsible for board creation and board-level data.

Responsibilities:

* create the 8×8 board
* generate the 56 arrow combinations
* add the two `ANY` entries
* shuffle the 58 random entries
* place fixed parcours fields
* place fixed start/goal fields

It may also provide helper functions such as:

```js
createBoard()
getTile(x, y)
isInsideBoard(x, y)
```

Board generation should be independent from rendering.

---

### `rules.js`

Contains the actual movement and goal rules.

Responsibilities:

* calculate legal moves
* determine movement directions
* apply board boundaries
* prevent moving onto the opponent
* determine whether a goal has been reached
* determine the next goal
* determine victory
* determine whether the current player is blocked

The rules module must not access the DOM or Canvas.

---

### `ui.js`

Owns browser interaction and rendering.

Responsibilities:

* draw the board
* draw arrows
* draw parcours markers
* draw start/goal markers
* draw pieces
* display the current goal
* display the current player
* handle pointer/touch interaction
* implement drag-and-drop visuals
* highlight legal destinations
* animate visual effects

The UI submits requested moves to `Game`.

It must not independently decide whether a move is legal.

---

## 4. Game State

The game state should be explicit and serializable.

A conceptual state is:

```js
{
    board: [...],

    players: {
        orange: {
            x: 4,
            y: 7,
            reached: 0,
            goal: { x: 6, y: 6 }
        },

        blue: {
            x: 3,
            y: 7,
            reached: 0,
            goal: { x: 1, y: 6 }
        }
    },

    currentPlayer: "orange",

    gameOver: false,
    winner: null,

    history: []
}
```

The exact representation may change during implementation, but the important principle is that all information required to reconstruct the game belongs to the Game State.

---

## 5. Board Coordinates

Game coordinates are independent of Canvas coordinates.

The Game Core uses:

```text
x = 0..7
y = 0..7
```

The UI converts between game coordinates and pixel coordinates.

Conceptually:

```text
Canvas coordinates
       │
       │ pointToCell()
       ▼
Game coordinates
       │
       │ cellCenter()
       ▼
Canvas coordinates
```

No Canvas pixel values should appear inside `rules.js` or the Game Core.

---

## 6. Movement API

The central operation is:

```js
game.move(from, to)
```

For example:

```js
game.move(
    { x: 4, y: 7 },
    { x: 5, y: 6 }
);
```

The Game Core then:

1. verifies that it is the correct player's turn
2. verifies that `from` contains that player's piece
3. calculates the legal moves
4. verifies that `to` is legal
5. updates the player's position
6. checks for goal completion
7. updates the player's next goal if necessary
8. checks for victory
9. changes the current player if the game continues
10. records the move for Undo

The UI receives the resulting state rather than performing these operations itself.

---

## 7. Legal Move Calculation

The rules engine should expose something similar to:

```js
getLegalMoves(state, player)
```

The calculation is conceptually:

```text
opponent position
       │
       ▼
opponent's board tile
       │
       ▼
allowed direction mask
       │
       ├── remove off-board moves
       └── remove opponent's square
       │
       ▼
legal destinations
```

This function should be deterministic for a given state.

It is particularly important that both future clients and future AI use the same function.

---

## 8. Drag & Drop

Drag and drop belongs entirely to the UI layer.

The UI maintains temporary drag state such as:

```js
{
    active: true,
    player: "orange",
    from: { x: 4, y: 7 },
    pointer: { x: 381, y: 492 }
}
```

This state is **not part of the Game State**.

The interaction sequence is:

```text
pointerdown
    │
    ▼
identify board square
    │
    ▼
identify player's piece
    │
    ├── wrong piece → reject
    │
    ▼
begin drag
    │
    ▼
pointermove
    │
    └── update visual position
            │
            ▼
pointerup
    │
    ▼
convert pointer to board square
    │
    ▼
game.move(from, to)
    │
    ├── success → render new state
    │
    └── failure → return piece to from
```

The piece follows the pointer freely while being dragged.

It is only snapped to a board square when the move is committed or rejected.

---

## 9. Rendering

Rendering should be based entirely on the current Game State plus temporary UI state.

The renderer should draw, in approximately this order:

1. board background
2. grid
3. board tiles
4. arrow combinations
5. parcours markers
6. start/goal markers
7. current-goal indicator
8. legal-move highlights
9. player pieces
10. dragged piece, if active
11. optional UI overlays

Rendering must not modify the Game State.

---

## 10. Animation

Animations are presentation concerns.

Examples:

* blinking/pulsing current goal
* dragged-piece movement
* invalid-move return
* successful-move transition

Animations must not alter game rules or coordinates stored by the Game Core.

A later implementation can therefore replace Canvas animation without changing the game logic.

---

## 11. Undo

Undo belongs to the Game Core.

The UI only requests:

```js
game.undo();
```

The Game Core restores the previous state.

The history mechanism should preserve enough information to restore:

* both player positions
* completed goals
* current goals
* current player
* game-over state
* winner

The initial implementation should favour correctness and clarity over minimizing memory usage.

---

## 12. New Game

The UI requests:

```js
game.newGame();
```

The Game Core then:

* generates a new board
* resets players
* resets goals
* resets history
* clears victory state
* determines the starting player

The UI subsequently renders the new state.

---

## 13. Separation of Concerns

The following dependencies are intentional:

```text
main.js
   │
   ├── game.js
   └── ui.js
          │
          └── Canvas / DOM

game.js
   │
   ├── board.js
   └── rules.js
```

The following dependencies should **not** exist:

```text
rules.js  → Canvas       NO
rules.js  → DOM          NO
board.js  → Canvas       NO
game.js   → DOM          NO
game.js   → Pointer API  NO
```

The Game Core should be executable without a browser.

---

## 14. Future AI

The original game contains a computer opponent with nine difficulty levels.

This should eventually be implemented above the core rules:

```text
AI
 │
 ├── reads Game State
 ├── calls getLegalMoves()
 ├── evaluates possible moves
 └── calls game.move()
```

The AI must never implement a second copy of the movement rules.

---

## 15. Future Server

If online multiplayer is added later, the server should own an authoritative Game Core.

Conceptually:

```text
Browser A ──┐
            │
Browser B ──┼──► Server Game Core
            │
            └──── authoritative state
```

Clients should submit requested moves.

The server validates them using the same rules as the local implementation.

This is one of the main reasons for keeping the Game Core independent of Canvas and browser APIs.

---

## 16. Testing

Rules should be testable independently of the UI.

At minimum, tests should eventually cover:

* board dimensions
* all 56 arrow combinations
* exactly two random `ANY` tiles
* fixed parcours positions
* fixed start positions
* initial goals
* direction calculation
* board-edge restrictions
* diagonal movement
* opponent-square restriction
* `ANY` movement
* goal progression
* opposite parcours directions
* final victory
* blocked-player loss
* turn switching
* undo
* new game

The most important rule tests should be created before adding AI or networking.

---

## 17. Initial Implementation Scope

The first POC deliberately implements only:

* randomized board generation
* 8×8 Canvas board
* arrow tiles
* parcours markers
* start/goal squares
* two human players
* player pieces
* current-goal indicator
* legal move calculation
* drag & drop
* move validation
* turn switching
* goal progression
* victory
* blocked-player loss
* Undo
* New Game

The following are postponed:

* computer opponent
* difficulty levels
* Suggest Move
* loop prevention
* networking
* accounts
* database
* server
* mobile-specific UI
* elaborate graphics
* sound
