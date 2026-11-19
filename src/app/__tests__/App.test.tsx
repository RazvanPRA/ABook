import React from 'react';
import BootSplash from 'react-native-bootsplash';
import { act, render, screen } from '@testing-library/react-native';
import type { BootSnapshot } from '@/repositories';
import { App } from '../App';
import { fakeServices, withBoot } from '../__fixtures__/fakeServices';

beforeEach(() => jest.mocked(BootSplash.hide).mockClear());

test('opens on the Library tab with the three Romanian tab labels', async () => {
  await render(<App services={fakeServices().services} />);
  expect(await screen.findByTestId('screen-library')).toBeOnTheScreen();
  for (const label of ['Bibliotecă', 'Ascultă', 'Setări']) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
});

test('keeps the splash and renders no screen until bootstrap has finished', async () => {
  const { services } = fakeServices();
  let finish: (snapshot: BootSnapshot) => void = () => {};
  const slow = withBoot(services, {
    loadSnapshot: () =>
      new Promise<BootSnapshot>(resolve => {
        finish = resolve;
      }),
  });
  const real = await services.bootRepository.loadSnapshot();

  await render(<App services={slow} />);
  expect(screen.queryByTestId('screen-library')).toBeNull();
  expect(BootSplash.hide).not.toHaveBeenCalled();

  await act(async () => finish(real));
  expect(await screen.findByTestId('screen-library')).toBeOnTheScreen();
  expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true });
});

test('still opens, and hides the splash, when storage cannot be read', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const broken = withBoot(fakeServices().services, {
    migrate: () => Promise.reject(new Error('disk')),
    loadSnapshot: () => Promise.reject(new Error('disk')),
  });
  await render(<App services={broken} />);
  expect(await screen.findByTestId('screen-library')).toBeOnTheScreen();
  expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true });
  warn.mockRestore();
});
