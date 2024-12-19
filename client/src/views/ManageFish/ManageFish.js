import {Container, Row} from "reactstrap";

import FishDataUpload from "../../components/Upload/FishDataUpload";
import React, {useState} from "react";
import {useOutletContext} from "react-router-dom";
import AmphiTable from "../../components/Table/AmphiTable";
import ManageRowExpanded from "./ManageRowExpanded";
import {formatStr, formatDate, formatDoubleTo3} from "../../components/Utils/FormatFunctions";
import classNames from "classnames";

export default function ManageFish() {
    const [reloadTable, setReloadTable] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [setSpinning] = useOutletContext();


    const FISH_HEADER = {
        rows: {},
        cols:[
        {name: "Family ID", key: "group_id", order_by: "group_id", visible: true, order_direction: "ASC", order: 1,
            format_fn: formatStr},
        {name: "Birth Year", key: "cross_date", order_by: "cross_date", visible: true, order_direction: "", order: 2,
            format_fn: formatDate},
        {name: "F", key: "f", order_by: "f", visible: true, order_direction: "", order: 2, format_fn: formatDoubleTo3},
        {name: "DI", key: "di", order_by: "di", visible: true, order_direction: "", order: 2, format_fn: formatDoubleTo3},
        {name: "Sex", key: "sex", order_by: "sex", visible: true, order_direction: "", order: 2, format_fn: formatStr},
        {name: "Refuge Tag", key: "tag", order_by: "tag", visible: true, order_direction: "", order: 2, format_fn: formatStr},
        {name: "Box", key: "box", order_by: "box", visible: true, order_direction: "", order: 2, format_fn: formatStr}
    ]};

    const handleFishUploadedCallback = () => {
        setReloadTable(reloadTable + 1);
    }

    const getExpandedRow = (fishId) => {
        return (ManageRowExpanded(fishId))
    }

    React.useEffect(() =>{
        if (isLoading){
            setSpinning(true);
        }else{
            setSpinning(false);
        }
    }, [isLoading]);

    return (

        <div className={classNames("wrapper", isLoading ? 'disabled' : '')}>
            <Container>
                <FishDataUpload dataUploadUrl="manage_fish/bulk_upload"
                                uploadCallback={handleFishUploadedCallback}
                                formModalTitle="Upload Bulk Fish Data (master sheet)"
                                uploadButtonText="Upload Fish"
                                setIsLoading={setIsLoading}
                    />
                <Row>
                    <AmphiTable tableDataUrl="manage_fish/get_fishes"
                                reloadData={reloadTable}
                                headerDataStart={FISH_HEADER}
                                getExpandedRow={getExpandedRow}
                    />
                </Row>
            </Container>

        </div>
   );
}