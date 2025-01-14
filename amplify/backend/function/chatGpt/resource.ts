// import { defineFunction } from "@aws-amplify/backend";
// import { Construct } from "constructs";
// import { PolicyStatement } from "aws-cdk-lib/aws-iam";
// import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
// import { Runtime } from "aws-cdk-lib/aws-lambda";

// export const chatGptFunction = defineFunction((scope: Construct) => {
//   const fn = new NodejsFunction(scope, "chatGptFunction", {
//     runtime: Runtime.NODEJS_18_X,
//     entry: "./handler.ts"
//   });

//   fn.addToRolePolicy(
//     new PolicyStatement({
//       actions: ["bedrock:InvokeModel"],
//       resources: ["*"],
//     })
//   );

//   return fn; // Return the construct
// });


import { defineFunction } from "@aws-amplify/backend";
export const chatGptFunction = defineFunction({
// leave empty for older Amplify versions
});

