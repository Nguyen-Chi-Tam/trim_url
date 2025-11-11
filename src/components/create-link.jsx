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
import ErrorMessage from "@/components/error"
import { Input } from "@/components/ui/input"
import * as Yup from 'yup';
import QRCode from 'react-qrcode-logo';
import useFetch from '@/hooks/use-fetch';
import { BeatLoader } from 'react-spinners'; // Added import
import { createUrl, checkCustomUrlExists, checkTitleExists, attachQrCode } from '@/db/apiUrl';
import ReCAPTCHA from 'react-google-recaptcha';

export function CreateLink(){
  const { user } = UrlState();
  const navigate = useNavigate()
  let [searchParams, setSearchParams] = useSearchParams()
  const longLink = searchParams.get("createNew");
  // Hidden QR generator for short URL post-creation
  const genRef = useRef()
  const [qrToGenerate, setQrToGenerate] = useState(null)
  const [open, setOpen] = useState(false);
  // Number pickers for expiration time (HH:MM:SS)
  const [expHours, setExpHours] = useState(0)
  const [expMinutes, setExpMinutes] = useState(10)
  const [expSeconds, setExpSeconds] = useState(0)

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
      setQrToGenerate(null);
      // reset pickers to default 00:10:00
      setExpHours(0);
      setExpMinutes(10);
      setExpSeconds(0);
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

  const handleTimePartChange = (part) => (e) => {
    const raw = parseInt(e.target.value, 10)
    const value = clamp(raw, part === 'h' ? 0 : 0, part === 'h' ? 23 : 59)
    let h = expHours, m = expMinutes, s = expSeconds
    if (part === 'h') { setExpHours(value); h = value }
    if (part === 'm') { setExpMinutes(value); m = value }
    if (part === 's') { setExpSeconds(value); s = value }
    setFormValues({ ...formValues, expirationTime: toTimeString(h, m, s) })
  }

  const [errors, setErrors] = useState({})
  const [formValues, setFormValues] = useState({
    title: "",
    longUrl: "",
    customUrl: "",
    isTemporary: false,
    expirationTime: "00:10:00" // default 10 minutes
  })

  // Helpers for time pickers and synchronization
  const clamp = (v, min, max) => Math.min(Math.max(Number.isFinite(v) ? v : 0, min), max)
  const pad2 = (n) => String(n).padStart(2, '0')
  const toTimeString = (h, m, s) => `${pad2(h)}:${pad2(m)}:${pad2(s)}`

  // Keep pickers in sync with stored hh:mm:ss
  useEffect(() => {
    if (!formValues?.expirationTime) return
    const [h = 0, m = 0, s = 0] = formValues.expirationTime.split(':').map((n) => parseInt(n, 10) || 0)
    setExpHours(clamp(h, 0, 23))
    setExpMinutes(clamp(m, 0, 59))
    setExpSeconds(clamp(s, 0, 59))
  }, [formValues.expirationTime, formValues.isTemporary])

  const {
    loading, error, data, fn: fnCreateUrl
  } = useFetch(createUrl, { ...formValues, user_id: user.id })

  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)

  // We'll navigate after QR attach completes, so skip navigating here.

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token)
    // Proceed with form submission after CAPTCHA verification
    createNewLink()
  }

  // helper: generate a QR blob for a given value using hidden canvas
  const generateQrBlob = (value) => new Promise((resolve, reject) => {
    setQrToGenerate(value)
    let attempts = 0
    const maxAttempts = 40 // ~40 frames
    const check = () => {
      const canvas = genRef.current?.canvasRef?.current
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to generate QR code"))
        })
        return
      }
      if (attempts++ < maxAttempts) {
        requestAnimationFrame(check)
      } else {
        reject(new Error("QR canvas not ready"))
      }
    }
    requestAnimationFrame(check)
  })

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
        const [h, m, s] = formValues.expirationTime.split(':').map(Number)
        if ((h + m + s) === 0) {
          throw new Error("Thời gian hết hạn phải lớn hơn 0 giây");
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

      // Step 1: Create URL record first (without QR)
      const created = await fnCreateUrl(null, expirationTime, captchaToken);
      const rec = created?.[0];
      if (!rec) throw new Error("Không nhận được dữ liệu đường link vừa tạo");

      // Step 2: Generate QR from short URL and attach
      const shortFull = `https://trimurlz.me/${rec.short_url}`;
      const blob = await generateQrBlob(shortFull);
      const file = new File([blob], "qrcode.png", { type: "image/png" });
      await attachQrCode({ id: rec.id, short_url: rec.short_url }, file);

      // Step 3: Go to detail page
      navigate(`/link/${rec.id}`);
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
          <DialogTitle className='text-2xl text-cyan-400 font-bold'>Tạo đường link mới nhú tại đây</DialogTitle>
          <DialogTitle>👇</DialogTitle>
        </DialogHeader>
        {/* Hidden QR generator for short URL (used post-creation) */}
        {qrToGenerate && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }} aria-hidden="true">
            <QRCode value={qrToGenerate} size={300} ref={genRef} />
          </div>
        )}
        <h2 className='font-bold '>Tiêu đề:</h2>
        <Input id="title" placeholder="Đặt cho nó một cái tên dễ nhớ"
          value={formValues.title}
          onChange={handleChange} />
  {errors.title && <ErrorMessage message={errors.title} />}

        <h2 className='font-bold'>Link gốc:</h2>
        <Input id="longUrl" placeholder="Đường link mà bạn cần cắt ngắn"
          value={formValues.longUrl}
          onChange={handleChange} />
  {errors.longUrl && <ErrorMessage message={errors.longUrl} />}

        <h2 className='font-bold'>Link tuỳ chỉnh (nếu bạn cần):</h2>
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">https://trimurlz.me/</span>
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
            <div className="flex items-center gap-2">
              <Input
                type="number"
                id="exp-hours"
                min={0}
                max={23}
                step={1}
                value={expHours}
                onChange={handleTimePartChange('h')}
                className="w-20 text-center"
              />
              <span>:</span>
              <Input
                type="number"
                id="exp-minutes"
                min={0}
                max={59}
                step={1}
                value={expMinutes}
                onChange={handleTimePartChange('m')}
                className="w-20 text-center"
              />
              <span>:</span>
              <Input
                type="number"
                id="exp-seconds"
                min={0}
                max={59}
                step={1}
                value={expSeconds}
                onChange={handleTimePartChange('s')}
                className="w-20 text-center"
              />
            </div>
            {errors.expirationTime && <ErrorMessage message={errors.expirationTime} />}
          </>
        )}

  {error && <ErrorMessage message={normalizeErrorMessage(error)} />}
  {errors.general && <ErrorMessage message={errors.general} />}

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
