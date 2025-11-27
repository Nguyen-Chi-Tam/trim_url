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
import { login, loginWithGoogle } from '@/db/apiauth'
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
    const { error: gErr, loading: gLoading, fn: fnGoogle } = useFetch(loginWithGoogle);
    
    // Map raw auth error messages to friendlier, actionable Vietnamese messages
    const mapAuthErrorMessage = (raw) => {
        if (!raw) return null;
        const msg = (raw.message || raw.toString() || '').trim();
        const lower = msg.toLowerCase();
        if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
            return 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại, hoặc nhấn “Quên mật khẩu?” nếu bạn cần đặt lại.';
        }
        if (lower.includes('email not confirmed') || lower.includes('confirm') && lower.includes('email')) {
            return 'Email của bạn chưa được xác nhận. Hãy kiểm tra hộp thư (kể cả Spam) để tìm email kích hoạt, rồi thử đăng nhập lại.';
        }
        if (lower.includes('too many') || lower.includes('rate limit') || lower.includes('rate-limited')) {
            return 'Bạn đã thử quá nhiều lần trong thời gian ngắn. Vui lòng đợi một chút rồi đăng nhập lại.';
        }
        if (lower.includes('fetch') || lower.includes('network') || lower.includes('timeout')) {
            return 'Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng hoặc thử lại sau.';
        }
        if (lower.includes('refresh token') && lower.includes('expired')) {
            return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.';
        }
        return `Không đăng nhập được: ${msg}`;
    };
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
    const handleGoogle = async () => {
        const redirectPath = `/auth${longLink ? `?createNew=${encodeURIComponent(longLink)}` : ''}`;
        // This will redirect away; no need to await fetchuser here.
        await fnGoogle({ redirectPath });
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>Đăng nhập</CardTitle>
                <CardDescription>Chào mừng bạn cũ quay lại TrimURL</CardDescription>
                {error && <Error message={mapAuthErrorMessage(error)} />}
                {gErr && <Error message={mapAuthErrorMessage(gErr)} />}
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
            <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full" onClick={handleLogin}>
                    {loading ? <BeatLoader size={10} color="#5500ffff" /> : "Đăng nhập"}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={gLoading}>
                    {gLoading ? <BeatLoader size={10} color="#5500ffff" /> : "Đăng nhập với Google"}
                </Button>
                <Button variant="link" onClick={() => navigate('/forgot-password')}>
                    Quên mật khẩu?
                </Button>
            </CardFooter>
        </Card>
    )
}

export default Login
