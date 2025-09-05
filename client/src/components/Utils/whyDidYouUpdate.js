import React, {useEffect, useRef} from "react";

export default function useWhyDidYouUpdate(name, props) {
    const previous = useRef();

    useEffect(() => {
        if (previous.current) {
            const allKeys = Object.keys({ ...previous.current, ...props });
            const changedProps = {};

            allKeys.forEach(key => {
                if (previous.current[key] !== props[key]) {
                    changedProps[key] = {
                        from: previous.current[key],
                        to: props[key]
                    };
                }
            });

            if (Object.keys(changedProps).length) {
                console.log('[Manual Debug]', name, changedProps);
            }
        }

        previous.current = props;
    });
}