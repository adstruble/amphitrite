import React from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import whyDidYouRender from '@welldone-software/why-did-you-render';

if (process.env.NODE_ENV === 'development') {
    whyDidYouRender(React, {
        trackAllPureComponents: true,
        trackHooks: true,
        logOnDifferentValues: true,
    });
}
ManageFish.whyDidYouRender = true;
AmphiTable.whyDidYouRender = true;
import './App.css';
import Login from './views/User/Login.jsx'
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
import AmphiTable from "./components/Table/AmphiTable.jsx";
import FishCare from "./views/FishCare/FishCare.jsx";
import EggBowls from "./views/EggBowls/EggBowls.jsx";
import ViewCrossesLFSMock from "./views/CrossFish/ViewCrosses_LFS_Mock.jsx";
import SpawningPerformance from "./views/Reports/SpawningPerformance.jsx";
import CohortTracker from "./views/Reports/CohortTracker.jsx";
import WaterQuality from "./views/Reports/WaterQuality.jsx";
import LarvalCohorts from "./views/LarvalCohorts/LarvalCohorts.jsx";

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
                path: "/fishcare",
                element: <FishCare/>,
            },
            {
                path: "/eggbowls",
                element: <EggBowls/>,
            },
            {
                path: "/viewcrosses_lfs_mock",
                element: <ViewCrossesLFSMock/>,
            },
            {
                path: "/spawningperformance",
                element: <SpawningPerformance/>,
            },
            {
                path: "/cohorttracker",
                element: <CohortTracker/>,
            },
            {
                path: "/waterquality",
                element: <WaterQuality/>,
            },
            {
                path: "/larvalcohorts",
                element: <LarvalCohorts/>,
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
