import React, { useState, useEffect } from 'react'
import { BarLoader } from 'react-spinners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, ChevronDown } from 'lucide-react';
import Error from '@/components/error';
import { deleteBio, fetchBiosByUser } from '@/db/apiBio';
import { UrlState } from '@/context.jsx';
import BioCard from '@/components/ui/biocard';
import CreateBio from '@/components/create-bio';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BioPages = () => {
  const { user } = UrlState();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bioPages, setBioPages] = useState([]);

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("User object in fetchData:", user);
      console.log("User ID in fetchData:", user?.id);
      if (user?.id) {
        const bios = await fetchBiosByUser(user.id);
        setBioPages(bios);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const [pageLoaded, setPageLoaded] = useState(false);
  useEffect(() => {
    setPageLoaded(false);
    const timer = setTimeout(() => setPageLoaded(true), 400);
    return () => clearTimeout(timer);
  }, [currentPage]);
  const filteredData = bioPages.filter(item =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedData = (() => {
    if (!filteredData) return [];
    const sortFn = (a, b) => {
      let compare = 0;
      if (sortBy === "name") {
        compare = a.title.localeCompare(b.title);
      } else if (sortBy === "created") {
        compare = new Date(a.created_at) - new Date(b.created_at);
      }
      return sortOrder === "asc" ? compare : -compare;
    };
    return filteredData.slice().sort(sortFn);
  })();

  const totalPages = Math.ceil((sortedData?.length || 0) / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id) => {
    try {
      await deleteBio(id);
      fetchData(); // Refresh the list after deletion
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="flex flex-col gap-8 mb-10 mt-36">
      {loading && <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}
      <div className='ml-10 mr-10 flex justify-between'>
        <h1 className='text-4xl font-extrabold'>Các trang bio của tôi</h1>
        <CreateBio onCreate={fetchData}/>
      </div>
      <div className='ml-10 mr-10 relative flex items-center gap-4'>
        <Input type="text" placeholder="Tìm kiếm" className="w-full pr-10"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <Filter className="absolute top-2 right-2 p-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              Sắp xếp <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="w-48">
            <DropdownMenuRadioGroup value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [newSortBy, newSortOrder] = value.split("-");
              setPageLoaded(false);
              setTimeout(() => {
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setPageLoaded(true);
              }, 400);
            }}>
              <DropdownMenuRadioItem value="name-asc">(A-Z)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-desc">(Z-A)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created-asc">Cũ nhất</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created-desc">Mới nhất</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='ml-10 mr-10'>
        {error && <Error message={error?.message}></Error>}
        {paginatedData.length === 0 && !loading && <p>Không có gì trong này cả</p>}
        <div className="flex flex-row flex-wrap gap-4 justify-center">
          {paginatedData.map((item) => (
            <BioCard key={item.id} bio={item} onDelete={handleDelete} fetchBios={fetchData} pageLoaded={pageLoaded} />
          ))}
        </div>
      </div>
      <div className='ml-10 mr-10 flex justify-center items-center gap-4 mb-5'>
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPageLoaded(false);
            setCurrentPage(1);
          }}
        >
          Đầu
        </Button>
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPageLoaded(false);
            setCurrentPage(currentPage - 1);
          }}
        >
          Trước
        </Button>
        <span>Trang {currentPage}/{totalPages}</span>
        <Button
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPageLoaded(false);
            setCurrentPage(currentPage + 1);
          }}
        >
          Tiếp
        </Button>
        <Button
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPageLoaded(false);
            setCurrentPage(totalPages);
          }}
        >
          Cuối
        </Button>
      </div>
    </div>
  )
}

export default BioPages
