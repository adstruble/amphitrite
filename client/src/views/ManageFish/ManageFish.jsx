import {Container, FormGroup, Input, Label, Row} from "reactstrap";

import FishDataUpload from "../../components/Upload/FishDataUpload";
import React, {useEffect, useState} from "react";
import {useOutletContext} from "react-router-dom";
import AmphiTable from "../../components/Table/AmphiTable";
import {
    formatStr,
    formatDate,
    formatDoubleTo3,
    formatTextWithIcon,
    formatIcon, formatStrExpand
} from "../../components/Utils/FormatFunctions";
import classNames from "classnames";
import {ManageFishFilter} from "./ManageFishFilter";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";
import ManageRowNotesExpanded from "./ManageRowNotesExpanded.jsx";
import AmphiAlert from "../../components/Basic/AmphiAlert";
import ExportSelected from "../../components/Download/ExportSelected";
import ManageRowFamilyExpanded from "./ManageRowFamilyExpanded.jsx";
import useWhyDidYouUpdate from "../../components/Utils/whyDidYouUpdate.js";
import classnames from "classnames";
import AmphiTooltip from "../../components/Basic/AmphiTooltip.jsx";

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

    const [updateGenotype, setUpdateGenotype] = useState(false);

    const getExpandedRow = (fish) => {
        return (ManageRowNotesExpanded({fish, saveNotes}))
    }
    getExpandedRow.uuid = '67331600-536b-456c-8568-5a2706e38fae';

    const handleExpandLineage  = (fish) => {
        return (ManageRowFamilyExpanded({fish, setAlertLevel, setAlertText}))
    }
    handleExpandLineage.uuid = '2e8ad040-ccc6-4a61-a12e-b5c5c2903a21'

    const getAliveIconColorClass = (fish) => {
        return fish['alive'] ? '' : 'icon-danger'
    }

    const FISH_HEADER = {
        rows: {},
        cols:[
        {name: "Alive", key: "alive", order_by: "alive", visible: true, order_direction: "DESC", order: 1,
                format_fn: formatIcon, format_args:[null, "icon-fish","icon-fish-bone", getAliveIconColorClass], width: ".7fr"},
        {name: "Family ID", key: "group_id", order_by: "group_id", visible: true, order_direction: "ASC", order: 1,
            format_fn: formatStrExpand, className:"numberCell", width: ".8fr",
            format_args: {'expandFn': handleExpandLineage, 'tooltip': 'Show/Hide Pedigree Tree'}},
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

    const validateNumberOfGenerations = (value) => {
        if (Number.isInteger(Number(value)) && Number(value) > 0){
            return null
        }
        return "Number of generations for pedigree must be an integer greater than or equal to 1";
    }

    const EXPORT_COLUMNS = [
        {name: 'Tag', selected: true, field: 'tag'},
        {name: 'Sex', selected: false, field: 'sex'},
        {name:'BY FSG (PC)', selected: false, field:'group_id'},
        {name:'Box', selected: false, field:'box'},
        {name:'F', selected: false, field:'f'},
        {name:'DI', selected: false, field: 'di'},
        {name: 'Notes', selected: false, field: 'notes'},
        {name: 'Pedigree', selected: false, field: 'pedigree', variable:'No of Generations',
            validate_fn:validateNumberOfGenerations},
        {name:'Alleles', selected: false, field: 'genotype'}]

    const handleFishUploadedCallback =  () => {
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

    const UserOptions = <Row style={{paddingBottom:10}}>
        <Row style={{justifyContent:"right",paddingRight:0, maxWidth:"fit-content"}}>
            <FormGroup check>
                `<Label id="updateGenotypeControl" check >
                    <Input defaultChecked={updateGenotype} type="checkbox"
                           onChange={(e) => {
                               setUpdateGenotype(e.target.checked);
                           }}
                           id="updateGenotypeCheck"
                    />
                    <span id="updateGenotypeLabel"
                          className={classnames("form-check-sign")}>Update genotypes (Tags will be used to match fish)</span>
                </Label>
            </FormGroup>
            <AmphiTooltip
                placement={"top-start"}
                target="updateGenotypeControl"
                content="By default, genotypes are used to match fish. If tags differ, the tag will be updated (if no match on genotype is found a new fish will be created). If genotypes need to be updated,
                    tags may be used to match fish (if no match on tag is found, the fish will be skipped)."/>
        </Row>
    </Row>

    return (

        <div className={classNames("wrapper", isLoading ? 'disabled' : '')}>
            <Container id='amphi-table-wrapper'>
                <Row className={'amphi-table-wrapper-header'}>
                    <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
                </Row>
                <Row className={'amphi-table-wrapper-header'}>
                <FishDataUpload dataUploadUrl="manage_fish/bulk_upload"
                                uploadCallback={handleFishUploadedCallback}
                                formModalTitle="Upload Bulk Fish Data (master sheet)"
                                uploadButtonText="Upload Fish"
                                setIsLoading={setIsLoading}
                                setAlertText={setAlertText}
                                setAlertLevel={setAlertLevel}
                                UserOptions={UserOptions}
                                uploadParams={{'update_genotype': updateGenotype ? 'true' : 'false'}}
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
                                calcHeaderHeight={true}
                    />
                </Row>
            </Container>

        </div>
   );
}
