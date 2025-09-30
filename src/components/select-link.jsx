import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { UrlState } from '../context';
import { getUrls } from '../db/apiUrl';
import { Search, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const SelectLink = ({ isOpen, onOpenChange, onLinksSelected, existingLinkIds = [] }) => {
  const { user } = UrlState();
  const [links, setLinks] = useState([]);
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchUserLinks();
    }
  }, [isOpen, user?.id]);

  const fetchUserLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const userLinks = await getUrls(user.id);
      setLinks(userLinks || []);
    } catch (err) {
      console.error('Error fetching links:', err);
      setError('Không thể tải đường link');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToggle = (linkId) => {
    setSelectedLinks(prev =>
      prev.includes(linkId)
        ? prev.filter(id => id !== linkId)
        : [...prev, linkId]
    );
  };

  const handleSelectAll = () => {
    const filteredLinks = getSortedLinks();
    const allIds = filteredLinks.map(link => link.id);
    setSelectedLinks(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedLinks([]);
  };

  const getFilteredLinks = () => {
    // First filter out temporary links
    const nonTemporaryLinks = links.filter(link => !link.is_temporary);

    // Filter out links that are already in existingLinkIds
    const filteredOutExisting = nonTemporaryLinks.filter(link => !existingLinkIds.includes(link.id));

    // Then apply search filter if there's a search term
    if (!searchTerm.trim()) return filteredOutExisting;
    return filteredOutExisting.filter(link =>
      link.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getSortedLinks = () => {
    const filteredLinks = getFilteredLinks();
    const sortFn = (a, b) => {
      let compare = 0;
      if (sortBy === "name") {
        compare = a.title.localeCompare(b.title);
      } else if (sortBy === "created") {
        compare = new Date(a.created_at) - new Date(b.created_at);
      }
      return sortOrder === "asc" ? compare : -compare;
    };
    return filteredLinks.slice().sort(sortFn);
  };

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token);
    createAddSelected();
  }

  const createAddSelected = () => {
    const selectedLinkData = links.filter(link => selectedLinks.includes(link.id));
    onLinksSelected(selectedLinkData, captchaToken);
    onOpenChange(false);
    setSelectedLinks([]);
    setSearchTerm('');
  };

  const handleAddSelected = () => {
    setShowCaptcha(true);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedLinks([]);
    setSearchTerm('');
    setError(null);
  };

  const sortedLinks = getSortedLinks();
  const { isDarkMode } = UrlState();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-4xl max-h-[50vh] overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Chọn đường Link
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hãy chọn đường link để thêm vào trang bio của bạn
          </p>
        </DialogHeader>
        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 py-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                Sắp xếp <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-48">
              <DropdownMenuRadioGroup value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split("-");
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}>
                <DropdownMenuRadioItem value="name-asc">(A-Z)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name-desc">(Z-A)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created-asc">Cũ nhất</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created-desc">Mới nhất</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex gap-2">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              disabled={sortedLinks.length === 0}
            >
              Chọn tất cả
            </Button>
            <Button
              onClick={handleDeselectAll}
              variant="outline"
              size="sm"
              disabled={selectedLinks.length === 0}
            >
              Bỏ chọn tất cả
            </Button>
          </div>
        </div>
        {/* Links List */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải đường link...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
              <Button onClick={fetchUserLinks} variant="outline" size="sm">
                Thử lại
              </Button>
            </div>
          </div>
        ) : sortedLinks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchTerm ? 'Không có đường link bạn đang tìm' : 'Không có đường link nào cả'}
              </p>
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                  size="sm"
                >
                  Xoá tìm kiếm
                </Button>
              )}
            </div>
          </div>
          ) : (
            <div className="grid gap-3">
              {sortedLinks.map((link) => (
                <div
                  key={link.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedLinks.includes(link.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleLinkToggle(link.id)}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedLinks.includes(link.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedLinks.includes(link.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {/* Link Image */}
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={link.profile_pic || link.qr_code || '/public/qr_not_found.png'}
                      alt={link.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Link Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{link.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {link.short_url && `https://trimurl.id.vn/${link.short_url}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      Ngày tạo: {new Date(link.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* CAPTCHA Verification */}
        {showCaptcha && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-bold mb-2 text-center">Xác minh CAPTCHA</h3>
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
              onChange={handleCaptchaVerify}
              className="flex justify-center"
            />
            <p className="text-sm text-gray-500 mt-2 text-center">
              Vui lòng xác minh bạn không phải là robot
            </p>
          </div>
        )}
        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Đã chọn {selectedLinks.length}/{sortedLinks.length} link
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline">
                Huỷ
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={selectedLinks.length === 0}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Thêm ({selectedLinks.length})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import ReCAPTCHA from 'react-google-recaptcha';
export default SelectLink;
