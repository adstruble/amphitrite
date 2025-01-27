import PropTypes from "prop-types";
import AmphiTable from "../../components/Table/AmphiTable";
import {
    formatDate,
    formatDoubleTo3,
    formatStr
} from "../../components/Utils/FormatFunctions";
import React, {useState} from "react";
import fetchData from "../../server/fetchData";
import useToken from "../../components/App/useToken";

export default function CrossFishExpanded({item}) {
    const {getUsername} = useToken();
    const familyCrossURL = "cross_fish/get_completed_crosses_by_family"
    const familyCrossURLCntOnly = "cross_fish/get_completed_crosses_by_family_cnt"
    const [xCompletedCrossesRefuge, setXCompletedCrossesRefuge] = useState(0);
    const [yCompletedCrossesRefuge, setYCompletedCrossesRefuge] = useState(0)
    const [xCompletedCrossesSuppl, setXCompletedCrossesSuppl] = useState(0);
    const [yCompletedCrossesSuppl, setYCompletedCrossesSuppl] = useState(0)
    const [rowContentsRefuge, setRowContentsRefuge] = useState(null);
    const [rowContentsSuppl, setRowContentsSuppl] = useState(null);
    const [itemCrossed, setItemCrossed] = useState(item['completed_x']!=null)

    const CROSSES_HEADER = {
        rows:{},
        cols:[
            {name: "Date Cross Made", key:"cross_date", visible: true, format_fn: formatDate, width:".9fr"},
            {name: "F", key: "f", visible: true, format_fn: formatDoubleTo3, width:"1fr"},
            {name: "DI", key: "di", visible: true, format_fn: formatDoubleTo3, width:".7fr"},
            {name: "F Fish", key: "f_tag", visible: true, format_fn: formatStr, width:".9fr", tooltip: true},
            {name: "F PC/FSG", key: "x_gid",  visible: true, format_fn: formatStr, width:".9fr"},
            {name: "M Fish", key: "m_tag", visible: true, format_fn: formatStr, width:".9fr", tooltip: true},
            {name: "M PC/FSG", key: "y_gid",  visible: true, format_fn: formatStr, width:".9fr"}
        ]};

    // We need to do an intial load of the table data so we know the counts or completed crosses
    React.useEffect(()=>{
        let params = {
                offset: 0,
                limit: 25,
                order_by: [],
                return_size: true,
                like_filter: "",
                exact_filters: {},
                fam_ids: [item['p1_fam_id'], item['p2_fam_id']]
            };

        fetchData(familyCrossURLCntOnly, getUsername(), params, onGetCrossesCallback);
    }, [itemCrossed]);

    React.useEffect(()=>{
        setItemCrossed(item['completed_x']!=null);
    },[item])

    function onGetCrossesCallback(table_data){
        setXCompletedCrossesRefuge(table_data['refuge'][item['p1_fam_id']]);
        setYCompletedCrossesRefuge(table_data['refuge'][item['p2_fam_id']]);
        setXCompletedCrossesSuppl(table_data['supplementation'][item['p1_fam_id']]);
        setYCompletedCrossesSuppl(table_data['supplementation'][item['p2_fam_id']]);
    }

    React.useEffect(()=>{
        setRowContentsRefuge(getRowContents("refuge",
            "Refuge",
            xCompletedCrossesRefuge,
            yCompletedCrossesRefuge,
            true));
    },[xCompletedCrossesRefuge, yCompletedCrossesRefuge]);

    React.useEffect(()=>{
        setRowContentsSuppl(getRowContents("supplementation",
            "Supplementation",
            xCompletedCrossesSuppl,
            yCompletedCrossesSuppl,
            false));
    },[xCompletedCrossesSuppl, yCompletedCrossesSuppl]);

    function getRowContents(crossTypeLower, crossTypeUpper, xCrosses, yCrosses, refuge){
        if(xCrosses + yCrosses === 0){
            return (<>
                <span style={{paddingLeft:"40px"}}>No {crossTypeLower} crosses have been <b>completed</b> with either group {item['x_gid']} of year {item['x_cross_year']} or group {item['y_gid']} of year {item['y_cross_year']}.</span>
            </>);
        }

        if (xCrosses > 0 && yCrosses === 0) {
            return (
                <div className="inner-amphi-table">
                    <h6>{crossTypeUpper} Crosses <b>Completed</b> With Family Sibling Group {item['x_gid']} of Year {item['x_cross_year']}</h6>
                    <AmphiTable headerDataStart={CROSSES_HEADER}
                                fetchParams={{fam_id: item['p1_fam_id'], refuge: refuge}}
                                tableDataUrl={familyCrossURL}
                                includePagination={false}
                                includeSearch={false}
                    />
                </div>);
        }

        if (xCrosses === 0 && yCrosses > 0){
            return (
                <div className="inner-amphi-table">
                    <h6>{crossTypeUpper} Crosses <b>Completed</b> With Family Sibling Group {item['y_gid']} of Year {item['y_cross_year']}</h6>
                    <AmphiTable headerDataStart={CROSSES_HEADER}
                        fetchParams={{fam_id: item['p2_fam_id'], refuge: refuge}}
                        tableDataUrl={familyCrossURL}
                        includePagination={false}
                        includeSearch={false}/>
                </div>);
        }

        return (
            <div className="inner-amphi-table">
                <h6>{crossTypeUpper} Crosses <b>Completed</b> With Family Sibling Group {item['x_gid']} of Year {item['x_cross_year']}</h6>
                <AmphiTable headerDataStart={CROSSES_HEADER}
                            fetchParams={{fam_id: item['p1_fam_id'], refuge: refuge}}
                            tableDataUrl={familyCrossURL}
                            includePagination={false}
                            includeSearch={false}/>
                <h6 style={{paddingTop:10}}>{crossTypeUpper} Crosses <b>Completed</b> With Family Sibling Group {item['y_gid']} of Year {item['y_cross_year']}</h6>
                <AmphiTable headerDataStart={CROSSES_HEADER}
                            fetchParams={{fam_id: item['p2_fam_id'], refuge: refuge}}
                            tableDataUrl={familyCrossURL}
                            includePagination={false}
                            includeSearch={false}/>
            </div>

        )
    }

    return (
        <tr className='expanded-row-contents'>
            <td>
                {rowContentsRefuge}
                <br/><br/>
                {rowContentsSuppl}
            </td>
        </tr>
    );
}

CrossFishExpanded.propTypes = {
    item: PropTypes.any.isRequired
}