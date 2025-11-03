import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Login from '@/components/login'
import { useNavigate } from 'react-router-dom'
import Signup from '@/components/signup'
import { useEffect } from 'react'
import { UrlState } from '@/context.jsx'
import { ensureUserMetadataFromProvider } from '@/db/apiauth'

const Auth = () => {
  const [searchParams] = useSearchParams()
  const longLink = searchParams.get("createNew")
  const navigate = useNavigate()

  const { isAuthenticated, loading } = UrlState();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      (async () => {
        try {
          await ensureUserMetadataFromProvider();
        } catch (e) {
          // Non-fatal: proceed to app even if profile sync fails
          console.warn('ensureUserMetadataFromProvider failed:', e?.message || e);
        } finally {
          navigate(`/dashboard?${longLink ? `createNew=${longLink}` : ""}`);
        }
      })();
    }
  }, [isAuthenticated, loading])
  return (
    <div className='mt-40 flex flex-col items-center'>
      <h1 className="text-2xl font-extrabold">
        {longLink ? "Từ từ! Hãy đăng nhập đi đã bạn ơi 🙅‍♂️"
          : "Đăng nhập/Đăng ký"}
      </h1>
      <Tabs defaultValue="login" className="w-[400px] mt-10">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Đăng nhập</TabsTrigger>
          <TabsTrigger value="signup">Đăng ký</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Login />
        </TabsContent>
        <TabsContent value="signup">
          <Signup />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Auth
