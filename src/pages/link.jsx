import { UrlState } from '@/context'
import { getClicksForUrl } from '@/db/apiClick'
import { deleteUrl, getUrl, updateUrl } from '@/db/apiUrl'
import useFetch from '@/hooks/use-fetch'
import { LinkIcon, Edit, Check, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BarLoader, BeatLoader } from 'react-spinners'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Download, Trash } from 'lucide-react'
import Location from '@/components/ui/location-stats'
import Device from '@/components/ui/device-stats'
import Country from '@/components/ui/country-stats'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const Link = () => {
  const { user } = UrlState()
  const { id } = useParams()
  const navigate = useNavigate()
  const [remainingTime, setRemainingTime] = useState('')
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCustomUrl, setNewCustomUrl] = useState('');
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);
  const {
    loading,
    data: url,
    fn,
    error,
  } = useFetch(getUrl, { id, user_id: user?.id });

  const {
    loading: loadingStats,
    data: stats,
    fn: fnStats,
  } = useFetch(getClicksForUrl, id);

  const { loading: loadingDelete, fn: fnDelete } = useFetch(deleteUrl, id);
  const { loading: loadingUpdate, fn: fnUpdate } = useFetch(updateUrl, {id, user_id: user.id});

  useEffect(() => {
    fn()
    fnStats()
  }, [])

  useEffect(() => {
    if (url?.expiration_time) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const expiration = new Date(url.expiration_time).getTime()
        const diff = expiration - now
        if (diff <= 0) {
          setRemainingTime('Expired')
          clearInterval(interval)
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          setRemainingTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [url])

  if (error) navigate("/dashboard")

  let link = ""
  if (url) link = url?.custom_url ? url?.custom_url : url.short_url;

  const downloadImage = () => {
    const imageUrl = url?.qr_code
    const fileName = url?.title

    const anchor = document.createElement("a")
    anchor.href = imageUrl
    anchor.download = fileName

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
    <div className='ml-10 mr-10 mt-30 mb-10'>
      {(loading || loadingStats) && <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}
      <div className='flex flex-col gap-8 xl:flex-row justify-between'>
        
        <div className='flex flex-col items-start gap-8 rounded-lg xl:w-2/5'>
          {isEditing ? (
            <>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Tiêu đề"
                className="text-4xl font-extrabold"
              />
              <div className="flex items-center gap-2 w-full">
                <span className="text-gray-500 text-lg">https://trimurlz.me/</span>
                <Input
                  value={newCustomUrl}
                  onChange={(e) => setNewCustomUrl(e.target.value)}
                  placeholder="Link tuỳ chỉnh (nếu cần)"
                  className="flex-1 text-lg"
                />
              </div>
              <div>
                <h2 className="font-bold mt-4 text-left">Ảnh bìa:</h2>
                <div className="flex items-center">
                  <Input
                    id="profilePic"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mr-2"
                  />
                  {url?.profile_pic && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        fnUpdate({ title: newTitle, customUrl: newCustomUrl, profile_pic: null }).then(() => {
                          setIsEditing(false);
                          setNewProfilePic(null);
                          fn();
                        });
                      }}
                      variant="outline"
                      className="bg-red-500 text-white border-red-500"
                    >
                      Xoá
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {url?.profile_pic && (
                <img
                  src={url.profile_pic}
                  alt="Ảnh đại diện"
                  className="flex mb-4 max-h-125 max-w-125 object-cover ring ring-blue-500 self-start"
                  style={{ borderRadius: '1.8rem' }}
                />
              )}
              <span className='text-6xl font-bold hover:underline cursor-pointer'>{url?.title}</span>
            </>
          )}
          <div className="flex flex-col gap-2">
            {url?.custom_url && (
              <a href={`/${url.id}/${url.custom_url}`} target='_blank'
                className="text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 whitespace-nowrap">
                <LinkIcon className='p-1 w-5 h-5 flex-shrink-0' />
                Link tuỳ chỉnh: https://trimurlz.me/{url.id}/{url.custom_url}
              </a>
            )}
            {url && (
              <a href={`/${url.id}/${url.short_url}`} target='_blank'
                className="text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 whitespace-nowrap">
                <LinkIcon className='p-1 w-5 h-5 flex-shrink-0' />Link rút gọn: https://trimurlz.me/{url.id}/{url.short_url}</a>
            )}
            {url && (
              <a href={url.original_url} target='_blank'
                className="text-blue-700 dark:text-blue-400 flex items-start gap-1 hover:underline cursor-pointer text-left">
                <LinkIcon className='p-1 w-5 h-5 flex-shrink-0' />Link gốc: {url.original_url}</a>
            )}
          </div>
          {url && (
            <span className='flex items-end font-extralight text-sm'>{new Date(url.created_at).toLocaleString()}</span>
          )}
          {url?.expiration_time && (
            <span className='flex items-end font-extralight text-sm text-red-500'>
              Hết hạn sau: {remainingTime}
            </span>
          )}
          <div className='flex gap-2'>
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    fnUpdate({ title: newTitle, customUrl: newCustomUrl }, newProfilePic).then(() => {
                      setIsEditing(false);
                      fn();
                    });
                  }}
                  disabled={loadingUpdate}
                >
                  {loadingUpdate ? <BeatLoader size={5} color='#5500ffff' /> : <Check />}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setNewTitle(url?.title);
                    setNewCustomUrl(url?.custom_url || '');
                  }}
                >
                  <X />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => {
                  setIsEditing(true);
                  setNewTitle(url?.title);
                  setNewCustomUrl(url?.custom_url || '');
                }}>
                  <Edit />
                </Button>
                <div className="relative">
                  <Button variant="ghost" onClick={() => {
                    navigator.clipboard.writeText(`https://trimurlz.me/${url?.id}/${url?.short_url}`);
                    setShowCopiedPopup(true);
                    setTimeout(() => setShowCopiedPopup(false), 2000);
                  }}
                  >
                    <Copy />
                  </Button>
                  <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-lg z-[60] transition-opacity duration-500 ease-in-out ${showCopiedPopup ? 'opacity-100' : 'opacity-0'}`}>
                    Đã sao chép
                  </div>
                </div>
                <Button variant="ghost" onClick={downloadImage}>
                  <Download />
                </Button>
                <Button variant="ghost" onClick={() => fnDelete().then(() => navigate('/dashboard'))}>
                  {loadingDelete ? <BeatLoader size={5} color='#5500ffff' /> : <Trash />}
                </Button>
              </>
            )}
          </div>
            {url && (
              <img src={url.qr_code ? url.qr_code : '/public/qr_not_found.png'}
                className="self-center object-contain ring ring-blue-500 self-start"
                alt="Mã QR" />
            )}
        </div>
        <Card className='xl:w-3/5'>
          <CardHeader>
            <CardTitle className='text-4xl font-bold'>Thống kê</CardTitle>
          </CardHeader>
          {stats && stats?.length ? (<CardContent className='flex flex-col gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Tổng số lượt click</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{stats?.length}</p>
              </CardContent>
            </Card>
            <CardTitle>Vị trí</CardTitle>
            <Location stats={stats} />
            <CardTitle>Quốc gia</CardTitle>
            <Country stats={stats} />
            <CardTitle>Thiết bị</CardTitle>
            <Device stats={stats} />
          </CardContent>) : (
            <CardContent>
              {loadingStats === false ? "Chưa có số liệu thống kê" : "Đang tải số liệu thống kê"}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Link
