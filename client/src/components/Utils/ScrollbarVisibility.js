import { useState, useEffect, useRef } from 'react';

const useScrollbarVisibility = (callback, tableData) => {
    const ref = useRef(null);
    const [isScrollbarVisible, setIsScrollbarVisible] = useState(true);

    useEffect(() => {
        const element = ref.current;

        const handleScroll = () => {
            const hasScrollbar = element.scrollHeight > element.clientHeight;
            if (hasScrollbar !== isScrollbarVisible) {
                setIsScrollbarVisible(hasScrollbar);
                callback(hasScrollbar);
            }
        };

        if (element) {
            element.addEventListener('scroll', handleScroll);
            handleScroll(); // Check initial state on mount
        }

        return () => {
            if (element) {
                element.removeEventListener('scroll', handleScroll);
            }
        };
    }, [tableData, callback]);

    return ref;
};

export default useScrollbarVisibility;