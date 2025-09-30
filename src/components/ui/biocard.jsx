import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UrlState } from '@/context.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Copy, Trash, Check, X } from 'lucide-react';
import useFetch from '@/hooks/use-fetch';
import { updateBio, deleteBio } from '@/db/apiBio';
import { BeatLoader } from 'react-spinners';

const BioCard = ({ bio, onDelete, fetchBios, pageLoaded }) => {
  const navigate = useNavigate();
  const { isDarkMode, user } = UrlState();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(bio?.title);
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [removeProfilePic, setRemoveProfilePic] = useState(false);
  const { loading: loadingUpdate, fn: fnUpdate } = useFetch(updateBio, { id: bio?.id, user_id: user?.id });
  const { loading: loadingDelete, fn: fnDelete } = useFetch(deleteBio, bio?.id);
  const [showCard, setShowCard] = useState(false);
  useEffect(() => {
    if (!loadingDelete && !loadingUpdate && (typeof pageLoaded === 'undefined' || pageLoaded)) {
      setShowCard(true);
    } else {
      setShowCard(false);
    }
  }, [loadingDelete, loadingUpdate, pageLoaded]);
  useEffect(() => {
    setShowCard(false);
    const timer = setTimeout(() => setShowCard(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setNewTitle(bio?.title);
  }, [bio?.title]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfilePic(file);
    }
  };

  return (
    <div
      className={
        `cursor-pointer flex flex-col items-center border p-0 rounded-lg mt-2 mb-2 w-full max-w-[237px] h-[280px] sm:max-w-[220px] sm:h-[320px] md:max-w-[320px] md:h-[450px]${isDarkMode ? " bg-gray-900 text-white border-white" : " bg-gray-200 text-black border-black"} ` +
        (showCard ? " animate-fade-up" : " opacity-0")
      }
      style={{
        width: '320px',
        height: isEditing ? (window.innerWidth < 768 ? '520px' : '520px') : (window.innerWidth < 768 ? '410px' : '450px'),
        backgroundImage: bio.background ? `url(${bio.background})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: bio.background ? '0.25rem' : '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'opacity 0.5s',
      }}
    >
      {/* Semi-transparent wrapper for text readability */}
      <div
        className={"w-full p-4 " + (isDarkMode ? "bg-black/50" : "bg-white/50")}
        style={{
          height: isEditing ? (window.innerWidth < 768 ? '520px' : '600px') : (window.innerWidth < 768 ? '410px' : '450px'),
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      >
        {isEditing ? (
          <>
            {bio.profile_pic && (
              <img
                src={bio.profile_pic}
                alt={bio.title}
                className={"object-cover mb-4 rounded-lg border w-[250px] h-[250px] phone:w-[160px] phone:h-[160px] sm:w-[300px] sm:h-[300px] md:w-[300px] md:h-[300px]" + (isDarkMode ? " border-white" : " border-black")}
                style={{ borderRadius: '0.25rem' }}
              />
            )}
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fnUpdate({ title: newTitle }, newProfilePic).then(() => {
                    setIsEditing(false);
                    setNewProfilePic(null);
                    if (fetchBios) fetchBios();
                  });
                } else if (e.key === "Escape") {
                  setIsEditing(false);
                  setNewTitle(bio?.title);
                  setNewProfilePic(null);
                }
              }}
              autoFocus
              className="mb-2"
            />
            <div className="flex items-center mb-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mr-2 max-w-full truncate"
                style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
              />

            </div>
          </>
        ) : (
          <>
            {bio.profile_pic && (
              <img
                src={bio.profile_pic}
                alt={bio.title}
                style={{ borderRadius: '0.25rem' }}
                className={"object-cover mb-4 rounded-lg border w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] md:w-[300px] md:h-[300px]" + (isDarkMode ? " border-white" : " border-black")} />
            )}
            <h2 className="text-xl font-bold mb-1 w-full text-left truncate hover:underline"
              onClick={() => navigate(`/bio/${bio.id}`)}>{bio.title}</h2>
          </>
        )}
        <div className="w-full flex justify-start">
          <span className="text-sm font-light">
            {new Date(bio.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex flex-row justify-end w-full space-x-2 mt-4">
          {isEditing ? (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  fnUpdate({ title: newTitle }, newProfilePic).then(() => {
                    setIsEditing(false);
                    setNewProfilePic(null);
                    if (fetchBios) fetchBios();
                  });
                }}
                disabled={loadingUpdate}
                className={isDarkMode ? '' : 'bg-black text-white'}
              >
                {loadingUpdate ? <BeatLoader size={5} color='#5500ffff' /> : <Check />}
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                  setNewTitle(bio?.title);
                  setNewProfilePic(null);
                }}
                className={isDarkMode ? '' : 'bg-black text-white border-black'}
              >
                <X />
              </Button>
            </>
          ) : (
            <>
              <Button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className={isDarkMode ? '' : 'bg-black text-white'}>
                <Edit />
              </Button>
              <Button onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`https://trimurl.id.vn/${bio?.url}`)
              }}
                className={isDarkMode ? '' : 'bg-black text-white'}>
                <Copy />
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); fnDelete().then(() => fetchBios()); }} className={isDarkMode ? '' : 'bg-black text-white'}>
                {loadingDelete ? <BeatLoader size={5} color='#5500ffff' /> : <Trash />}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BioCard;
