# Functional Requirements

## Purpose
Define the required behavior for a TODO app that lets users create tasks, complete tasks, and reorder tasks.

## Scope
- In scope: task creation, task completion UI state, and drag-and-drop reordering.
- Out of scope: user accounts, reminders, due dates, and collaboration.

## User Roles
- Standard User: creates and manages a personal list of TODO items.

## Functional Requirements
1. FR-001: Create a TODO item
   - Description: Users can add a new TODO item by entering text and submitting it.
   - Priority: Must Have
   - Acceptance Criteria:
     - A text input and add action are available to the user.
     - Submitting valid text creates a new TODO item in the list.
     - The new TODO appears immediately in the current list order.

2. FR-002: Mark a TODO item as done
   - Description: Users can mark a TODO item as complete and visually distinguish it from active items.
   - Priority: Must Have
   - Acceptance Criteria:
     - Each TODO item has a control to toggle completion status.
     - When marked as done, the TODO text is shown with strikethrough styling.
     - When marked as done, the TODO item appears slightly faded compared to active items.
     - Toggling again restores the normal (not done) appearance.

3. FR-003: Reorder TODO items via drag-and-drop
   - Description: Users can drag TODO items and drop them in a different position in the list.
   - Priority: Must Have
   - Acceptance Criteria:
     - Users can drag any TODO item to a new position.
     - Dropping an item updates the list order immediately.
     - The reordered list remains in the new order during the current session.

## Assumptions
- Users manage a single TODO list.
- Basic pointer or touch interactions are available for drag-and-drop.

## Constraints
- Completion styling must include both strikethrough and reduced visual emphasis (faded look).
- Reordering must be done through drag-and-drop interaction.

## Dependencies
- Frontend support for drag-and-drop interactions.

## Open Questions
- Should TODO list order persist after page reloads?
- Should empty TODO submissions be blocked with validation feedback?
