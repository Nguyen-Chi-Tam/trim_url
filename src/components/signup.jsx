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
import { signup } from '@/db/apiauth'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { UrlState } from '@/context.jsx'

const Signup = () => {
    const [errors, setErrors] = useState([])
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        profile_pic: null
    });

    const navigate = useNavigate();
    let [searchParams] = useSearchParams();
    const longLink = searchParams.get("createNew");

    const handleInputChange = (e) => {
        const { name, value, files } = e.target
        setFormData((prevState) => ({
            ...prevState,
            [name]: files ? files[0] : value
        }));
    }
    const { data, error, loading, fn: fnSignup } = useFetch(signup, formData);
    const { fetchuser } = UrlState();
    useEffect(() => {
        console.log("Data:", data);
        if (error === null && data) {
            navigate(`/dashboard?${longLink ? `createNew=${longLink}` : ""}`);
            fetchuser();
        }
    }, [error, loading])

    const handleSignup = async () => {
        setErrors([])
        try {
            const schema = Yup.object().shape({
                name: Yup.string().required("Tên là bắt buộc"),
                email: Yup.string().email("Email không hợp lệ").required("Email là bắt buộc"),
                password: Yup.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").required("Mật khẩu là bắt buộc"),
            })
            await schema.validate(formData, { abortEarly: false })
            await fnSignup();
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
                <CardTitle>Đăng ký</CardTitle>
                <CardDescription>Chào mừng bạn mới đến với TrimURL</CardDescription>
                {error && <Error message={error.message} />}
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="space-y-1">
                    <Input name="name" type="text" placeholder="Tên của bạn là gì?"
                        onChange={handleInputChange} />
                    {errors.name && <Error message={errors.name} />}
                </div>
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
                <div className="space-y-1">
                    <Input name="profile_pic" type="file" accept="image/*"
                        onChange={handleInputChange} />
                    {errors.profile_pic && <Error message={errors.profile_pic} />}
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleSignup}>
                    {loading ? <BeatLoader size={10} color="#5500ffff" /> : "Tạo tài khoản mới"}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default Signup
