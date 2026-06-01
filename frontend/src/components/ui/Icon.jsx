const PATHS = {
  document: (
    <>
      <path d="M7 3h7l3 3v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v3a1 1 0 0 0 1 1h3" />
      <path d="M9 12h6M9 15h6M9 18h4" />
    </>
  ),
  book: (
    <>
      <path d="M5 4h9a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
      <path d="M5 18h9a2 2 0 0 0 2-2" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M6 17l4-4 3 3 2-2 3 3" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.2 4.2L17 8l-3.8 1.2L12 14l-1.2-4.8L7 8l3.8-0.8L12 3z" />
      <path d="M18 14l0.6 2.1L21 17l-2.1 0.6L18 20l-0.6-2.4L15 17l2.4-0.9L18 14z" />
    </>
  ),
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 4.2 1.8c-.8.7-1.2 1.4-1.2 2.7M12 17h.01" /></>,
  upload: (
    <>
      <path d="M12 16V6M8 10l4-4 4 4" />
      <path d="M5 20h14" />
    </>
  ),
  clipboard: (
    <>
      <rect x="7" y="4" width="10" height="4" rx="1" />
      <path d="M6 8h12v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8z" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  folder: (
    <>
      <path d="M4 7h6l2 2h8v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 6h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6z" />
      <path d="M4 10h5l2 3h2l2-3h5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5L10 14l-2.5-2.5L12 10l2.5-0.5z" />
    </>
  ),
  file: (
    <>
      <path d="M8 4h8l2 2v14H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M14 4v3h3" />
    </>
  ),
  graduation: (
    <>
      <path d="M3 10l9-5 9 5-9 5-9-5z" />
      <path d="M6 12v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
    </>
  ),
  paperclip: (
    <path d="M8 12.5V7a4 4 0 0 1 8 0v8a3 3 0 0 1-6 0V8" />
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  check: <path d="M5 12l5 5L19 7" />,
  x: (
    <>
      <path d="M8 8l8 8M16 8l-8 8" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 8h.01" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 7l10 10" />
    </>
  ),
  listChecks: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M5 6h.01M5 12h.01M5 18h.01" />
    </>
  ),
  toggle: <circle cx="12" cy="12" r="4" />,
  pencil: (
    <>
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M14 6l4 4" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 1 0-6l1-1a4 4 0 0 1 6 6l-1 1" />
      <path d="M14 10a4 4 0 0 1 0 6l-1 1a4 4 0 0 1-6-6l1-1" />
    </>
  ),
  download: (
    <>
      <path d="M12 5v10M8 13l4 4 4-4" />
      <path d="M5 19h14" />
    </>
  ),
  moodle: (
    <>
      <path d="M4 18V8l8-4 8 4v10" />
      <path d="M8 14l4 3 4-3" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
};

export default function Icon({ name, size = 18, className = "", strokeWidth = 1.75 }) {
  const content = PATHS[name];
  if (!content) return null;

  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
