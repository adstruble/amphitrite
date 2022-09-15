import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [person, setPerson] = useState("starter");

  useEffect(() => {
    fetch('/amphitrite/getPerson').then(res => res.json()).then(data => {
	setPerson(data.person);
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <p>Hello {person}!!</p>
    </div>
  );
}

export default App;
