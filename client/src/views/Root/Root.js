import AmphiNavbar from "../../components/AmphiNavbar/AmphiNavbar";
import BkgrdPath from "../../assets/img/path1.png";
import React from "react";
import {Outlet} from "react-router-dom";

export default function Root(){

    return (
        <div className="App index-page">
            <AmphiNavbar/>
            {/*<Squares classToggle="index-page" setSquares7and8={() => {}}/>*/}
            <div className="main">
                <div className="section section-basic">
                    <img alt="..." className="path" src={BkgrdPath}/>
                    <Outlet/>
                </div>
            </div>
        </div>
    );
}
