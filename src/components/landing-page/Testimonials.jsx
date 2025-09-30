import { Star } from './icons'

const data = [
  { name:"Minh, PM", quote:"Triển khai nhanh, giao diện đẹp. Đội mình quản lý chiến dịch gọn hẳn.", rating:5 },
  { name:"Lan, Marketer", quote:"QR và số liệu theo ngày rất hữu ích cho offline-to-online.", rating:5 },
  { name:"Huy, Dev", quote:"API đơn giản, tích hợp CI dễ. Giá hợp lý.", rating:4 },
  {name:"Hieu, Rapper", quote:"Nghe bài Trình chưa?", rating:3},
]

export default function Testimonials(){
  return (
    <section className="mt-5">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-center">Khách hàng nói gì</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {data.map(t => (
            <div key={t.name} className="card border border-black dark:border-white rounded-lg p-4">
              <div className="flex">
                {Array.from({length:t.rating}).map((_,i)=>(<Star key={i} className="h-5 w-5 text-brand-500 text-yellow-500" />))}
              </div>
              <p className="mt-3 text-gray-700 dark:text-gray-200">“{t.quote}”</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">— {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
