import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
const BioLinkCard = ({ url, isEditing = false, onDelete, shiftRight = false, pageLoaded }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    if (!url) return null;

    const handleDelete = async () => {
        if (window.confirm('Bạn có chắc là muốn xoá không?')) {
            setIsDeleting(true);
            try {
                await onDelete();
            } catch (error) {
                console.error('Failed to delete link:', error);
                alert('Không thể xoá link');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="relative overflow-hidden flex items-center gap-4 border border-black dark:border-white p-4 rounded-lg mt-2 mb-2"
            style={{
                borderRadius: '0.55rem',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}>
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.55rem',
                    zIndex: -1,
                    transition: 'opacity 0.5s, background-color 0.3s ease'
                }}
            />
            {url.profile_pic ?
                <img
                    src={url.profile_pic}
                    alt={url.profile_pic}
                    className="h-20 w-20 object-cover rounded-lg ring ring-blue-500"
                    style={{ borderRadius: '0.25rem' }}
                /> : <></>}
            <a
                href={`/${url.id}/${url.short_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl font-semibold hover:underline cursor-pointer text-white flex-1"
                style={{
                    marginLeft: shiftRight && !url.profile_pic && window.innerWidth > 768 ? '6rem' : undefined
                }}
            >
                {url.title}
            </a>

            {isEditing && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white p-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-red-400"
                    title="Delete link"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
};

export default BioLinkCard;
