export default function Showcase() {
  return (
    <section id="showcase" className="py-16">
      <div className="mx-auto max-w-6xl px-4 grid gap-6 md:grid-cols-2 items-center">
        <div className="card border rounded-xl border-black dark:border-white">
          <h3 className="text-xl font-semibold">Bảng điều khiển</h3>
          <p className="mt-2 text-sm text-gray-600 border-black dark:border-white dark:text-gray-300">Danh sách link, trạng thái, số lượt click.</p>
          <div className="mt-4 h-48 rounded-xl border border-black bg-gray-50 dark:bg-gray-800 dark:border-white">
          <img src="https://assets.qrcode-ai.com/software/branded-url-link-shortener/branded-url-link-shortener-og-banner.png" className="w-full h-full object-cover rounded-xl"/>
          </div>
        </div>
        <div className="card border rounded-xl border-black dark:border-white">
          <h3 className="text-xl font-semibold">Phân tích lưu lượng</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Biểu đồ theo ngày và tỉ lệ theo quốc gia.</p>
          <div className="mt-4 h-48 rounded-xl border border-black bg-gray-50 dark:bg-gray-800 dark:border-white">
            <img src="https://img.pikbest.com/wp/202346/data-analytics-web-banner-and-business-chart-mockup-featuring-a-3d-rendered-seo-user-interface_9621529.jpg!bw700" className="w-full h-full object-cover rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
