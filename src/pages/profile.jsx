import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UrlState } from '@/context.jsx';
import { updateUser } from '@/db/apiauth';
import supabase, { supabaseUrl } from '@/db/supabase';
import { BarLoader } from 'react-spinners';
import Error from '@/components/error';

const Profile = () => {
  const { user, fetchuser } = UrlState();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updates = {};
      if (name !== user?.user_metadata?.name) {
        updates.data = { name };
      }
      if (Object.keys(updates).length > 0) {
        await updateUser(updates);
        await fetchuser(); // Refresh user data
        alert('Cập nhật thông tin thành công');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    navigate('/forgot-password');
  };

  const handleChangeProfilePic = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const fileName = `dp-${user.user_metadata.name.split(" ").join("_")}-${Math.random()}`;
      const { error: storageErr } = await supabase.storage.from("profile_pic").upload(fileName, selectedFile);
      if (storageErr) throw new Error(storageErr.message);
      const profilePicUrl = `${supabaseUrl}/storage/v1/object/public/profile_pic/${fileName}`;
      await updateUser({ data: { profile_pic: profilePicUrl } });
      await fetchuser();
      alert('Ảnh đại diện đã được cập nhật thành công');
      setSelectedFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 mb-10 mt-10">
      {loading && <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}
      <div className='ml-10 mr-10 mt-5'>
        <Card>
          <CardHeader>
            <CardTitle className={"text-2xl font-bold"}>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left dark:text-white">Ảnh đại diện</label>
                <div className="flex items-center gap-4 mt-2">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user?.user_metadata?.profile_pic} alt="Profile Picture" />
                    <AvatarFallback>{user?.user_metadata?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleChangeProfilePic}
                      disabled={!selectedFile || uploading}
                      size="sm"
                    >
                      {uploading ? 'Đang tải lên...' : 'Thay đổi ảnh đại diện'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left mb-2 dark:text-white">Tên</label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Thay đổi'}
                </Button>
                <Button type="button" variant="outline" onClick={handleChangePassword}>
                  Đổi mật khẩu
                </Button>
              </div>
            </form>
            {error && <Error message={error} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
