# File Upload API Documentation

## Overview

This document provides information on how to use the API endpoints for file upload, deletion, retrieval, and listing.

## Base URL

- **Base URL**: `http://localhost:8081`

## Endpoints

### 1. Upload a File

- **Endpoint**: `/upload`
- **Method**: `POST`
- **Description**: Uploads one or more files to the server.

#### Request

- **Headers**:
  - `Content-Type: multipart/form-data`
- **Body**:
  - `file`: File to upload (type: `File`, required)
  - `alt`: Optional alternate text for the file (type: `String`, optional)
  - `description`: Optional description of the file (type: `String`, optional)

#### Example Request using `curl`

```sh
curl -X POST http://localhost:8081/upload \
  -F "file=@/path/to/your/file.txt" \
  -F "alt=sample alt text" \
  -F "description=sample description"
```

#### Example Request using Postman

1. Open Postman and set the request type to `POST`.
2. Enter the URL: `http://localhost:8081/upload`.
3. Go to the `Body` tab and select `form-data`.
4. Add a key `file`, set the type to `File`, and choose a file from your system.
5. Optionally, add keys for `alt` and `description` with the desired values.
6. Click `Send`.

#### Response

- **Status Code**: `200 OK` (success) or `500 Internal Server Error` (failure)
- **Body**:
  ```json
  {
    "message": "Files uploaded successfully",
    "files": [
      {
        "name": "file.txt",
        "location": "/storages/uploads/2024-08-08/1234567890.txt",
        "passphraseCode": "sampleCode123"
      }
    ]
  }
  ```

### 2. Delete a File by ID

- **Endpoint**: `/delete/{id}`
- **Method**: `DELETE`
- **Description**: Deletes a file by its ID.

#### Request

- **URL Parameters**:
  - `id`: The ID of the file to delete (type: `String`, required)

#### Example Request using `curl`

```sh
curl -X DELETE http://localhost:8081/delete/FILE_ID
```

#### Example Request using Postman

1. Set the request type to `DELETE`.
2. Enter the URL: `http://localhost:8081/delete/FILE_ID` (replace `FILE_ID` with the actual file ID).
3. Click `Send`.

#### Response

- **Status Code**: `200 OK` (success), `404 Not Found` (file not found), or `500 Internal Server Error` (failure)
- **Body**:
  ```json
  {
    "message": "File deleted successfully",
    "file": {
      "filename": "file.txt",
      "path": "/storages/uploads/2024-08-08/1234567890.txt"
    }
  }
  ```

### 3. Delete a File by Passphrase Code

- **Endpoint**: `/delete-passphrase?code=PASSCODE`
- **Method**: `DELETE`
- **Description**: Deletes a file using a unique passphrase code.

#### Request

- **Query Parameters**:
  - `code`: The passphrase code associated with the file (type: `String`, required)

#### Example Request using `curl`

```sh
curl -X DELETE "http://localhost:8081/delete-passphrase?code=PASSCODE"
```

#### Example Request using Postman

1. Set the request type to `DELETE`.
2. Enter the URL: `http://localhost:8081/delete-passphrase?code=PASSCODE` (replace `PASSCODE` with the actual passphrase code).
3. Click `Send`.

#### Response

- **Status Code**: `200 OK` (success), `404 Not Found` (file not found), or `500 Internal Server Error` (failure)
- **Body**:
  ```json
  {
    "message": "File deleted successfully",
    "file": {
      "filename": "file.txt",
      "path": "/storages/uploads/2024-08-08/1234567890.txt"
    }
  }
  ```

### 4. Retrieve a File

- **Endpoint**: `/files/{file_path}`
- **Method**: `GET`
- **Description**: Retrieves a file by its path.

#### Request

- **URL Parameters**:
  - `file_path`: The path to the file (type: `String`, required)

#### Example Request using `curl`

```sh
curl -X GET http://localhost:8081/files/file_path
```

#### Example Request using Postman

1. Set the request type to `GET`.
2. Enter the URL: `http://localhost:8081/files/file_path` (replace `file_path` with the actual file path).
3. Click `Send`.

#### Response

- **Status Code**: `200 OK` (success) or `404 Not Found` (file not found)
- **Body**: Binary data of the file

### 5. List All Files

- **Endpoint**: `/list`
- **Method**: `GET`
- **Description**: Lists all uploaded files.

#### Request

- **Headers**: None

#### Example Request using `curl`

```sh
curl -X GET http://localhost:8081/list
```

#### Example Request using Postman

1. Set the request type to `GET`.
2. Enter the URL: `http://localhost:8081/list`.
3. Click `Send`.

#### Response

- **Status Code**: `200 OK` (success) or `500 Internal Server Error` (failure)
- **Body**:
  ```json
  {
    "files": [
      {
        "filename": "file1.txt",
        "path": "/storages/uploads/2024-08-08/1234567890.txt",
        "type": "text/plain",
        "size": 1234,
        "alt": "sample alt text",
        "description": "sample description",
        "uploadedAt": "2024-08-08T12:34:56Z",
        "passphraseCode": "sampleCode123"
      }
    ]
  }
  ```

## Error Handling

- **File Upload Failures**: Returns a `500 Internal Server Error` with a message detailing the failure.
- **File Deletion Failures**: Returns a `500 Internal Server Error` or `404 Not Found` if the file is not found.
- **File Retrieval Failures**: Returns a `404 Not Found` if the file does not exist.

---

Ensure to replace placeholders like `FILE_ID`, `file_path`, and `@/path/to/your/file.txt` with actual values when testing the API.