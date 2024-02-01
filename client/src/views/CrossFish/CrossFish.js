import {Container} from "reactstrap";

import FishDataUpload from "../../components/Upload/FishDataUpload";
import React from "react";


export default function CrossFish() {

    const handleUploadCrossesClick = async e => {
        console.log("Crosses upload callback")
    };

    return (

        <div className="wrapper">
            <Container>
                <FishDataUpload
                    dataUploadUrl="cross_fish/upload_crosses"
                    uploadCallback={handleUploadCrossesClick}
                    formModalTitle="Upload Recommended Crosses"
                    uploadButtonText="Upload Crosses"
                />
            </Container>
        </div>
    )
}