# Trippples — Architecture

## 1. Goals

Trippples is a browser-based implementation of the original game, initially developed as a small proof of concept (POC) using HTML, CSS, and Canvas.

The current POC should be:

- Playable by two human players.
- Usable with mouse and touch input.
- Independent of a server and database.
- Free of external frameworks and runtime dependencies.
- Simple enough to run locally by opening `index.html`.
- Structured so that the game logic can later be reused by other clients.

The architecture must not be tied to Canvas.

The long-term objective is to keep the game rules and state management independent of the presentation layer.

```text
┌─────────────────────────┐
│           UI            │
│ HTML / Canvas / Input   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│        Game API         │
│                         │
│ newGame()               │
│ move()                  │
│ undo()                  │
│ getLegalMoves()         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│       Game Core         │
│                         │
│ rulesets                │
│ board and state         │
│ movement and goals      │
│ history                 │
└─────────────────────────┘
```

The same Game Core should eventually be reusable by different clients:

```text
Web UI ─────────┐
                │
Android UI ─────┼──► Game Core
                │
Server ─────────┘
```

The diagram describes the intended architecture, not a claim that all future clients or interfaces already exist.

## 2. Project Structure

The current POC uses the following structure:

```text
trippples-poc/
├── index.html
├── style.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── board.js
│   ├── rules.js
│   ├── rulesets.js
│   └── ui.js
├── tests/
│   ├── test.html
│   ├── rules.test.js
│   ├── game.test.js
│   └── ui.test.js
└── docs/
    ├── GAME_RULES.md
    └── ARCHITECTURE.md
```

The application uses ordinary JavaScript files loaded directly by `index.html`. No build system, package manager, framework, or external runtime dependency is required.

The test suite can be run in a browser using `tests/test.html`.

The architecture uses classic script loading rather than JavaScript modules. Script order therefore matters: shared definitions must be loaded before the scripts that depend on them.

## 3. Responsibilities

### `main.js`

Application entry point.

Responsibilities:

- Initialize the application.
- Create the `Game` instance.
- Initialize the UI.
- Connect application-level controls and events.
- Coordinate ruleset selection and confirmation.
- Start the initial rendering process.

It should contain very little game-specific logic.

### `game.js`

Owns the game state and public game operations.

Responsibilities:

- Initialize a new game.
- Maintain the current ruleset.
- Track player positions and route progress.
- Validate and apply moves.
- Manage turn progression and victory.
- Maintain undo history.
- Expose information needed by the UI.

The `Game` class coordinates the board and rules modules.

It must not depend on:

- Canvas.
- DOM elements.
- Mouse or pointer events.
- Touch APIs.
- CSS.
- Rendering or animation.

### `rulesets.js`

Defines the available rule configurations.

Each ruleset describes:

- Board dimensions.
- The required number of arrow combinations.
- The number of `ANY` fields.
- Fixed blocked fields.
- Player starting positions.
- Ordered routes, including intermediate waypoints and final targets.

The current POC provides two rulesets:

- **Current Rules:** the multi-waypoint variant with two ordinary `ANY` fields.
- **Classic Rules:** the variant with four central blocked fields and a single final target for each player.

Ruleset definitions should be the single source of truth for these configuration differences. The board generator, game logic, and UI should consume the configuration rather than maintaining separate ruleset-specific implementations.

### `board.js`

Responsible for board creation and board-level data.

Responsibilities:

- Generate the configured board.
- Generate the 56 unique arrow combinations.
- Add the configured number of `ANY` fields.
- Place fixed blocked fields.
- Assign start, waypoint, and target roles.
- Validate the ruleset configuration and generated board.
- Provide board-coordinate helper functions.

Important functions include:

```js
createBoard(ruleset)
getTile(board, x, y)
isInsideBoard(x, y, size)
```

The board generator is independent of rendering.

A tile distinguishes its movement behaviour from its semantic roles.

Movement behaviour:

- `arrows`: movement directions are determined by the tile's direction mask.
- `any`: movement is allowed in all eight directions, subject to other rules.
- `blocked`: the tile cannot be entered.

Roles can include:

- `start`
- `parcours`
- `target`

A tile may have more than one role. For example, a starting position can also be the opponent's final target.

Start, waypoint, and target roles do not themselves determine movement behaviour. In the current implementation, these role-bearing fields behave as `ANY` fields.

### `rules.js`

Contains the movement rules.

Responsibilities:

- Calculate legal moves.
- Interpret movement masks.
- Apply board boundaries.
- Prevent players from occupying the same square.
- Prevent movement onto blocked fields.

The legal-move calculation is exposed through:

```js
getLegalMoves(state, player)
```

The rules module must not access the DOM or Canvas.

Game-level operations such as turn progression, route advancement, victory, and undo are coordinated by `game.js`.

### `ui.js`

Owns browser interaction and rendering.

Responsibilities:

- Draw the board and grid.
- Draw arrow fields and special field symbols.
- Draw player pieces and route markers.
- Display current goals and player progress.
- Render player mini-maps.
- Handle pointer and drag-and-drop interaction.
- Highlight legal destinations according to the display setting.
- Refresh the visual state after moves, undo, and new games.

The UI submits requested moves to `Game`.

It must not independently decide whether a move is legal.

Temporary interaction state, such as the currently dragged piece, belongs to the UI and not to the game state.

## 4. Game State

The game state must contain the information necessary to reconstruct a position and continue the game.

The following is a conceptual example, not the literal object layout of the current implementation:

```js
{
    ruleset: "current",

    board: [...],

    players: {
        orange: {
            x: 4,
            y: 7,
            reached: 0
        },

        blue: {
            x: 3,
            y: 7,
            reached: 0
        }
    },

    currentPlayer: "orange",

    gameOver: false,
    winner: null,

    history: [...]
}
```

The current implementation keeps the ruleset configuration on the `Game` instance and derives goals from the configured player routes.

Each player's route is an ordered list of positions. The player's `reached` value tracks progress through that route. The final route entry is the player's final target; earlier entries, when present, are intermediate waypoints.

Undo history preserves the information needed to restore the previous game state.

The precise internal representation may evolve, but the following principles should remain:

- Game state is independent of presentation.
- Game rules operate on game coordinates.
- Route progression is deterministic.
- Rendering does not modify game state.

## 5. Board Coordinates

Game coordinates are independent of Canvas coordinates.

The current rulesets use an 8×8 board:

```text
x = 0..7
y = 0..7
```

The UI converts between game coordinates and pixel coordinates.

```text
Canvas coordinates
        │
        │ point(X, Y)
        ▼
Game coordinates
        │
        │ cell-centre calculation
        ▼
Canvas coordinates
```

No Canvas pixel values should appear inside `rules.js` or the game rules.

Board-boundary checks should use the applicable board size rather than assume that every future board must be 8×8.

## 6. Movement API

The central operation is the game's move operation.

Conceptually:

```js
game.move(from, to);
```

The Game Core is responsible for:

1. Verifying that the game accepts another move.
2. Verifying that the move belongs to the current player.
3. Verifying the player's origin position.
4. Calculating the legal destinations.
5. Rejecting an illegal destination.
6. Updating the player's position.
7. Updating route progress if a goal has been reached.
8. Checking for victory or a blocked-player loss.
9. Advancing the turn when appropriate.
10. Recording sufficient history for undo.

The UI must not duplicate these operations. It requests a move and subsequently renders the resulting state.

The public API should remain the only supported route for applying moves to the live game.

## 7. Legal Move Calculation

The rules engine exposes:

```js
getLegalMoves(state, player);
```

The movement rule is unusual: the directions available to a player are determined by the tile currently occupied by the opponent.

The calculation is conceptually:

```text
Opponent position
        │
        ▼
Opponent's board tile
        │
        ▼
Tile movement behaviour
        │
        ├── ANY: all eight directions
        │
        ├── arrows: directions in the mask
        │
        └── blocked: no movement directions
        │
        ▼
Candidate destinations
        │
        ├── remove off-board positions
        ├── remove opponent's square
        └── remove blocked destinations
        │
        ▼
Legal destinations
```

The implementation must also account for the current game state.

Legal-move calculation should be deterministic for a given state and player.

It is particularly important that future clients and the computer opponent use this same implementation rather than create their own copies of the movement rules.

## 8. Drag and Drop

Drag and drop belongs entirely to the UI layer.

The UI maintains temporary drag state, conceptually:

```js
{
    active: true,
    player: "orange",
    from: { x: 4, y: 7 },
    pointer: { x: 381, y: 492 }
}
```

This is UI state, not Game State.

The interaction sequence is:

```text
pointerdown
    │
    ▼
Identify board square
    │
    ▼
Identify player's piece
    │
    ├── wrong piece → reject
    │
    ▼
Begin drag
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
Convert pointer to board square
    │
    ▼
game.move(from, to)
    │
    ├── success → render new state
    │
    └── failure → restore visual position
```

The piece follows the pointer while being dragged. It is snapped back to its original position if the move is rejected.

Changing the ruleset or starting a new game must also clear any stale drag state.

## 9. Rendering

Rendering is based on the current game state and temporary UI state.

The renderer draws, approximately in this order:

1. Board background.
2. Grid.
3. Board-field symbols.
4. Arrow combinations.
5. Start, waypoint, and target markers.
6. Current-goal indicators.
7. Legal-move highlights.
8. Player pieces.
9. Dragged piece, if active.
10. Optional visual overlays.

Field symbols represent different concepts:

- Arrow fields display their movement directions.
- `ANY` fields remain visually blank.
- Blocked fields display an X.
- Unvisited waypoints and targets display a target symbol.
- Visited waypoints retain a visual indication of progress.

A tile's visual representation is derived from its movement behaviour and roles. The renderer must not use a field's appearance as a substitute for its actual game rules.

The UI also displays the players' route progress using mini-maps.

Rendering must not modify the Game State.

## 10. Animation

Animations are presentation concerns.

Examples include:

- Pulsing current-goal indicators.
- Dragged-piece movement.
- Invalid-move feedback.
- Successful-move transitions.

Animations must not alter game rules or coordinates stored by the Game Core.

The Canvas renderer may eventually be replaced without changing the game logic.

## 11. Undo

Undo belongs to the Game Core.

The UI requests an undo operation and then refreshes the display.

The history mechanism must preserve sufficient information to restore:

- Both player positions.
- Route progress.
- The current player.
- Game-over state.
- Winner.
- Any other state needed to reproduce the previous position.

Undo must not retain stale UI interaction state, such as an active drag.

Correctness and clarity are more important than minimizing history memory usage at this stage.

## 12. New Game and Ruleset Changes

The UI requests a new game through the Game API.

Conceptually:

```js
game.newGame({
    starterMode: "alternate",
    boardMode: "random"
});
```

The current implementation supports configurable starting-player selection and board creation behaviour.

A new game:

- Initializes or reuses the board according to the selected board mode.
- Resets both players to their configured starting positions.
- Resets route progress.
- Clears undo history.
- Clears victory state.
- Determines the starting player.

Changing the ruleset is a separate operation.

A ruleset change must:

- Apply the selected ruleset configuration.
- Generate a fresh board.
- Reset the game state and route progress.
- Clear undo history.
- Preserve the intended starting-player selection behaviour.
- Clear temporary UI interaction state.
- Refresh the rendered board.

The UI asks for confirmation before discarding the current game when the ruleset changes. Cancelling the confirmation must leave the current game unchanged.

## 13. Separation of Concerns

The intended dependencies are:

```text
main.js
   │
   ├── game.js
   └── ui.js
          │
          └── Canvas / DOM

game.js
   │
   ├── rulesets.js
   ├── board.js
   └── rules.js

board.js
   │
   └── rulesets.js
```

The following dependencies must not exist:

```text
rules.js  → Canvas       NO
rules.js  → DOM          NO
board.js  → Canvas       NO
game.js   → DOM          NO
game.js   → Pointer API  NO
```

The Game Core should be executable independently of browser presentation APIs.

The current POC uses direct script loading, so the dependency structure is enforced by code organization and script order rather than an ES module system.

## 14. Future Computer Opponent

The original game contains a computer opponent with nine difficulty levels.

The next major planned feature is a computer player using minimax search with alpha–beta pruning.

The intended architecture is:

```text
Computer Player
       │
       ├── reads a game position
       ├── obtains legal moves
       ├── explores hypothetical future positions
       ├── evaluates candidate outcomes
       └