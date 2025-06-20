Code Quality DashboardThis project contains the frontend and backend for the Code Quality Dashboard application.Project Structure/
|-- .env              # Holds all secret keys and configuration
|-- package.json      # Defines the Node.js project and dependencies
|-- server.js         # The backend API server
|-- /web
    |-- index.html    # The main application page
    |-- app.js        # Frontend logic to interact with the UI and backend
    |-- style.css     # Custom styles
How to RunYou will need to have Node.js installed on your machine.A. Backend SetupAuthenticate with Google Cloud: The server uses Application Default Credentials. Run this command once to authenticate your local environment with GCP:gcloud auth application-default login
Install Dependencies: Open your terminal in the project's root directory and run:npm install
Start the Backend Server:node server.js

Access the App: Open your browser and navigate to:http://localhost:8080 