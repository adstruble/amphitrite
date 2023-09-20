import {Alert, Button, Container, Modal, Row} from "reactstrap";
import {Body, Cell, Header, HeaderCell, HeaderRow, Table, Row as TableRow} from '@table-library/react-table-library/table';
import { useTheme } from '@table-library/react-table-library/theme';
import { DEFAULT_OPTIONS, getTheme } from '@table-library/react-table-library/baseline';

import FileUploadSingle from "../../components/Upload/SingleFileUpload";
import React, {useState} from "react";
import {useOutletContext} from "react-router-dom";
import fetchData from "../../server/post";
import useToken from "../../components/App/useToken";
import {usePagination} from "@table-library/react-table-library/pagination";


export default function ManageFish() {
    const LIMIT = 20;
    const {token, setToken, getUsername} = useToken();
    const [formModal, setFormModal] = useState(false);

    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState(""); //useOutletContext();

    const [tableData, setTableData] = useState({
        nodes: [],
    });

    const handleUploadFishClick = async e => {
        e.preventDefault();
        setFormModal(true);
    };

    const setFishList = (fishList) => {
        setTableData({nodes: fishList});
    }

    const fishUploadCallback = result => {

        if ("success" in result) {
            let message = "Records successfully imported. ";
            for (let k in result['success']) {
                message += k + ": " + result['success'][k] + " ";
            }
            setAlertText(message);
            setAlertLevel("success");

            doGetFish(0,'family_id', false).then();
            return;
        }
        setAlertText(result["error"]);
        setAlertLevel("danger");
    };

    const fishUploadInProgress = () => {
        setFormModal(false);
        setAlertText("Bulk upload in progress...");
        setAlertLevel("info");
    }

    const fishUploadCancel = () => {
        setFormModal(false);
    }

    const doGetFish = React.useCallback(async (offset, order_by, desc) => {
        fetchData('/manage_fish/get_fishes', getUsername(),  {
            offset: offset,
            limit: LIMIT,
            order_by: order_by,
            DESC: desc
        }, setFishList);
    }, [fetchData]);

    React.useEffect(() => {
        doGetFish(0,'family_id', false).then();
    }, [doGetFish]);


    const THEME = {
        Row: `
        &.table_row {
            background-color: (0,0,0,0);
        }
      `,
    };

    const theme = useTheme([THEME, getTheme()]);

    const pagination = usePagination(
        tableData,
        {
            state: {
                page: 0,
                size: LIMIT,
            },
            onChange: onPaginationChange,
        },
        {
            isServer: true,
        }
    );

    function onPaginationChange(action, state) {
        doGetFish(state.page * LIMIT,'family_id', false).then();
    }

    return (

        <div className="wrapper">
            <Container>
                <Row>
                    <Alert isOpen={alertText.length > 0} color={alertLevel} onClose={() => setAlertText("")} dismissible>
                        {alertLevel === "danger" && <strong>Error: </strong>} {alertText}
                    </Alert>
                </Row>
                <Row>
                    <FileUploadSingle formModalProp={formModal} fileUploadUrl="manage_fish/bulk_upload"
                                      submitReturnCallback={fishUploadCallback} submitCallback={fishUploadInProgress}
                    cancelCallback={fishUploadCancel}/>
                    <Button className="btn" color="default" type="button" onClick={handleUploadFishClick}>
                        Upload Fish
                    </Button>
                </Row>
                <Row>
                    <div
                        style={{
                            height: "100vh",
                            width: "100%",
                            flex: "1",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                            marginTop: ".5rem"
                        }}
                    >
                        <div
                            style={{
                                flex: "1",
                                display: "flex",
                                flexDirection: "column",
                                position: "absolute",
                                top: "0",
                                left: "0",
                                right: "0",
                                bottom: "0",
                            }}
                        >
                            <Table style={{marginBottom: "0px"}} data={{nodes:[]}} theme={theme} pagination={pagination} >
                                {(tableList) => (
                                    <>
                                    <Header>
                                        <HeaderRow className='table_row'>
                                            <HeaderCell>Family ID</HeaderCell>
                                            <HeaderCell>Sex</HeaderCell>
                                            <HeaderCell>Refuge Tag</HeaderCell>
                                            <HeaderCell>Box</HeaderCell>
                                        </HeaderRow>
                                    </Header>
                                    <Body>
                                    {tableList.map((fish) => (
                                        <TableRow className='table_row' key={fish.id} item={fish}>
                                            <Cell>{fish.group_id}</Cell>
                                            <Cell>{fish.sex}</Cell>
                                            <Cell>{fish.tag}</Cell>
                                            <Cell>{fish.box}</Cell>
                                        </TableRow>
                                    ))}
                                    </Body>
                                    </>
                                )}
                            </Table>
                        </div>
                        <div
                            style={{
                                flex: "1",
                                display: "flex",
                                flexDirection: "column",
                                position: "absolute",
                                inset: "45px 0px 0px 0px"
                            }}
                        >
                            <Table data={tableData} theme={theme} pagination={pagination}>
                                {(tableList) => (
                                        <>
                                            <Header>
                                                <HeaderRow style={{display:"none"}}>
                                                    <HeaderCell></HeaderCell>
                                                    <HeaderCell></HeaderCell>
                                                    <HeaderCell></HeaderCell>
                                                    <HeaderCell></HeaderCell>
                                                </HeaderRow>
                                            </Header>

                                        <Body>
                                            {tableList.map((fish) => (
                                                <TableRow className='table_row' key={fish.id} item={fish}>
                                                    <Cell>{fish.group_id}</Cell>
                                                    <Cell>{fish.sex}</Cell>
                                                    <Cell>{fish.tag}</Cell>
                                                    <Cell>{fish.box}</Cell>
                                                </TableRow>
                                            ))}
                                        </Body>
</>
                                )}
                            </Table>
                        </div>
                    </div>
                </Row>
            </Container>

        </div>
   );
}