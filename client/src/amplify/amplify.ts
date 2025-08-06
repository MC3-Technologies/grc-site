import { Amplify } from "aws-amplify";

import outputs from "../../../amplify_outputs_download/amplify_outputs.json";

Amplify.configure(outputs);

const getAmplify = () => {
  return Amplify;
};

export { getAmplify };
