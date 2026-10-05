import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="mt-16 bg-[#18181B] text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="font-heading text-lg font-bold text-white">
          Ab YouTube par bhatakna band — sirf ek video, aur topic khatam 💯
        </p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Zero Nuisance Policy: har PDF upload, video suggestion aur comment AI se check hota hai.
          Gali, spam ya bakwaas = turant delete.
        </p>
        <nav className="mt-6 flex flex-wrap gap-4 text-sm" data-testid="footer-links">
          <Link to="/search" className="hover:text-amber-400">Search</Link>
          <Link to="/papers" className="hover:text-amber-400">PYQs &amp; Papers</Link>
          <Link to="/contribute" className="hover:text-amber-400">Daan Karo</Link>
          <Link to="/chat" className="hover:text-amber-400">Ghee Guru</Link>
        </nav>
        <p className="mt-6 text-xs text-zinc-500">
          © {new Date().getFullYear()} Ghee Khatam. Padhai me ghee, dimaag me cheetah.
        </p>
      </div>
    </footer>
  );
}
