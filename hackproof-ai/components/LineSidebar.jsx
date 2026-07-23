import { useState } from 'react';

const DEFAULT_ITEMS = [
  'Overview',
  'Components',
  'Animations',
  'Backgrounds',
  'Showcase',
  'Playground',
  'Templates',
  'Changelog',
  'Community',
  'Resources',
  'Documentation',
  'Support'
];

const LineSidebar = ({
  items = DEFAULT_ITEMS,
  accentColor = '#818cf8',
  textColor = '#94a3b8',
  markerColor = '#475569',
  showIndex = true,
  showMarker = true,
  maxShift = 24,
  markerLength = 50,
  markerGap = 12,
  itemGap = 24,
  fontSize = 1.1,
  defaultActive = null,
  onItemClick,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultActive);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleClick = (index, label) => {
    setActiveIndex(index);
    onItemClick?.(index, label);
  };

  return (
    <nav
      className={`relative flex justify-start ${showMarker ? 'pl-[64px]' : ''} ${className}`}
      style={{
        fontSize: `${fontSize}rem`,
      }}
    >
      <ul
        className="m-0 flex list-none flex-col py-2"
        style={{ gap: `${itemGap}px` }}
      >
        {items.map((label, index) => {
          const isActive = activeIndex === index;
          const isHovered = hoveredIndex === index;
          const isHighlighted = isActive || isHovered;

          return (
            <li
              key={`${label}-${index}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => handleClick(index, label)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative cursor-pointer group select-none py-1"
            >
              {/* Horizontal Accent Marker Line */}
              {showMarker && (
                <span
                  aria-hidden="true"
                  className="absolute left-[-64px] top-1/2 h-[2px] transition-all duration-300 ease-out origin-left rounded-full"
                  style={{
                    width: `${markerLength}px`,
                    backgroundColor: isHighlighted ? accentColor : markerColor,
                    transform: `translateY(-50%) scaleX(${isHighlighted ? 1.25 : 0.7})`,
                    opacity: isHighlighted ? 1 : 0.4,
                  }}
                />
              )}

              {/* Text Item with Shift Animation */}
              <span
                className="relative inline-flex items-baseline leading-[1.3] transition-all duration-300 ease-out font-medium"
                style={{
                  color: isHighlighted ? accentColor : textColor,
                  transform: `translateX(${isHighlighted ? maxShift : 0}px)`,
                }}
              >
                {showIndex && (
                  <span
                    className="mr-3 font-mono text-[0.85em] transition-opacity duration-300"
                    style={{ opacity: isHighlighted ? 1 : 0.5 }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                <span className="tracking-tight">{label}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default LineSidebar;
