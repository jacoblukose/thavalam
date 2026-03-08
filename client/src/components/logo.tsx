export function Logo({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Garage roof */}
      <path d="M3 10.5 12 4l9 6.5" />
      {/* Garage body */}
      <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
      {/* Wrench inside */}
      <path d="M9.5 20v-5.5a2.5 2.5 0 0 1 5 0V20" />
      {/* Gauge arc */}
      <path d="M10 13.5a2 2 0 0 1 4 0" />
      {/* Gauge needle */}
      <line x1="12" y1="13.5" x2="13" y2="12.5" />
    </svg>
  );
}
