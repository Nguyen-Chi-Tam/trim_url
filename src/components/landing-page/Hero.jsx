import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { UrlState } from '@/context.jsx';
export default function Hero() {
  const [longUrl, setLongUrl] = useState();
  const navigate = useNavigate();
  const { isDarkMode } = UrlState();

  const handleShorten = (e) => {
    e.preventDefault();
    if (longUrl) navigate(`/auth?createNew=${longUrl}`);
  }

  return (
    <section className="relative overflow-hidden w-full">
      <div className="w-full bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100"></div>
      <div className="animate-fadeInUp w-full">
        <h1
          className={`mt-10 font-bold tracking-tight w-full text-center ${typeof window !== 'undefined' && window.innerWidth > 1440 ? 'text-5xl' : 'text-4xl md:text-3xl'}`}
        >
          Nền tảng rút gọn URL cho website hiện đại.
        </h1>
        <p className="mt-4 text-black dark:text-gray-300 w-full text-center">
          Quản lý link, theo dõi click, bản đồ quốc gia, mã QR tức thì. Thiết kế đẹp, tốc độ cao.
        </p>
        <div className="mt-8 space-y-3 w-full">
          <div className="flex flex-col gap-3 md:flex-row w-full">
            <form onSubmit={handleShorten}
              className='sm:h-14 flex flex-col sm:flex-row w-full gap-2 mb-10'>
              <Input type="url"
                value={longUrl}
                placeholder="Nhập đường liên kết"
                onChange={(e) => setLongUrl(e.target.value)}
                className="h-full flex-1 py-4 px-4 border-black dark:border-white ml-2 mr-2" />
              <Button
                className="h-full" type="submit" variant="destructive">Rút gọn</Button>
            </form>
          </div>
        </div>
      </div>
      <div className="animate-float w-full">
      </div>
    </section>
  )
}
