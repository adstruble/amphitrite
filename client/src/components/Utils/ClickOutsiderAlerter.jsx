import React, {useEffect, useRef} from "react";
import PropTypes from "prop-types";

function useOutsideAlerter(ref, clickedOutsideCallback) {
    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                clickedOutsideCallback();
            }
        }
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);
}

export default function ClickOutsideAlerter(props) {

    const wrapperRef = useRef(null);
    useOutsideAlerter(wrapperRef, props.clickedOutsideCallback);

    return <div style={props.show ? {} : {display:'none'}} ref={wrapperRef}>{props.children}</div>;
}

ClickOutsideAlerter.propTypes = {
    props: PropTypes.shape({
            children: PropTypes.elementType.isRequired,
        clickedOutsideCallback: PropTypes.func.isRequired}
    )
}