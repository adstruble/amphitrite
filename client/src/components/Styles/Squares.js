import React from "react";
import PropTypes from "prop-types";
import Login from "../../views/User/Login";

export default function Squares({setSquares7and8, classToggle}) {
    const [squares1to6, setSquares1to6] = React.useState("");

    React.useEffect(() => {
        document.body.classList.toggle(classToggle);
        document.documentElement.addEventListener("mousemove", followCursor);
        // Specify how to clean up after this effect:
        return function cleanup() {
            document.body.classList.toggle(classToggle);
            document.documentElement.removeEventListener("mousemove", followCursor);
        };
    }, []);

    const followCursor = (event) => {
        let posX = event.clientX - window.innerWidth / 2;
        let posY = event.clientY - window.innerWidth / 6;
        setSquares1to6(
            "perspective(500px) rotateY(" +
            posX * 0.05 +
            "deg) rotateX(" +
            posY * -0.05 +
            "deg)"
        );
        setSquares7and8(
            "perspective(500px) rotateY(" +
            posX * 0.02 +
            "deg) rotateX(" +
            posY * -0.02 +
            "deg)"
        );
    };

    return(
        <div className="squares">
            <div
                className="square square-1"
                id="square1"
                style={{transform: squares1to6}}
            />
            <div
                className="square square-2"
                id="square2"
                style={{transform: squares1to6}}
            />
            <div
                className="square square-3"
                id="square3"
                style={{transform: squares1to6}}
            />
            <div
                className="square square-4"
                id="square4"
                style={{transform: squares1to6}}
            />
            <div
                className="square square-5"
                id="square5"
                style={{transform: squares1to6}}
            />
            <div
                className="square square-6"
                id="square6"
                style={{transform: squares1to6}}
            />
        </div>
    );
}

Squares.propTypes = {
    setSquares7and8: PropTypes.func.isRequired,
    classToggle: PropTypes.string.isRequired
};