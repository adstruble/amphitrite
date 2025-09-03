import {
    Body,
    Cell,
    Header,
    HeaderCell,
    HeaderRow,
    Table,
    Row as ReactTableRow,
    useCustom
} from '@table-library/react-table-library/table';
import React, {Fragment, useRef, useState} from "react";

import fetchData from "../../server/fetchData";
import useToken from "../App/useToken";
import {useTheme} from "@table-library/react-table-library/theme";
import {getTheme} from "@table-library/react-table-library/baseline";
import PropTypes from "prop-types";
import {Button, Input, InputGroup, InputGroupText, Row} from "reactstrap";
import AmphiHeaderCell from "./AmphiHeaderCell";
import classnames from "classnames";
import AmphiPagination from "./AmphiPagination";
import {onKeyupWithDelay} from "../Utils/General";
import useScrollbarVisibility from "../Utils/ScrollbarVisibility";
import AmphiTooltip from "../Basic/AmphiTooltip.jsx";
import {useHeaderHeight} from "../Utils/useHeaderHeight.js";

export const getExpandedDefault = () => {
    return (<tr className='expanded-row-contents'><td style={{display:"none"}}/></tr>);
}
getExpandedDefault.uuid = '2b228773-242f-47cb-8a70-919edf9138ec';

export default function AmphiTable({tableDataUrl,
                                       reloadData,
                                       headerDataStart,
                                       getExpandedRow=getExpandedDefault,
                                       includePagination=true,
                                       fetchParams,
                                       includeSearch=true,
                                       filter=null,
                                       tableControl=null,
                                       LIMIT=50,
                                       dataFetchCallback=null,
                                       calcHeaderHeight=false}){
    const {getUsername} =   useToken();
    const getUsernameRef = useRef(getUsername);
    getUsernameRef.current = getUsername;
    const [headerCols, setHeaderCols] = useState(headerDataStart.cols);
    const [headerRows, setHeaderRows] = useState(headerDataStart.rows);
    const [searchFocus, setSearchFocus] = useState(false);
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    const [search, setSearch] = useState("");
    const [tableSize, setTableSize] = useState(0);
    const [currElementCnt, setCurrElementCnt] = useState(0);
    const [currPage, setCurrPage] = useState(0);

    const [filterState, setFilterState] = useState(filter === null ? {} : null)
    const [filterStateHolder, setFilterStateHolder] = useState({})

    const Filter = filter;

    const filterWidth = "550px"; //matchWidthElementId ? parseInt(getComputedStyle(document.getElementById(matchWidthElementId))['width'])/2 : "100%";

    const [isScrollbarVisible, setIsScrollbarVisible] = useState(true);
    const [checkScroll, setCheckScroll] = useState(0);
    const elementRef = useScrollbarVisibility(setIsScrollbarVisible, checkScroll);

    const [tableNodes, setTableNodes] = useState({
        nodes: [],
    });

    const [expandedIds, setExpandedIds] = React.useState(new Map());

    React.useEffect(() => {
        setHeaderCols(headerDataStart.cols);
        setHeaderRows(headerDataStart.rows);
    }, [headerDataStart]);

    const handleExpand = (item, event, expandFn) => {
        // First if this is a checkbox we don't want to do anything.
        if (event && event.target.classList.contains('form-check-sign')) {
            return;
        }

        if (!expandFn) {
            expandFn = getExpandedRow
        }

        // Look for ID to see if it's already expanded. If it's expanded for this fn, close it.
        // If it's expanded for a different fn, or not expanded, expand on ths fn
        if (expandedIds.has(item.id) && expandedIds.get(item.id).uuid === expandFn.uuid ){
            removeExpandedId(item.id);
        }
        // If ID is not expanded, expand on this fn
        else{
            addExpandedId(item.id, expandFn);
        }
    };

    const addExpandedId = (expandedId, fn) => {
        setExpandedIds(prev => {
            const newMap = new Map(prev);
            newMap.set(expandedId, fn)
            return newMap;
        });
    };

    const removeExpandedId = (expandedId) => {
        setExpandedIds(prev => {
            const newMap = new Map(prev);
            newMap.delete(expandedId);
            return newMap;
        });
    };

    const getExpandedRowInternal = (item) => {
        return expandedIds.get(item.id)(item);
    }

    useCustom("expand", tableNodes, {
        state: { expandedIds },
        onChange: onExpandChange,
    });

    function onExpandChange(action, state) {
        //console.log(action, state);
    }

    function setParentFilterHolder(state, forceReload){
        setFilterStateHolder(state);
        if (forceReload){
            setFilterState(state);
        }
    }

    function updateOrderBy(clickedHeader){
        const clickedHeaderOrder = clickedHeader.order;
        const newHeaders =
        headerCols.map((header) => {
            if (header.key === clickedHeader.key){
                if(header.order_direction === "ASC"){
                    header.order_direction = "DESC";
                }else if (header.order_direction == null) {
                    header.order_direction = "ASC"
                }else{
                    header.order_direction = null;
                }
                if (header.order_direction == null) {
                    header.order = null;
                }else{
                    header.order = 1;
                }
                return header;
            }else{
                if(header.order <= clickedHeaderOrder || clickedHeaderOrder == null){
                    header.order = header.order + 1;
                }
                return header;
            }
        });
        setHeaderCols(newHeaders);
        setCurrPage(0)
    }

    const determineOrderBy = React.useCallback(async () => {
        // Clone the headerData so we don't change the order of the columns in the rendered table,
        // Shouldn't need to do a deep copy because we're not changing data on the headers themselves
        const headerDataClone = headerCols.slice(0);
        const sortedHeaders = (headerDataClone.sort((a, b) => {
            if (!("order" in a) && !("order" in b)) {
                return 0;
            }
            if (!("order" in a)){
                    return 1;
            }if(!("order" in b)){
                return -1;
            }
            if (isNaN(a.order) && isNaN(b.order)){
                return 0;
            }
            if (isNaN(a.order)){
                return 1;
            }
            if(isNaN(b.order)){
                return -1;
            }
            return a.order < b.order ? -1 : a.order === b.order ? 0 : 1;
        }));
        let newOrderBy = [];
        newOrderBy = sortedHeaders.reduce((newOrderBy, header) => {
            if (header.order > 0 && header.order_direction) {
                newOrderBy = newOrderBy.concat(header.order_by + "," + header.order_direction);
            }
            return newOrderBy;
        }, newOrderBy);

        return newOrderBy
    }, [headerCols]);

    const doGetTableData = React.useCallback(async () => {
        const setTableData = (tableData, params) => {
            setTableNodes({nodes: tableData['data']});
            setCheckScroll(c => c + 1);
            setTableSize(tableData['size']);
            if (tableData['size'] <= (params.offset + LIMIT)){
                setCurrElementCnt(tableData['size'])
            }else{
                setCurrElementCnt(params.offset + LIMIT)
            }
            if(dataFetchCallback){
                dataFetchCallback(tableData, params);
            }
        };

        const newOrderBy = await determineOrderBy()
        if (filterState ===  null){
            // Don't fetch data until filter state has been set
            return;
        }
        let params = {...fetchParams, ...{
                offset: currPage * LIMIT,
                limit: LIMIT,
                order_by: newOrderBy,
                return_size: true,
                like_filter: search,
                exact_filters: filterState,
            }};

        fetchData(tableDataUrl, getUsernameRef.current(), params, setTableData);
    }, [search, currPage, fetchParams, filterState, LIMIT, determineOrderBy, tableDataUrl,
    dataFetchCallback]);

    React.useEffect(() => {
        doGetTableData().then();
    }, [doGetTableData, reloadData]);

    React.useEffect(() =>{
        setHeaderCols(headerDataStart.cols);
        setHeaderRows(headerDataStart.rows);
    }, [headerDataStart]);

    const  maybeSearchTable = (e) => {
        setSearch(e.target.value)
        setCurrPage(0)
    }

    const THEME = {
        ReactTableRow: `
        &.table_row {
            background-color: (0,0,0,0);
        }
      `, Table: `--data-table-library_grid-template-columns: `
             + headerCols.map((header) => {
                 if (header.width) {
                     return "minmax(0px, " + header.width + ")";
                 }else {
                     return "minmax(0px, 1fr)";
                 }
                 }).join("") + ` !important`,
    };

    const theme = useTheme([THEME, getTheme()]);

    function onPaginationChange(action, state) {
        setCurrPage(state.page)
    }

    const totalHeaderHeight = useHeaderHeight(calcHeaderHeight);
    return (
        <div className='amphi-table-container' style={{ height: totalHeaderHeight}}>
            <div className='amphi-table-search-paginate' id="amphiTableSearchPaginate">
                <div className='amphi-table-search' id="amphiTableSearch">
                {includeSearch &&
                    <InputGroup onBlur={() => setSearchFocus(false)}
                                className={classnames({"input-group-focus": searchFocus})}>
                        <div className="input-group-prepend">
                            <InputGroupText>
                                <i className="tim-icons icon-zoom-split"/>
                            </InputGroupText>
                        </div>
                        <Input
                            placeholder="Search"
                            type="text"
                            onFocus={() => setSearchFocus(true)}
                            className={classnames({"input-group-focus": searchFocus})}
                            onKeyUp={onKeyupWithDelay((e) => maybeSearchTable(e),
                                500)}
                            id={tableDataUrl + "_amphiTable"}
                        />
                        <div className="input-group-append">
                            <InputGroupText>
                                <i className="amphi-icon icon-filter clickable"
                                   style={showFilterOptions ? {display: "none"} : {}}
                                   onClick={() => {
                                       setShowFilterOptions(!showFilterOptions);
                                   }}/>
                            </InputGroupText>
                        </div>
                    </InputGroup>}

                    {Filter &&
                        <div style={{width: filterWidth, display:showFilterOptions ? "block": "none"}}
                             className="filter" id="filterTable">
                            <div style={{border: "1px solid #1d8cf8", padding: "10px"}}>
                                <Filter setFilterParent={setParentFilterHolder}/>
                                <Row style={{margin:0}}>
                                    <div style={{display:"flex"}}>
                                        <Button type="button" onClick={()=>setShowFilterOptions(false)}>Close</Button>
                                    </div>
                                    <div style={{display:"flex", marginLeft:"auto"}}>
                                        <Button type="button" onClick={()=>{
                                            setShowFilterOptions(false);
                                            setCurrPage(0);
                                            setFilterState(filterStateHolder);
                                        }}>Search</Button>
                                    </div>
                                </Row>
                            </div>
                        </div>
                    }
                    {includePagination &&
                        <AmphiPagination className={classnames('pagination')} LIMIT={LIMIT} tableNodes={tableNodes} onPaginationChange={onPaginationChange}
                                         tableSize={tableSize} currPage={currPage} currElementCnt={currElementCnt}/>}
                    {tableControl}
                </div>


            </div>

            <div className={classnames('amphi-table-inner',isScrollbarVisible && 'scrolling')}>
                <div className='amphi-table-header'>
                    <Table data={{nodes: headerCols}} style={{marginBottom: "0px"}} theme={theme} >
                        {(headerData) => (
                            <>
                                <Header>
                                    <HeaderRow className='table-row' id={"header_row"}>
                                        {headerData.map((header) => {
                                            return(<AmphiHeaderCell header={header} updateOrderBy={updateOrderBy}/>);
                                        })
                                        }
                                    </HeaderRow>
                                </Header>
                            </>
                        )}
                    </Table>
                </div>
                <div className='amphi-table-contents'>
                    <Table data={tableNodes} theme={theme} ref={elementRef}>
                    {(tableList) => (
                        <>
                            <Header>
                                <HeaderRow style={{display:'none'}}>
                                    {headerCols.map(() => {return <HeaderCell/>})}
                                </HeaderRow>
                            </Header>

                            <Body>
                                {tableList.map((item) => (

                                    <React.Fragment>
                                        <ReactTableRow className={
                                            classnames({'expanded': expandedIds.has(item.id) },
                                            'table-row', (headerRows.getRowClass) && headerRows.getRowClass(item))}
                                                       key={item.id} item={item} id={'id' + item.id}
                                        >
                                            {headerCols.map((header) => {
                                                let txt = () => {return(header['format_fn'](item[header.key], item, header.format_args, handleExpand, header.key))};
                                                let tooltip = txt();
                                                let content = tooltip
                                                if (Array.isArray(tooltip)){
                                                    tooltip = tooltip[1];
                                                    content = content[0]
                                                }
                                                return (
                                                    <Cell id={'id' + item.id + header.key}
                                                          key={item.id + header.key}
                                                          className={header.className && header.className}>
                                                        {header.tooltip && <AmphiTooltip
                                                            placement={header.className === 'numberCell' ? "top-end" : "top-start"}
                                                            target={'id' + item.id + header.key}
                                                            content={tooltip}/>
                                                        }
                                                        {content}

                                                    </Cell>
                                                   );})
                                            }
                                        </ReactTableRow>
                                        {expandedIds.has(item.id) && (getExpandedRowInternal(item))}
                                    </React.Fragment>
                                ))}
                                <ReactTableRow key='bottom' item={null} id={'idlastrow'}>
                                    <Cell key='bottom-cell' className='table-bottom' gridColumnStart={1} gridColumnEnd={headerCols.length + 1}>&nbsp;</Cell>
                                </ReactTableRow>
                            </Body>
                        </>
                    )}
                </Table>
                </div>
            </div>
        </div>
    );

}

AmphiTable.propTypes = {
    tableDataUrl: PropTypes.string.isRequired,
    reloadData: PropTypes.any,
    headerDataStart:PropTypes.objectOf(PropTypes.any).isRequired,
    getExpandedRow: PropTypes.func,
    includePagination: PropTypes.bool,
    fetchParams: PropTypes.objectOf(PropTypes.any)
}