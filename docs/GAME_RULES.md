# Trippples — Game Rules

## 1. Overview

Trippples is a two-player board game played on an 8×8 board.

Each player starts on their own start square and must travel around four fixed parcours squares in a specific order before reaching the opponent's start square. The first player to reach the opponent's start square wins.

The original Amiga implementation, `Tripppin` by Paul Kienitz, was reconstructed from the author's memory of the game. It is therefore treated as a valuable implementation reference, but not necessarily as an authoritative transcription of the original commercial rules.

This document defines the rules currently used as the basis for the modern POC.

---

## 2. Board

The board consists of **64 squares arranged as 8×8**.

There are four kinds of squares:

| Type               | Count | Description                                                  |
| ------------------ | ----: | ------------------------------------------------------------ |
| Arrow squares      |    56 | Each contains exactly three of the eight possible directions |
| ANY squares        |     2 | All legal directions are potentially available               |
| Parcours squares   |     4 | Fixed goal/checkpoint squares                                |
| Start/goal squares |     2 | Starting square for one player and final goal for the other  |

The four parcours squares are fixed at:

```text
(1,1)   (6,1)
(1,6)   (6,6)
```

The two start/goal squares are:

```text
Orange start / Blue final goal:  (4,7)
Blue start / Orange final goal:  (3,7)
```

Coordinates are zero-based:

* `x = 0..7`, from left to right
* `y = 0..7`, from top to bottom

---

## 3. Arrow Directions

Each arrow square contains three directions selected from the eight possible neighbouring directions.

The directions are indexed as follows:

```text
       0 N
       ↑
  7 NW   NE 1

  6 W     E 2

  5 SW   SE 3
       ↓
       4 S
```

The 56 arrow squares contain the complete set of all combinations of three directions chosen from eight:

```text
C(8,3) = 56
```

The two remaining random board positions are `ANY` squares.

---

## 4. Board Generation

At the beginning of a new game:

1. The 56 possible three-direction combinations are placed into a deck.
2. Two `ANY` entries are added.
3. The resulting 58 entries are shuffled.
4. They are distributed randomly over all board squares except the six fixed special squares.
5. The four parcours squares and two start/goal squares remain fixed.

Therefore every newly generated board contains:

* 56 arrow combinations
* 2 random `ANY` squares
* 4 fixed parcours squares
* 2 fixed start/goal squares

The current POC should use random board generation.

A deterministic/random-seed option may be added later for testing and debugging.

---

## 5. Players

There are two players:

* **Orange**
* **Blue**

Their initial positions are:

```text
Orange: (4,7)
Blue:   (3,7)
```

The players occupy their own start/goal square at the beginning of the game.

A player may never occupy the same square as the other player.

---

## 6. Parcours

Before reaching the opponent's start square, each player must visit all four parcours squares in a specific order.

The players travel in opposite directions.

### Orange

Orange starts at `(4,7)` and must reach:

```text
1. (6,6)
2. (6,1)
3. (1,1)
4. (1,6)
5. (3,7)  ← Blue's start square
```

### Blue

Blue starts at `(3,7)` and must reach:

```text
1. (1,6)
2. (1,1)
3. (6,1)
4. (6,6)
5. (4,7)  ← Orange's start square
```

A parcours square only counts when it is reached as the player's **current required goal**.

Reaching another parcours square out of order does not advance the player's goal.

---

## 7. Current Goal

Each player has a current goal.

Initially:

```text
Orange → (6,6)
Blue   → (1,6)
```

After reaching a goal, the next goal is activated immediately.

After the fourth parcours square has been reached, the opponent's start square becomes the player's final goal.

The UI should clearly indicate the current goal. The original Amiga implementation used a blinking `X`; the POC should retain this concept.

---

## 8. Movement

A move consists of moving a player's piece exactly **one square** horizontally, vertically, or diagonally.

A player may therefore move to any of the eight neighbouring squares, subject to the movement rules below.

There is no multi-square movement.

---

## 9. The Defining Movement Rule

The directions available to a player are determined by the **square currently occupied by the opponent**.

If Orange is moving, the arrows on Blue's current square determine Orange's possible movement directions.

If Blue is moving, the arrows on Orange's current square determine Blue's possible movement directions.

Conceptually:

```text
Player to move
      │
      ▼
Look at opponent's square
      │
      ▼
Read its direction mask
      │
      ▼
Determine legal neighbouring squares
```

This is the central mechanic of Trippples.

---

## 10. `ANY` Squares

An `ANY` square permits movement in every direction that would otherwise be legal.

However, `ANY` does **not** override the normal board boundaries or the restriction against moving onto the opponent.

Therefore an `ANY` square does not necessarily provide eight legal moves.

For example, if the opponent is on the edge of the board, some directions may lead outside the board and are therefore unavailable.

---

## 11. Move Legality

A move is legal if all of the following are true:

1. The destination is directly adjacent to the player's current position.
2. The corresponding direction is allowed by the opponent's current square.
3. The destination lies within the 8×8 board.
4. The destination is not occupied by the opponent.

A player may not move more than one square.

---

## 12. No Legal Move

If the player whose turn it is has no legal move, that player loses.

The opponent wins.

The game is therefore also terminated when a player is completely blocked.

---

## 13. Winning

A player wins when they reach the opponent's start square **after completing all four required parcours goals**.

Thus a complete winning route consists of:

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
Opponent's start
   ↓
WIN
```

The opponent's start square is both:

* the starting position of one player
* the final goal of the other player

---

## 14. Turn Order

Players alternate turns.

The original implementation alternated the starting player between successive games.

The POC should initially preserve this behaviour.

A new game therefore does not necessarily always start with Orange.

---

## 15. Drag & Drop Interaction

The original Amiga implementation used direct manipulation of the pieces.

The POC should preserve this interaction model.

### Start drag

The player presses/touches their own piece.

If the piece does not belong to the player whose turn it is, the drag is rejected.

### During drag

The piece follows the pointer freely.

The piece is not restricted to board-cell centres while being dragged.

### End drag

When the pointer is released:

1. The pointer position is converted to a board square.
2. The requested move is submitted to the Game Core.
3. If the move is legal, the move is committed.
4. If the move is illegal, the piece returns to its original square.

The UI must not implement the movement rules itself.

---

## 16. Undo

The game supports taking back moves.

For Human vs Human, one invocation of Undo reverses the previous move.

For Human vs Computer, a later implementation may undo the computer's preceding move together with the human's move, matching the behaviour of the original implementation.

Undo must restore all relevant game state, including:

* player position
* current goal
* number of completed parcours goals
* current player
* game-over state

---

## 17. New Game

Starting a new game:

1. Generates a new randomized board.
2. Resets both players to their start squares.
3. Resets their completed-goal counters.
4. Restores their first parcours goals.
5. Clears the move history.
6. Clears the game-over state.
7. Determines the starting player.

---

## 18. Features Not Required for the Initial POC

The following features existed in the original implementation but are deliberately outside the first Human-vs-Human POC:

* Computer opponent
* Difficulty levels 1–9
* Suggest Move
* Loop-prevention option
* Computer move animation/thinking delay
* Advanced graphical effects
* Sound effects

They should be added later without changing the core movement rules.

---

## 19. Rule vs. Implementation Notes

The following distinction is important:

### Core game rules

These belong in the Game Core:

* board structure
* arrow directions
* `ANY`
* player positions
* movement legality
* parcours sequence
* current goals
* victory
* blocked-player loss
* turn order
* undo state

### Presentation

These belong in the UI:

* Canvas drawing
* colours
* piece appearance
* blinking/pulsing goal marker
* drag animation
* move highlights
* menus and buttons
* sounds

The Game Core must remain independent of Canvas and browser APIs.
