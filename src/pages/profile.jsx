import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UrlState } from '@/context.jsx';
import { updateUser } from '@/db/apiauth';
import supabase, { supabaseUrl } from '@/db/supabase';
import { compressImage } from '@/lib/utils';
import { BarLoader } from 'react-spinners';
import Error from '@/components/error';

const Profile = () => {
  const { user, fetchuser } = UrlState();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  // No separate uploading state; use loading for both

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updates = {};
      let hasChanges = false;

      // Handle name update
      if (name !== user?.user_metadata?.name) {
        updates.data = { ...updates.data, name };
        hasChanges = true;
      }

      // Handle profile pic update if file selected
      if (selectedFile) {
        let usedFallback = false;
        let postAlertMessage = 'Cập nhật thông tin thành công';
        // 1) Delete current avatar in Tebi if it's not the default image and is within our bucket
        const currentUrl = user?.user_metadata?.profile_pic || '';
        const bucket = 'profilepic';
        const publicPrefix = `https://s3.tebi.io/${bucket}/`;
        const isDefault = currentUrl.endsWith('default_user.png');
        let deletedOld = false;
        if (currentUrl.startsWith(publicPrefix) && !isDefault) {
          const fileName = currentUrl.split('/').pop(); // get filename from URL
          try {
            // Call backend API to delete old profile pic using correct endpoint for production (Cloudflare Worker)
            await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/delete-qr`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
              },
              body: JSON.stringify({ bucket, key: fileName })
            });
            deletedOld = true;
          } catch (delEx) {
            console.warn('Error deleting old avatar:', delEx?.message || delEx);
          }
        }

        // 2) Compress and upload new image
        let toUpload = selectedFile;
        try {
          toUpload = await compressImage(selectedFile, 5 * 1024, 400);
        } catch (e) {
          console.warn('Profile pic compression failed on profile update, uploading original', e);
          toUpload = selectedFile;
        }

        // Convert to Uint8Array for AWS SDK
        if (!(toUpload instanceof Uint8Array)) {
          if (toUpload instanceof Blob || toUpload instanceof File) {
            const arrayBuffer = await toUpload.arrayBuffer();
            toUpload = new Uint8Array(arrayBuffer);
          } else {
            toUpload = new Uint8Array(toUpload);
          }
        }

        // Keep file extension if possible (prefer blob type)
        const guessedExt = toUpload.type?.split('/')?.pop() || selectedFile.name?.split('.')?.pop() || 'jpg';
        const safeBase = (user?.id || user?.user_metadata?.name || 'user').toString().replace(/\s+/g, '_');
        const fileName = `dp-${safeBase}-${Date.now()}.${guessedExt}`;
        let uploadedUrl = null;
        let uploadError = null;
        try {
          const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
          const s3 = new S3Client({
            region: 'us-east-1',
            endpoint: 'https://s3.tebi.io',
            credentials: {
              accessKeyId: import.meta.env.VITE_TEBI_ACCESS_KEY,
              secretAccessKey: import.meta.env.VITE_TEBI_SECRET_KEY,
            },
          });
          await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: fileName,
            Body: toUpload,
            ContentType: selectedFile.type || 'image/png',
          }));
          uploadedUrl = `https://s3.tebi.io/${bucket}/${fileName}`;
        } catch (err) {
          uploadError = err;
        }

        if (uploadError) {
          // If upload fails and we already deleted old one, fall back to default avatar and continue
          if (deletedOld) {
            const fallbackUrl = `https://s3.tebi.io/${bucket}/default_user.png`;
            updates.data = { ...updates.data, profile_pic: fallbackUrl };
            hasChanges = true;
            usedFallback = true;
            postAlertMessage = 'Ảnh mới tải lên thất bại, hệ thống đã đặt lại ảnh mặc định. Các thông tin khác đã được cập nhật.';
          } else {
            throw new Error(uploadError.message);
          }
        }

        // 3) Build new public URL and update metadata if upload succeeded
        if (!uploadError) {
          updates.data = { ...updates.data, profile_pic: uploadedUrl };
          hasChanges = true;
        }
        setSelectedFile(null); // Clear after upload

        // If we used fallback, preserve message via closure for later alert
        if (usedFallback) {
          // attach for outer scope alert usage by mutating a property
          updates.__postAlertMessage = postAlertMessage;
        }
      }

      if (hasChanges) {
        // Extract possible post alert message
        const postMsg = updates.__postAlertMessage;
        if ('__postAlertMessage' in updates) delete updates.__postAlertMessage;
        await updateUser(updates);
        await fetchuser(); // Refresh user data
        alert(postMsg || 'Cập nhật thông tin thành công');
      } else {
        alert('Không có thay đổi nào');
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

  return (
    <div className="flex flex-col gap-8 mb-10 mt-30">
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
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-sm w-full"
                      disabled={loading}
                    />
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
                <Button type="submit" disabled={loading || (!name.trim() && !selectedFile)}>
                  {loading ? 'Đang xử lý...' : 'Thay đổi'}
                </Button>
                <Button type="button" variant="outline" onClick={handleChangePassword} disabled={loading}>
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
