/**
 * Envelope answered by every backend endpoint except `GET /health`:
 * `{ ok: true, msg, data }` on success and `{ ok: false, msg, data: null }` on error.
 */
export interface ApiEnvelope<T> {
	ok: boolean;
	msg: string;
	data: T | null;
}
