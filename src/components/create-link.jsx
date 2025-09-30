import { UrlState } from '@/context'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Error from "@/components/error"
import { Input } from "@/components/ui/input"
import * as Yup from 'yup';
import QRCode from 'react-qrcode-logo';
import useFetch from '@/hooks/use-fetch';
import { BeatLoader } from 'react-spinners'; // Added import
import { createUrl, checkCustomUrlExists, checkTitleExists } from '@/db/apiUrl';
import ReCAPTCHA from 'react-google-recaptcha';

export function CreateLink(){
  const { user } = UrlState();
  const navigate = useNavigate()
  let [searchParams, setSearchParams] = useSearchParams()
  const longLink = searchParams.get("createNew");
  const ref = useRef()
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (longLink) {
      setOpen(true);
    }
  }, [longLink]);

  useEffect(() => {
    if (open) {
      setFormValues({
        title: "",
        longUrl: longLink || "",
        customUrl: "",
        isTemporary: false,
        expirationTime: "00:10:00"
      });
      setShowCaptcha(false);
      setCaptchaToken(null);
      setErrors({});
    }
  }, [open]);

  const schema = Yup.object().shape({
    title: Yup.string().required("Nhập tên đi cho dễ nhớ :)"),
    longUrl: Yup.string().required("Bạn đã nhập link chưa?"),
    customUrl: Yup.string(),
    isTemporary: Yup.boolean(),
    expirationTime: Yup.string(),
  })

  const handleChange = (e) => {
    setFormValues({
      ...formValues,
      [e.target.id]: e.target.value,
    })
  }

  const [errors, setErrors] = useState({})
  const [formValues, setFormValues] = useState({
    title: "",
    longUrl: "",
    customUrl: "",
    isTemporary: false,
    expirationTime: "00:10:00" // default 10 minutes
  })

  const {
    loading, error, data, fn: fnCreateUrl
  } = useFetch(createUrl, { ...formValues, user_id: user.id })

  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)

  useEffect(() => {
    if (error === null && data) {
      navigate(`/link/${data[0].id}`);
    }
  }, [error, data])

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token)
    // Proceed with form submission after CAPTCHA verification
    createNewLink()
  }

  const createNewLink = async () => {
    setErrors({});
    try {
      await schema.validate(formValues, {abortEarly: false});

      if (formValues.isTemporary) {
        if (!formValues.expirationTime) {
          throw new Error("Nhập thời gian hết hạn (hh:mm:ss)");
        }
        if (!/^\d{2}:\d{2}:\d{2}$/.test(formValues.expirationTime)) {
          throw new Error("Định dạng phải là hh:mm:ss");
        }
      }

      // Check for duplicate title
      const titleExists = await checkTitleExists(formValues.title, user.id);
      if (titleExists) {
        throw new Error("Tiêu đề này đã được sử dụng. Vui lòng chọn tiêu đề khác.");
      }

      // Check for duplicate customUrl
      if (formValues.customUrl) {
        const exists = await checkCustomUrlExists(formValues.customUrl, user.id);
        if (exists) {
          throw new Error("Link tùy chỉnh này đã được sử dụng. Vui lòng chọn tên khác.");
        }
      }

      let expirationTime = null;
      if (formValues.isTemporary) {
        const [hours, minutes, seconds] = formValues.expirationTime.split(':').map(Number);
        const now = new Date();
        now.setHours(now.getHours() + hours);
        now.setMinutes(now.getMinutes() + minutes);
        now.setSeconds(now.getSeconds() + seconds);
        expirationTime = now.toISOString();
      }

      const canvas = ref.current.canvasRef.current;
      if (!canvas) {
        throw new Error("Failed to generate QR code");
      }
      const blob = await new Promise((resolve, reject) => canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate QR code"));
      }));

      // Wrap blob as a File with filename and type for Supabase storage upload
      const file = new File([blob], "qrcode.png", { type: "image/png" });

      await fnCreateUrl(file, expirationTime, captchaToken);
    } catch (e) {
      const newErrors = {};

      if (e?.inner) {
        e.inner.forEach((err) => {
          newErrors[err.path] = err.message;
        });
      } else {
        newErrors.general = e.message || "An error occurred during link creation";
      }

      setErrors(newErrors);
    }
  }

  const handleSubmit = () => {
    if (!formValues.longUrl.trim()) {
      setErrors({ longUrl: "Bạn đã nhập link chưa?" });
    } else {
      setErrors({});
      setShowCaptcha(true);
    }
  }

  const normalizeErrorMessage = (error) => {
    if (!error) return null;
    const msg = error.message || error.toString();

    if (msg.includes("not a constructor")) {
      return "Đã xảy ra lỗi không xác định. Vui lòng thử lại hoặc liên hệ quản trị viên.";
    }
    // Add more custom error message mappings here if needed

    return msg;
  };

  return (
    <Dialog open={open} onOpenChange={(res) => { setOpen(res); if (!res) setSearchParams({}); }}>
      <DialogTrigger>
        <Button variant='destructive'>+</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {formValues.longUrl && <QRCode value={formValues.longUrl} size={250} ref={ref} />}
          <DialogTitle className='text-2xl text-cyan-400 font-bold'>Tạo đường link mới nhú tại đây</DialogTitle>
          <DialogTitle>👇</DialogTitle>
        </DialogHeader>
        <h2 className='font-bold '>Tiêu đề:</h2>
        <Input id="title" placeholder="Đặt cho nó một cái tên dễ nhớ"
          value={formValues.title}
          onChange={handleChange} />
        {errors.title && <Error message={errors.title} />}

        <h2 className='font-bold'>Link gốc:</h2>
        <Input id="longUrl" placeholder="Đường link mà bạn cần cắt ngắn"
          value={formValues.longUrl}
          onChange={handleChange} />
        {errors.longUrl && <Error message={errors.longUrl} />}

        <h2 className='font-bold'>Link tuỳ chỉnh (nếu bạn cần):</h2>
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">https://trimurl.id.vn/</span>
          <Input
            id="customUrl"
            placeholder="(...)"
            value={formValues.customUrl}
            onChange={handleChange}
            className="flex-1"
          />
        </div>

        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            id="isTemporary"
            checked={formValues.isTemporary}
            onChange={(e) => setFormValues({ ...formValues, isTemporary: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="isTemporary" className="font-bold">Link tạm thời</label>
        </div>

        {formValues.isTemporary && (
          <>
            <h2 className='font-bold mt-2'>Thời gian hết hạn (hh:mm:ss):</h2>
            <Input
              id="expirationTime"
              placeholder="00:10:00"
              value={formValues.expirationTime}
              onChange={handleChange}
            />
            {errors.expirationTime && <Error message={errors.expirationTime} />}
          </>
        )}

        {error && <Error message={normalizeErrorMessage(error)} />}
        {errors.general && <Error message={errors.general} />}

        {/* CAPTCHA Verification */}
        {showCaptcha && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-bold mb-2 text-center">Xác minh CAPTCHA</h3>
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"} // Official test key as fallback
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
