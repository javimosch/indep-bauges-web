# Indépendants en Bauges Website

A static website for the "Indépendants en Bauges" association, built with HTML, CSS, and JavaScript.

## Project Structure

- `src/sections/`: Contains HTML section files that are combined into the final page
- `src/scripts/`: Contains JavaScript scripts for building and serving the website
- `dist/`: Contains the compiled website (generated during build)

## Development

### Prerequisites

- Node.js (v20.17.0 or later)
- Docker and Docker Compose (for containerized deployment)

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Build the website:
   ```
   npm run build
   ```

3. Start the development server:
   ```
   npm run serve
   ```

4. Or do both in one command:
   ```
   npm start
   ```

5. Open your browser and navigate to http://localhost:3000

## Docker Deployment

### Using Docker Compose (Development)

1. Start the container:
   ```
   docker compose up
   ```

2. Access the website at http://localhost:3000

### Building and Pushing Pre-built Image

1. Build and push the pre-built image to a container registry:
   ```
   ./build-and-push.sh [registry/username]
   ```

   Replace `[registry/username]` with your container registry and username.

### Deploying on Remote Server

1. Copy the `deploy.sh` script to your remote server.

2. Run the deployment script:
   ```
   ./deploy.sh [registry/username]
   ```

   Replace `[registry/username]` with your container registry and username.

## Building Process

The website is built using a custom concatenation script that:

1. Takes `src/sections/index.html` as a template
2. Finds all include comments like `<!-- Include file.html -->`
3. Replaces each comment with the content of the corresponding file from the `src/sections` folder
4. Processes any nested includes recursively
5. Writes the final compiled file to `dist/index.html`

## License

ISC
