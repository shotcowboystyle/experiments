import type { PanInfo } from 'motion/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import './stats-widget.css';

interface Fund {
  value: string;
  change: number;
  label: string;
}

interface FundWidgetProps {
  /**
   * The array which contains all the funds with their value, changes, and label.
   */
  funds?: Fund[];

  /**
   * Class name for the background element.
   */
  backgroundClassName?: string;

  /**
   * Class name for the container element.
   */
  containerClassName?: string;
}

export default function FundWidget({
  containerClassName,
  funds = [
    { change: 12, label: 'Stocks', value: '2.7Cr' },
    { change: -8, label: 'Funds', value: '3.5Cr' },
    { change: 6, label: 'Deposits', value: '1.2Cr' },
  ],
}: FundWidgetProps) {
  const len = funds.length;

  const [[activeDiv, direction], setDirection] = useState([0, 0]);
  const [dragDistance, setDragDistance] = useState(0);

  // Reset dragDistance after the drag ends to remove blur/rotate effects
  useEffect(() => {
    if (dragDistance !== 0) {
      const timer = setTimeout(() => {
        setDragDistance(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [dragDistance]);

  const sliderVariants = {
    active: { opacity: 1, scale: 1, y: 0 },
    exit: (newDirection: number) => ({
      opacity: 0.2,
      scale: 1,
      y: newDirection > 0 ? '100%' : '-100%',
    }),
    incoming: (newDirection: number) => ({
      opacity: 0,
      scale: 1,
      y: newDirection > 0 ? '100%' : '-100%',
    }),
  };

  const sliderTransition = {
    duration: 0.5,
    ease: [0.56, 0.03, 0.12, 1.04] as [number, number, number, number],
  };

  const swipeToAction = (newDirection: number) => {
    const newDiv = activeDiv + newDirection;
    if (newDiv < 0 || newDiv >= len) {
      return;
    }

    setDirection([newDiv, direction]);
  };

  const dragHandler = (dragInfo: PanInfo) => {
    const dragDistanceY = dragInfo.offset.y;
    const swipeThreshold = 20;

    // Only swipe down if not at the first div (activeDiv !== 0)
    if (dragDistanceY > swipeThreshold) {
      swipeToAction(-1);
    }
    // Only swipe up if not at the last div (activeDiv !== len - 1)
    else if (dragDistanceY < -swipeThreshold) {
      swipeToAction(1);
    }

    setDragDistance(0);
  };

  const skipToDiv = (divId: number) => {
    let changeDirection = 1;
    if (divId > activeDiv) {
      changeDirection = 1;
    } else if (divId < activeDiv) {
      changeDirection = -1;
    }
    setDirection([divId, changeDirection]);
  };

  const blurValue = Math.min(Math.abs(dragDistance / 20), 10);
  const rotateYValue = Math.min(dragDistance / 10, 15);

  return (
    <div className={containerClassName ? `stats-widget ${containerClassName}` : 'stats-widget'}>
      <AnimatePresence initial={false}>
        <div className="stats-widget-stack">
          <div className="stats-widget-card">
            <motion.div
              key={activeDiv}
              custom={direction}
              className="stats-widget-slide"
              variants={sliderVariants}
              initial="incoming"
              animate="active"
              transition={sliderTransition}
              drag="y"
              dragConstraints={{ bottom: 0, top: 0 }}
              dragElastic={1}
              onDragEnd={(_, dragInfo) => dragHandler(dragInfo)}
              onDrag={(_event, info) => setDragDistance(info.offset.y)}
              style={{
                filter: `blur(${blurValue}px)`,
                transform: `rotateY(${rotateYValue}deg)`,
              }}
            >
              <div className="stats-widget-content">
                <h1 className="stats-widget-value">{funds[activeDiv].value}</h1>
                {funds[activeDiv].change < 0 ? (
                  <h2
                    className="stats-widget-change"
                    data-negative
                  >
                    {funds[activeDiv].change}% &#8595;
                  </h2>
                ) : (
                  <h2 className="stats-widget-change">{funds[activeDiv].change}% &#8593;</h2>
                )}
                <h1 className="stats-widget-label">{funds[activeDiv].label}</h1>
              </div>
            </motion.div>
            <div className="stats-widget-dots">
              {funds.map((_, index) => (
                <motion.span
                  key={index}
                  className="stats-widget-dot"
                  data-active={index === activeDiv || undefined}
                  initial={{ height: 8 }}
                  animate={{ height: index === activeDiv ? 30 : 8 }}
                  onClick={() => skipToDiv(index)}
                ></motion.span>
              ))}
            </div>
          </div>
          <div className="stats-widget-shelf"></div>
        </div>
      </AnimatePresence>
    </div>
  );
}
