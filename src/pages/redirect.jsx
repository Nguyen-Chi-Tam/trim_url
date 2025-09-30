import { getLongUrl } from '@/db/apiUrl'
import { storeClicks } from '@/db/apiClick'
import useFetch from '@/hooks/use-fetch'
import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import Error from '@/components/error'

const Redirect = () => {
  const { id } = useParams();

  // Always use the ID for lookup - this ensures we get the exact URL by its unique identifier
  const { loading, data, error, fn } = useFetch(getLongUrl, parseInt(id));

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
          window.location.href = data.original_url;
        }
      };

      processRedirect();
    }
  }, [loading, data]); // Only depend on loading and data

  if (loading) {
    return (
      <>
        <BarLoader width={"100%"} color="#36d7b7" />
        <br />
        Redirecting...
      </>
    );
  }

  if (error) {
    return <Error message="Không tìm thấy đường link này" />
  }

  return null;
};

export default Redirect;
