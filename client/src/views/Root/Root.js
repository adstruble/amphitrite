import TopNavbar from "../../components/Navigation/TopNavbar";
import BkgrdPath from "../../assets/img/path1.png";
import React, {useState} from "react";
import {Outlet} from "react-router-dom";
import AmphiSpinner from "../../components/Basic/AmphiSpinner";

export default function Root(){
    const [spinning, setSpinning] = useState(false);

    return (
        <div className="App index-page">
            <TopNavbar/>

            {/*<Squares classToggle="index-page" setSquares7and8={() => {}}/>*/}
            <div className="main">
                <AmphiSpinner spinning={spinning}/>
                <div className="section section-basic">
                    <img alt="..." className="path" src={BkgrdPath}/>
                <Outlet context={[setSpinning]}/>
            </div>
        </div>
</div>
);
}
