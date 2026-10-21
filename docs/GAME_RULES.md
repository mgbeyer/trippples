# Trippples — Game Rules

## 1. Overview

Trippples is a two-player board game played on an 8×8 board.

The game has two rulesets:

- **Current Rules:** Each player must visit four fixed parcours squares in a prescribed order before reaching the opponent's start square.
- **Classic Rules:** Each player must reach the opponent's start square directly, without intermediate parcours goals. Four central squares are blocked.

In both rulesets, the defining mechanic is that the directions available to a player are determined by the square currently occupied by the opponent.

The original Amiga implementation, `Tripppin` by Paul Kienitz, was reconstructed from the author's memory of the game. It is therefore treated as a valuable implementation reference, but not necessarily as an authoritative transcription of the original commercial rules.

This document defines the rules implemented by the modern POC.

## 2. Board Coordinates and Tile Model

Both rulesets use an 8×8 board.

Coordinates are zero-based:

- `x = 0..7`, from left to right.
- `y = 0..7`, from top to bottom.

The board contains different kinds of tiles. It is important to distinguish a tile's **movement behaviour** from its **role in the game**.

### Movement behaviour

| Type | Description |
|---|---|
| `arrows` | Permits movement in the directions encoded by its direction mask. |
| `any` | Permits movement in all eight directions, subject to the normal movement restrictions. |
| `blocked` | Cannot be entered by a player. |

### Tile roles

| Role | Description |
|---|---|
| `start` | A player's starting position. |
| `parcours` | An intermediate goal used by Current Rules. |
| `target` | A final destination. |

A tile can have more than one role. In particular, each player's starting square is also the opponent's final target in Current Rules.

Start, parcours, and target roles do not themselves restrict movement. In the current implementation, these tiles have `any` movement behaviour.

The UI displays the different tile types and roles using appropriate symbols. Their visual appearance does not determine their game behaviour.

## 3. Arrow Directions

Each arrow tile contains three directions selected from the eight possible neighbouring directions.

The direction indices are:

```text
       0 N
       ↑
  7 NW   NE 1

  6 W     E 2

  5 SW   SE 3
       ↓
       4 S
```

The board contains all possible combinations of three directions chosen from eight:

\[
\binom{8}{3} = 56
\]

Each combination appears exactly once on a generated board.

The direction mask determines which neighbouring squares are candidates for movement when the opponent occupies that tile.

## 4. Rulesets and Board Configuration

### 4.1 Current Rules

Current Rules use the following configuration:

| Tile type or role | Count |
|---|---:|
| Arrow combinations | 56 |
| Ordinary `ANY` tiles | 2 |
| Fixed parcours positions | 4 |
| Start/target positions | 2 |
| **Total** | **64** |

The four parcours positions are fixed:

```text
(1,1)   (6,1)
(1,6)   (6,6)
```

The start/target positions are:

```text
Orange start / Blue final target: (4,7)
Blue start / Orange final target: (3,7)
```

The parcours tiles and start/target tiles have `any` movement behaviour. The two ordinary `ANY` tiles are placed randomly.

### 4.2 Classic Rules

Classic Rules use the following configuration:

| Tile type or role | Count |
|---|---:|
| Arrow combinations | 56 |
| Ordinary `ANY` tiles | 0 |
| Blocked tiles | 4 |
| Start/target positions | 4 role assignments on 2 squares |
| **Total** | **64** |

The four blocked tiles occupy the centre of the board:

```text
(3,3)   (4,3)
(3,4)   (4,4)
```

The starting positions and final targets are:

```text
Orange start:       (0,7)
Orange final target: (7,0)

Blue start:         (7,7)
Blue final target:  (0,0)
```

There are no intermediate parcours goals in Classic Rules.

The starting squares are also the final targets of the opposing players.

### 4.3 Random Board Generation

At the beginning of a game requiring a new board:

1. The 56 unique three-direction combinations are generated.
2. The configured number of ordinary `ANY` entries is added.
3. The entries are shuffled.
4. The shuffled entries are assigned to the remaining board positions.
5. Fixed parcours, start/target, and blocked positions are applied according to the selected ruleset.

The number of randomly assigned entries is 58 in Current Rules and 56 in Classic Rules.

Each generated board must satisfy its ruleset configuration and contain every arrow combination exactly once.

The POC supports generating a new random board or reusing the current board when starting another game. Changing the ruleset always creates a new board.

A deterministic random seed may be introduced later for reproducible tests and debugging.

## 5. Players and Starting Positions

There are two players:

- **Orange**
- **Blue**

Their initial positions depend on the selected ruleset.

| Ruleset | Orange | Blue |
|---|---|---|
| Current Rules | `(4,7)` | `(3,7)` |
| Classic Rules | `(0,7)` | `(7,7)` |

Players may never occupy the same square.

## 6. Parcours — Current Rules Only

Before reaching the opponent's start square, each player must visit all four parcours squares in a specific order.

The players travel in opposite directions.

### Orange

Orange starts at `(4,7)` and must reach:

1. `(6,6)`
2. `(6,1)`
3. `(1,1)`
4. `(1,6)`
5. `(3,7)` — Blue's start square and Orange's final target.

### Blue

Blue starts at `(3,7)` and must reach:

1. `(1,6)`
2. `(1,1)`
3. `(6,1)`
4. `(6,6)`
5. `(4,7)` — Orange's start square and Blue's final target.

A parcours square counts only when it is reached as the player's **current required goal**.

Reaching another parcours square out of order does not advance the player's progress.

### Classic Rules

Classic Rules have no intermediate parcours goals. Each player must reach the opponent's final target directly.

## 7. Current Goal

Each player has an ordered route defined by the selected ruleset.

In Current Rules, the initial goals are:

```text
Orange → (6,6)
Blue   → (1,6)
```

After a player reaches the current goal, the next goal becomes active immediately.

After the fourth parcours square has been reached, the opponent's start square becomes the final goal.

In Classic Rules, each player's only goal is the opponent's start square.

The UI must clearly indicate the current goal. Unvisited waypoints and targets use a target symbol; visited parcours squares retain a visual indication of progress.

The original Amiga implementation used a blinking `X` for the current goal. The POC uses a distinct target-style marker, while the X symbol identifies blocked tiles.

## 8. Movement

A move consists of moving a player's piece exactly one square horizontally, vertically, or diagonally.

There is no multi-square movement.

The destination must satisfy the movement rules described below.

## 9. The Defining Movement Rule

The directions available to a player are determined by the **square currently occupied by the opponent**.

If Orange is moving, the tile occupied by Blue determines Orange's possible movement directions.

If Blue is moving, the tile occupied by Orange determines Blue's possible movement directions.

Conceptually:

```text
Player to move
      │
      ▼
Opponent's position
      │
      ▼
Opponent's board tile
      │
      ▼
Tile movement behaviour
      │
      ▼
Candidate movement directions
```

For an arrow tile, the direction mask determines the available directions.

For an `ANY` tile, all eight directions are available as candidates.

A blocked tile cannot be occupied by a player during normal play. It therefore cannot serve as the opponent's current tile in a valid game position.

This is the central mechanic of Trippples.

## 10. `ANY` Tiles

An `ANY` tile permits movement in all eight directions that would otherwise be legal.

It does not override:

- Board boundaries.
- The restriction against occupying the opponent's square.
- The restriction against entering blocked tiles.

Consequently, an `ANY` tile does not necessarily provide eight legal moves.

Ordinary `ANY` tiles appear only in Current Rules. Start/target tiles have `any` movement behaviour in both rulesets.

## 11. Move Legality

A move is legal if all of the following conditions hold:

1. The destination is adjacent to the player's current position.
2. The direction is permitted by the opponent's current tile.
3. The destination lies within the board.
4. The destination is not occupied by the opponent.
5. The destination is not a blocked tile.
6. The move is valid in the current game state.

A player may not move more than one square.

The Game Core is responsible for calculating and validating legal moves. The UI must not implement a separate version of the movement rules.

## 12. No Legal Move

If the player whose turn it is has no legal move, that player loses and the opponent wins.

The game terminates when a player is completely blocked.

This rule applies to both rulesets.

## 13. Winning

### Current Rules

A player wins by reaching the opponent's start square after completing all four required parcours goals in order.

```text
Own start
   ↓
Parcours 1
   ↓
Parcours 2
   ↓
Parcours 3
   ↓
Parcours 4
   ↓
Opponent's start square
   ↓
WIN
```

The opponent's start square is both a starting position and the other player's final target.

### Classic Rules

A player wins by reaching the opponent's start square directly.

There are no intermediate goals.

In either ruleset, a player cannot win by reaching the final target before completing any required intermediate goals.

## 14. Turn Order

Players alternate turns.

The POC supports the following starting-player choices:

- Alternate between Orange and Blue for successive games.
- Always start with Orange.
- Always start with Blue.

The default mode alternates the starting player between successive games.

Changing the ruleset starts a new game and creates a new board. The selected starting-player setting is respected.

## 15. Drag and Drop Interaction

The POC uses direct manipulation of the pieces.

### Start drag

The player presses or touches their own piece.

If the piece does not belong to the player whose turn it is, the drag is rejected.

### During drag

The piece follows the pointer freely. Its visual position is not restricted to board-cell centres.

The UI may highlight legal destinations according to the selected display setting.

### End drag

When the pointer is released:

1. The pointer position is converted to a board square.
2. The requested move is submitted to the Game Core.
3. If the move is legal, it is committed.
4. If the move is illegal, the piece returns to its original square.

The UI must not independently decide whether a move is legal.

## 16. Undo

The game supports taking back moves.

In the current Human-vs-Human POC, one invocation of Undo reverses the previous move.

A future Human-vs-Computer implementation may undo the computer's preceding move together with the human's move, matching the behaviour of the original implementation.

Undo must restore all relevant game state, including:

- Player positions.
- Route progress and current goals.
- Current player.
- Game-over state.
- Winner.
- Any other state required to restore the previous position correctly.

## 17. New Game and Ruleset Changes

Starting a new game:

1. Generates a new random board or reuses the current board, according to the selected setting.
2. Resets both players to their configured starting positions.
3. Resets route progress.
4. Restores the initial goals.
5. Clears move history.
6. Clears the game-over state.
7. Determines the starting player.

Changing the ruleset:

1. Requests confirmation before discarding the current game.
2. Applies the newly selected ruleset.
3. Creates a fresh random board.
4. Resets both players and their route progress.
5. Clears move history and victory state.
6. Preserves the selected starting-player behaviour.
7. Refreshes the UI.

Cancelling the confirmation leaves the current game unchanged.

## 18. Features Outside the Current POC

The following features are deferred:

- Computer opponent.
- Minimax search and alpha–beta pruning.
- Difficulty levels 1–9.
- Suggest Move.
- Loop-prevention option.
- Computer move animation and thinking delay.
- Advanced graphical effects.
- Sound effects.
- Networking and online multiplayer.
- Android client.

These features should be added without duplicating or changing the underlying movement rules unless a deliberate ruleset change is intended.

## 19. Rules Versus Implementation

### Core game rules

These belong in the Game Core:

- Ruleset configuration.
- Board structure and movement masks.
- Player positions.
- Movement legality.
- Blocked-field restrictions.
- Route progression.
- Current goals.
- Victory and blocked-player loss.
- Turn order.
- Undo state.

### Presentation and interaction

These belong in the UI:

- Canvas drawing.
- Colours and piece appearance.
- Target and blocked-field symbols.
- Goal highlighting and animation.
- Drag-and-drop visuals.
- Legal-move highlighting.
- Mini-maps.
- Menus, buttons, and confirmation dialogs.
- Sound effects, if introduced later.

The Game Core must remain independent of Canvas, the DOM, and browser input APIs. Both future clients and the computer opponent should rely on the same underlying rules and state-transition logic.
