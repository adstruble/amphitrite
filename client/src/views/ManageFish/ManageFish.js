import {Container, Row} from "reactstrap";

import FishDataUpload from "../../components/Upload/FishDataUpload";
import React, {useState} from "react";
import {useOutletContext} from "react-router-dom";
import AmphiTable from "../../components/Table/AmphiTable";
import {
    formatStr,
    formatDate,
    formatDoubleTo3,
    formatTextWithIcon,
    formatIcon
} from "../../components/Utils/FormatFunctions";
import classNames from "classnames";
import {ManageFishFilter} from "./ManageFishFilter";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";
import ManageRowExpanded from "./ManageRowExpanded";
import AmphiAlert from "../../components/Basic/AmphiAlert";
import ExportSelected from "../../components/Download/ExportSelected";

export default function ManageFish() {
    const {getUsername} = useToken();
    const [reloadTable, setReloadTable] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [setSpinning] = useOutletContext();
    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState("");
    const [allStr, setAllStr] = useState("");
    const [currentFilter, setCurrentFilter] = useState(null);
    const [currentSearch, setCurrentSearch] = useState(null);

    const getExpandedRow = (fish) => {
        return (ManageRowExpanded({fish, saveNotes}))
    }

    const getAliveIconColorClass = (fish) => {
        return fish['alive'] ? '' : 'icon-danger'
    }

    const FISH_HEADER = {
        rows: {},
        cols:[
        {name: "Alive", key: "alive", order_by: "alive", visible: true, order_direction: "DESC", order: 1,
                format_fn: formatIcon, format_args:[null, "icon-fish","icon-fish-bone", getAliveIconColorClass], width: ".7fr"},
        {name: "Family ID", key: "group_id", order_by: "group_id", visible: true, order_direction: "ASC", order: 1,
            format_fn: formatStr, className:"numberCell", width: ".8fr", tooltip:true},
        {name: "Parent Cross Date", key: "cross_date", order_by: "cross_date", visible: true, order_direction:null, order:null,
            format_fn: formatDate, className:"numberCell", width:"1.3fr"},
        {name: "F", key: "f", order_by: "f", visible: true, order_direction:null, order:null, format_fn: formatDoubleTo3,
            className:"numberCell"},
        {name: "DI", key: "di", order_by: "di", visible: true, order_direction:null, order:null, format_fn: formatDoubleTo3,
            className:"numberCell"},
        {name: "Sex", key: "sex", order_by: "sex", visible: true, order_direction:null, order:null, format_fn: formatStr,
            className:"numberCell"},
        {name: "Refuge Tag", key: "tag", order_by: "tag", visible: true, order_direction:null, order:null,
            format_fn: formatStr, width:"1fr"},
        {name: "Box", key: "box", order_by: "box", visible: true, order_direction:null, order:null, format_fn: formatStr,
            className:"numberCell"},
        {name: "Notes", key: "notes", order_by: "notes", visible: true, order_direction:null, order:null,
            format_fn: formatTextWithIcon, format_args:['icon-pencil', true, 'Show/Hide Edit notes', true],
            width:"4fr"}
    ]};

    const EXPORT_COLUMNS = [
        {name: 'Tag', selected: true, field: 'tag'},
        {name: 'Sex', selected: false, field: 'sex'},
        {name:'BY FSG (PC)', selected: false, field:'group_id'},
        {name:'Box', selected: false, field:'box'},
        {name:'f', selected: false, field:'f'},
        {name:'di', selected: false, field: 'di'},
        {name: 'Notes', selected: false, field: 'notes'},
        {name:'Alleles', selected: false, field: 'genotype'}]

    const handleFishUploadedCallback = () => {
        setReloadTable(reloadTable + 1);
    }

    function handleDataFetched(tableData, params){
        setAllStr(tableData['size'].toString()+ " fish");
        setCurrentFilter(params['exact_filters'])
        setCurrentSearch(params['like_filter'])
    }

    function saveNotes(notes, fish){
        fetchData("manage_fish/save_notes", getUsername(),
            {'fish_id': fish['id'], 'notes':notes},
            ()=> {setReloadTable(reloadTable + 1)}
        )
    }

    React.useEffect(() =>{
        if (isLoading){
            setSpinning(true);
        }else{
            setSpinning(false);
        }
    }, [isLoading, setSpinning]);

    return (

        <div className={classNames("wrapper", isLoading ? 'disabled' : '')}>
            <Container>
                <Row>
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                </Row>
                <Row>
                <FishDataUpload dataUploadUrl="manage_fish/bulk_upload"
                                uploadCallback={handleFishUploadedCallback}
                                formModalTitle="Upload Bulk Fish Data (master sheet)"
                                uploadButtonText="Upload Fish"
                                setIsLoading={setIsLoading}
                                setAlertText={setAlertText}
                                setAlertLevel={setAlertLevel}

                    />
                <ExportSelected exportUrl="manage_fish/export_fish"
                                exportCallback={()=>{}}
                                formModalTitle="Export Fish"
                                exportButtonText="Export Fish"
                                setIsLoading={setIsLoading}
                                setAlertText={setAlertText}
                                setAlertLevel={setAlertLevel}
                                exportColumns={EXPORT_COLUMNS}
                                allStr={allStr}
                                fileName={'fish.csv'}
                                filter={currentFilter}
                                search={currentSearch}
                />
                </Row>
                <Row>
                    <AmphiTable tableDataUrl="manage_fish/get_fishes"
                                reloadData={reloadTable}
                                headerDataStart={FISH_HEADER}
                                getExpandedRow={getExpandedRow}
                                filter={ManageFishFilter}
                                LIMIT={500}
                                dataFetchCallback={handleDataFetched}
                    />
                </Row>
            </Container>

        </div>
   );
}