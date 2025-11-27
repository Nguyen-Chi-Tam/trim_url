import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarLoader, BeatLoader } from 'react-spinners';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Error from '@/components/error';
import { getAllUsers, getAllUrls, getAllBioPages, getAdmin } from '@/db/apiAdmin';

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [urls, setUrls] = useState([]);
  const [bioPages, setBioPages] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminStatus = await getAdmin();
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          navigate('/dashboard');
        }
      } catch (err) {
        setError(err);
        navigate('/dashboard');
      } finally {
        setCheckingStatus(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  useEffect(() => {
    if (!checkingStatus && isAdmin) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [usersData, urlsData, bioPagesData] = await Promise.all([
            getAllUsers(),
            getAllUrls(),
            getAllBioPages()
          ]);
          setUsers(usersData);
          setUrls(urlsData);
          setBioPages(bioPagesData);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [checkingStatus, isAdmin]);

  if (checkingStatus || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <BeatLoader color="#36d7b7" />
      </div>
    );
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <div className="flex flex-col gap-8 mb-10 mt-30 p-10">
      <h1 className="text-4xl font-extrabold text-center">Admin Dashboard</h1>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Tên</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 hover:text-black">
                    <td className="border border-gray-300 px-4 py-2">{user.id}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      {/* URLs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách URLs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Tiêu đề</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">URL gốc</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">URL ngắn</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">URL tùy chỉnh</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Ngày tạo</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Số lượt click</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Người tạo</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((url) => {
                  const user = users.find(u => u.id === url.user_id);
                  return (
                    <tr key={url.id} className="hover:bg-gray-50 hover:text-black">
                      <td className="border border-gray-300 px-4 py-2">{url.title}</td>
                      <td className="border border-gray-300 px-4 py-2 max-w-xs truncate">{url.original_url}</td>
                      <td className="border border-gray-300 px-4 py-2">{url.short_url}</td>
                      <td className="border border-gray-300 px-4 py-2">{url.custom_url || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{new Date(url.created_at).toLocaleDateString()}</td>
                      <td className="border border-gray-300 px-4 py-2">{url.clicks_count}</td>
                      <td className="border border-gray-300 px-4 py-2">{user ? user.name : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bio Pages Section */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Bio Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Tiêu đề</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Mô tả</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Ngày tạo</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">URLs trong Bio</th>
                  <th className="border border-gray-300 px-4 py-2 text-black text-left">Người tạo</th>
                </tr>
              </thead>
              <tbody>
                {bioPages.map((bio) => {
                  const user = users.find(u => u.id === bio.user_id);
                  return (
                    <tr key={bio.bio_page_id} className="hover:bg-gray-50 hover:text-black">
                      <td className="border border-gray-300 px-4 py-2">{bio.title}</td>
                      <td className="border border-gray-300 px-4 py-2 text-left whitespace-pre-wrap">{bio.description || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{new Date(bio.created_at).toLocaleDateString()}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {bio.urls.length > 0 ? (
                          <ul className="list-disc list-inside text-left">
                            {bio.urls.map((url, idx) => (
                              <li key={idx}>
                                {url.url_title} ({url.short_url})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{user ? user.name : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
