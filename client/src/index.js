import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import './assets/css/blk-design-system-react.css'
import './assets/css/nucleo-icons.css'
import './assets/css/amphi-icons.css'
import './assets/css/amphi.css'

import App from './App';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    /*When using React.StrictMode in the application, react will render twice in development mode.
      This is to make sure that there are no side effects. however in Production environment, it only renders once.*/
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
