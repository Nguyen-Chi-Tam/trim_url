import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {Copy, Download, Trash, Edit, Check, X} from 'lucide-react'
import useFetch from '@/hooks/use-fetch';
import { deleteUrl, updateUrl } from '@/db/apiUrl';
import { BeatLoader } from 'react-spinners';
import { UrlState } from '@/context.jsx';

const LinkCard = ({ url, fetchUrls, pageLoaded }) => {
    const { user } = UrlState();
    const {loading: loadingDelete, fn:fnDelete}=useFetch(deleteUrl, url?.id)
    const {loading: loadingUpdate, fn:fnUpdate}=useFetch(updateUrl, {id: url?.id, user_id: user.id})

    const [timeLeft, setTimeLeft] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newTitle, setNewTitle] = useState(url?.title);
    const [newProfilePic, setNewProfilePic] = useState(null);
    const [showCard, setShowCard] = useState(false);
    useEffect(() => {
        if (!loadingDelete && !loadingUpdate && (typeof pageLoaded === 'undefined' || pageLoaded)) {
            setShowCard(true);
        } else {
            setShowCard(false);
        }
    }, [loadingDelete, loadingUpdate, pageLoaded]);

    const { isDarkMode } = UrlState();

    useEffect(() => {
        setNewTitle(url?.title);
    }, [url?.title]);

    useEffect(() => {
        if (url?.expiration_time) {
            const expiration = new Date(url.expiration_time);
            const updateTimeLeft = () => {
                const now = new Date();
                const diff = expiration - now;
                if (diff <= 0) {
                    setTimeLeft(0);
                    fnDelete().then(() => fetchUrls());
                } else {
                    setTimeLeft(diff);
                }
            };
            updateTimeLeft();
            const interval = setInterval(updateTimeLeft, 1000);
            return () => clearInterval(interval);
        }
    }, [url?.expiration_time, fnDelete, fetchUrls]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const downloadImage=()=>{
        const imageUrl=url?.qr_code
        const fileName=url?.title

        const anchor=document.createElement("a")
        anchor.href=imageUrl
        anchor.download=fileName

        document.body.appendChild(anchor)
        anchor.click();
        document.body.removeChild(anchor)
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewProfilePic(file);
        }
    };
    return (
    <div className={`flex flex-col md:flex-row gap-5 border border-gray-600 dark:border-gray-500 p-4 rounded-lg mt-2 mb-2 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-200/50'}${showCard ? ' animate-fade-up' : ' opacity-0'}`} style={{transition: 'opacity 0.5s'}}>
            <img src={url?.profile_pic ? url.profile_pic : (url?.qr_code ? url.qr_code : '/public/qr_not_found.png')}
                className="h-25 w-25 object-cover ring ring-blue-500 self-start aspect-square"
                alt={url?.profile_pic ? "Profile Picture" : "QR Code"} />
            <div className="flex flex-col flex-1 max-w-full overflow-hidden">
                {isEditing ? (
                    <>
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    fnUpdate({ title: newTitle }, newProfilePic).then(() => {
                                        setIsEditing(false);
                                        setNewProfilePic(null);
                                        fetchUrls();
                                    });
                                } else if (e.key === "Escape") {
                                    setIsEditing(false);
                                    setNewTitle(url?.title);
                                    setNewProfilePic(null);
                                }
                            }}
                            autoFocus
                        />
                        <div className="flex items-center mt-2">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="mr-2"
                            />
                            {url?.profile_pic && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fnUpdate({ title: newTitle, profile_pic: null }).then(() => {
                                            setIsEditing(false);
                                            setNewProfilePic(null);
                                            fetchUrls();
                                        });
                                    }}
                                    variant="outline"
                                    className={isDarkMode ? '' : 'bg-red-500 text-white border-red-500'}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <Link to={`/link/${url?.id}`} className={`text-left line-clamp-2 text-2xl font-bold hover:underline cursor-pointer ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {url?.title}
                    </Link>
                )}
                {url?.custom_url && (
                    <span className={`text-left ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Link tuỳ chỉnh: <a href={`/${url.id}/${url.custom_url}`} target='_blank' className='text-blue-400 hover:underline cursor-pointer truncate max-w-full'>{`https://trimurlz.me/${url.id}/${url.custom_url}`.length > 60 ? `https://trimurlz.me/${url.id}/${url.custom_url}`.slice(0, 60) + '...' : `https://trimurlz.me/${url.id}/${url.custom_url}`}</a>
                    </span>
                )}
                <span className={`text-left ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Link rút gọn: <a href={`/${url.id}/${url.short_url}`} target='_blank' className='text-blue-400 hover:underline cursor-pointer truncate max-w-full'>{`https://trimurlz.me/${url.id}/${url.short_url}`.length > 60 ? `https://trimurlz.me/${url.id}/${url.short_url}`.slice(0, 60) + '...' : `https://trimurlz.me/${url.id}/${url.short_url}`}</a>
                </span>
                <span className={`text-left ${isDarkMode ? 'text-white' : 'text-black'}`}>Link gốc: <a href={url.original_url} target='_blank' className='text-blue-400 hover:underline cursor-pointer truncate max-w-full'>{url.original_url.length > 60 ? url.original_url.slice(0, 60) + '...' : url.original_url}</a></span>
                <span className={`flex items-end font-extralight text sm flex-1 text-left ${isDarkMode ? 'text-white' : 'text-black'}`}>Thời điểm tạo: {new Date(url?.created_at).toLocaleString()}</span>
                {url.is_temporary && timeLeft !== null && timeLeft > 0 && (
                    <span className='flex items-end font-extralight text sm flex-1 text-left text-red-400'>Thời gian còn lại: {formatTime(timeLeft)}</span>
                )}
                {url.is_temporary && timeLeft === 0 && (
                    <span className='flex items-end font-extralight text sm flex-1 text-left text-red-600'>Đã hết hạn</span>
                )}
            </div>

        <div className='flex gap-2'>
            {isEditing ? (
                <>
                    <Button
                        onClick={() => {
                            fnUpdate({ title: newTitle }, newProfilePic).then(() => {
                                setIsEditing(false);
                                setNewProfilePic(null);
                                fetchUrls();
                            });
                        }}
                        disabled={loadingUpdate}
                        className={isDarkMode ? '' : 'bg-black text-white'}
                    >
                        {loadingUpdate ? <BeatLoader size={5} color='#5500ffff' /> : <Check />}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setIsEditing(false);
                            setNewTitle(url?.title);
                            setNewProfilePic(null);
                        }}
                        className={isDarkMode ? '' : 'bg-black text-white border-black'}
                    >
                        <X />
                    </Button>
                </>
            ) : (
                <>
                    <Button onClick={() => setIsEditing(true)} className={isDarkMode ? '' : 'bg-black text-white'}>
                        <Edit />
                    </Button>
                    <Button onClick={() =>
                        navigator.clipboard.writeText(`https://trimurl.id.vn/${url?.short_url}`)
                    }
                    className={isDarkMode ? '' : 'bg-black text-white'}
                    >
                        <Copy/>
                    </Button>
                    <Button onClick={downloadImage} className={isDarkMode ? '' : 'bg-black text-white'}>
                        <Download/>
                    </Button>
                    <Button onClick={()=>fnDelete().then(()=>fetchUrls())} className={isDarkMode ? '' : 'bg-black text-white'}>
                       {loadingDelete?<BeatLoader size={5} color='#5500ffff'/>: <Trash/>}
                    </Button>
                </>
            )}
        </div>
        </div>
    )
}

export default LinkCard
