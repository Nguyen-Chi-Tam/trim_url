export default function Footer(){
  return (
    <footer className="border-t py-10 dark:border-gray-800">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 md:flex-row">
        <p className="text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Shortly</p>
        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
          <a className="hover:text-gray-800 dark:hover:text-white" href="#">Điều khoản</a>
          <a className="hover:text-gray-800 dark:hover:text-white" href="#">Bảo mật</a>
          <a className="hover:text-gray-800 dark:hover:text-white" href="#">Liên hệ</a>
        </div>
      </div>
    </footer>
  )
}
