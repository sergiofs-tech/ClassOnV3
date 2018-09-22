'''
Default values, to be used for all environments or overridden by individual environments. An example might be setting
DEBUG = False in config/default.py and DEBUG = True in config/development.py.
'''

DEBUG = True

# MySQL
SECRET_KEY = 'key'
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'classOn1'
MYSQL_DB = 'database_classOn'
MYSQL_CURSORCLASS = 'DictCursor'