import React from 'react';
import {ReactSVG} from "react-svg";
import { default as fish_spinner } from '../../assets/img/fish_spinner.svg';
import classnames from "classnames";

export default function AmphiSpinner({spinning}){
    return (
        <ReactSVG src={fish_spinner} className={classnames('loadingSpinner', spinning ? '' : 'off')}/>
    );
}