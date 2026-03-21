export const PROVIDER_FORM_SECTION_MOTION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
} as const;
