import PropTypes from "prop-types";


export default function fetchData(fetchUrl, username, params, setData, fetchCallback=null, fetchException=null,
                                  setAlertLevel=null, setAlertText=null,
                                  setLoading=null, body = null) {
    if (setLoading){
        setLoading(true)
    }
    let headers = {username: username};
    if (body == null){
        body = JSON.stringify(params)
        headers['Content-Type'] = 'application/json';
    }
    fetch("/amphitrite/" + fetchUrl, {
        method: "POST",
        headers: headers,
        body: body
})
    .then((res) => res.json())
    .then((data) => {
            if ('success' in data) {
                setData(data['success'], params);
                if (fetchCallback) {
                    fetchCallback(data);
                }
            }
            if (!data['success'] && data['level']){
                setAlertLevel(data['level']);
                setAlertText(data['message']);
            }
        } // TODO: Handle Failure
    )
    .catch((err) => {
            console.error(err);
            if (fetchException) {
                fetchException(err);
            }
        }
    ).finally({
        if (setLoading) {
            setLoading(false);
        }
    })

};


fetchData.propTypes = {
    fetchUrl: PropTypes.string.isRequired,
    params: PropTypes.objectOf(PropTypes.string).isRequired,
    setData: PropTypes.func.isRequired,
    fetchCallback: PropTypes.func,
    fetchException: PropTypes.func,
    setAlertLevel: PropTypes.func,
    setAlertText: PropTypes.func,
    body: PropTypes.any
}
