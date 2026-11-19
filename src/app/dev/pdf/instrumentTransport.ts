import type { WebViewTransport } from '@/services/pdf';

/** Per request type: count, total round trip, total time RN spent posting it. */
export interface BridgeTimings {
  [type: string]: {
    count: number;
    roundTripMs: number;
    postMs: number;
    receiveMs: number;
  };
}

const requestOf = (raw: string): { type: string; id: string } | null => {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === 'object' && value !== null) {
      const { type, requestId } = value as Record<string, unknown>;
      return { type: String(type), id: String(requestId) };
    }
  } catch {
    // not JSON: not timed
  }
  return null;
};

/**
 * Dev only: wraps the transport's `post` and `receive` to time every request (abook://dev/pdf).
 * Returns the live timings and a reset; `uninstall` restores the original methods.
 */
export function instrumentTransport(transport: WebViewTransport) {
  const timings: BridgeTimings = {};
  const sent = new Map<string, { type: string; at: number }>();
  const { post, receive } = transport;
  transport.post = message => {
    const started = Date.now();
    post(message);
    const request = requestOf(message);
    if (request) {
      const entry = (timings[request.type] ??= {
        count: 0,
        roundTripMs: 0,
        postMs: 0,
        receiveMs: 0,
      });
      entry.count += 1;
      entry.postMs += Date.now() - started;
      sent.set(request.id, { type: request.type, at: started });
    }
  };
  transport.receive = raw => {
    const response = requestOf(raw);
    const request = response && sent.get(response.id);
    if (request) {
      sent.delete(response.id);
      const entry = timings[request.type];
      if (entry) {
        entry.roundTripMs += Date.now() - request.at;
      }
    }
    const started = Date.now();
    receive(raw);
    const entry = request ? timings[request.type] : undefined;
    if (entry) {
      entry.receiveMs += Date.now() - started;
    }
  };
  return {
    timings,
    reset: () => Object.keys(timings).forEach(key => delete timings[key]),
    uninstall: () => {
      transport.post = post;
      transport.receive = receive;
    },
  };
}
