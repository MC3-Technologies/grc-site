interface Props {
  fileName: string;
}

const FileDownloadButton = (props: Props) => {
  const { fileName } = props;
  const handleDownload = () => {
    const link = document.createElement("a");
    const fileUrl = `/${fileName}`;
    link.href = fileUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      type="button"
      className="inline-flex items-center justify-center focus:outline-none text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-purple-300 font-bold rounded-lg text-xl px-5 py-5 mb-2 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-purple-900 w-full"
    >
      <svg
        className="w-7 h-7 mr-2"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 13V4M7 14H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2m-1-5-4 5-4-5m9 8h.01"
        />
      </svg>
      Download Resource
    </button>
  );
};

export default FileDownloadButton;
