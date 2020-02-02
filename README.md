# Task-Manager REST-API
<p>
    <img src="https://img.shields.io/badge/built--on-nodeJS-green?style=flat">
    <img src="https://img.shields.io/badge/storage-mongoDB-blue?style=flat&logo=mongodb">
    <img src="https://img.shields.io/badge/package--manager-npm-grenblue?style=flat">
    <img src="https://img.shields.io/badge/routing-Express-yellow?style=flat">   
</p>
<img src="https://img.shields.io/badge/made--by-elit--altum-purple?style=flat">

***A Representational State Transfer API for managing all your tasks, built using MongoDB and Express***

Manage all your tasks with the Task-It REST API.

Has full fledged support for user login and sign up.  Filter and sort your tasks, search with pagination and a whole lot more features accessible with just some simple requests.

### Live Demo : https://elit-task-manager.herokuapp.com/

## Description

### Technology Stack
- NodeJS
- MongoDB
- Express
- Multer

### Working
1. JSON Web Tokens (JWT's) for tracking user sessions with the app.
2. Hashing features for securely storing and comparing passwords.
3. Multer for file uploads (profile pictures) and 'sharp' for auto-formatting.
4. Mongoose library for using MongoDB
5. SendGrid API for auto-sending emails 

## How to use 

### 0. General Use 
1. __Open routes__ : A route which ***will not*** require authentication i.e. a server issued JSON Web Token (JWT) is not required for access. Can be accessed by any client

2. __Secure routes__ : A route which ***cannot*** be accessed without authentication i.e. a server issued JSON Web Token (JWT) to that particular user is required for access. For all such routes the incoming request should have a request header of *'Authorization'* containing the string *'Bearer'* before the JWT:
```
{
    Authorization: 'Bearer <JWT>'
}
```

### 1. POST /users
*User creation endpoint* <br>
*Open Route*

- Provide a JSON as the request's body following the example and descriptions given below:
```
{
    "name": "John Doe",
    "email": "john.doe@gmail.com",
    "age": 27,
    "password": "ILikeCats123"
}
```
- The data will then be validated for: 
- Validators:
    1. __Email__ : Will be unique for every user in the database. A duplicate email will be considered as validation failure. *(compulsory)*
    2. __Age__ : Should always be a positive number. If not provided, will default to 0.  *(optional)*
    3. __Password__ : Should be at least 7 characters long and shouldn't contain the string 'password' as it's part. *(compulsory)*
- Upon validation of the data, a *201 response* will be sent by the app, along with the newly created user document on MongoDB :
```
{
    "user": {
        "age": 27,
        "_id": "<MongoDB issued unique-id>",
        "name": "John Doe",
        "email": "john.doe@gmail.com",
        "createdAt": "2020-01-23T15:00:15.918Z",
        "updatedAt": "2020-01-23T15:00:16.149Z",
        "__v": 1
    },
    "token": "<Server issued JWT>"
}
```
- Additional fields handled and added by MongoDB:
    1. ___id__ : A unique specifier handled by MongoDB, it is issued to every document on the database.
    2. __createdAt__ : Stores the timestamp of when the user document was created.
    3. __updatedAt__ : Stores the timestamp of when the user document was last updated.
    4. ___v__ : Indicates the version of the document. Helps MongoDB in tracking changes to the data of the document
    5. __token__ : Right now a single token is seen, but this is a subset of the tokens array i.e. every token issued to the user will be displayed as a sub document there.


- Upon failure, a *400 response* will be sent by the app.

### 2. POST /users/login
*User login endpoint* <br>
*Open Route*

- Provide a JSON as the request's body following the example : 
```
{
	"email": "john.doe@gmail.com",
	"password": "ILikeCats123"
}
```
- The data will then be validated for against the existing data/documents in the database.
- If a matching user is found, a *201 response* will be sent by the app along with the user's data (same as route 1. ). A JWT will also be generated for further use of secure routes.
- If no matching user is found, a *404 response* will be sent by the app.

### 3. POST /users/logout
*User logout endpoint from the current session* <br>
*Secure Route*

- Will logout the user from it's current session by deleting the provided JWT.
- A *200 response* will be returned by the app :
```
{
    "success": "Logged out successfully!"
}
```
- If failure, a *500 response* is returned.
- No request modifications/attachments are required.
- The JWT used for logging out can now ***not be used*** for accessing secure routes in the future.

### 4. POST /users/logoutAll
*User logout endpoint from all the sessions* <br>
*Secure Route*

- Will logout the user from it's current session and from all the other sessions ,i.e. if a user has been using the app on multiple devices, by deleting the provided and all the other JWTs issued.
- Will return a *200 response* along with the data similar to that returned in 3.
- If failure, a *500 response* is returned.
- No request modifications/attachments are required.
- All the past JWTs can now ***not be used*** for accessing secure routes in the future.

### 5. GET /users/me
*User profile endpoint* <br>
*Secure Route*

- If the request succeeds, the server will send back the MongoDB stored document of the user of the form :

```
{
    "age": 27,
    "_id": "<MongoDB's User ID>",
    "name": "John Doe",
    "email": "john.doe@gmail.com",
    "createdAt": "2020-01-23T10:37:50.056Z",
    "updatedAt": "2020-01-23T10:37:50.338Z",
    "__v": 1
}
```
- A request failure can only indicate an internal server error i.e. the server might be under maintenance, therefore a *500 response* is returned.

### 6. PATCH /users/me
*User update endpoint* <br>
*Secure Route*

- Provide a JSON as the request's body following the example and descriptions given for User creation to replace the existing data with the newly provided data :
```
{
	"name": "Jenny Doe",
	"email": "jenny.doe@gmail.com",
	"password": "ILikeDogs123"
}
```
- Data not provided in the above request will be untouched/remain same.
- Data validators will run again on the new data and if successful, a *200 response* is returned along with the newly updated document:
```
{
    "age": 27,
    "_id": "<MongoDB's User ID>",
    "name": "Jenny Doe",
    "email": "jenny.doe@gmail.com",
    "createdAt": "2020-01-23T15:00:15.918Z",
    "updatedAt": "2020-01-23T15:23:19.000Z",
    "__v": 3
}
```
- If the validators fail, a *400 response* is returned instead.

### 7. DELETE /users/me
*User delete endpoint* <br>
*Secure Route*

- Will delete the user from the database. Will also delete all his corresponding tasks and task data.
- Upon successful deletion, a *200 response* will be returned by the app, along with the user document, similar to 6.
- If failure, a *400 response* is returned.
- No request modifications/attachments are required.

## Task Handling Routes

### 1. POST /tasks
*Task creation endpoint* <br>
*Secure Route*

- Provide a JSON as the request's body following the example and descriptions given below:
```
{
	"description": "Learn NodeJS",
	"completed": true
}
```
- Validators:
    1. __Description__ : A brief description of the task to add. *(compulsory)*
    2. __Completed__ : *(Boolean)* To indicate if the task added should be marked completed or not. If not provided, will default to false.  *(optional)*
- Upon validation of the data, a *201 response* will be sent by the app, along with the newly created task document on MongoDB :
```
{
    "completed": true,
    "_id": "<MongoDB issued task id>",
    "description": "Learn NodeJS",
    "owner": "<MongoDB issued user id>",
    "createdAt": "2020-02-02T14:03:26.248Z",
    "updatedAt": "2020-02-02T14:03:26.248Z",
    "__v": 0
}
```
- Additional fields handled and added by MongoDB:
    1. ___id__ : A unique specifier handled by MongoDB, it is issued to every document on the database.
    2. __createdAt__ : Stores the timestamp of when the task document was created.
    3. __updatedAt__ : Stores the timestamp of when the task document was last updated.
    4. ___v__ : Indicates the version of the document. Helps MongoDB in tracking changes to the data of the document
    5. __owner__ : Stores the _id of the user which created the particular task for linking it to his account.


- Upon failure, a *400 response* will be sent by the app.

### 2. GET /tasks
*Get all tasks endpoint* <br>
*Secure Route*

- __Query Strings__ :
    1. GET /tasks?*completed=[true/false]*
    2. GET /tasks?*limit=3&skip=6*
    3. GET /tasks?*sortBy=[createdAt/updatedAt]:[desc/asc]*

- Query strings implement sorting and pagination features while getting all the tasks:
    1. Brings all the tasks which are completed or not completed. If not specified all tasks are matched.
    2. Implements the pagination behavior to avoid large transfer of data over the requests and response. If not specified all the matching tasks are returned. Specifications :
        - __limit__ : Specifies the number of tasks to show per page. Assume *l*.
        - __skip__ : Specifies the number of tasks to skip before displaying the current limit of tasks. It is always a multiple of *l*. Assume *s*. 
        - *Example* : <br>
            - For the first page : *l* = 10 and *s* = 0 <br>
            Brings 10 tasks without skipping any i.e. bring the first 10 tasks.
            - For the second page : *l* = 10 and *s* = 10 <br>
            Brings 10 tasks with skipping the first 10 (displayed on the first page) i.e. bring the next 10 tasks *(11 - 20)*
            - For the *nth* page : <br>
            limit = *l* <br>skip = *(n - 1) x l*
    3. Sorts the matching tasks by the specified property in a particular order. If not specified the ascending/asc order is followed. Order :
        - __asc__ : Sorts the found tasks in ascending order
        - __desc__ : Sorts the found tasks in descending order       

__Example__ <br>
*GET/tasks?limit=2&skip=0&sortBy=createdAt:asc*

```
[
    {
        "completed": true,
        "_id": "//",
        "description": "Learn NodeJS",
        "owner": "//",
        "createdAt": "2020-02-02T14:03:26.248Z",
        "updatedAt": "2020-02-02T14:03:26.248Z",
        "__v": 0
    },
    {
        "completed": false,
        "_id": "//",
        "description": "Make coffee",
        "owner": "//",
        "createdAt": "2020-02-02T14:35:18.953Z",
        "updatedAt": "2020-02-02T14:35:18.953Z",
        "__v": 0
    }
]
```
- Returns a *200 response* along with an array of all the matching task documents in accordance with the above query strings.
- A request failure can only indicate an internal server error i.e. the server might be under maintenance, therefore a *500 response* is returned.

### 3. GET /task/:id
*Single task endpoint* <br>
*Secure Route*

- If the request succeeds, the server will send back the MongoDB stored document of the task whose id is specified as the request parameter.
- If a matching task is found, a document similar to that returned when a task is successfully created is returned with a *200 response*
- A request failure indicates that a matching document was not found, therefore a *404 response* is returned.

### 4. PATCH /task/:id
*Update task endpoint* <br>
*Secure Route*

- A request with the required updates as the request's body should be sent. All the updates will be validated with the same validators as those when creating a task:
```
{
	"description": "Get Sleep",
	"completed": false
}
```
- Updates allowed :
    1. __description__
    2. __completed__
- Any other updates are sensitive or Mongo specified therefore cannot be changed.
- If a matching task is found, a document similar to that returned when a task is successfully created is returned with the updated fields and with a *200 response*
- A request failure indicates that a matching document was not found or the validators have failed, therefore a *400 response* is returned.

### 5. DELETE /task/:id
*Delete task endpoint* <br>
*Secure Route*

- Deletes the specified task by matching it using its id provided as query parameter.
- If found, the task document along with a *200 response* is returned.
- If not, a *404 request* is returned.

