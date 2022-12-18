import React, { useState} from 'react';
import './App.css';
import Login from './views/Login/Login.js'
import useToken from "./components/App/useToken";

import {Container} from "reactstrap"

function App() {
  const [person, setPerson] = useState("starter");
  const {token, setToken } = useToken();

  if(!token) {
    return (
        <div className="wrapper">
            <div className="page-header">
                <div className="page-header-image" />
                <div className="content">
                    <Container>
                        <Login setToken={setToken} />
                    </Container>
                </div>
            </div>
        </div>
          )
  }

  return (
    <div className="App">

      <p>Hello {person}!!</p>
    </div>
  );
}

export default App;
