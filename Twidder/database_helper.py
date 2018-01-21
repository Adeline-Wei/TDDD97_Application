__author__ = 'linwe991'
print("database_helper.py")

from flask import g
import sqlite3


DB = None

def init_db(db_name):
    global DB
    DB = get_db(db_name)
    with open('database.schema', mode='r') as f:
        try:
            DB.cursor().executescript(f.read())
            DB.commit()
        except:
            print("Database Initialization Failed.")
            return False
    return True


def get_db(db_name):
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(db_name, check_same_thread=False)
        print("db: ", db)
    return db



def add_user(email,password,firstname,familyname,gender,city,country):
    global DB
    try:
        DB.cursor().execute('INSERT INTO Users VALUES (?,?,?,?,?,?,?);', [email,password,firstname,familyname,gender,city,country])
        DB.commit()
    except Exception:
        print ('An Exception Occurs In ADD_USER Function Users. ')
        return False
    # except sqlite3.Error as er:
    #     print('er:', er)
    try:
        DB.cursor().execute('INSERT INTO Views VALUES (?,?,?);', [None, email, 0])
        DB.commit()
        return True
    except Exception:
        print ('An Exception Occurs In ADD_USER Function Views. ')
        return False


def find_user(email,password=None,status=None):
    global DB
    if status == 'LOGIN':
        result = DB.cursor().execute("SELECT * FROM Users WHERE email = ? AND password = ?;", [email,password]).fetchall()
        DB.commit()
        if result:
            return result[0]
        else:
            print ('An Exception Occurs In FIND_USER Function. ')
            return False
    else:
        result = DB.cursor().execute("SELECT * FROM Users WHERE email = ?;", [email]).fetchall()
        DB.commit()
        if result:
            return result[0]
        else:
            print ('An Exception Occurs In FIND_USER Function. ')
            return False


def add_sign_in_user(email, token):
    global DB
    try:
        DB.cursor().execute("INSERT INTO Logins VALUES (?,?,?);", [None,email,token])
        DB.commit()
        return True
    except:
        print ('An Exception Occurs In ADD_SIGN_IN_USER Function. ')
        return False


def remove_sign_in_user(token):
    global DB
    try:
        DB.cursor().execute("DELETE FROM Logins WHERE token = ?;", [token])
        DB.commit()
        return True
    except:
        print ('An Exception Occurs In REMOVE_SIGN_IN_USER Function. ')
        return False


def change_password(token, old_pw, new_pw):
    global DB
    # Format: [(2, u'123', u'BfK3nE71lA3YsPdWRp9SJ315gL5U9gwGZSkP')]
    result = DB.cursor().execute("SELECT email FROM Logins WHERE token = ?;", [token]).fetchall()
    result2 = DB.cursor().execute("SELECT password FROM Users WHERE email = ?;", [result[0][0]]).fetchall()
    if old_pw == result2[0][0]:
        if result:
            email = result[0][0]
            result = DB.cursor().execute("UPDATE Users SET password = ? WHERE email = ? AND password = ?;", [new_pw,email,old_pw])
            DB.commit()
            if result:
                return True
            else:
                return False
        else:
            return False
    else:
        print ('An Exception Occurs In CHANGE PASSWORD Function.')
        return False



def find_sign_in_user(token):
    global DB
    result = DB.cursor().execute("SELECT email FROM Logins WHERE token = ?;", [token]).fetchall()
    if result:
        email = result[0][0]
        result = DB.cursor().execute("SELECT email,firstname,familyname,gender,city,country FROM Users WHERE email = ?;", [email]).fetchall()
        DB.commit()
        return result[0]
    else:
        print ('An Exception Occurs In FIND_SIGN_IN_USER.')
        return False


def find_user_message(token, search_email=None):
    global DB
    print('current_token:',token)
    current_user = DB.cursor().execute("SELECT email FROM Logins WHERE token = ?;", [token]).fetchall()
    if current_user and search_email:
        searched_user = DB.cursor().execute("SELECT email FROM Users WHERE email = ?;", [search_email]).fetchall()
        if searched_user[0][0]:
            result = DB.cursor().execute("SELECT from_user, content FROM Messages WHERE to_user = ?;", [search_email]).fetchall()
            return True, result
        else:
            print ('FIND_USER_MESSAGE: No corresponding email.')
            return False
    elif current_user:
        result = DB.cursor().execute("SELECT from_user, content FROM Messages WHERE to_user = ?;", [current_user[0][0]]).fetchall()
        return True, result
    else:
        print ('An Exception Occurs In FIND_USER_MESSAGE')
        return False


def add_message(token, message, search_email):
    global DB
    current_user = DB.cursor().execute("SELECT email FROM Logins WHERE token = ?;", [token]).fetchall()
    if search_email == '':
        DB.cursor().execute("INSERT INTO Messages VALUES (?,?,?,?);", [None,current_user[0][0],current_user[0][0],message])
        DB.commit()
        return True
    else:
        result2 = DB.cursor().execute("SELECT email FROM Users WHERE email = ?;", [search_email]).fetchall()
        if result2:
            DB.cursor().execute("INSERT INTO Messages VALUES (?,?,?,?);", [None,search_email,current_user[0][0],message])
            DB.commit()
            return True
        else:
            print ('ADD_MESSAGE: No corresponding email.')
            return False


def check_unique_sign_in_user(email, token):
    global DB
    result = DB.cursor().execute("SELECT token FROM Logins WHERE email = ? and token <> ?;", [email, token]).fetchall()
    if result:
        DB.cursor().execute("DELETE FROM Logins WHERE email = ? and token = ?;", [email, result[0][0]]).fetchall()
        DB.commit()
        print('DATABASE_HELPER:', result[0][0])
        return result[0][0]
    else:
        print ('CHECK_UNIQUE_SIGN_IN_USER: unique logging.')
        return False


def add_viewed_time(viewed_email):
    global DB
    DB.cursor().execute("UPDATE Views SET times = times + 1 WHERE email = ?;", [viewed_email])
    DB.commit()
    return True


def show_chart(email):
    global DB
    num_cur_onlines = DB.cursor().execute("SELECT COUNT(lid) FROM Logins;").fetchall()
    num_posts = DB.cursor().execute("SELECT COUNT(mid) FROM Messages WHERE to_user = ?;", [email]).fetchall()
    num_views = DB.cursor().execute("SELECT times FROM Views WHERE email = ?;", [email]).fetchall()
    return num_cur_onlines[0][0], num_posts[0][0], num_views[0][0]


def close():
    global DB
    DB.close()
    return None