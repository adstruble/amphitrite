import { useState, useEffect, useRef } from 'react';
import PropTypes from "prop-types";

export function useHeaderHeight(calcHeaderHeight, containerId = 'amphi-table-wrapper') {
    const [totalHeaderHeight, setTotalHeaderHeight] = useState(0);

    useEffect(() => {
        if (!calcHeaderHeight)
            return;

        const container = document.getElementById(containerId);
        if (!container)
            return;

        // Find all header elements
        const headerElements = container.querySelectorAll('.amphi-table-wrapper-header');

        const updateHeight = () => {
            const total = Array.from(headerElements).reduce((sum, element) => {
                return sum + element.offsetHeight;
            }, 0);
            setTotalHeaderHeight(total - 50);
        };

        const resizeObserver = new ResizeObserver(updateHeight);

        headerElements.forEach(element => {
            resizeObserver.observe(element);
        });

        // Initial calculation
        updateHeight();

        return () => resizeObserver.disconnect();
    }, [containerId]);

    if (!calcHeaderHeight){
        return "100%"
    }

    return "calc(100vh - " + totalHeaderHeight + "px)"
}

useHeaderHeight.propTypes = {
    calcHeaderHeight: PropTypes.bool.isRequired,
    containerId: PropTypes.string
}