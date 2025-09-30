import React, { useEffect, useState } from 'react';
import { updateBio } from '@/db/apiBio';
import BioLinkCard from './bio-linkcard';
import { getBioUrls, deleteBioUrl, addBioUrl } from '@/db/apiBio';
import { Button } from './button';
import { X, Plus, ArrowLeft } from 'lucide-react';
import SelectLink from '../select-link';
import { UrlState } from '@/context';

const BioDetails = ({ bio }) => {
  const { user } = UrlState();
  const [bioUrls, setBioUrls] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [selectedProfilePic, setSelectedProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [selectedBackgroundPic, setSelectedBackgroundPic] = useState(null);
  const [backgroundPicPreview, setBackgroundPicPreview] = useState(null);

  const [showSelectLinkDialog, setShowSelectLinkDialog] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  // Check if current user owns this bio page
  const isOwner = user && bio && user.id === bio.user_id;

  useEffect(() => {
    if (bio?.id) {
      getBioUrls(bio.id).then((urls) => {
        console.log('Fetched bioUrls:', urls);
        setBioUrls(urls);
      }).catch(() => {
        setBioUrls([]);
      });
    }
  }, [bio?.id]);

  // Initialize edited title and description when bio changes
  useEffect(() => {
    if (bio) {
      setEditedTitle(bio.title || '');
      setEditedDescription(bio.description || '');
    }
  }, [bio]);

  if (!bio) {
    return <div className="p-8 text-center text-gray-500">Trang bio không tồn tại</div>;
  }

  const handleEditClick = () => {
    setIsEditing(!isEditing);
    setHasUnsavedChanges(false);
  };

  const handleApply = async () => {
    setIsLoading(true);
    try {
      // Prepare updates object with title and description changes
      const updates = {};

      // Check if title has changed
      if (editedTitle !== bio.title) {
        updates.title = editedTitle;
      }

      // Check if description has changed
      if (editedDescription !== bio.description) {
        updates.description = editedDescription;
      }

      // If there are text changes or picture changes, update the bio
      if (Object.keys(updates).length > 0 || selectedProfilePic || selectedBackgroundPic) {
        await updateBio({ id: bio.id, user_id: bio.user_id }, updates, selectedProfilePic, selectedBackgroundPic);
      }

      // Clear the temporary states after successful upload
      setSelectedProfilePic(null);
      setProfilePicPreview(null);
      setSelectedBackgroundPic(null);
      setBackgroundPicPreview(null);
      setHasUnsavedChanges(false);
      setIsEditing(false);
      setShowDiscardConfirm(false);

      // Reload to reflect changes, can be improved with state update
      window.location.reload();
    } catch (error) {
      console.error('Failed to update bio:', error);
      alert('Lỗi cập nhật bio: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      setIsEditing(false);
      setHasUnsavedChanges(false);
    }
  };

  const confirmDiscard = () => {
    // Reset any unsaved changes and exit edit mode
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setShowDiscardConfirm(false);
    // Clear any selected picture changes
    setSelectedProfilePic(null);
    setProfilePicPreview(null);
    setSelectedBackgroundPic(null);
    setBackgroundPicPreview(null);
    // Reset edited title and description to original values
    setEditedTitle(bio.title || '');
    setEditedDescription(bio.description || '');
  };

  const cancelDiscard = () => {
    setShowDiscardConfirm(false);
  };

  const handleProfilePicSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Store the selected file
      setSelectedProfilePic(file);
      setHasUnsavedChanges(true);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfilePicPreview(previewUrl);
    }
  };

  const handleCancelProfilePic = () => {
    // Clear the selected file and preview
    setSelectedProfilePic(null);
    setProfilePicPreview(null);
    setHasUnsavedChanges(false);
  };

  const handleProfilePicUpload = async () => {
    if (!selectedProfilePic) return;

    setIsLoading(true);
    try {
      await updateBio({ id: bio.id, user_id: bio.user_id }, {}, selectedProfilePic, null);
      // Clear the temporary states after successful upload
      setSelectedProfilePic(null);
      setProfilePicPreview(null);
      setHasUnsavedChanges(false);
      window.location.reload(); // Reload to reflect changes, can be improved with state update
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      alert('Không thể cập nhật ảnh bìa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    setIsLoading(true);
    setHasUnsavedChanges(true);
    try {
      await updateBio({ id: bio.id, user_id: bio.user_id }, { profile_pic: null });
      window.location.reload();
    } catch (error) {
      console.error('Failed to remove profile picture:', error);
      alert('Không thể xoá ảnh bìa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackgroundPicSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Store the selected file
      setSelectedBackgroundPic(file);
      setHasUnsavedChanges(true);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setBackgroundPicPreview(previewUrl);
    }
  };

  const handleCancelBackgroundPic = () => {
    // Clear the selected file and preview
    setSelectedBackgroundPic(null);
    setBackgroundPicPreview(null);
    setHasUnsavedChanges(false);
  };

  const handleRemoveBackgroundPic = async () => {
    setIsLoading(true);
    setHasUnsavedChanges(true);
    try {
      await updateBio({ id: bio.id, user_id: bio.user_id }, { background: null });
      window.location.reload();
    } catch (error) {
      console.error('Failed to remove background picture:', error);
      alert('Không thể xoá ảnh nền');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewItem = () => {
    setShowSelectLinkDialog(true);
  };

  const handleLinksSelected = async (selectedLinks) => {
    try {
      for (const link of selectedLinks) {
        await addBioUrl(bio.id, link.id);
      }
      // Refresh the bio URLs after adding
      const updatedUrls = await getBioUrls(bio.id);
      setBioUrls(updatedUrls);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to add links to bio:', error);
      alert('Không thể thêm link vào trang');
    }
  };

  const handleDeleteLink = async (urlId) => {
    try {
      await deleteBioUrl(bio.id, urlId);
      // Refresh the bio URLs after deletion
      const updatedUrls = await getBioUrls(bio.id);
      setBioUrls(updatedUrls);
    } catch (error) {
      console.error('Failed to delete bio URL:', error);
      alert('Không thể xoá link');
    }
  };

  // Edit icon SVG component
  const EditIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path strokeWidth="2" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );

  return (
    <div
      className={`text-[#3a2c1a] font-montserrat min-h-screen p-8 ${!(backgroundPicPreview || bio.background) ? 'main-background' : ''}`}
      style={{
        backgroundImage: (backgroundPicPreview || bio.background) ? `url(${backgroundPicPreview || bio.background})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'scroll',
        overflow: 'auto',
        margin: 0,
        padding: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Back to bio pages button */}
      <div className="absolute left-8 top-8 z-50">
        <Button onClick={() => window.location.href = '/bio_pages'} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>
      <div
        className="min-h-screen w-full p-8 mt-20"
      >
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-8 px-4 lg:px-0">
          <div className="relative flex-shrink-0">
            <img
              src={profilePicPreview || bio.profile_pic || 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'}
              alt={bio.title}
              className="round-lg w-64 h-64 lg:w-80 lg:h-80 object-cover relative z-10 shadow-lg"
              style={{ borderRadius: '0.5rem' }}
            />
            {isEditing && (
              <div className="mt-2 flex flex-col space-y-2 relative z-10">
                {/* Profile Picture Controls */}
                <div className="flex justify-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicSelection}
                    disabled={isLoading}
                    className="bg-[#00000080] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#000000] cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-[#d4bfa7] file:text-[#3a2c1a] max-w-xs"
                  />
                  {selectedProfilePic && (
                    <button
                      className="bg-gray-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600 disabled:bg-gray-300"
                      onClick={handleCancelProfilePic}
                      disabled={isLoading}
                    >
                      Bỏ chọn ảnh đại diện
                    </button>
                  )}
                  {bio.profile_pic && !selectedProfilePic && (
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 disabled:bg-red-300"
                      onClick={handleRemoveProfilePic}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Đang xoá...' : 'Xoá ảnh đại diện'}
                    </button>
                  )}
                </div>

                {/* Background Picture Controls */}
                <div className="flex justify-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundPicSelection}
                    disabled={isLoading}
                    className="bg-[#00000080] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#000000] cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-[#d4bfa7] file:text-[#3a2c1a] max-w-xs"
                  />
                  {selectedBackgroundPic && (
                    <button
                      className="bg-gray-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-600 disabled:bg-gray-300"
                      onClick={handleCancelBackgroundPic}
                      disabled={isLoading}
                    >
                      Bỏ chọn ảnh nền
                    </button>
                  )}
                  {bio.background && !selectedBackgroundPic && (
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 disabled:bg-red-300"
                      onClick={handleRemoveBackgroundPic}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Đang xoá...' : 'Xoá ảnh nền'}
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Right side - bio details */}
          <div className="flex-1 flex flex-col justify-center px-4 md:px-6 lg:px-0 text-center lg:text-left">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => {
                  setEditedTitle(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="font-playfair font-bold text-2xl md:text-3xl lg:text-5xl mb-2 text-black dark:text-white bg-transparent border-b-2 border-[#e7cdb7] focus:outline-none focus:border-white"
                placeholder="Nhập tiêu đề..."
              />
            ) : (
              <h1 className="font-playfair font-bold text-2xl md:text-3xl lg:text-5xl mb-2 text-black dark:text-white">{bio.title}</h1>
            )}
            <hr className="border-t-2 border-[#e7cdb7] mb-4 lg:mb-6" />
            <div>
              {isEditing ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => {
                    setEditedDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="text-base md:text-lg leading-relaxed w-full text-left mb-6 lg:mb-8 text-black dark:text-white bg-transparent border-2 border-[#e7cdb7] rounded-md p-3 focus:outline-none focus:border-white resize-none"
                  placeholder="Mô tả về trang bio này..."
                  rows={4}
                />
              ) : (
                <p className="text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-6 lg:mb-8 text-black dark:text-white">
                  {bio.description || "Không có thông tin gì về trang bio này"}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Bottom content */}
        <div className="w-full mb-30 px-6 lg:px-0">
          <hr className="border-t-2 border-[#e7cdb7] my-6" />
          {/* Add button positioned above the first bio link, right-aligned */}
          {isEditing && (
            <div className="flex justify-end mb-6">
              <Button
                onClick={handleAddNewItem}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-shadow duration-200 bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-700/20"
              >
                <Plus className="w-5 h-5" />
                <span className="ml-2 font-semibold">Thêm</span>
              </Button>
            </div>
          )}
          {/* Render simplified bio link cards here */}
          {bioUrls.length > 0 ? (
            (() => {
              const hasProfilePic = bioUrls.some(bioUrl => !!bioUrl.urls?.profile_pic);
              return bioUrls.map((bioUrl) => {
                const url = {
                  id: bioUrl.url_id,
                  title: bioUrl.urls?.title || '',
                  profile_pic: bioUrl.urls?.profile_pic || '',
                  qr_code: bioUrl.qr_code || '',
                  short_url: bioUrl.urls?.short_url || '',
                };
                const shiftRight = hasProfilePic && !url.profile_pic;
                return <BioLinkCard
                  key={url.id}
                  url={url}
                  isEditing={isEditing}
                  onDelete={() => handleDeleteLink(url.id)}
                  shiftRight={shiftRight}
                />;
              });
            })()
          ) : (
            <p className="text-center text-gray-300">No links available.</p>
          )}
        </div>

        {/* Discard Confirmation Dialog */}
        {showDiscardConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Discard Changes?</h3>
              <p className="text-gray-600 mb-6">You have unsaved changes that will be lost if you discard.</p>
              <div className="flex space-x-3">
                <Button
                  onClick={confirmDiscard}
                  className="bg-red-600 text-white hover:bg-red-700 flex-1"
                >
                  Discard
                </Button>
                <Button
                  onClick={cancelDiscard}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {isEditing ? (
            <>
              <Button
                onClick={handleApply}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-shadow duration-200 bg-green-600 text-white hover:bg-green-700 border-2 border-green-700/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </Button>
              <Button
                onClick={handleDiscard}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-shadow duration-200 bg-red-600 text-white hover:bg-red-700 border-2 border-red-700/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </>
          ) : (
            /* Edit Button with Tooltip - Only show if user owns this bio */
            isOwner && (
              <div className="relative group">
                <Button
                  onClick={handleEditClick}
                  variant="secondary"
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-shadow duration-200 bg-[#e7cdb7] text-[#3a2c1a] hover:bg-[#d4bfa7] border-2 border-[#3a2c1a]/20"
                  title="Click to edit and see delete buttons"
                >
                  <EditIcon className="w-5 h-5" />
                </Button>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  Nhấn để chỉnh sửa
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Select Link Dialog */}
      <SelectLink
        isOpen={showSelectLinkDialog}
        onOpenChange={setShowSelectLinkDialog}
        onLinksSelected={handleLinksSelected}
        existingLinkIds={bioUrls.map(bioUrl => bioUrl.url_id)}
      />
    </div>
  );
};

export default BioDetails;
