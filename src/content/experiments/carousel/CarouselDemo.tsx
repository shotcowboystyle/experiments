import { useState } from 'react';

import Carousel, { DEFAULT_ITEMS } from './Carousel';

const CarouselDemo = (): React.JSX.Element => {
  const [baseWidth, setBaseWidth] = useState(300);
  const [autoplay, setAutoplay] = useState(false);
  const [autoplayDelay, setAutoplayDelay] = useState(3000);
  const [pauseOnHover, setPauseOnHover] = useState(false);
  const [loop, setLoop] = useState(false);
  const [round, setRound] = useState(false);

  // Held in state so Carousel's items memo only changes when the count does.
  const [items, setItems] = useState(DEFAULT_ITEMS);

  return (
    <div className="carousel-demo">
      <Carousel
        items={items}
        baseWidth={baseWidth}
        autoplay={autoplay}
        autoplayDelay={autoplayDelay}
        pauseOnHover={pauseOnHover}
        loop={loop}
        round={round}
      />

      <fieldset className="carousel-controls">
        <legend>Props</legend>
        <label>
          <span>items</span>
          <input
            type="range"
            min={1}
            max={DEFAULT_ITEMS.length}
            value={items.length}
            onChange={(e) => setItems(DEFAULT_ITEMS.slice(0, e.target.valueAsNumber))}
          />
          <output>{items.length}</output>
        </label>
        <label>
          <span>baseWidth</span>
          <input
            type="range"
            min={200}
            max={500}
            step={10}
            value={baseWidth}
            onChange={(e) => setBaseWidth(e.target.valueAsNumber)}
          />
          <output>{baseWidth}px</output>
        </label>
        <label>
          <span>autoplayDelay</span>
          <input
            type="range"
            min={500}
            max={10_000}
            step={250}
            value={autoplayDelay}
            disabled={!autoplay}
            onChange={(e) => setAutoplayDelay(e.target.valueAsNumber)}
          />
          <output>{autoplayDelay}ms</output>
        </label>
        <label>
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
          />
          <span>autoplay</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={pauseOnHover}
            disabled={!autoplay}
            onChange={(e) => setPauseOnHover(e.target.checked)}
          />
          <span>pauseOnHover</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
          />
          <span>loop</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={round}
            onChange={(e) => setRound(e.target.checked)}
          />
          <span>round</span>
        </label>
      </fieldset>
    </div>
  );
};

export default CarouselDemo;
