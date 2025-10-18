import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { LogOut, User, Moon, Sun, LinkIcon, BookImage, Shield } from "lucide-react";
import { UrlState } from '@/context.jsx';
import useFetch from '@/hooks/use-fetch';
import { logout } from '@/db/apiauth';
import { getAdmin } from '@/db/apiAdmin';
import { BarLoader } from 'react-spinners';

const Header = () => {
    const navigate = useNavigate();
    const { user, fetchuser, isDarkMode, toggleDarkMode } = UrlState();
    const { loading, fn: fnLogout } = useFetch(logout);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (user) {
                console.log("Checking admin status for user:", user.id);
                const adminStatus = await getAdmin();
                console.log("Admin status received:", adminStatus);
                setIsAdmin(adminStatus);
            } else {
                // Ensure isAdmin is false when there's no user
                setIsAdmin(false);
            }
        };
        checkAdminStatus();
    }, [user]);

    return (
        <>
        <nav
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            backdropFilter: 'blur(10px)',
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            color: isDarkMode ? 'white' : 'black',
            transition: 'background-color 0.3s ease',
          }}
          className='py-4 flex justify-between items-center w-full px-4'
        >
            <Link to='/'>
                <img src="/trim_url.png" alt="Logo" className="h-12 sm:h-20" />
            </Link>

            {/* Container for the button to control its alignment */}
            <div className="flex justify-end mr-10 items-center space-x-4">
                {isAdmin && (
                    <Link to="/admin">
                        <Shield className="h-6 w-6 text-blue-500 hover:text-blue-700" />
                    </Link>
                )}
                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full hover:bg-gray-600 transition-colors duration-200"
                    aria-label="Toggle dark mode"
                >
                    {isDarkMode ? (
                        <Sun className="h-5 w-5 text-yellow-400 font-extrabold" />
                    ) : (
                        <Moon className="h-5 w-5 text-purple-700 font-extrabold" />
                    )}
                </button>

                {!user?
                    <Button onClick={() => navigate("./auth")}>Log In</Button>
                    : (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="w-10 rounded-full overflow-hidden">
                                <Avatar>
                                    <AvatarImage src={user?.user_metadata.profile_pic} className="object-contain" />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>{user?.user_metadata.name}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="transition-transform duration-200 hover:scale-105">
                                    <Link to="/dashboard" className="flex">
                                    <LinkIcon className="mr-2 h-4 w-4" /><span>Links</span></Link></DropdownMenuItem>
                                <DropdownMenuItem className="transition-transform duration-200 hover:scale-105">
                                    <Link to="/profile" className="flex">
                                    <User className="mr-2 h-4 w-4" /><span>Profile</span>
                                    </Link>
                                    </DropdownMenuItem>
                                <DropdownMenuItem className="transition-transform duration-200 hover:scale-105">
                                    <Link to="/bio_pages" className="flex">
                                    <BookImage className="mr-2 h-4 w-4" /><span>Trang Bio</span>
                                    </Link>
                                    </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400 transition-transform duration-200 hover:scale-105">
                                    <LogOut className="mr-2 h-4 w-4" /><span onClick={() => {
                                        fnLogout().then(() => {
                                            // Refresh user state after logout
                                            fetchuser();
                                            navigate("/auth");
                                        }).catch(error => {
                                            console.error("Logout error:", error);
                                            navigate("/auth");
                                        });
                                    }}>Đăng xuất</span></DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )
                }
            </div>      
        </nav> 
        {loading && <BarLoader className="mb-4" width={"100%"} color="#36d7b7"/>}
        </>
    );
};

export default Header;
