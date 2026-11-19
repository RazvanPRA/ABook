import React, {
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react';
import type { AppServices } from '../dependencies';

const ServicesContext = createContext<AppServices | null>(null);

/**
 * The services `App` was given, for `app/`-level screens (dev tools). Features never use this:
 * they reach repositories only through thunks' `extra` argument.
 */
export function ServicesProvider({
  services,
  children,
}: PropsWithChildren<{ services: AppServices }>) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

export const useAppServices = (): AppServices => {
  const services = useContext(ServicesContext);
  if (services === null) {
    throw new Error('useAppServices must be used inside ServicesProvider');
  }
  return services;
};
