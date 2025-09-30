import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarLoader } from 'react-spinners';
import Error from '@/components/error';
import { fetchBio } from '@/db/apiBio';
import BioDetails from '@/components/ui/bioDetails';

const Bio = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bio, setBio] = useState(null);

  useEffect(() => {
    const loadBio = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBio(id);
        setBio(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBio();
    }
  }, [id]);

  if (loading) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  if (error) {
    return <Error message={error?.message} />;
  }

  return <BioDetails bio={bio} />;
};

export default Bio;
