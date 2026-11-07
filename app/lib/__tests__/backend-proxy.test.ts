import { afterEach, describe, expect, it, vi } from 'vitest';

import { AUTH_COOKIE_NAME } from '@/app/lib/auth-cookie';
import { apiError, apiOk, apiResponse } from '@/test/mocks/ticket-hub';

import {
	extractErrorMessage,
	forwardBackendResponse,
	getAuthToken,
	invalidTicketNumberResponse,
	isValidTicketNumber,
	readBackendBody,
} from '../backend-proxy';

const cookieGet = vi.fn();

vi.mock('next/headers', () => ({
	cookies: () => Promise.resolve({ get: cookieGet }),
}));

afterEach(() => {
	vi.clearAllMocks();
});

describe('extractErrorMessage', () => {
	it('returns the envelope msg', () => {
		expect(extractErrorMessage({ msg: 'boom' }, 'fb')).toBe('boom');
	});

	it('falls back when there is no msg or no body', () => {
		expect(extractErrorMessage({}, 'fb')).toBe('fb');
		expect(extractErrorMessage({ msg: '' }, 'fb')).toBe('fb');
		expect(extractErrorMessage(null, 'fb')).toBe('fb');
		expect(extractErrorMessage(undefined, 'fb')).toBe('fb');
	});
});

describe('getAuthToken', () => {
	it('returns the cookie token', async () => {
		cookieGet.mockReturnValue({ value: 'tok' });

		expect(await getAuthToken()).toEqual({ token: 'tok' });
		expect(cookieGet).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
	});

	it('returns a 401 response when the cookie is missing', async () => {
		cookieGet.mockReturnValue(undefined);

		const result = await getAuthToken();

		expect(result.token).toBeUndefined();
		expect(result.unauthorized?.status).toBe(401);
		expect(await result.unauthorized?.json()).toEqual({
			message: 'No autenticado.',
		});
	});
});

describe('isValidTicketNumber / invalidTicketNumberResponse', () => {
	it.each(['0', '7', '12345'])('accepts %j', (value) => {
		expect(isValidTicketNumber(value)).toBe(true);
	});

	it.each(['', 'abc', '-1', '1.5', '1/2', '7?x=1', ' 7', '7\n', '../1', '1#x'])(
		'rejects %j',
		(value) => {
			expect(isValidTicketNumber(value)).toBe(false);
		},
	);

	it('builds a 400 response', async () => {
		const res = invalidTicketNumberResponse();

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({
			message: 'El número de ticket es inválido.',
		});
	});
});

describe('readBackendBody', () => {
	it('parses JSON', async () => {
		expect(await readBackendBody(new Response('{"a":1}'))).toEqual({ a: 1 });
	});

	it('returns null for a non-JSON body', async () => {
		expect(await readBackendBody(new Response('<html>'))).toBeNull();
		expect(await readBackendBody(new Response(''))).toBeNull();
	});
});

describe('forwardBackendResponse', () => {
	it('unwraps the envelope data and keeps the status', async () => {
		const res = await forwardBackendResponse(apiOk([{ number: 1 }], 201), 'fb');

		expect(res.status).toBe(201);
		expect(await res.json()).toEqual([{ number: 1 }]);
	});

	it("maps envelope errors to { message } with the backend's status", async () => {
		const res = await forwardBackendResponse(apiError('x, y', 400), 'fb');

		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ message: 'x, y' });
	});

	it('uses the fallback when an error body is not JSON', async () => {
		const res = await forwardBackendResponse(new Response('<html>', { status: 503 }), 'fb');

		expect(res.status).toBe(503);
		expect(await res.json()).toEqual({ message: 'fb' });
	});

	it('returns 502 with the fallback when an OK body is not JSON', async () => {
		const res = await forwardBackendResponse(new Response('oops', { status: 200 }), 'fb');

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ message: 'fb' });
	});

	it('returns 502 when an OK body is not an envelope or has no data', async () => {
		for (const body of [
			{ data: [1] },
			{ ok: true, msg: 'OK', data: null },
			{ ok: false, msg: 'no', data: null },
		]) {
			const res = await forwardBackendResponse(apiResponse(body), 'fb');

			expect(res.status).toBe(502);
		}
	});
});
