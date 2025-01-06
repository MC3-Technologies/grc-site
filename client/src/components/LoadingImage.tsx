import { useState } from "react";

import Spinner from "./Spinner";

interface Props {
  imageUri: string;
  className: string;
}

const LoadingImage = (props: Props) => {
  const [loadingStyle, changeLoadingStyle] = useState({});
  const [imageStyle, changeImageStyle] = useState({ display: "none" });

  return (
    <>
      <div className="flex justify-center py-12" style={loadingStyle}>
        <Spinner />
      </div>

      <img
        src={props.imageUri}
        className={props.className}
        onLoad={() => {
          changeLoadingStyle({ display: "none" });
          changeImageStyle({ display: "" });
        }}
        style={imageStyle}
      ></img>
    </>
  );
};

export default LoadingImage;
