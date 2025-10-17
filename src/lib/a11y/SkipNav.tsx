/**
 * Skip Navigation Link
 * Allows keyboard users to skip directly to main content
 * WCAG 2.4.1 Level A requirement
 */

export function SkipNavLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[10000] focus:px-3 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg"
    >
      Skip to content
    </a>
  );
}
