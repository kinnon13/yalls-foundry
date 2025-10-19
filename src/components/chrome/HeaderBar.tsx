/**
 * Global Header - Mac-style top bar
 */



export default function HeaderBar() {
  return (
    <header className="header">
      <div className="brand">Y'alls.Ai</div>

      <input 
        className="search" 
        placeholder="Search people, businesses, apps…" 
        type="search"
      />
    </header>
  );
}
