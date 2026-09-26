/** Hardcoded per the current ticket form scope: this ticket type only ever
 * targets the `database` namespace's "BASE_DE_DATOS" department. Set
 * authoritatively both in the UI (disabled inputs) and in the route handler
 * (overriding whatever the client sends), so a direct API call can't spoof
 * them either. */
export const DATABASE_TICKET_DEPARTMENT = "BASE_DE_DATOS";
export const DATABASE_TICKET_NAMESPACE = "database";
