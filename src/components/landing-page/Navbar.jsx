export default function Navbar({ onToggleTheme, dark }){
  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur dark:bg-gray-950/80 dark:border-gray-800">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="#" className="group flex items-center gap-2">
          <img src="/favicon.svg" className="h-6 w-6" alt="logo"/>
          <span className="font-semibold tracking-tight">Shortly<span className="text-brand-600">.io</span></span>
        </a>
        <div className="hidden gap-6 md:flex">
          <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Tính năng</a>
          <a href="#showcase" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Demo</a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Giá</a>
          <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Hỏi đáp</a>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleTheme} className="btn btn-outline">{dark?'Light':'Dark'}</button>
          <a href="#get-started" className="btn btn-primary">Bắt đầu</a>
        </div>
      </nav>
    </header>
  )
}
