
export default function getData(getUrl, username, params, setData, setAlertLevel, setAlertText){
    const queryParams = new URLSearchParams(params).toString();

    let headers = {username: username, 'Content-Type': 'application/json'};

    fetch(`/amphitrite/${getUrl}?${queryParams}`, {method: "GET", headers: headers})
        .then((res) => res.json())
        .then((data) => {
                if ('success' in data) {
                    setData(data['success'], params);
                }
                else if (!data['success'] && data['level']){
                    setAlertLevel(data['level']);
                    setAlertText(data['message']);
                }else if('error' in data){
                    setAlertLevel('danger');
                    setAlertText(data['error'])
                }
            } // TODO: Handle Failure
        ).catch((err) => {
            console.error(err);
        }
    )
}
