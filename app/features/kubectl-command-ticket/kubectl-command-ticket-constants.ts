/** Hardcoded per the current ticket form scope: this ticket type only ever
 * targets the "KUBERNATES" department. Set authoritatively both in the UI
 * (disabled input) and in the route handler (overriding whatever the client
 * sends), so a direct API call can't spoof it either. */
export const KUBECTL_COMMAND_TICKET_DEPARTMENT = "KUBERNATES";
