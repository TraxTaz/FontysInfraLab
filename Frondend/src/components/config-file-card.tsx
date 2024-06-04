import { useEffect, useState } from "react";
import { getFile } from "../services/user-service";
import FilePreviewModal from "./preview-file-modal";
import openvpnLogo from "../assets/openvpn-logo.png";
import { jwtDecode } from "jwt-decode";

export default function ConfigFileCard() {
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [fileContent, setFileContent] = useState<string | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const email = jwtDecode(
          sessionStorage.getItem("Access_token") || "",
        ).sub!;
        const fileUrl = await getFile(email);
        if (fileUrl) setFileUrl(fileUrl);
      } catch (error) {
        console.error(error);
      }
    };

    fetchFile();
  }, []);

  const handleShowModal = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        const text = await response.text();
        setFileContent(text);
        setShowModal(true);
      } catch (error) {
        console.error("Error fetching file content:", error);
      }
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-96 m-4 px-4 py-5 border">
        <div className="md:flex md:flex-col">
          <div className="md:flex-shrink-0 pb-5">
            <img
              className="h-6 object-cover justify-end"
              src={openvpnLogo}
              alt="OpenVPN Config"
            />
          </div>
          <div>
            <p className="text-gray-500 pb-4">
              Download your .ovpn configuration file.
            </p>
            {fileUrl && (
              <a
                href={fileUrl}
                download="openvpn_config.ovpn"
                className="text-white bg-primary-purple hover:bg-primary-purple-dark px-3 py-2 rounded-md mr-2 hover:cursor-pointer"
              >
                Download
              </a>
            )}
            <a
              href="#"
              onClick={handleShowModal}
              className="text-primary-purple border border-primary-purple hover:bg-primary-purple/5 hover:cursor-pointer px-3 py-2 rounded-md"
            >
              Preview
            </a>
          </div>
        </div>
      </div>
      <FilePreviewModal
        fileContent={fileContent}
        showModal={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
