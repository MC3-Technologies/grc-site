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


### Important Scripts
Inside the `client` folder, the following most used scripts are available:

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Lints the codebase.

## Functions Overview

In progress!