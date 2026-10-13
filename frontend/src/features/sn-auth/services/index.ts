// Auth calls live in the session store (src/core/stores/session.store.ts) so the shell, guards and pages share one session.
export { useSessionStore } from "@/core/stores/session.store";
