export default function FAQ(){
  const faqs = [
    { q: 'Nó hoạt động như thế nào?', a: '✂ Rút gọn liên kết nhanh chóng: Biến những URL dài thành các liên kết ngắn gọn, dễ nhớ, hoàn hảo. 📱 Tạo mã QR: Chuyển đổi liên kết ngắn của bạn thành mã QR để chia sẻ nhanh chóng và tiện lợi trên các nền tảng khác nhau. 📊 Quản lý và theo dõi hiệu suất: Theo dõi số lượng nhấp chuột, vị trí địa lý của người dùng, và các thiết bị họ sử dụng. Những số liệu này giúp bạn hiểu rõ hơn về đối tượng khán giả của mình và tối ưu hóa chiến lược tiếp thị.' },
    { q: 'Có miễn phí không?', a: 'Có, dịch vụ rút gọn liên kết của chúng tôi hoàn toàn miễn phí cho người dùng cơ bản. Bạn có thể rút gọn không giới hạn số lượng liên kết mà không cần trả phí.' },
    { q: 'Có an toàn không?', a: 'Chúng tôi đảm bảo an toàn cho liên kết của bạn. Tất cả các liên kết được mã hóa và chúng tôi không lưu trữ thông tin nhạy cảm. Ngoài ra, chúng tôi có hệ thống chống spam và malware để bảo vệ người dùng.' },
    { q: 'Tôi có thể tùy chỉnh URL ngắn không?', a: 'Có, bạn có thể tùy chỉnh phần cuối của URL ngắn để làm cho nó dễ nhớ hơn. Ví dụ: thay vì một chuỗi ngẫu nhiên, bạn có thể chọn một từ khóa như "my-link".' },
    { q: 'Làm thế nào để sử dụng?', a: 'Chỉ cần nhập URL dài vào ô trên và nhấn "Rút gọn". Sau đó, bạn sẽ nhận được liên kết ngắn và mã QR. Đăng ký tài khoản để quản lý và theo dõi các liên kết của bạn.' },
    { q: 'Tôi có thể theo dõi lượt nhấp không?', a: 'Có, với tài khoản đăng ký, bạn có thể xem số liệu chi tiết như số lượt nhấp, vị trí địa lý, thiết bị và thời gian truy cập để phân tích hiệu quả của liên kết.' },
    { q: 'Còn gì đặc biệt về nó không?', a: '⏱ Link tạm thời: Cho phép chia sẻ liên kết trong một khoảng thời gian giới hạn, sau đó liên kết sẽ tự động hết hạn và không còn truy cập được nữa. 🖼  Bio Page: Tạo trang tiểu sử cá nhân, và doanh nghiệp với nhiều liên kết, hoàn hảo cho việc chia sẻ trên mạng xã hội và giới thiệu bản thân một cách chuyên nghiệp.' },
  ]
  return (
    <section id="faq" className="py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-3xl font-bold text-center">Câu hỏi thường gặp</h2>
        <div className="mt-8 space-y-4">
          {faqs.map(f=> (
            <details key={f.q} className="group rounded-2xl border border-black p-4 transition open:shadow-md dark:border-white">
              <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
              <p className="mt-2 text-left text-sm text-gray-600 dark:text-gray-300">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
