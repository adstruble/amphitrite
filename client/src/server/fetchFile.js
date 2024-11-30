import PropTypes from "prop-types";

export default function fetchFile(fetchUrl, fileName, username, params, fetchCallback, fetchException=null) {
    fetch("/amphitrite/" + fetchUrl, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            username: username
        },
        body: JSON.stringify(params)
    })
        .then(response => {
            response.blob().then(blob => {
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
            })
                .catch((err) => {
                        console.error(err);
                        if (fetchException != null) {
                            fetchException(err);
                        }
                    }
                )});

};


fetchFile.propTypes = {
    fetchUrl: PropTypes.string.isRequired,
    fileName: PropTypes.string.isRequired,
    params: PropTypes.objectOf(PropTypes.string).isRequired,
    fetchCallback: PropTypes.func.isRequired,
    fetchException: PropTypes.func
}