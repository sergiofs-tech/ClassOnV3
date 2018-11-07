from wtforms import Form, StringField, PasswordField, validators, IntegerField, SelectField
from wtforms.widgets import TextArea
from wtforms.fields import TextAreaField

class CreateAssigmentForm(Form):
    course = StringField('Course', [validators.Length(min = 1, max=100)])
    name = StringField('Name', [validators.Length(min=1, max=100)])

class AddSectionForm(Form):
    name = StringField('Name', [validators.Length(min = 1, max=100)])
    text = TextAreaField('Text', render_kw={"rows": 15})

class CreateClassroom(Form):
    rows = IntegerField('Rows', [validators.required()])
    columns = IntegerField('Columns', [validators.required()])
    room = StringField('Room name', [validators.Length(min=1, max=100)])
    assigment = SelectField(u'Assignments',  coerce=int)

class OpenClassroom(Form):
    assigment = SelectField(u'Assignments', [validators.required()],  coerce=int)
    classroom = SelectField(u'Classroom', [validators.required()],  coerce=int)
