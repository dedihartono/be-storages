# Cloud Storage App

This project is a simple cloud storage service built using Node.js and MongoDB. It allows users to upload, delete, retrieve, and list files.

## Getting Started

To run the application, use Docker Compose:

```sh
docker compose -f docker-compose.yml -p cloud-storage up --build -d
```

## Folder Structure

```
cloud-storage/
├── src/
│   ├── controllers/
│   │   └── upload.controller.ts
│   ├── models/
│   │   └── File.ts
│   ├── app.ts
│   ├── server.ts
│   └── utils/
│       ├── passphrase.ts
│       └── index.ts
├── storages/
│   ├── uploads/
│   └── logs/
├── public/ -> storages/uploads (symlink)
├── .env
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

- `POST /upload`: Upload files
- `DELETE /delete/:id`: Delete a file by ID
- `DELETE /delete-passphrase?code=`: Delete a file by passphrase code
- `GET /files/:filename`: Retrieve a file by filename
- `GET /list`: List all files

## Environment Variables

Create a `.env` file in the root directory with the following content:

```dotenv
MONGODB_URI=mongodb://your_mongodb_uri
MAX_UPLOAD_SIZE=10
```

## Detailed Documentation

For detailed information about the API endpoints, request and response formats, and error handling, refer to the [Documentation](./DOCUMENTATION.md).

## Logging

The application logs server activities, file uploads, and errors using a custom logger utility. Logs are saved to appropriate log files and can be viewed for debugging and monitoring purposes.

## Dependencies

- Node.js
- Express
- Mongoose
- Formidable
- dotenv

## License

This project is licensed under the MIT License.