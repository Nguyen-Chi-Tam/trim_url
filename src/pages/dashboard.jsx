import React from 'react'
import { BarLoader } from 'react-spinners';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import Error from '@/components/error';
import useFetch from '@/hooks/use-fetch';
import { getUrls } from '@/db/apiUrl';
import { UrlState } from '@/context.jsx';
import { getClicksForUrls } from '@/db/apiClick';
import LinkCard from '@/components/ui/linkcard';
import { CreateLink } from "@/components/create-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = UrlState()
  const { loading, error, data: urls, fn: fnUrls } = useFetch(getUrls, user?.id)
  const {
    loading: loadingClicks,
    data: clicks,
    fn: fnClicks
  } = useFetch(getClicksForUrls, urls?.map(url => url.id)
  )
  useEffect(() => {
    fnUrls();
  }, []);

  useEffect(() => {
    if (urls?.length > 0) {
      fnClicks();
    }
  }, [urls?.length]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const [pageLoaded, setPageLoaded] = useState(false);
  useEffect(() => {
    setPageLoaded(false);
    const timer = setTimeout(() => setPageLoaded(true), 400);
    return () => clearTimeout(timer);
  }, [currentPage]);
  const filteredUrls = urls?.filter(url => url.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const sortedUrls = (() => {
    if (!filteredUrls) return [];
    const tempUrls = filteredUrls.filter(url => url.is_temporary);
    const nonTempUrls = filteredUrls.filter(url => !url.is_temporary);

    const sortFn = (a, b) => {
      let compare = 0;
      if (sortBy === "name") {
        compare = a.title.localeCompare(b.title);
      } else if (sortBy === "created") {
        compare = new Date(a.created_at) - new Date(b.created_at);
      }
      return sortOrder === "asc" ? compare : -compare;
    };

    const sortedTemp = tempUrls.slice().sort(sortFn);
    const sortedNonTemp = nonTempUrls.slice().sort(sortFn);

    return [...sortedTemp, ...sortedNonTemp];
  })();

  const itemsPerPage = 8;
  const totalPages = Math.ceil((sortedUrls?.length || 0) / itemsPerPage);

  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedUrls = sortedUrls?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col gap-8 mb-10 mt-30">
      {loading || loadingClicks && <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />}
      <div className='ml-10 mr-10 mt-5 grid grid-cols-2 gap-4'>
        <Card>
          <CardHeader>
            <CardTitle>Các đường link đã tạo</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{urls?.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tổng số lượt click</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{clicks?.length}</p>
          </CardContent>
        </Card>
      </div>
      <div className='ml-10 mr-10 flex justify-between'>
        <h1 className='text-4xl font-extrabold'>Các đường link của tôi</h1>
        <CreateLink/>
      </div>
      <div className='ml-10 mr-10 relative flex items-center gap-4'>
        <Input type="text" placeholder="Tìm kiếm..." className="w-full pr-10"
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
        {(paginatedUrls || []).map((url, i) => (
          <LinkCard key={i} url={url} fetchUrls={fnUrls} pageLoaded={pageLoaded}/>
        ))}
      </div>
      <div className='ml-10 mr-10 flex justify-center items-center gap-4 mb-5'>
        <Button
          variant="outline"
          disabled={currentPage === 1}
          style={{ minWidth: '72px' }}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPageLoaded(false);
            setTimeout(() => setCurrentPage(1), 400);
          }}
        >
          Đầu
        </Button>
        <Button
          variant="outline"
          disabled={currentPage === 1}
          style={{ minWidth: '72px' }}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPageLoaded(false);
            setTimeout(() => setCurrentPage(currentPage - 1), 400);
          }}
        >
          Trước
        </Button>
        <span>Trang {currentPage}/{totalPages}</span>
        <Button
          variant="outline"
          disabled={currentPage === totalPages}
          style={{ minWidth: '72px' }}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPageLoaded(false);
            setTimeout(() => setCurrentPage(currentPage + 1), 400);
          }}
        >
          Tiếp
        </Button>
        <Button
          variant="outline"
          disabled={currentPage === totalPages}
          style={{ minWidth: '72px' }}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setPageLoaded(false);
            setTimeout(() => setCurrentPage(totalPages), 400);
          }}
        >
          Cuối
        </Button>
      </div>
    </div>
  )
}

export default Dashboard
