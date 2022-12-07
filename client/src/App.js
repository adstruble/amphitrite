import React, { useState} from 'react';
import './App.css';
import Login from './views/Login/Login.js'
import useToken from "./components/App/useToken";

function App() {
  const [person, setPerson] = useState("starter");
  const {token, setToken } = useToken();

  if(!token) {
    return <Login setToken={setToken} />
  }

  return (
    <div className="App">

      <p>Hello {person}!!</p>
    </div>
  );
}

export default App;
