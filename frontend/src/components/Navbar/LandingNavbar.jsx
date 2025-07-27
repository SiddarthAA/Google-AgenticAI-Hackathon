export default function Navbar() {
  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-blue-500/20 z-20 sticky top-0">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="text-white font-bold text-xl">
          Bengaluru Signal
        </a>
        <div className="flex items-center space-x-6">
          <a href="#features" className="text-blue-200 hover:text-blue-300">
            Features
          </a>
          <a href="/home" className="text-blue-200 hover:text-blue-300">
            Dashboard
          </a>
        </div>
      </div>
    </nav>
  );
}
