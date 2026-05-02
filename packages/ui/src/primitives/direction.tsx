import * as React from 'react';

type Direction = 'ltr' | 'rtl';

const DirectionContext = React.createContext<Direction>('ltr');

interface DirectionProviderProps {
  children: React.ReactNode;
  direction?: Direction;
}

function DirectionProvider({ children, direction = 'ltr' }: DirectionProviderProps) {
  return (
    <DirectionContext.Provider value={direction}>
      <div dir={direction}>{children}</div>
    </DirectionContext.Provider>
  );
}

function useDirection(): Direction {
  return React.useContext(DirectionContext);
}

export { DirectionProvider, useDirection, type Direction };
