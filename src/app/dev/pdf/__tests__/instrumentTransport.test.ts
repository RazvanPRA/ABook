import { createWebViewTransport } from '@/services/pdf';
import { instrumentTransport } from '../instrumentTransport';

describe('instrumentTransport', () => {
  it('times each request type from post to its response, and uninstalls', () => {
    const transport = createWebViewTransport();
    const posted: string[] = [];
    const received: string[] = [];
    transport.mount();
    transport.attach(message => posted.push(message));
    transport.listen({ message: raw => received.push(raw), failure: () => {} });
    const meter = instrumentTransport(transport);

    transport.post('{"type":"get-pages","requestId":"r1"}');
    transport.receive('{"type":"pages","requestId":"r1"}');
    transport.receive('{"type":"ready","requestId":null}');
    transport.receive('not json');
    expect(posted).toHaveLength(1);
    expect(received).toHaveLength(3);
    expect(meter.timings['get-pages']).toMatchObject({ count: 1 });

    meter.reset();
    expect(meter.timings).toEqual({});
    meter.uninstall();
    transport.post('{"type":"open","requestId":"r2"}');
    expect(meter.timings).toEqual({});
  });
});
