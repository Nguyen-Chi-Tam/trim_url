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
import { resetPasswordForEmail } from '@/db/apiauth'
import { useNavigate } from 'react-router-dom'

const ForgotPassword = () => {
    const [errors, setErrors] = useState([])
    const [formData, setFormData] = useState({
        email: ""
    });
    const [message, setMessage] = useState("")

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    }
    const { data, error, loading, fn: fnReset } = useFetch(resetPasswordForEmail, formData.email);

    useEffect(() => {
        if (error === null && data) {
            setMessage("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.");
        }
    }, [data, error])

    const handleReset = async () => {
        setErrors([])
        setMessage("")
        try {
            const schema = Yup.object().shape({
                email: Yup.string().email("Email không hợp lệ").required("Email là bắt buộc")
            })
            await schema.validate(formData, { abortEarly: false })
            await fnReset(formData.email);
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
                <CardTitle>Quên mật khẩu</CardTitle>
                <CardDescription>Nhập email của bạn để đặt lại mật khẩu</CardDescription>
                {error && <Error message={error.message} />}
                {message && <p className="text-green-600">{message}</p>}
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="space-y-1">
                    <Input name="email" type="email" placeholder="Email"
                        onChange={handleInputChange} />
                    {errors.email && <Error message={errors.email} />}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full" onClick={handleReset}>
                    {loading ? <BeatLoader size={10} color="#5500ffff" /> : "Gửi email đặt lại"}
                </Button>
                <Button variant="link" onClick={() => navigate('/auth')}>
                    Quay lại đăng nhập
                </Button>
            </CardFooter>
        </Card>
    )
}

export default ForgotPassword
