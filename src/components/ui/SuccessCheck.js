'use client';

import { useEffect, useState } from 'react';

const __TRANSITION_STYLES = `
:root {
  --check-opacity-dur: 1100ms;
  --check-rotate-dur: 1100ms;
  --check-rotate-from: 90deg;
  --check-bob-dur: 1100ms;
  --check-y-amount: 35px;
  --check-blur-dur: 1000ms;
  --check-blur-from: 12px;
  --check-path-dur: 1100ms;
  --check-path-delay: 200ms;
  --check-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --check-ease-opacity: cubic-bezier(0.22, 1, 0.36, 1);
  --check-ease-rotate: cubic-bezier(0.22, 1, 0.36, 1);
  --check-ease-bob: cubic-bezier(0.34, 1.35, 0.64, 1);
  --check-ease-path: cubic-bezier(0.22, 1, 0.36, 1);
}


.t-success-check {
  display: inline-block;
  transform-origin: center;
  opacity: 0;
  will-change: transform, opacity, filter;
}

.t-success-check svg { display: block; overflow: visible; }

.t-success-check svg path {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
}

.t-success-check[data-state="in"] {
  animation:
    t-check-fade   var(--check-opacity-dur) var(--check-ease-opacity) forwards,
    t-check-rotate var(--check-rotate-dur)  var(--check-ease-rotate)  forwards,
    t-check-blur   var(--check-blur-dur)    var(--check-ease-out)     forwards,
    t-check-bob    var(--check-bob-dur)     var(--check-ease-bob)     forwards;
}

.t-success-check[data-state="in"] svg path {
  animation: t-check-draw var(--check-path-dur) var(--check-ease-path) var(--check-path-delay, 0ms) forwards;
}

@keyframes t-check-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes t-check-rotate {
  from { transform: rotate(var(--check-rotate-from)); }
  to   { transform: rotate(0deg); }
}
@keyframes t-check-blur {
  from { filter: blur(var(--check-blur-from)); }
  to   { filter: blur(0); }
}
@keyframes t-check-bob {
  from { transform: translateY(var(--check-y-amount)); }
  to   { transform: translateY(0); }
}
@keyframes t-check-draw { to { stroke-dashoffset: 0; } }

@media (prefers-reduced-motion: reduce) {
  .t-success-check { animation: none !important; opacity: 1; }
  .t-success-check svg path { animation: none !important; stroke-dashoffset: 0 !important; }
}
`;

export default function SuccessCheck({ size = 52, color = "#ffffff" }) {
  const [state, setState] = useState("out");

  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById("transitions-p10")) {
      const __style = document.createElement("style");
      __style.id = "transitions-p10";
      __style.textContent = __TRANSITION_STYLES;
      document.head.appendChild(__style);
    }
    const timer = setTimeout(() => {
      setState("in");
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      width: `${size + 24}px`,
      height: `${size + 24}px`,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)',
      margin: '0 auto 20px'
    }}>
      <span className="t-success-check" data-state={state} aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <path
            d="M14 24L22 32L34 16"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}

