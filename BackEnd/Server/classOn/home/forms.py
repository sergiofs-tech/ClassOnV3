from wtforms import Form, StringField, PasswordField, validators

# Register form class
class RegisterFormStudent(Form):
    name = StringField('Name', [validators.Length(min = 1, max=100)])
    lastName = StringField('First last name', [validators.Length(min = 1, max=100)])
    lastNameSecond = StringField('Second last name', [validators.Length(min = 0, max=100)])
    nia = StringField('NIA', [validators.Length(min = 9, max=9)])
    email = StringField('Email', [validators.Length(min=1, max=100)])
    password = PasswordField('Password',[
        validators.DataRequired(),
        validators.EqualTo('confirm', message='Passwords do not match')
    ])
    confirm = PasswordField('Confirm Password')

# Register form class
class RegisterFormProfessor(Form):
    name = StringField('Name', [validators.Length(min = 1, max=100)])
    lastName = StringField('First last name', [validators.Length(min = 1, max=100)])
    lastNameSecond = StringField('Second last name', [validators.Length(min = 0, max=100)])
    email = StringField('Email', [validators.Length(min=1, max=100)])
    password = PasswordField('Password',[
        validators.DataRequired(),
        validators.EqualTo('confirm', message='Passwords do not match')
    ])
    confirm = PasswordField('Confirm Password')