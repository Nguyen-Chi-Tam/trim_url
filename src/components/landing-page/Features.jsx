import { LinkIcon, ShieldIcon, ChartIcon, GlobeIcon, QrIcon } from './icons'

const items = [
  { title: 'Rút gọn & bí danh', desc: 'Tạo link ngắn, tuỳ chọn slug dễ nhớ.', icon: LinkIcon },
  { title: 'Bảo mật & riêng tư', desc: 'Kiểm soát quyền truy cập, an toàn.', icon: ShieldIcon },
  { title: 'Analytics theo ngày', desc: 'Theo dõi lượt click, biểu đồ rõ ràng.', icon: ChartIcon },
  { title: 'Bản đồ quốc gia', desc: 'Thống kê phân bố theo vị trí.', icon: GlobeIcon },
  { title: 'Mã QR tức thì', desc: 'Tạo và tải QR cho mỗi link.', icon: QrIcon },
  { title: 'Tối ưu tốc độ', desc: 'Redirect tức thì cho UX tốt nhất.', icon: LinkIcon },
]

export default function Features() {
  return (
    <section id="features">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold">Tính năng nổi bật</h2>
        <p className="mt-2 text-center mx-auto text-gray-600 dark:text-gray-300">Đầy đủ công cụ để quản lý link chuyên nghiệp.</p>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3 mx-auto w-full">
          {items.map((it) => (
            <div key={it.title} className="card group border border-black dark:border-white rounded-lg p-4">
              <div className="flex items-start gap-4">
                <it.icon className="h-6 w-6 md:h-10 md:w-10 text-brand-600 transition group-hover:scale-110"/>
                <div><h3 className="font-semibold">{it.title}</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{it.desc}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
