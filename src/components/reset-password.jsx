import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BeatLoader } from "react-spinners"
import Error from "@/components/error"
import { useState, useEffect } from 'react'
import * as Yup from 'yup'
import useFetch from '@/hooks/use-fetch'
import { updateUser } from '@/db/apiauth'
import { useNavigate, useSearchParams } from 'react-router-dom'
import supabase from '@/db/supabase'

const ResetPassword = () => {
    const [errors, setErrors] = useState([])
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: ""
    });
    const [message, setMessage] = useState("")

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        } else {
            setMessage("Liên kết không hợp lệ hoặc đã hết hạn.");
        }
    }, [searchParams]);

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    }

    const { data, error, loading, fn: fnUpdate } = useFetch(updateUser, { password: formData.password });

    useEffect(() => {
        if (error === null && data) {
            setMessage("Mật khẩu đã được cập nhật thành công. Đang chuyển hướng...");
            setTimeout(() => navigate('/auth'), 2000);
        }
    }, [data, error, navigate])

    const handleReset = async () => {
        setErrors([])
        setMessage("")
        try {
            const schema = Yup.object().shape({
                password: Yup.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").required("Mật khẩu là bắt buộc"),
                confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], "Mật khẩu xác nhận không khớp").required("Xác nhận mật khẩu là bắt buộc")
            })
            await schema.validate(formData, { abortEarly: false })
            await fnUpdate({ password: formData.password });
        } catch (error) {
            const newErrors = {};
            error?.inner?.forEach((err) => {
                newErrors[err.path] = err.message;
            })
            setErrors(newErrors);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Đặt lại mật khẩu</CardTitle>
                <CardDescription>Nhập mật khẩu mới của bạn</CardDescription>
                {error && <Error message={error.message} />}
                {message && <p className="text-green-600">{message}</p>}
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="space-y-1">
                    <Input name="password" type="password" placeholder="Mật khẩu mới"
                        onChange={handleInputChange} />
                    {errors.password && <Error message={errors.password} />}
                </div>
                <div className="space-y-1">
                    <Input name="confirmPassword" type="password" placeholder="Xác nhận mật khẩu"
                        onChange={handleInputChange} />
                    {errors.confirmPassword && <Error message={errors.confirmPassword} />}
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleReset}>
                    {loading ? <BeatLoader size={10} color="#5500ffff" /> : "Cập nhật mật khẩu"}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default ResetPassword
