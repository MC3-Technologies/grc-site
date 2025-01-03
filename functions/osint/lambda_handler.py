import json
from port_scanning import port_scan

def handler(event, context):
    try:
        # Log the incoming event for debugging
        print("Received event:", json.dumps(event, indent=2))

        # Parse query for parameters
        ip = event.get("queryStringParameters", {}).get("ip")
        
        # Create the response
        response = {
            "statusCode": 200,
            "body": json.dumps({
                "port-scan": port_scan(ip),
                "input": event
            }),
        }

        return response

    except Exception as e:
        print("Error handling event:", str(e))

        # Return a 500 error response
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": "Internal Server Error",
                "error": str(e),
            }),
        }
