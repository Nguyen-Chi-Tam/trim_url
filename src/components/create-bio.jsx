import React, { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Error from '@/components/error'
import useFetch from '@/hooks/use-fetch'
import { createBioPage } from '@/db/apiBio'
import { BeatLoader } from 'react-spinners'
import { UrlState } from '@/context'

const CreateBio = ({ onCreate }) => {
  const { user } = UrlState()
  const [open, setOpen] = useState(false)
  const [formValues, setFormValues] = useState({
    title: '',
    profilePic: null,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)

  useEffect(() => {
    if (open) {
      setFormValues({
        title: '',
        profilePic: null,
      })
      setErrors({})
      setShowCaptcha(false);
      setCaptchaToken(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null
      }
    }
  }, [open])

  const handleChange = (e) => {
    const { id, value, files } = e.target
    if (id === 'profilePic') {
      setFormValues(prev => ({ ...prev, profilePic: files[0] }))
    } else {
      setFormValues(prev => ({ ...prev, [id]: value }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formValues.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc'
    }
    if (!formValues.profilePic) {
      newErrors.profilePic = 'Ảnh đại diện là bắt buộc'
    } else if (!formValues.profilePic.type.startsWith('image/')) {
      newErrors.profilePic = 'Tệp phải là ảnh'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token);
    createNewBio();
  }

  const createNewBio = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const data = await createBioPage({
        title: formValues.title,
        profilePic: formValues.profilePic,
        user_id: user.id,
        captchaToken,
      });
      setLoading(false);
      setOpen(false);
      if (onCreate) {
        onCreate(data);
      }
    } catch (error) {
      setLoading(false);
      setErrors({ general: error.message || 'Lỗi khi tạo trang bio' });
    }
  }

  const handleSubmit = () => {
    if (!validate()) return;
    setErrors({});
    setShowCaptcha(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant='destructive'>+</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className='text-2xl text-cyan-400 font-bold'>Tạo trang bio mới nhú tại đây</DialogTitle>
          <DialogTitle>👇</DialogTitle>
        </DialogHeader>
        <h2 className='font-bold '>Tiêu đề:</h2>
        <Input
          id="title"
          placeholder="Đặt cho nó một cái tên dễ nhớ"
          value={formValues.title}
          onChange={handleChange}
        />
        {errors.title && <Error message={errors.title} />}
        <h2 className='font-bold mt-4'>Ảnh đại diện:</h2>
        <Input
          id="profilePic"
          type="file"
          accept="image/*"
          onChange={handleChange}
          ref={fileInputRef}
        />
        {errors.profilePic && <Error message={errors.profilePic} />}
        {errors.general && <Error message={errors.general} />}
        {/* CAPTCHA Verification */}
        {showCaptcha && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-bold mb-2 text-center">Xác minh CAPTCHA</h3>
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
              onChange={handleCaptchaVerify}
              className="flex justify-center"
            />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Vui lòng xác minh bạn không phải là robot
            </p>
          </div>
        )}
        <DialogFooter className='sm: justify-start'>
          <Button disabled={loading} type="submit" onClick={handleSubmit}>
            {loading ? <BeatLoader size={10} color="#5500ffff" /> : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import ReCAPTCHA from 'react-google-recaptcha';
export default CreateBio
