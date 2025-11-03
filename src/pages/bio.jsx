import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarLoader } from 'react-spinners';
import Error from '@/components/error';
import { fetchBioByUrl } from '@/db/apiBio';
import BioDetails from '@/components/ui/bioDetails';

const Bio = () => {
  const { url } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bio, setBio] = useState(null);

  useEffect(() => {
    const loadBio = async () => {
      setLoading(true);
      setError(null);
      try {
  const data = await fetchBioByUrl(url);
        setBio(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      loadBio();
    }
  }, [url]);

  if (loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return <BioDetails bio={bio} />;
};

export default Bio;
