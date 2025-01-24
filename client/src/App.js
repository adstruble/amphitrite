import React from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import './App.css';
import Login from './views/User/Login.js'
import useToken from "./components/App/useToken";
import Squares from "./components/Styles/Squares";
import ManageFish from "./views/ManageFish/ManageFish";
import BkgrdPath from "./assets/img/path1.png";
import ErrorPage from "./error-page";
import Root from "./views/Root/Root";
import CrossFish from "./views/CrossFish/CrossFish";
import ViewCrosses from "./views/CrossFish/ViewCrosses";
import UserSettings from "./views/User/UserSettings";
import ManageUsers from "./views/User/ManageUsers";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
        errorElement: <ErrorPage/>,
        children: [
            {
                path: "/usersettings",
                element: <UserSettings/>
            },
            {
                path: "/viewcrosses",
                element: <ViewCrosses/>,
            },
            {
                path: "/crossfish",
                element: <CrossFish/>,
            },
            {
                path: "/managefish",
                element: <ManageFish/>,
            },
            {
                path: "/manageusers",
                element: <ManageUsers/>,
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
