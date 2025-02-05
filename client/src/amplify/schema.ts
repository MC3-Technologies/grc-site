import { getAmplify } from "./amplify";
import type { Schema } from "../../../amplify/data/resource";
import { generateClient } from "aws-amplify/api";

const getClientSchema = () => {
  getAmplify();
  const client = generateClient<Schema>({ authMode: "userPool" });
  return client;
};

export { getClientSchema };
