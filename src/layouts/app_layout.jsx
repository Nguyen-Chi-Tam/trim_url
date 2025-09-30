import { Outlet, useLocation } from "react-router-dom";
import { HTMLAttributes } from "react";
import Header from "../components/header";
import { Youtube, Facebook, Instagram, Twitter, Mail } from "lucide-react";

const AppLayout = () => {
  const location = useLocation();

  // Hide footer on bio pages to prevent overlap with floating edit button
  const hideFooter = location.pathname.startsWith('/bio/');
  const isLanding = location.pathname === '/';
  const isBio = location.pathname.startsWith('/bio/');

  return (
    <div className={!isLanding && !isBio ? 'main-background' : ''}>
      {!isBio && <Header />}
      <main className="min-h-screen w-full">
        <Outlet />
      </main>
      {!hideFooter && (
        <div className="w-full p-10 text-center bg-gray-500 dark:bg-gray-700 bg-opacity-20 backdrop-blur mt-0 text-white">
          <div className="mb-4 font-semibold text-xl md:text-3xl">
            Dự án được xây dựng và phát triển bởi: Nguyễn Chí Tâm, Đặng Hoài Vũ, Nguyễn Đình Khánh.
          </div>
          <div className="mb-8">
            <p>Liên hệ với tôi tại đây:</p>
            <ul className="flex justify-center space-x-6 mt-2">
              <li className="flex items-center space-x-1">
                <a href="https://www.youtube.com/@hoathuyetnhatnhat8919" target="_blank" rel="noopener noreferrer" className="hover:underline text-red-600">
                  <Youtube className="h-5 w-5 text-red-600" />
                </a>
              </li>
              <li className="flex items-center space-x-1">
                <a href="https://www.facebook.com/nguyen.chi.tam.418729/" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">
                  <Facebook className="h-5 w-5 text-blue-400" />
                </a>
              </li>
              <li className="flex items-center space-x-1">
                <a href="https://www.instagram.com/qsd8gen1/" target="_blank" rel="noopener noreferrer" className="hover:underline text-pink-500">
                  <Instagram className="h-5 w-5 text-pink-500" />
                </a>
              </li>
              <li className="flex items-center space-x-1">
                <a href="https://x.com/scousersvn" target="_blank" rel="noopener noreferrer" className="hover:underline text-cyan-500">
                  <Twitter className="h-5 w-5 text-cyan-500" />
                </a>
              </li>
              <li className="flex items-center space-x-1">
                <a href="https://github.com/Nguyen-Chi-Tam" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  <img src="/github.png" alt="GitHub" className="h-5 w-5" />
                </a>
              </li>
            </ul>
            <div className="flex justify-center items-center space-x-2 mt-2">
              <Mail className="h-5 w-5 text-lime-500" />
              <span className="text-lime-500">fegeltronics@gmail.com</span>
            </div>
          </div>
          <div className="flex justify-center mt-2 mspace-x-4">
            <img src="/trim_url.png" alt="App Icon" className="h-10 w-auto filter brightness-0 invert" />
            {/* Additional app icons can be added here if available */}
          </div>
          <div>
            <p className="text-sm">Cảm ơn vì đã đến! ❤</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
