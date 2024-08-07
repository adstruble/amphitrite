import React from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import './App.css';
import Login from './views/Login/Login.js'
import useToken from "./components/App/useToken";
import AmphiNavbar from "./components/AmphiNavbar/AmphiNavbar";
import Squares from "./components/Styles/Squares";
import ManageFish from "./views/ManageFish/ManageFish";
import BkgrdPath from "./assets/img/path1.png";
import ErrorPage from "./error-page";
import Root from "./views/Root/Root";
import CrossFish from "./views/CrossFish/CrossFish";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
        errorElement: <ErrorPage/>,
        children: [
            {
                path: "/crossfish",
                element: <CrossFish/>,
            },
            {
                path: "/managefish",
                element: <ManageFish/>,
            },
            {
                path: "",
                element: <ManageFish/>,
            },
        ],
    }
]);

function App() {
    const {token, setToken, getUsername} = useToken();

    if (!token) {
        return(<Login setToken={setToken}/>);
    }else{
        return(
            <RouterProvider router={router} />
        );
    }
}

export default App;
