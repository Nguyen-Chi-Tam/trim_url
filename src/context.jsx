import { createContext, useEffect, useContext, useState } from 'react';
import useFetch from './hooks/use-fetch.jsx';
import { getCurrentUser } from './db/apiauth';

const UrlContext = createContext();
const UrlProvider=({children})=>{
   const{data:user,loading,fn:fetchuser} = useFetch(getCurrentUser);
   const isAuthenticated = user?.role=== 'authenticated';
   const [isDarkMode, setIsDarkMode] = useState(false);

   useEffect(()=>{
    fetchuser();
   },[])

   useEffect(() => {
    // Check if dark mode preference exists in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }
   }, []);

   const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
   };

    return <UrlContext.Provider value={{user,fetchuser,loading, isAuthenticated, isDarkMode, toggleDarkMode}}> {children} </UrlContext.Provider>
}
export const UrlState=()=>{
    return useContext(UrlContext);
}
export default UrlProvider;