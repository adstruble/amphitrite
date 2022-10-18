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

      <p>Hello {person}!!</p>
    </div>
  );
}

export default App;
