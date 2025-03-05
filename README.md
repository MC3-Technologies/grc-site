# GRC-Site

GRC-Site is a free MC3 Technologies Cyber Security assessment tool for businesses based on the CMMC Cyber Security Model.

- `/.github/workflows`: Contains all project related automated workflows
- `/client`: Contains the front-end code for the application along with the Amplify backend resources. This hosts a Vite-based React application using TypeScript and Tailwind CSS. It is configured for a multi-page setup.

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

### Chatting UI Function for Production

AWS ampx sandbox with function streaming `npx dotenvx run --env-file=.env.local -- ampx sandbox --stream-function-logs`

Currently, our chatting UI is disabled to minimize calling to the function.

In order to re-enable it, do the following in the client/src/components/Chat.tsx file

1. Uncomment the getClientChema import on line 3 `import { getClientSchema } from "../amplify/schema";`
2. Uncomment the client state on line 45 `const [client] = useState(getClientSchema());`
3. Comment out the setTimeout function from line 182-192
   ```javaScript
   // setTimeout(() => {
   //    setMessages((prev) => [
   //      ...prev,
   //      {
   //        role: "assistant",
   //        content:
   //          "Our chat bot is currently disabled! Please check back later.",
   //      },
   //    ]);
   //    setResponseLoading(false);
   // }, 500);
   ```
4. Uncomment the try, catch and finally block from line 194-235

   ```javaScript
   try {
      // Request response from GPT completion function using previous currentMessages copy
      const response = await client.queries.gptCompletion({
         messages: JSON.stringify([
            ...messages,
            { role: "user", content: currentMessage },
         ]),
      });
      // If no response data, set error state
      if (!response.data) {
         setError("Error fetching response");
         return;
      }

      // Otherwise double parse response for response messages array and set messages state
      const parsedMessages = JSON.parse(
         JSON.parse(response.data as string)
      ) as ChatHistoryMessage[];
      setMessages(parsedMessages);
      } catch (error) {
      console.error("Error fetching response:", error);
      // Set error and set response loading to false to unlock send message
      setError(`Error fetching response: ${error}`);
      } finally {
      // Set response loading to false to unlock send message
      setResponseLoading(false);
   }
   ```

## Functions Overview

We curently have two functions in plan -- one for GPT integration via OpenAI API and the OSINT scanning function which will use many different OSINT scanning APIs
