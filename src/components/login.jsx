import React from 'react'
import {
    Card,
    CardAction,
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
import { login } from '@/db/apiauth'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { UrlState } from '@/context.jsx'

const Login = () => {
    const [errors, setErrors] = useState([])
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const navigate=useNavigate();
    let[searchParams] = useSearchParams();
    const longLink = searchParams.get("createNew");

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    }
    const { data, error, loading, fn: fnLogin } = useFetch(login, formData);
    const {fetchuser} =  UrlState();
    useEffect(() => {
        if (error === null && data) {
            navigate(`/dashboard?${longLink? `createNew=${longLink}` : ""}`);
            fetchuser();
        }
    },[data,error])

    const handleLogin = async () => {
        setErrors([])
        try {
            const schema = Yup.object().shape({
                email: Yup.string().email("Email không hợp lệ").required("Email là bắt buộc"),
                password: Yup.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").required("Mật khẩu là bắt buộc")
            })
            await schema.validate(formData, { abortEarly: false })
            //api
            await fnLogin(formData);
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
                <CardTitle>Đăng nhập</CardTitle>
                <CardDescription>Chào mừng bạn cũ quay lại TrimURL</CardDescription>
                {error && <Error message={error.message} />}
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="space-y-1">
                    <Input name="email" type="email" placeholder="Email"
                        onChange={handleInputChange} />
                    {errors.email && <Error message={errors.email} />}
                </div>
                <div className="space-y-1">
                    <Input name="password" type="password" placeholder="Mật khẩu"
                        onChange={handleInputChange} />
                    {errors.password && <Error message={errors.password} />}
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleLogin}>
                    {loading ? <BeatLoader size={10} color="#5500ffff" /> : "Đăng nhập"}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default Login
