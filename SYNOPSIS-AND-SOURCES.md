# Trippples — Sources & Reference Material

## Synopsis

**Trippples** (deliberately spelled with three *p*s) is an abstract strategy board game from the early 1970s, designed by William T. Powers.

The game is played on an **8×8 board** containing tiles with three arrows. Each arrow points in one of the eight possible directions. The unusual central mechanic is that a player's available movement directions are determined by the tile occupied by the **opponent's piece**, rather than by the tile occupied by the player's own piece.

The game involves a combination of fixed and directional tiles, starting and destination positions, and a central neutral area. The exact setup and some rule details differ between surviving descriptions and later computer implementations.

For the POC, these sources will be used to reconstruct and verify the rules before implementation. Where sources disagree, the discrepancy will be documented rather than silently choosing one interpretation.

---

## Sources

### 1. Tripppin — Amiga implementation by Paul Kienitz

**[GitHub repository — paulkienitz/Tripppin](https://github.com/paulkienitz/Tripppin)**

The most relevant digital reference for this project.

`Tripppin` is an Amiga implementation of Trippples and includes source code as well as documentation describing the game and its implementation.

Useful information includes:

* board layout and special squares
* the 56 possible three-arrow combinations
* movement rules
* legal-move calculation
* the route towards the goal
* handling of blocked positions
* game flow and user interface
* historical information about the Amiga versions

The repository is particularly valuable because it provides an actual playable implementation rather than merely a textual description of the game.

**Important:** The author notes that parts of the implementation were reconstructed from his memory of the original game and therefore may not exactly reproduce the original rules.

---

### 2. BoardGameGeek — Trippples

**[BoardGameGeek — Trippples](https://boardgamegeek.com/boardgame/2040/trippples)**

A concise overview of the original commercial board game.

It provides useful confirmation of:

* the 8×8 board
* the three-arrow tiles
* the eight possible movement directions
* the 56 possible combinations
* the central/neutral area
* the basic movement concept
* the unusual rule that movement options are determined by the opponent's position

It is also useful for identifying the game's designer, publishers and historical editions.

---

### 3. Abstract Games — Issue 7

**[Abstract Games — Issue 7 (PDF)](https://www.abstractgames.org/uploads/1/1/6/4/116462923/abstract_games_issue_7.pdf)**

A historical article discussing Trippples and related abstract games.

It provides additional historical context and information about the original game, including:

* its early history
* the Benassi and Aladdin editions
* the structure of the board
* the 56 three-arrow combinations
* starting and destination squares
* the four blank/neutral tiles

This is particularly useful for comparing the original board design with later computer implementations.

---

### 4. Original Aladdin Rules — English Rulebook

**[Trippples — English rulebook (PDF)](https://tesera.ru/images/items/905121/Trippples%20ENG.pdf)**

A scan of the original English-language rule material.

This is the most important source for resolving detailed gameplay questions that are not covered by short online descriptions.

It covers, among other things:

* board setup
* movement
* special squares
* legal and illegal moves
* situations where a player has no legal move
* winning conditions
* optional rule variants

For the POC, this source should generally take precedence over later computer implementations when the rules differ.

---

### 5. Don's Game Closet — Game Rules

**[Don's Game Closet — Game Rules, T–U](https://www.donsgamecloset.com/GameRulesTpU.html)**

An additional historical reference listing Trippples rules and editions.

It is useful mainly as supporting historical evidence for the game's publication history and the different Aladdin editions.

It is not intended to be the primary source for reconstructing the gameplay rules.

---

## Source Priority for the POC

When reconstructing the rules, the sources will be considered in roughly this order:

1. **Original rulebook / historical material**
2. **Contemporary historical descriptions**
3. **Tripppin Amiga implementation**
4. **Other secondary descriptions and implementations**

`Tripppin` is nevertheless an especially valuable reference because it represents a complete computer implementation of the game and can help resolve practical details that are difficult to infer from the surviving rulebook alone.

Any unresolved differences between the original rules and `Tripppin` will be recorded explicitly in `GAME_RULES.md`.

---

## Open Questions

Before implementing the POC, the following points should be verified:

* Exact initial board layout
* Exact placement and number of neutral/blank squares
* Exact starting and destination positions
* Whether the board setup is fixed or randomized
* Exact movement distance and restrictions
* Treatment of occupied or blocked destination squares
* What happens when a player has no legal move
* Exact winning condition
* Whether any optional rules or variants should be supported
* Which rules were used by the historical Amiga/DOS implementations

The POC should implement **one clearly defined rule set**, with any
