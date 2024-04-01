from flask import Flask, request, jsonify
import mongoengine as db
import bcrypt
import certifi
import jwt
from datetime import datetime, timedelta
from jwt import ExpiredSignatureError, DecodeError
from flask_cors import CORS
import os
import random
import string
import base64
from mongoengine.errors import ValidationError, DoesNotExist
from bson import ObjectId
from bill_settlement.bill_settle import settle_expenses
from flask_mail import Mail, Message




app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Connect to MongoDB using mongoengine
password = os.getenv("PASSWORD")
dataBase_name = os.getenv("DBNAME")
DB_URI = "mongodb+srv://abgupta:{}@cluster0.u08th6y.mongodb.net/{}?retryWrites=true&w=majority".format(password, dataBase_name)
db.connect(host=DB_URI, tlsCAFile=certifi.where())

# key and config

SECRET_KEY = os.getenv("SECRET_KEY")
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")


app.config["MAIL_SERVER"] = "smtp.fastmail.com"
app.config["MAIL_PORT"] = 465
app.config["MAIL_USERNAME"] = "abhigupta@fastmail.com"
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_USE_TLS"] = False
app.config["MAIL_USE_SSL"] = True
mail = Mail(app)



# User Model
class User(db.Document):
    username = db.StringField(required=True, unique=True)
    password = db.StringField(required=True)
    first_name = db.StringField(required=True)
    last_name = db.StringField(required=True)
    email = db.EmailField(required=True, unique=True)
    budget = db.FloatField(required=False, default=1000.00)
    
    def to_json(self):
        return {
            "user_id": str(self.id),
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "budget": self.budget
        }
    
class PersonalExpense(db.Document):
    user_id = db.ReferenceField(User, required=True)
    amount = db.FloatField(required=True)
    name = db.StringField(required=True)
    date = db.DateTimeField(default=datetime.utcnow)
    category = db.StringField(required=True)

    def to_json(self):
        return {
            "expense_id": str(self.id),
            "user_id": str(self.user_id.id),
            "amount": self.amount,
            "name": self.name,
            "date": self.date.strftime('%Y-%m-%d'),
            "category": self.category
        }

    
class Group(db.Document):
    groupName = db.StringField(required=True)
    admin = db.ReferenceField(User, required=True)
    members = db.ListField(db.ReferenceField(User), default=[])
    date_created = db.DateTimeField(default=datetime.utcnow)
    passphrase = db.StringField(required=True, unique=True)

    def generate_passphrase(self, length=16):
        # Generate a random string of letters and digits
        letters_and_digits = string.ascii_letters + string.digits
        return ''.join(random.choice(letters_and_digits) for i in range(length))

    def save(self, *args, **kwargs):
        if not self.passphrase:
            self.passphrase = self.generate_passphrase()
        return super(Group, self).save(*args, **kwargs)

    def is_admin(self, user):
        return user == self.admin

    @property
    def all_members(self):
        return list(set(self.members + [self.admin]))
    
    def to_json(self):
        return {
            "group_id": str(self.id),
            "group_name": self.groupName,
            "admin": str(self.admin.id),
            "members": [str(member.id) for member in self.members],
            "date_created": self.date_created.strftime('%Y-%m-%d %H:%M:%S'),
            "passphrase": self.passphrase
        }
    
class GroupExpense(db.Document):
    group_id = db.ReferenceField(Group, required=True)
    paidBy = db.ReferenceField(User, required=True)  # User who paid the expense
    amount = db.FloatField(required=True)
    description = db.StringField(required=True)
    paid_for = db.ListField(db.ReferenceField(User))  # Description of what the expense was for
    splitMethod = db.StringField(required=True, choices=['equal', 'percentage', 'custom', 'payment'])
    splitDetails = db.DictField()  # Details of how the expense is split among members
    date = db.DateTimeField(default=datetime.utcnow)  # Date and time of the expense

    def to_json(self):
        # Helper function to safely get a username from a user ID
        def get_username_from_id(user_or_id):
            # Check if user_or_id is a dictionary with an '$oid' key
            if isinstance(user_or_id, dict) and '$oid' in user_or_id:
                user_or_id = user_or_id['$oid']

            # If user_or_id is a string, try converting it to ObjectId
            if isinstance(user_or_id, str):
                try:
                    user_or_id = ObjectId(user_or_id)
                except ValidationError:
                    return "Unknown User"

            # If user_or_id is ObjectId, fetch the user and return the username
            if isinstance(user_or_id, ObjectId):
                try:
                    user = User.objects.get(id=user_or_id)
                    return user.username
                except (DoesNotExist, ValidationError):
                    return "Unknown User"
            else:
                return "Unknown User"

        try:

            # Get usernames for the paid_for field
            paid_for_usernames = [user.username for user in self.paid_for if isinstance(user, User)]

            # Get username for the payer
            payer_username = get_username_from_id(self.paidBy.id)

            # Get usernames for the shares
            shares_with_usernames = {get_username_from_id(user_id): share for user_id, share in self.splitDetails['shares'].items()}

            # Construct the split details with usernames
            split_details_with_usernames = {
                'payer': get_username_from_id(self.splitDetails['payer']),
                'shares': shares_with_usernames
            }

            return {
                "group_expense_id": str(self.id),
                "group_id": str(self.group_id.id),
                "paid_by": payer_username,
                "amount": self.amount,
                "description": self.description,
                "paid_for": paid_for_usernames,
                "split_method": self.splitMethod,
                "split_details": split_details_with_usernames,
                "date": self.date.strftime('%Y-%m-%d %H:%M:%S')
            }
        except Exception as e:
            print(f"Error in to_json: {e}")
            raise

def send_email(email_purpose,  recipient_email,user_name=None ,data= None):
    sender_email = 'abhigupta@fastmail.com'
    # Base HTML structure
    base_html = """
    <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: linear-gradient(to right, #e2e2e2, #7e9af6);
                    color: #333333;
                }}
                .header {{
                    background-color: #512da8;
                    color: white;
                    text-align: center;
                    padding: 10px 0;
                }}
                .content {{
                    padding: 20px;
                }}
                .footer {{
                    background-color: #512da8;
                    color: white;
                    text-align: center;
                    padding: 10px 0;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Expense Monitoring System</h1>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                <p>ExpenseMonitoringSystem.com</p>
                <p>Copyright © 2023 ExpenseMonitoringSystem™.<br>
                All rights reserved.<br>
                Boston, MA, 02135</p>
            </div>
        </body>
    </html>
    """

    if email_purpose == 'registration':
        subject = 'Welcome to Expense Monitoring System!'
        content = f"<p>Hello {user_name},</p><p>Welcome to our Expense Management System! Your account has been created successfully.</p>"
    
    elif email_purpose == 'group_invitation':
        subject = 'You have been invited to a group!'
        content = f"""
        <p>Hello {user_name},</p>
        <p>You have been invited to join a group in Expense Monitoring System. 
        Use the API key below to join the group: <strong>{data['group_name']}</strong></p>
        <p><strong>API Key: {data['api_key']}</strong></p>
        <p>Follow the instructions on our website to use this key and join group to manage expenses efficiently.</p>
        """    
    elif email_purpose == 'expense_alert':
        subject = 'Expense Alert in Your Group'
        content = f"<p>Hello,</p><p>There's a new update in your expense group.</p><p> {data} </p><p>Please check your Expense Monitoring System account for more details.</p>"

    else:
        subject = 'Notification from Expense Monitoring System'
        content = "<p>Hello, you have a new notification from Expense Monitoring System.</p>"

    # Create the HTML content
    html_content = base_html.format(content=content)

    # Create and send the message
    msg = Message(subject, sender=sender_email, recipients=[recipient_email])
    msg.body = content.replace('<p>', '').replace('</p>', '\n').strip()  # Plain text version
    msg.html = html_content
    mail.send(msg)




@app.route('/api/users/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        username = data.get('username')
        plain_password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')

        # Checking if the user already exists based on username or email
        existing_user = User.objects(db.Q(username=username) | db.Q(email=email)).first()
        if existing_user:
            return jsonify({"success": False, "message": "User with that username or email already exists"}), 400

        # Hashing the password before saving
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(plain_password.encode('utf-8'), salt)

        # Create new user
        new_user = User(
            username=username,
            password=hashed_password.decode('utf-8'),
            first_name=first_name,
            last_name=last_name,
            email=email
        ).save()

        # Generate JWT token
        token_payload = {
            "user_id": str(new_user.id),
            "username": new_user.username,
            # Token expires after 24 hours
            "exp": datetime.utcnow() + timedelta(hours=24)  
        }
        token = jwt.encode(token_payload, SECRET_KEY, algorithm="HS256")
        # send email to welcome user
        send_email('registration', user_name=new_user.first_name, recipient_email=new_user.email)

        return jsonify({"success": True, "message": "User registered successfully", "token": token, "data": new_user.to_json()}), 201

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"success": False, "message": "An error occurred during registration"}), 500



@app.route('/api/verify_token', methods=['POST'])
def verify_token():
    data = request.get_json()
    token = data.get('token')

    if not token:
        return jsonify({"success": False, "message": "Token is missing"}), 400

    try:
        # decode the token
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return jsonify({"success": True, "message": "Token is valid", "user_id": decoded_token["user_id"]}), 200
    except ExpiredSignatureError:
        return jsonify({"success": False, "message": "Token has expired"}), 401
    except DecodeError:
        return jsonify({"success": False, "message": "Token is invalid"}), 401


@app.route('/api/users/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # Check if the user exists
    user = User.objects(username=username).first()
    
    if not user:
        return jsonify({"success": False, "message": "Invalid username or password"}), 404
    
    # Validate the password
    if bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        # If valid password, generate and send JWT token
        token = jwt.encode({"user_id": str(user.id)}, app.config['SECRET_KEY'])
        return jsonify({"success": True, "token": token, "data": user.to_json()}), 200
    else:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401


@app.route('/api/users/profile', methods=['GET'])
def get_user_profile():
    # Extracting the token from the header
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    # Getting the user ID from the token
    user_id = get_user_id_from_token(token)

    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 402

    # Fetching the user from the database
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    # Returning the user's first name and last name
    return jsonify({
        "success": True,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username" :user.username,
        "email": user.email
    }), 200



def get_user_id_from_token(token):
    try:
        if token.startswith('Bearer '):
            # Removing the 'Bearer ' prefix
            token = token[7:]  
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded_token["user_id"]
    except (ExpiredSignatureError, DecodeError) as e:
        print(f"Token error: {e}")
        return None



@app.route('/api/personal_expenses/add', methods=['POST'])
def add_expense():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    data = request.get_json()
    amount = data.get('amount')
    name = data.get('name')
    date = data.get('date', datetime.utcnow())
    category = data.get('category')

    if not category:
        return jsonify({"success": False, "message": "Category is required"}), 400
    
    if not amount or not name:
        return jsonify({"success": False, "message": "Amount and name are required"}), 400

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    try:
        if isinstance(date, str):
            # Updated to parse ISO 8601 format date string
            date = datetime.strptime(date, '%Y-%m-%dT%H:%M:%S.%fZ')
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format. Use YYYY-MM-DDTHH:MM:SS.sssZ"}), 400

    new_expense = PersonalExpense(user_id=user, amount=amount, name=name, date=date, category=category).save()
    return jsonify({"success": True, "message": "Expense added successfully", "data": new_expense.to_json()}), 201

@app.route('/api/personal_expenses', methods=['GET'])
def get_expenses():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    expenses = PersonalExpense.objects(user_id=user).order_by('-date')  # Fetch expenses for the user, ordered by date
    return jsonify({
        "success": True,
        "expenses": [expense.to_json() for expense in expenses]
    }), 200

@app.route('/api/personal_expenses/delete/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    # Check if the expense belongs to the user
    expense = PersonalExpense.objects(id=expense_id, user_id=user_id).first()
    if not expense:
        return jsonify({"success": False, "message": "Expense not found or does not belong to the user"}), 404

    try:
        # Delete the found expense
        expense.delete()
        return jsonify({"success": True, "message": "Expense deleted successfully"}), 200
    except Exception as e:
        # Handle any exceptions that occur during delete
        return jsonify({"success": False, "message": "An error occurred while trying to delete the expense"}), 500


@app.route('/api/personal_expenses/edit/<expense_id>', methods=['PUT'])
def edit_expense(expense_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    expense = PersonalExpense.objects(id=expense_id, user_id=user_id).first()
    if not expense:
        return jsonify({"success": False, "message": "Expense not found or does not belong to the user"}), 404

    data = request.get_json()
    amount = data.get('amount')
    name = data.get('name')
    date = data.get('date', datetime.utcnow())

    if not amount or not name:
        return jsonify({"success": False, "message": "Amount and name are required"}), 400

    try:
        if isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%dT%H:%M:%S.%fZ')
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format. Use YYYY-MM-DDTHH:MM:SS.sssZ"}), 400

    try:
        # Update the expense
        expense.update(amount=amount, name=name, date=date)
        return jsonify({"success": True, "message": "Expense updated successfully"}), 200
    except Exception as e:
        # Handle any exceptions that occur during update
        return jsonify({"success": False, "message": "An error occurred while trying to update the expense"}), 500

@app.route('/api/users/update_budget', methods=['PUT'])
def update_user_budget():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    data = request.get_json()
    new_budget = data.get('budget')

    if new_budget is None:
        return jsonify({"success": False, "message": "Budget value is required"}), 400

    try:
        user.update(budget=new_budget)
        return jsonify({"success": True, "message": "Budget updated successfully"}), 200
    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "message": "An error occurred while trying to update the budget"}), 500

@app.route('/api/users/get_budget', methods=['GET'])
def get_user_budget():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    try:
        return jsonify({"success": True, "budget": user.budget}), 200
    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "message": "An error occurred while retrieving the budget"}), 500


@app.route('/api/groups/create', methods=['POST'])
def create_group():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    data = request.get_json()
    group_name = data.get('group_name')

    if not group_name:
        return jsonify({"success": False, "message": "Group name is required"}), 400

    admin = User.objects(id=user_id).first()
    if not admin:
        return jsonify({"success": False, "message": "Admin user not found"}), 404

    try:
        new_group = Group(groupName=group_name, admin=admin).save()
        return jsonify({"success": True, "message": "Group created successfully", "data": new_group.to_json()}), 201
    except Exception as e:
        return jsonify({"success": False, "message": "Error creating group", "error": str(e)}), 500

@app.route('/api/groups/<group_id>', methods=['GET'])
def get_group_details(group_id):
    print("fetch group!!!!!!")
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    try:
        group = Group.objects(id=group_id).first()
        if not group:
            return jsonify({"success": False, "message": "Group not found"}), 404

        # Check if the user is either a member or an admin of the group
        if user_id not in [str(group.admin.id)] + [str(member.id) for member in group.members]:
            return jsonify({"success": False, "message": "User is not authorized to view to this group"}), 403

        print("-------> ", group.to_json())
        return jsonify({"success": True, "data": group.to_json()}), 200
    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "message": "Error fetching group details", "error": str(e)}), 500



@app.route('/api/groups/<group_id>/delete', methods=['DELETE'])
def delete_group(group_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    group = Group.objects(id=group_id).first()
    if not group:
        return jsonify({"success": False, "message": "Group not found"}), 404

    if str(group.admin.id) != user_id:
        return jsonify({"success": False, "message": "Only the group admin can delete the group"}), 403

    try:
        group.delete()
        return jsonify({"success": True, "message": "Group deleted successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": "Error deleting group", "error": str(e)}), 500


def generate_api_key(group_id, passphrase):
    combined_key = f"{group_id}:{passphrase}"
    encoded_key = base64.urlsafe_b64encode(combined_key.encode()).decode()
    return encoded_key


def decode_api_key(api_key):
    decoded_key = base64.urlsafe_b64decode(api_key).decode()
    group_id, passphrase = decoded_key.split(':', 1)
    return group_id, passphrase


@app.route('/api/groups/join', methods=['POST'])
def join_group():
    data = request.get_json()
    user_id = get_user_id_from_token(request.headers.get('Authorization'))
    api_key = data.get('api_key')

    if not all([user_id, api_key]):
        return jsonify({"success": False, "message": "Missing required parameters"}), 400

    group_id, passphrase = decode_api_key(api_key)

    if not all([user_id, group_id, passphrase]):
        return jsonify({"success": False, "message": "Missing required parameters"}), 400

    group = Group.objects(id=group_id, passphrase=passphrase).first()
    if not group:
        return jsonify({"success": False, "message": "Invalid group ID or passphrase"}), 404

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    if user in group.members:
        return jsonify({"success": False, "message": "User already in group"}), 400

    group.members.append(user)
    group.save()

    return jsonify({"success": True, "message": "Joined group successfully"}), 200



@app.route('/api/groups/<group_id>/invite', methods=['POST'])
def invite_user_to_group(group_id):
    # Authenticate the user
    token = request.headers.get('Authorization')
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    # Check if the group exists
    group = Group.objects(id=group_id).first()
    if not group:
        return jsonify({"success": False, "message": "Group not found"}), 404

    # Get email from request
    data = request.get_json()
    recipient_email = data.get('email')
    if not recipient_email:
        return jsonify({"success": False, "message": "Email is required"}), 400

    # Check if email is already in the group
    if any(member.email == recipient_email for member in group.members):
        return jsonify({"success": False, "message": "User already in group"}), 400

    # Generate API key
    api_key = generate_api_key(group_id, group.passphrase)

    # Send an invitation email with API key
    try:
        data = {
            'group_name': group.groupName,
            'api_key': api_key
        }
        send_email(email_purpose='group_invitation',recipient_email=recipient_email, data=data)
    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "message": "Failed to send invitation email", "error": str(e)}), 500

    return jsonify({"success": True, "message": "Invitation sent successfully"}), 200


@app.route('/api/groups', methods=['GET'])
def get_user_groups():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    try:
        admin_groups = Group.objects(admin=user_id)
        # Fetch groups where the user is a member
        member_groups = Group.objects(members=user_id)

        # Combine the results from both queries
        user_groups = list(admin_groups) + list(member_groups)

        return jsonify({"success": True, "data": [group.to_json() for group in user_groups]}), 200
    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "message": "Error fetching groups", "error": str(e)}), 500

@app.route('/api/groups/<group_id>/members', methods=['GET'])
def get_group_members(group_id):
    # Extract and validate the authorization token
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    # Find the group by the group_id
    group = Group.objects(id=group_id).first()
    if not group:
        return jsonify({"success": False, "message": "Group not found"}), 404

    # Optional: Check if the requesting user is authorized (e.g., a member of the group)
    if user_id not in [str(group.admin.id)] + [str(member.id) for member in group.members]:
        return jsonify({"success": False, "message": "Unauthorized access"}), 403

    # Return the list of members
    members = group.all_members
    member_data = [member.to_json() for member in members]
    return jsonify({"success": True, "members": member_data}), 200


@app.route('/api/groups/<group_id>/add_expense', methods=['POST'])
def add_expense_to_group(group_id):
    # Step 1: Authenticate the user
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    # Step 2: Validate and extract data
    data = request.get_json()
    paid_by = data.get('paid_by')
    amount = data.get('amount')
    description = data.get('description')
    paid_for_ids = data.get('paidFor')
    split_method = data.get('splitMethod')
    split_details = data.get('splitDetails')

    # Convert paid_for_ids to User objects
    paid_for_users = [User.objects(id=user_id).first() for user_id in paid_for_ids]

    # Step 3: Check if group exists and user is a member or admin
    group = Group.objects(id=group_id).first()
    if not group:
        return jsonify({"success": False, "message": "Group not found"}), 404

    if split_method == 'payment':
        if paid_by in paid_for_ids:
            return jsonify({"success": False, "message": "Payer cannot be the same as payee in 'payment' split method"}), 400


    # Checking if the user is an admin or a member of the group
    if user_id not in [str(group.admin.id)] + [str(member.id) for member in group.members]:
        return jsonify({"success": False, "message": "User is not authorized to add expense to this group"}), 403

    # Step 4: Create and save expense
    try:
        new_expense = GroupExpense(
            group_id=group,
            paidBy=User.objects(id=paid_by).first(),
            amount=amount,
            description=description,
            paid_for=paid_for_users,
            splitMethod=split_method,
            splitDetails=split_details
        ).save()

        # Prepare data for email
        expense_mail_data = {
            "Alert type": "Add",
            "paid_by": User.objects(id=paid_by).first().username,
            "amount": amount,
            "description": description,
            "split_method": split_method,
        }

        # Get all group members' email addresses, excluding the user who added the expense
        recipient_emails = []
        for member in group.all_members:
            recipient_emails.append(member.email)
            
        # Send email to each group member
        for email in recipient_emails:
            send_email(email_purpose='expense_alert', recipient_email=email, data=expense_mail_data)
            
        return jsonify({"success": True, "message": "Expense added successfully", "data": new_expense.to_json()}), 201
    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "message": "Error adding expense", "error": str(e)}), 500

@app.route('/api/groups/<group_id>/expenses', methods=['GET'])
def get_group_expenses(group_id):
    # Step 1: Authenticate the user
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    # Step 2: Check if the group exists
    group = Group.objects(id=group_id).first()
    if not group:
        return jsonify({"success": False, "message": "Group not found"}), 404

    # Step 3: Check if the user is a member or admin of the group
    if user_id not in [str(group.admin.id)] + [str(member.id) for member in group.members]:
        return jsonify({"success": False, "message": "User is not authorized to view expenses of this group"}), 403

    # Step 4: Retrieve and return the expenses
    try:
        expenses = GroupExpense.objects(group_id=group).order_by('-date')  # Order by date descending
        expenses_json = [expense.to_json() for expense in expenses]

        return jsonify({"success": True, "expenses": expenses_json}), 200

    except Exception as e:
        return jsonify({"success": False, "message": "Error retrieving expenses", "error": str(e)}), 500

@app.route('/api/groups/<group_id>/edit_expense/<expense_id>', methods=['PUT'])
def edit_group_expense(group_id, expense_id):
    # Authentication and user validation
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    # Check if group exists and if user is admin
    group = Group.objects(id=group_id).first()
    if user_id not in [str(group.admin.id)] + [str(member.id) for member in group.members]:
        return jsonify({"success": False, "message": "Unauthorized Action"}), 403

    # Retrieve the expense to be edited
    expense = GroupExpense.objects(id=expense_id, group_id=group).first()
    if not expense:
        return jsonify({"success": False, "message": "Expense not found"}), 404

    # Update the expense
    data = request.get_json()
    expense.amount = data.get('amount', expense.amount)
    expense.description = data.get('description', expense.description)
    expense.splitMethod = data.get('splitMethod', expense.splitMethod)
    expense.splitDetails = data.get('splitDetails', expense.splitDetails)
    expense.save()

    # Prepare data for email
    expense_mail_data = {
        "Alert type": "Edit",
        "paid_by": User.objects(id=expense.paidBy.id).first().username,
        "amount": expense.amount,
        "description": expense.description,
        "split_method": expense.splitMethod,
    }

    # Get all group members' email addresses, excluding the user who added the expense
    recipient_emails = []
    for member in group.all_members:
        recipient_emails.append(member.email)
        
    # Send email to each group member
    for email in recipient_emails:
        send_email(email_purpose='expense_alert', recipient_email=email, data=expense_mail_data)
    return jsonify({"success": True, "message": "Expense updated successfully", "data": expense.to_json()}), 200

@app.route('/api/groups/<group_id>/expenses/<expense_id>', methods=['DELETE'])
def delete_expense_from_group(group_id, expense_id):
    # Step 1: Authenticate the user
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    # Step 2: Check if group exists and user is an admin
    group = Group.objects(id=group_id).first()
    if not group:
        return jsonify({"success": False, "message": "Group not found"}), 404

    if user_id not in [str(group.admin.id)] + [str(member.id) for member in group.members]:
        return jsonify({"success": False, "message": "User is not authorized to delete expenses in this group"}), 403

    # Step 3: Attempt to delete the expense
    try:
        expense = GroupExpense.objects(id=expense_id, group_id=group_id).first()
        if not expense:
            return jsonify({"success": False, "message": "Expense not found"}), 404
        expense.delete()

        # Prepare data for email
        expense_mail_data = {
            "Alert type": "Delete",
            "paid_by": User.objects(id=expense.paidBy.id).first().username,
            "amount": expense.amount,
            "description": expense.description,
            "split_method": expense.splitMethod,
        }

        # Get all group members' email addresses, excluding the user who added the expense
        recipient_emails = []
        for member in group.all_members:
            recipient_emails.append(member.email)
            
        # Send email to each group member
        for email in recipient_emails:
            send_email(email_purpose='expense_alert', recipient_email=email, data=expense_mail_data)

        return jsonify({"success": True, "message": "Expense deleted successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": "Error deleting expense", "error": str(e)}), 500

@app.route('/api/groups/<group_id>/settlement_summary', methods=['GET'])
def get_settlement_summary(group_id):
    # Step 1: Authenticate the user
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    # Step 2: Check if the group exists
    group = Group.objects(id=group_id).first()
    if not group:
        return jsonify({"success": False, "message": "Group not found"}), 404

    # Step 3: Check if the user is a member or admin of the group
    if user_id not in [str(group.admin.id)] + [str(member.id) for member in group.members]:
        return jsonify({"success": False, "message": "User is not authorized to view this information"}), 403

    # Step 4: Retrieve and filter the expenses with split method 'equal'
    try:
        expenses = GroupExpense.objects(group_id=group, splitMethod__in=['equal', 'payment', 'percentage'])
        # Prepare the data for the settlement calculation
        expenses_data = []
        for expense in expenses:
            payer_id = str(expense.paidBy.id)
            shares = {str(user_id): expense.splitDetails['shares'][str(user_id)] for user_id in expense.splitDetails['shares']}
            expenses_data.append({
                "payer": payer_id,
                "amount": expense.amount,
                "shares": shares
            })

        # Calculate the settlements
        settlements = settle_expenses(expenses_data)

        # Format the settlements for the response
        settlements_json = [
            {
                'from': User.objects(id=debtor).first().username,
                'to': User.objects(id=creditor).first().username,
                'amount': amount
            }
            for debtor, creditor, amount in settlements
        ]

        return jsonify({"success": True, "settlements": settlements_json}), 200

    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "message": "Error calculating settlements", "error": str(e)}), 500

#dashboard section

@app.route('/api/dashboard/get_expenses', methods=['GET'])
def get_expenses_by_date_range():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    expenses = PersonalExpense.objects(user_id=user).order_by('date')

    start_date_str = request.args.get('start')
    end_date_str = request.args.get('end')

    start_date = datetime.strptime(start_date_str, '%Y-%m-%d') if start_date_str else None
    end_date = datetime.strptime(end_date_str, '%Y-%m-%d') if end_date_str else None

    if start_date:
        expenses = expenses.filter(date__gte=start_date)
    if end_date:
        expenses = expenses.filter(date__lte=end_date)

    return jsonify({
        "success": True,
        "expenses": [expense.to_json() for expense in expenses]
    }), 200

@app.route('/api/dashboard/get_all_expenses', methods=['GET'])
def get_all_expenses():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    expenses = PersonalExpense.objects(user_id=user).order_by('date')  # Fetch expenses for the user, ordered by date
    return jsonify({
        "success": True,
        "expenses": [expense.to_json() for expense in expenses]
    }), 200

@app.route('/api/dashboard/get_budget', methods=['GET'])
def get_budget():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"success": False, "message": "Authentication token is missing"}), 401

    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({"success": False, "message": "Invalid or expired token"}), 401

    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    try:
        return jsonify({"success": True, "budget": user.budget}), 200
    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "message": "An error occurred while retrieving the budget"}), 500

if __name__ == '__main__':
    app.run(debug=True)

