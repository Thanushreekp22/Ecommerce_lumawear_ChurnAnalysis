import { Heart, LogOut, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { APP_NAME } from "../config/env";

const links = [
  { to: "/shop", label: "Shop" },
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/men", label: "Men" },
  { to: "/women", label: "Women" },
  { to: "/collections", label: "Collections" },
  { to: "/about", label: "About" },
];

export default function Navbar({ onOpenCart }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const { cartItems, wishlist } = useStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const navClass = ({ isActive }) =>
    `focus-ring rounded-md px-2 py-1 text-sm transition hover:text-ink ${isActive ? "text-ink font-medium" : "text-charcoal/75"}`;

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setMobileOpen(false);
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  // ── Admin shell: logo + avatar/logout only, no storefront chrome ──
  if (isAdmin) {
    return (
      <header className="sticky top-0 z-50 border-b border-sand/80 bg-cream/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
          <Link to="/admin" className="focus-ring mr-4 rounded-md text-lg font-semibold tracking-wide">
            {APP_NAME}
            <span className="ml-2 rounded-full bg-ink px-2 py-0.5 align-middle text-[11px] font-medium text-cream">Admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <div className="relative">
              <button
                className="focus-ring flex items-center gap-2 rounded-full p-2 hover:bg-sand/40"
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Admin account menu"
                title={user?.email || "Admin"}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-cream">
                  {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
                </span>
              </button>
              {profileOpen && (
                <>
                  <button aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-sand bg-white p-2 shadow-lg">
                    <p className="truncate px-3 py-2 text-xs font-medium text-charcoal/70">{user?.name || "Store Administrator"}</p>
                    <p className="truncate px-3 pb-2 text-xs text-charcoal/50">{user?.email}</p>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-charcoal hover:bg-sand/40"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-sand/80 bg-cream/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <button className="focus-ring rounded-md p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation menu">
          <Menu size={20} />
        </button>
        <Link to="/" className="focus-ring mr-4 rounded-md text-lg font-semibold tracking-wide">
          {APP_NAME}
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink key={link.label} to={link.to} className={navClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <form onSubmit={submitSearch} className="ml-auto hidden w-full max-w-xs items-center md:flex">
          <label htmlFor="nav-search" className="sr-only">
            Search products
          </label>
          <div className="relative w-full">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/60" />
            <input
              id="nav-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="focus-ring w-full rounded-full border border-sand bg-white py-2 pl-9 pr-3 text-sm"
            />
          </div>
        </form>

        <div className="ml-2 flex items-center gap-1">
          <Link className="focus-ring rounded-full p-2 hover:bg-sand/40 md:hidden" to="/shop" aria-label="Search products">
            <Search size={18} />
          </Link>
          <Link className="focus-ring rounded-full p-2 hover:bg-sand/40" to="/account" aria-label="Account">
            <User size={18} />
          </Link>
          <Link className="focus-ring relative rounded-full p-2 hover:bg-sand/40" to="/account#wishlist" aria-label="Wishlist">
            <Heart size={18} />
            {wishlist.length > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-cream">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button className="focus-ring relative rounded-full p-2 hover:bg-sand/40" onClick={onOpenCart} aria-label="Open cart">
            <ShoppingBag size={18} />
            {cartItems.length > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-cream">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-[65] bg-black/30 lg:hidden">
          <aside className="h-full w-[82%] max-w-sm bg-cream p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">Menu</p>
              <button className="focus-ring rounded-full p-2 hover:bg-sand/40" onClick={() => setMobileOpen(false)} aria-label="Close navigation menu">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitSearch} className="mb-4">
              <label htmlFor="mobile-search" className="sr-only">
                Search products
              </label>
              <input
                id="mobile-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="focus-ring w-full rounded-full border border-sand bg-white px-4 py-2 text-sm"
              />
            </form>
            <div className="space-y-1">
              {links.map((link) => (
                <NavLink key={link.label} to={link.to} className={navClass} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
