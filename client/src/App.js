import React from 'react';
import './App.css';
import Login from './views/Login/Login.js'
import useToken from "./components/App/useToken";

import {Container} from "reactstrap"
//import { BrowserRouter, Route, Switch } from 'react-router-dom';
import AmphiNavbar from "./components/AmphiNavbar/AmphiNavbar";
import Squares from "./components/Styles/Squares";

function App() {
    const {token, setToken} = useToken();


    if (!token) {
        return(<Login setToken={setToken}/>);
    }else{
        return(
            <div className="App index-page">
                <AmphiNavbar setToken={setToken}/>
                <Squares classToggle="index-page" setSquares7and8={() => {}}/>
                <p>Hello {token}!!</p>
            </div>
        );
    }
}

export default App;
