### Setup Environment:

Create a virtual environment (optional but recommended):

python3 -m venv venv
Activate the virtual environment:

For Windows:

`.\venv\Scripts\activate`

For macOS/Linux:

`source venv/bin/activate`

##### Install Necessary Libraries:

Install the required libraries (Flask, Flask-MongoEngine, bcrypt) within your virtual environment or globally:

`pip install Flask Flask-MongoEngine bcrypt`

`pip install PyJWT`

`Update MongoDB Password`:
replace YOUR_MONGODB_PASSWORD with the actual password for your MongoDB cluster.

### Run the Code:

Save the provided code to a file, e.g., app.py. Then, run the script using:

`python app.py`

##### Testing the Endpoint:

With the API running (you should see a message like Running on http://127.0.0.1:5000/), you can test the registration endpoint.

You can use tools like Postman or curl from the command line to send a POST request:

http://127.0.0.1:5000/api/users/register

##### Deactivate Virtual Environment:

After testing, if you wish to exit the virtual environment, simply run:

`deactivate`
