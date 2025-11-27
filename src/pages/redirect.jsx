import { getLongUrlByShort, getLongUrlByIdAndCustom } from '@/db/apiUrl'
import { storeClicks } from '@/db/apiClick'
import useFetch from '@/hooks/use-fetch'
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BeatLoader } from "react-spinners";
import { Button } from '@/components/ui/button'
import { X, ArrowLeft, House, RotateCcw } from 'lucide-react'

const Redirect = () => {
  const { id, customUrl, shortUrl } = useParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Decide which lookup to use based on route params
  const isShort = !!shortUrl && !id;
  const lookupArg = isShort
    ? shortUrl
    : { id: parseInt(id), customUrl };

  const { loading, data, error, fn } = useFetch(
    isShort ? getLongUrlByShort : getLongUrlByIdAndCustom,
    lookupArg
  );

  // Use a ref to ensure everything only happens once
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    fn();
  }, []);

  useEffect(() => {
    // Only proceed if we haven't processed yet and we have data
    if (!hasProcessedRef.current && !loading && data && data.id && data.original_url) {
      const processRedirect = async () => {
        try {
          setIsRedirecting(true);
          console.log('Recording click for URL:', data.id);
          hasProcessedRef.current = true; // Set immediately to prevent any further processing

          await storeClicks({
            id: data.id,
            originalUrl: data.original_url,
          });

          console.log('Click recorded successfully, redirecting...');
          window.location.href = data.original_url;
        } catch (error) {
          console.error('Error recording click:', error);
          hasProcessedRef.current = true; // Still mark as processed
          setIsRedirecting(true); // Still show loading while we fallback-redirect
          window.location.href = data.original_url;
        }
      };

      processRedirect();
    }
  }, [loading, data]); // Only depend on loading and data

  if (loading || isRedirecting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-neutral-900 px-6 text-center">
        <div className="w-full max-w-md">
          <BeatLoader width={"100%"} color="#36d7b7" />
        </div>
        <p className="mt-6 text-base text-neutral-700 dark:text-neutral-200">
          Đang chuyển hướng đến liên kết gốc...
        </p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Vui lòng đợi trong giây lát.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 min-h-screen w-full flex items-center justify-center p-6 bg-[#0b0b0b] bg-opacity-60">
        <div className="max-w-xl w-full bg-white/95 backdrop-blur rounded-xl shadow-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <X className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy liên kết</h1>
          <p className="text-gray-600 mb-6">
            Có vẻ như đường dẫn bạn nhập không khớp với bất kỳ liên kết nào. Hãy kiểm tra lại đường dẫn
            hoặc thử các lựa chọn bên dưới.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => (window.location.href = '/dashboard')}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="secondary"
              className="flex-1 bg-[#e7cdb7] text-[#3a2c1a] hover:bg-[#d4bfa7]"
            >
               <House className="w-5 h-5 mr-2" />
              Về trang chủ
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="flex-1 text-white bg-black hover:bg-gray-700"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Thử lại
            </Button>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            Nếu bạn nghĩ đây là lỗi, liên kết có thể đã hết hạn hoặc bị xoá.
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Redirect;
