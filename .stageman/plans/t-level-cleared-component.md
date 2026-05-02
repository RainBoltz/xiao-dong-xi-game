Plan is ready at `/Users/rainboltz/.claude/plans/plan-task-add-levelcleared-jsx-idempotent-eclipse.md`. Highlights:

- **One new file**: `src/components/LevelCleared.jsx`. No edits to `GameContainer.jsx`, no constants, no tests (repo has no test runner).
- **Reuses** the `ResultModal.jsx:29-39` gradient + spring transition for family-consistency, but renders a smaller centered card (no opaque backdrop, `pointer-events-none`) — clearly distinct from the Win/Lose modal.
- **No internal timer / `useEffect`**: component is a pure presentational `motion.div` with `initial / animate / exit`. The 1.5 s mount/unmount and the wrapping `AnimatePresence` belong to `t-game-container-fsm`.
- **Verification** is `npm run build` + a temporary dev-mode mount you revert before the PR (no Storybook in repo).
- **Flagged risk**: fade-out only fires once the parent task adds `<AnimatePresence>` around the mount — by design, but worth calling out on the PR.

Awaiting your approval.