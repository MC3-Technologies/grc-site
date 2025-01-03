import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("PORT_SCANNING_API_KEY")

def port_scan(host):
    try:
        request_string = f"https://api.viewdns.info/portscan/?host={host}&apikey={api_key}&output=json"
        print(request_string)
        res = requests.get(request_string)
        res.raise_for_status()
        data=res.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return e    
