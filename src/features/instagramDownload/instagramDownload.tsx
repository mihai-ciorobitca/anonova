import React from "react";
import { useGetOrderDownloadLinkByIdQuery } from "./instagramDownloadApiSlice";

const InstagramDownloadComponent = ({ id }: { id: number }) => {
  const { data, error, isLoading } = useGetOrderDownloadLinkByIdQuery(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.toString()}</div>;

  return (
    <div>
      <h1>Download Order</h1>
      {data && (
        <a href={data.href} download={data.download}>
          Download file
        </a>
      )}
    </div>
  );
};

export default InstagramDownloadComponent;
