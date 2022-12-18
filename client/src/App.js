import React, {useState} from 'react';
import './App.css';
import Login from './views/Login/Login.js'
import useToken from "./components/App/useToken";

import {Container} from "reactstrap"

function App() {
    const [person, setPerson] = useState("starter");
    const {token, setToken} = useToken();
    const [squares1to6, setSquares1to6] = React.useState("");
    const [squares7and8, setSquares7and8] = React.useState("");

    React.useEffect(() => {
        document.body.classList.toggle("register-page");
        document.documentElement.addEventListener("mousemove", followCursor);
        // Specify how to clean up after this effect:
        return function cleanup() {
            document.body.classList.toggle("register-page");
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


    return (
        <div className="wrapper">
            <div className="page-header">
                <div className="page-header-image"/>
                <div className="content">
                    <Container>
                        if (!token) {
                        <Login setToken={setToken} squares7and8={squares7and8}/>
                        }else{
                        <div className="App">
                            <p>Hello {token}!!</p>
                        </div>
                        }
                        <div className="register-bg"/>
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
                    </Container>
                </div>
            </div>
        </div>
    )
}

export default App;
