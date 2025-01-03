# GRC-Site

GRC-Site is a free MC3 Technologies Cyber Security assessment tool for businesses based on the CMMC Cyber Security Model.

- `/.github/workflows`: Contains all project related automated workflows
- `/client`: Contains the front-end code for the application. This folder hosts a Vite-based React application using TypeScript and Tailwind CSS. It is configured for a multi-page setup.
- `/functions`: Currently empty, but reserved for serverless functions or backend logic in the future.

## Client Overview

### Information

The client-side application is built with the following technologies:

- **Vite**: A fast build tool and development server for modern web applications.
- **React**: A library for building user interfaces.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **TypeScript**: A strongly typed programming language that builds on JavaScript, providing better tooling and type safety.
- **Multi-Page Configuration**: The app is configured to handle multiple entry points, enabling better performance and separation of concerns.

With a **Multi-Page Configuration** setup, we are able to handle routing with different HTML index files in their respective folder routes -- /osint would go to the index.html file in ./osint directory

### Development Setup

1. Navigate to the `client` directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the application in your browser:
   - By default, the development server runs on `http://localhost:5173`.

### Adding a new route entry point

1. Within the ./src folder, create your routing folder and its respective index.html -- If I wanted to created a /food routing, create a /food folder in ./src and a index.html file in ./src/food
2. In the new index.html file, you can copy and paste the contents from the src index.html and change the page entry point on line 11.
3. Run the dev server with `npm run dev` and going to your page route should work as expected, just dont forgot the slash at the end -- `http://localhost:5173/food/`
4. In order to add this new entry point to the build, edit the vite.config.ts config file to include it -- there is an example of it on line 12

### Important Scripts

Inside the `client` folder, the following most used scripts are available:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Lints the codebase.

## Functions Overview

We curently have two Lambda functions in plan -- one for GPT integration via OpenAI API and the OSINT scanning function which will use many different OSINT scanning APIs

### OSINT Function

The OSINT scanning function is planned to take in email, IPs or domains and will use many different APIs to return one comprehensive result.

Currently used APIs:

- **ViewDNS**: Free API used for server port scanning
TBD....

### OSINT Development Setup

1. Navigate to the `osint` directory:

   ```bash
   cd functions/osint
   ```

2. Create a Python venv:

   ```bash
   python -m venv venv
   ```

3. Install pip dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Get and setup port scanning API key :
   Navigate to [viewdns.info](https://viewdns.info/) and create an account for an API key then create a .env file in the `functions/osint` directory with ```PORT_SCANNING_API_KEY = your-api-key```

5. You can test the port scanning API function by calling the port_scan method in ```functions/osint/src/port_scanning.py``` with ```port_scan("your-ip-to-test")```

### GPT Function

In progress!
