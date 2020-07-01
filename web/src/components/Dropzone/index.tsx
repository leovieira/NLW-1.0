import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUpload } from "react-icons/fi";

import "./styles.css";

interface Props {
  onFileUploaded: (file: File) => void;
}

const Dropzone: React.FC<Props> = ({ onFileUploaded }) => {
  const [selectedFileUrl, setSelectedFileUrl] = useState("");

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const fileUrl = URL.createObjectURL(file);

      setSelectedFileUrl(fileUrl);
      onFileUploaded(file);
    },
    [onFileUploaded]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ".png, .jpg, .jpeg",
  });

  if (selectedFileUrl) {
    return (
      <div
        className="dropzone-container"
        style={{ backgroundImage: "url(" + selectedFileUrl + ")" }}
        {...getRootProps()}
      >
        <input {...getInputProps()} accept=".png, .jpg, .jpeg" />
        <div className="text-container image">
          <FiUpload className="dropzone-p-icon-image" />
          <p className="dropzone-p1-image">Imagem do estabelecimento</p>
          <p className="dropzone-p2-image">
            (Arraste e solte ou clique para selecionar uma imagem)
          </p>
        </div>
      </div>
    );
  } else {
    return (
      <div
        className="dropzone-container"
        style={{ backgroundColor: "#e1faec" }}
        {...getRootProps()}
      >
        <input {...getInputProps()} accept=".png, .jpg, .jpeg" />
        <div className="text-container no-image">
          <FiUpload className="dropzone-p-icon" />
          <p className="dropzone-p1">Imagem do estabelecimento</p>
          <p className="dropzone-p2">
            (Arraste e solte ou clique para selecionar uma imagem)
          </p>
        </div>
      </div>
    );
  }
};

export default Dropzone;
