

// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = async (event) => {
//     console.log(`EVENT: ${JSON.stringify(event)}`);
//     return {
//         statusCode: 200,
//     //  Uncomment below to enable CORS requests
//     //  headers: {
//     //      "Access-Control-Allow-Origin": "*",
//     //      "Access-Control-Allow-Headers": "*"
//     //  },
//         body: JSON.stringify('Hello from Lambda!'),
//     };
// };


const {
    BedrockRuntimeClient,
    InvokeModelCommand
  } = require("@aws-sdk/client-bedrock-runtime");
  
  const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" }); // Adjust region if needed
  
  exports.handler = async (event) => {
    // Provide standard CORS headers if needed
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    };
  
    if (event.httpMethod === "OPTIONS") {
      // Handle preflight CORS
      return {
        statusCode: 200,
        headers,
        body: "",
      };
    }
  
    try {
      // Parse request
      const body = JSON.parse(event.body || "{}");
      const { messages } = body;
  
      if (!Array.isArray(messages)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "messages must be an array" }),
        };
      }
  
      // Format messages for the Claude prompt
      const userPrompt = messages.map((m) => m.message).join("\nHuman: ");
      const prompt = `Human: ${userPrompt}\nAssistant:`;
    
    // const prompt = `[System: You are a cybersecurity assistant. Provide helpful answers to the user.]  
    // Human: ${userPrompt}  
    // Assistant:`;
  
      // Call Claude via Bedrock
      const result = await bedrockClient.send(
        new InvokeModelCommand({
          modelId: "anthropic.claude-v2",
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            prompt,
            max_tokens_to_sample: 1000,
            temperature: 0.7,
          }),
        })
      );
  
      // Parse Bedrock response
      const responseBody = new TextDecoder().decode(result.body);
      const { completion } = JSON.parse(responseBody);
  
      // Return response
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: completion.trim() }),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Error occurred",
        }),
      };
    }
  };