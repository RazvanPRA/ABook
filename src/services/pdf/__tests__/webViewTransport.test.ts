import { createWebViewTransport } from '../extractor/webViewTransport';

function listening() {
  const transport = createWebViewTransport();
  const messages: string[] = [];
  const failures: string[] = [];
  const stop = transport.listen({
    message: raw => messages.push(raw),
    failure: reason => failures.push(reason),
  });
  return { transport, messages, failures, stop };
}

describe('createWebViewTransport', () => {
  it('starts with no WebView and gives every mount a new session', () => {
    const { transport } = listening();
    const onChange = jest.fn();
    transport.subscribe(onChange);
    expect(transport.session()).toBeNull();
    transport.mount();
    expect(transport.session()).toBe(1);
    transport.mount();
    expect(transport.session()).toBe(2);
    transport.unmount();
    expect(transport.session()).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('does not notify an unmount when nothing is mounted', () => {
    const { transport } = listening();
    const onChange = jest.fn();
    const unsubscribe = transport.subscribe(onChange);
    transport.unmount();
    expect(onChange).not.toHaveBeenCalled();
    unsubscribe();
    transport.mount();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('posts into the attached WebView, and reports a failure when none is attached', () => {
    const { transport, failures } = listening();
    const post = jest.fn();
    transport.mount();
    transport.post('early');
    expect(failures).toEqual(['WebView not attached']);
    const detach = transport.attach(post);
    transport.post('hello');
    expect(post).toHaveBeenCalledWith('hello');
    detach();
    transport.post('late');
    expect(post).toHaveBeenCalledTimes(1);
    expect(failures).toHaveLength(2);
  });

  it('drops the attached WebView on a new session, and an old detach leaves the new one', () => {
    const { transport, failures } = listening();
    const oldPost = jest.fn();
    const newPost = jest.fn();
    transport.mount();
    const detachOld = transport.attach(oldPost);
    transport.mount();
    transport.post('lost');
    expect(failures).toHaveLength(1);
    transport.attach(newPost);
    detachOld();
    transport.post('kept');
    expect(newPost).toHaveBeenCalledWith('kept');
    expect(oldPost).not.toHaveBeenCalled();
  });

  it('forwards messages and failures to the listeners until they unsubscribe', () => {
    const { transport, messages, failures, stop } = listening();
    transport.receive('{"type":"ready"}');
    transport.fail('render process gone');
    stop();
    transport.receive('ignored');
    expect(messages).toEqual(['{"type":"ready"}']);
    expect(failures).toEqual(['render process gone']);
  });
});
