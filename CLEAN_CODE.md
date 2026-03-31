# Clean Code Guidelines

This document serves as a guide for maintaining a readable, maintainable source code free of "junk code".

## Core Principles

### 1. Keep It Simple, Stupid (KISS)
*   **Avoid Overengineering**: Solve the current problem, not hypothetical future ones.
*   **YAGNI (You Aren't Gonna Need It)**: Do not add features "just in case".
*   **Readability**: Code should be easy to read for others (and for yourself in 6 months).

### 2. Delete Useless Code Without Fear
*   **No Commented-Out Code**: If it's not used, delete it. Use Version Control (**Git**) history to recover old code if needed.
*   **Remove Dead Variables and Functions**: Avoid clutter that distracts from the actual logic.

### 3. If You Need Comments, Refactor
*   **Self-Documenting Code**: Use descriptive variable and function names (e.g., `calculateTotalPrice()` instead of `calc()`).
*   **Avoid Redundancy**: Don't comment on the obvious. The "why" is more important than the "how" (if a comment is even necessary).

### 4. Don't Mix Refactors with Fixes
*   **Separation of Intent**: If you are fixing a bug, focus only on the bug.
*   **Isolated Refactoring**: Improve structure in a separate step to facilitate code reviews (PRs) and make reverts easier.

### 5. If You Can't Explain It Quickly, It's Wrong
*   **Single Responsibility**: A function or class should do one thing and do it well.
*   **Rubber Duck Technique**: If you struggle to explain the logic, it's a sign that it needs simplification or division.

### 6. Make It Work First, Optimize Later
*   **Correct Logic**: Ensure the code solves the problem reliably.
*   **Avoid Premature Optimization**: Don't sacrifice readability for milliseconds of performance unless there is a proven bottleneck.

### 7. Keep Commits Small or You're Hiding Something
*   **Atomic Commits**: A commit should represent a single logical change.
*   **Easy Reviews**: Small commits are faster to review and reduce the likelihood of serious conflicts.

---
*Let's keep the code clean and development agile.*
