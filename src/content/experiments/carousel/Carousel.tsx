'use client';

// replace icons with your own if needed
import { CircleIcon, CodeIcon, FileTypeIcon, LayersIcon, PanelsTopLeftIcon } from 'lucide-react';
import type { MotionValue, PanInfo, Transition } from 'motion/react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import './carousel.css';

export interface CarouselItem {
  title: string;
  description: string;
  id: number;
  icon: React.ReactElement;
}

export interface CarouselProps {
  items?: CarouselItem[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
}

export const DEFAULT_ITEMS: CarouselItem[] = [
  {
    description: 'Cool text animations for your projects.',
    icon: <FileTypeIcon className="carousel-icon" />,
    id: 1,
    title: 'Text Animations',
  },
  {
    description: 'Smooth animations for your projects.',
    icon: <CircleIcon className="carousel-icon" />,
    id: 2,
    title: 'Animations',
  },
  {
    description: 'Reusable components for your projects.',
    icon: <LayersIcon className="carousel-icon" />,
    id: 3,
    title: 'Components',
  },
  {
    description: 'Beautiful backgrounds and patterns for your projects.',
    icon: <PanelsTopLeftIcon className="carousel-icon" />,
    id: 4,
    title: 'Backgrounds',
  },
  {
    description: 'Common UI components are coming soon!',
    icon: <CodeIcon className="carousel-icon" />,
    id: 5,
    title: 'Common UI',
  },
];

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = {
  damping: 30,
  stiffness: 300,
  type: 'spring' as const,
};

interface CarouselItemProps {
  item: CarouselItem;
  index: number;
  itemWidth: number;
  round: boolean;
  trackItemOffset: number;
  x: MotionValue<number>;
  transition: Transition;
}

const CarouselCard = ({ item, index, itemWidth, round, trackItemOffset, x, transition }: CarouselItemProps) => {
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const outputRange = [90, 0, -90];
  const rotateY = useTransform(x, range, outputRange, { clamp: false });

  return (
    <motion.div
      className={`carousel-item ${round ? 'round' : ''}`}
      style={{
        height: round ? itemWidth : '100%',
        rotateY,
        width: itemWidth,
        ...(round && { borderRadius: '50%' }),
      }}
      transition={transition}
    >
      <div className={`carousel-item-header ${round ? 'round' : ''}`}>
        <span className="carousel-icon-container">{item.icon}</span>
      </div>
      <div className="carousel-item-content">
        <div className="carousel-item-title">{item.title}</div>
        <p className="carousel-item-description">{item.description}</p>
      </div>
    </motion.div>
  );
};

const Carousel = ({
  items = DEFAULT_ITEMS,
  baseWidth = 300,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false,
}: CarouselProps): React.JSX.Element => {
  const containerPadding = 16;
  const itemWidth = baseWidth - containerPadding * 2;
  const trackItemOffset = itemWidth + GAP;
  const itemsForRender = useMemo(() => {
    if (!loop) {
      return items;
    }
    return [...items.slice(-1), ...items, ...items.slice(0, 1)];
  }, [items, loop]);

  const [position, setPosition] = useState<number>(loop ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) {
      return;
    }
    if (pauseOnHover && isHovered) {
      return;
    }

    const timer = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1, itemsForRender.length - 1));
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  useEffect(() => {
    const startingPosition = loop ? 1 : 0;
    setPosition(startingPosition);
    x.set(-startingPosition * trackItemOffset);
  }, [items.length, loop, trackItemOffset, x]);

  useEffect(() => {
    if (!loop && position > itemsForRender.length - 1) {
      setPosition(Math.max(0, itemsForRender.length - 1));
    }
  }, [itemsForRender.length, loop, position]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationStart = () => {
    setIsAnimating(true);
  };

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false);
      return;
    }
    const lastCloneIndex = itemsForRender.length - 1;

    if (position === lastCloneIndex) {
      setIsJumping(true);
      const target = 1;
      setPosition(target);
      x.set(-target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    if (position === 0) {
      setIsJumping(true);
      const target = items.length;
      setPosition(target);
      x.set(-target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    setIsAnimating(false);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void => {
    const { offset, velocity } = info;
    let direction: number;
    if (offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD) {
      direction = 1;
    } else if (offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD) {
      direction = -1;
    } else {
      return;
    }

    setPosition((prev) => {
      const next = prev + direction;
      const max = itemsForRender.length - 1;
      return Math.max(0, Math.min(next, max));
    });
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: 0,
        },
      };

  let activeIndex = 0;
  if (items.length > 0) {
    activeIndex = loop ? (position - 1 + items.length) % items.length : Math.min(position, items.length - 1);
  }

  return (
    <div
      ref={containerRef}
      className={`carousel-container ${round ? 'round' : ''}`}
      style={{
        width: `${baseWidth}px`,
        ...(round && { borderRadius: '50%', height: `${baseWidth}px` }),
      }}
    >
      <motion.div
        className="carousel-track"
        drag={isAnimating ? false : 'x'}
        {...dragProps}
        style={{
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
          width: itemWidth,
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationStart={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
      >
        {itemsForRender.map((item, index) => (
          <CarouselCard
            key={`${item.id}-${index}`}
            item={item}
            index={index}
            itemWidth={itemWidth}
            round={round}
            trackItemOffset={trackItemOffset}
            x={x}
            transition={effectiveTransition}
          />
        ))}
      </motion.div>
      <div className={`carousel-indicators-container ${round ? 'round' : ''}`}>
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <motion.button
              type="button"
              key={index}
              className={`carousel-indicator ${activeIndex === index ? 'active' : 'inactive'}`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeIndex === index}
              animate={{
                scale: activeIndex === index ? 1.2 : 1,
              }}
              onClick={() => setPosition(loop ? index + 1 : index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Carousel;
