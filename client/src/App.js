import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Login from './views/Login/Login.js'

function setToken(userToken){
  sessionStorage.setItem('token', JSON.stringify(userToken));
}

function getToken(){}

function App() {
  const [person, setPerson] = useState("starter");
  const token = getToken()

  if (!token) {
    return <Login setToken={token}/>
  }

  useEffect(() => {
    fetch('/amphitrite/getPerson').then(res => res.json()).then(data => {
	setPerson(data.person);
    });
  }, []);

  return (
    <div className="App">

      <p>Hello {person}!!</p>
    </div>
  );
}

export default App;
