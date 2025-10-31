import { getCurrentUser } from "@/lib/auth/hooks";
import { getApplications } from "@/lib/data/Application";
import { getProductName } from "@/lib/data/Product";
import React from "react";
import NewApplication from "./NewApplication";

const ApplicationPage = async () => {
  const user = await getCurrentUser();
  const product = await getProductName();
 

  return <NewApplication user={user} product={product} />;
};

export default ApplicationPage;
