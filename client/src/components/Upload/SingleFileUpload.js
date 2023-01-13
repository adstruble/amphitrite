import { ChangeEvent, useState } from 'react';

export default function FileUploadSingle({fileupload_url}) {
    const [file, setFile] = useState();

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        if (!file) {
            return;
        }
        const formData = new FormData();
        formData.append('File', file);
        // 👇 Uploading the file using the fetch API to the server
        fetch("/amphitrite/" + fileupload_url, {
            method: "POST",
            body: formData,
        })
            .then((res) => res.json())
            .then((data) => console.log(data))
            .catch((err) => console.error(err));
    };

    return(
        <div>
            <input type="file" name="file" onChange={handleFileChange} />
            <div>
                <button onClick={handleUploadClick}>Submit</button>
            </div>
        </div>
    )
}
