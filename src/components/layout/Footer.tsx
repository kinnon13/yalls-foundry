export default function Footer() {
  return (
    <footer className="fixed bottom-0 inset-x-0 z-30 border-t border-border/40 bg-background/80 backdrop-blur">
      <div className="h-12 max-w-screen-2xl mx-auto px-4 flex items-center justify-between text-xs">
        <span className="opacity-70">© Y'all</span>
        <nav className="flex gap-4 opacity-80">
          <a href="/terms" className="hover:opacity-100 transition-opacity">Terms</a>
          <a href="/privacy" className="hover:opacity-100 transition-opacity">Privacy</a>
        </nav>
      </div>
    </footer>
  );
}
