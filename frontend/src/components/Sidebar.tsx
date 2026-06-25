import type { MenuItem, Tool } from "../types";

type SidebarProps = {
  activeTool: Tool;
  menuItems: MenuItem[];
  onToolChange: (tool: Tool) => void;
};

function Sidebar({ activeTool, menuItems, onToolChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Scanify AI</h1>
        <p>Smart image & document tools</p>
      </div>

      <nav className="tool-menu">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={activeTool === item.key ? "menu-btn active" : "menu-btn"}
            onClick={() => onToolChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;