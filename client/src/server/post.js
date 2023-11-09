import PropTypes from "prop-types";

export default function fetchData(fetchUrl, username, params, setData, fetchCallback=null, fetchException=null) {
    fetch("/amphitrite/" + fetchUrl, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            username: username
        },
        body: JSON.stringify(params)
})
    .then((res) => res.json())
    .then((data) => {
            if ('success' in data) {
                console.log(data['success'])
                setData(data['success'], params);
                if (fetchCallback != null) {
                    fetchCallback(data);
                }
            }
        } // TODO: Handle Failure
    )
    .catch((err) => {
            console.error(err);
            if (fetchException != null) {
                fetchException(err);
            }
        }
    )

};


fetchData.propTypes = {
    fetchUrl: PropTypes.string.isRequired,
    params: PropTypes.objectOf(PropTypes.string).isRequired,
    setData: PropTypes.func.isRequired,
    fetchCallback: PropTypes.func,
    fetchException: PropTypes.func
}