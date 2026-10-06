/** Hardcoded per the current ticket form scope: this ticket type only ever
 * targets the "KUBERNATES" department and the "default" namespace. Set
 * authoritatively both in the UI (disabled inputs) and in the route handler
 * (overriding whatever the client sends), so a direct API call can't spoof
 * them either. There's no backend capability yet to list available
 * namespaces, so this stays fixed until that's built. */
// Spelling mirrors the backend contract (ticket-hub-api `Role.KUBERNATES` /
// `KUBERNATES_APPROVER`); do not "fix" it here without changing the backend.
export const KUBERNETES_MANIFEST_TICKET_DEPARTMENT = "KUBERNATES";
export const KUBERNETES_MANIFEST_TICKET_NAMESPACE = "default";
