"use client";

import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M4 15L2 20C6 22 18 22 22 20L20 15"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        />
        <path
          d="M6 15V6H14L18 10.5V15"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        />
        <path
          d="M9 6V3.5H12.5V6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        />
      </svg>
      <span className="text-base font-semibold tracking-tight text-white">
        Rastreamento de Barcos
      </span>
    </Link>
  );
}
