'use client';

import React, { useId } from 'react';

interface AnimatedBtn1Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color1?: string;
  color2?: string;
  hoverColor1?: string;
  hoverColor2?: string;
}

export default function AnimatedBtn1({
  children,
  className,
  color1 = '#212529',
  color2 = '#343a40',
  hoverColor1 = '#343a40',
  hoverColor2 = '#495057',
  ...props
}: AnimatedBtn1Props) {
  const uniqueId = useId().replace(/:/g, '');
  const btnClass = `bubbleeffectbtn-${uniqueId}`;

  return (
    <button className={`${btnClass} ${className || ''}`} type="button" {...props}>
      <style dangerouslySetInnerHTML={{ __html: `
        .${btnClass} {
          min-width: 130px;
          height: 40px;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
          border-radius: 25px;
          border: none;
          background: linear-gradient(45deg, ${color1}, ${color2});
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          z-index: 1;
          overflow: hidden;
        }

        .${btnClass}:before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0)
          );
          transform: rotate(45deg);
          transition: all 0.5s ease;
          z-index: -1;
        }

        .${btnClass}:hover:before {
          top: -100%;
          left: -100%;
        }

        .${btnClass}:after {
          border-radius: 25px;
          position: absolute;
          content: '';
          width: 0;
          height: 100%;
          top: 0;
          z-index: -1;
          box-shadow:
            inset 2px 2px 2px 0px rgba(255, 255, 255, 0.5),
            7px 7px 20px 0px rgba(0, 0, 0, 0.1),
            4px 4px 5px 0px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          background: linear-gradient(45deg, ${hoverColor1}, ${hoverColor2});
          right: 0;
        }

        .${btnClass}:hover:after {
          width: 100%;
          left: 0;
        }

        .${btnClass}:active {
          top: 2px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          background: linear-gradient(45deg, ${color1}, ${color2});
        }

        .${btnClass} span {
          position: relative;
          z-index: 2;
        }
      `}} />

      <span className="text-sm font-medium w-full flex items-center justify-center">
        {children || 'Hover me'}
      </span>
    </button>
  );
}
