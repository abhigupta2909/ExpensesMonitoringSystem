import mongoengine as db
import certifi
import os
from dotenv import load_dotenv

load_dotenv()


password = os.getenv("DB_PASSWORD")


dataBase_name = os.getenv("DB_NAME")

DB_URI = "mongodb+srv://abgupta:{}@cluster0.u08th6y.mongodb.net/{}?retryWrites=true&w=majority".format(password, dataBase_name)

db.connect(host=DB_URI, tlsCAFile=certifi.where())

class User(db.Document):
    username = db.StringField(required=True, unique=True)
    password = db.StringField(required=True)  
    token = db.StringField()  
    budget = db.FloatField(default=0)

    def to_json(self):
        return {
            "user_id": str(self.id),
            "username": self.username,
            "budget": self.budget
        }

class Expense(db.Document):
    userId = db.ReferenceField(User, required=True)
    name = db.StringField(required=True)
    cost = db.FloatField(required=True)
    date = db.DateTimeField(required=True)  

    meta = {
        'indexes': [
            'name',
            'date',
            ('userId', 'date')
        ]
    }

    def to_json(self):
        return {
            "expense_id": str(self.id),
            "user_id": str(self.userId.id),
            "name": self.name,
            "cost": self.cost,
            "date": self.date.strftime('%Y-%m-%d')  
        }
