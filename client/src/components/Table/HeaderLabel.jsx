import React, {useEffect, useRef, useState} from "react";
import AmphiTooltip from "../Basic/AmphiTooltip.jsx";

export default function HeaderLabel({colId, label}) {
    const ref = useRef(null);
    const [truncated, setTruncated] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => setTruncated(el.scrollWidth > el.offsetWidth);
        check();
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <span ref={ref} id={'header_' + colId}
                  style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block'}}>
                {label}
            </span>
            {truncated && <AmphiTooltip placement="top-start" target={'header_' + colId} content={label}/>}
        </>
    );
}
