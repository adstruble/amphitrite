import {Button, Container, FormGroup, Input, Modal, Row} from "reactstrap";
import AmphiTable from "../../components/Table/AmphiTable";
import React, {useState} from "react";
import useToken from "../../components/App/useToken";
import {
    formatCheckbox,
    formatDelete,
    formatStr
} from "../../components/Utils/FormatFunctions";
import classnames from "classnames";
import fetchData from "../../server/fetchData";
import AmphiAlert from "../../components/Basic/AmphiAlert";

export default function ManageUsers(){

    const {getUsername} = useToken();
    const [reloadTable, setReloadTable] = useState(0);
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [usernameFocus, setUsernameFocus] = useState(false);
    const [alertText, setAlertText] = useState("");
    const [alertLevel, setAlertLevel] = useState("success")

    function addUser(){
        setAddUserOpen(false);
        let username = document.getElementById('userField').value
        fetchData('users/add_user', getUsername(),
            {'username': username}, () => {
                setReloadTable(reloadTable + 1);
                setAlertLevel("success");
                setAlertText("User " + username + " added with password: pass")
            });
    }

    const deleteUser = (user)  => {
        if (user['username'] === 'amphiadmin'){
            // don't allow delete of amphiadmin
            return;
        }
        fetchData('users/delete_user', getUsername(),
            {'username': user['username']}, () => {
                setReloadTable(reloadTable + 1);
                setAlertLevel("success");
                setAlertText("User " + user['username'] + " deleted")
            });
    }

    function handleDisabledChecked(evt, user,getName ){
        if (getName){
            return "handleDisabledChecked";
        }
        fetchData('users/disable_user', getUsername(),
            {'username': user['username'], 'enable':!evt.target.checked}, () => {
                setAlertLevel("success");
                setAlertText("User " + user['username'] + (!evt.target.checked ? " enabled" : " disabled"));
            });
    }

    function isUserDisabled(user){
        return !user['enabled']
    }

    function disableActions(user){
        if (user['username'] === 'amphiadmin') {
            return true;
        }
        return false;
    }

    const USERS_HEADER = {
        rows:{},
        cols:[
            {name: "User", key: "username", visible: true, format_fn: formatStr, width:"1fr"},
            {name: "User Disabled", key: "disabled", visible: true, format_fn:formatCheckbox,
                format_args:[handleDisabledChecked, isUserDisabled, disableActions], width:".1fr", className:"centerCell"},
            {name: "Delete User", key: "delete", visible: true, format_fn:formatDelete,
                format_args:[deleteUser, disableActions], width:".1fr", className:"centerCell"}]
    };

    return (
        <Container className="manage-users">
            <Row>
                <AmphiAlert alertText={alertText} alertLevel={alertLevel} setAlertText={setAlertText}/>
            </Row>
            <Row>
                <Button className="btn" color="default" type="button" onClick={() =>setAddUserOpen(true)}>
                    Add User
                </Button>
            </Row>
            <Modal isOpen={addUserOpen} modalClassName="modal-black" id="addUser">
                <div className="modal-header justify-content-center">
                    <Button className="btn-close" onClick={() => setAddUserOpen(false)}>
                        <i className="tim-icons icon-simple-remove text-white"/>
                    </Button>
                    <div className="text-muted text-center ml-auto mr-auto">
                        <h3 className="mb-0">Add User</h3>
                    </div>
                </div>
                <div className="modal-body">
                    <FormGroup className={classnames({"input-group-focus": usernameFocus})}>
                        <span>Username</span>
                        <Input id="userField"
                            onFocus={() => setUsernameFocus(true)}
                            onBlur={() => setUsernameFocus(false)}
                            type="text"
                        />
                    </FormGroup>
                </div>
                <div className="modal-footer">
                    <Button color="default" className="btn" type="button"
                            onClick={() => setAddUserOpen(false)}>Cancel</Button>
                    <Button color="success" type="button" onClick={addUser}>Save</Button>
                </div>
            </Modal>
            <Row>
                <AmphiTable tableDataUrl="users/get_users"
                            headerDataStart={USERS_HEADER}
                            includeSearch={false}
                />
            </Row>
        </Container>
    );
}