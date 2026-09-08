"use client";

import { useEffect, useState } from "react";

export default function Fab({
  onClick,
  label,
  title,
}: {
  onClick: () => void;
  label: string;
  title?: string;
}) {
  const [bottom, setBottom] = useState("1.5rem");

  useEffect(() => {
    const footer =
      document.getElementById("site-footer") ?? document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const visible = entry.intersectionRect.height;
          setBottom(`${visible + 24}px`);
        } else {
          setBottom("1.5rem");
        }
      },
      { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title}
      style={{ bottom, transition: "bottom 150ms, background-color 150ms" }}
      className="fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}
