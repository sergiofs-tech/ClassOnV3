from flask import render_template, flash, redirect, url_for, session, request, Blueprint
import dataStructures
import logging
from classOn import DBUtils
from classOn.decorators import is_logged_in_professor, defined_session
from classOn.professor import forms
import uuid
from classOn import sessionUtils as su
from classOn import socketio
from flask_socketio import send, emit, join_room, leave_room

'''Register blueprint'''
professor = Blueprint('professor',
                 __name__,
                 template_folder='templates',
                 static_folder='static'
                 )

''' MySQL import '''
from classOn import mysql

''' Global objects import '''
from classOn import runningClasses

@professor.route('/')
@is_logged_in_professor
def index():
    return redirect(url_for('professor.dashboard'))

@professor.route('/dashboard')
@is_logged_in_professor
def dashboard():
    return render_template('dashboard.html')

@professor.route('/create_assigment', methods=['GET', 'POST'])
@is_logged_in_professor
def createAssigment():

    form = forms.CreateAssigmentForm(request.form)

    if (request.method == 'POST' and form.validate()):
        cur = mysql.connection.cursor()

        course = form['course'].data
        name = form['name'].data

        # Put information at DB
        id_professor = su.get_professor_id(session)
        id = DBUtils.putAssigment(course, name, id_professor)
        su.set_assigment_id(session, id)                                        # Store id to add sections
        su.set_orderInAssigment(session, 0)                                     # To be in control adding sections

        return redirect(url_for('professor.addSections', course=course, name=name))

    return render_template('createAssigment.html', form=form)

@professor.route('/add_sections', methods=['GET', 'POST'])
@is_logged_in_professor
def addSections():
    form = forms.AddSectionForm(request.form)

    if (request.method == 'POST' and request.form['btn'] == 'cancel'):
        # Not needed to validate the form
         return redirect(url_for('professor.dashboard'))

    elif (request.method == 'POST' and form.validate()):

        if request.form['btn'] == 'add' or request.form['btn'] == 'addFinish':

            su.increment_orderInAssigment(session)                              # Update order

            id_assigment = su.get_assigment_id(session)
            order_in_assigment = su.get_orderInAssigment(session)
            name = form['name'].data
            text = form['text'].data
            flash('Section saved', 'success')

            DBUtils.putSection(id_assigment, order_in_assigment, name, text)    # Add table row

            if request.form['btn'] == 'add':
                return redirect(url_for('professor.addSections'))
            elif request.form['btn'] == 'addFinish':
                flash('Saved', 'success')
                return redirect(url_for('professor.dashboard'))
            else:
                flash('Something uncontrolled append', 'danger')
                return redirect(url_for('professor.dashboard'))

        else:
            flash('Something uncontrolled happened', 'danger')
            return redirect(url_for('professor.dashboard'))

    ### Fetch info to render ###
    order_in_assigment = su.get_orderInAssigment(session) + 1                   # Do not update here because user can reload the page
    sections = DBUtils.getSections(su.get_assigment_id(session))                # Get sections
    tmpAssigment = dataStructures.Assigment(sections)                           # Create a temporal
    dicSections = tmpAssigment.sections_dict()                                  # Create dict from temporal to render later

    return render_template('addSections.html', form=form, order_in_assigment=order_in_assigment, sections=dicSections)

def assigmentsTupleList(id_professor):
    '''
    Creates a list of tuples (id, title) for the assigments of the current professor (session['id_professor']
    '''
    assigments = []
    cur = mysql.connection.cursor()
    result = cur.execute('SELECT * FROM assigments WHERE id_professor = %s', [id_professor])
    if result > 0:
        # Using the cursor as iterator
        for row in cur:
            tmpTuple = (row['id'], row['name'])
            assigments.append(tmpTuple)

    return assigments

def classroomsTupleList():

    classrooms = []
    cur = mysql.connection.cursor()
    result = cur.execute('SELECT * FROM classrooms')
    if result > 0:
        # Using the cursor as iterator
        for row in cur:
            tmpTuple = (row['id'], row['name'])
            classrooms.append(tmpTuple)

    return classrooms

@professor.route('/create_classroom', methods=['GET', 'POST'])
@is_logged_in_professor
def createClassroom():
    form = forms.CreateClassroom(request.form)

    # Dynamic drop-down menu to choose the available assigments for professor
    assigments = assigmentsTupleList(session['id_professor'])
    blank = (0, 'Select one to open the class')
    assigments = [blank] + assigments
    form.assigment.choices = assigments

    if request.method == 'POST' and form.validate():
        # Form information about the new classroom
        rows = form['rows'].data
        columns = form['columns'].data
        room = form['room'].data
        selectedAssigmentID = form['assigment'].data

        DBUtils.putClassroom(
            rows,
            columns,
            room
        )

        if selectedAssigmentID!=0:

            # Classroom objects initialization
            assigmentObj = DBUtils.getAssigment(selectedAssigmentID)                                        # Object assigment
            currentProfessor = DBUtils.getProfessor(su.get_professor_id(session))                           # Object professor
            classroom = dataStructures.Classroom((rows, columns), currentProfessor, assigmentObj, room)     # Object ClassRoom
            runningClasses[classroom.id] = classroom                                                        # Add to runningClasses (dict) with id to be able to track different courses
            su.set_class_id(session, classroom.id)                                                          # Add to professor's session

            return redirect(url_for('professor.classroom'))

        else:
            return render_template('dashboard.html', form=form)

    return render_template('createClassroom.html', form=form)

@professor.route('/open_classroom', methods=['GET', 'POST'])
@is_logged_in_professor
def openClassroom():
    form = forms.OpenClassroom(request.form)

    # Dynamic drop-down menu to choose the available assigments for professor
    assigments = assigmentsTupleList(session['id_professor'])
    form.assigment.choices = assigments

    classrooms = classroomsTupleList()
    form.classroom.choices = classrooms


    if (request.method == 'POST' and form.validate()):
        # Form information about the new classroom

        selectedAssigmentID = form['assigment'].data
        selectedClassroomID = form['classroom'].data

        # Classroom objects initialization
        classroomObj = DBUtils.getClassroom(selectedClassroomID)
        assigmentObj = DBUtils.getAssigment(selectedAssigmentID)
        rows = int(float(classroomObj.rows))
        columns = int(float(classroomObj.columns))
        room = classroomObj.name

        # Object assigment
        currentProfessor = DBUtils.getProfessor(su.get_professor_id(session))                           # Object professor
        classroom = dataStructures.Classroom((rows, columns), currentProfessor, assigmentObj, room)     # Object ClassRoom
        runningClasses[classroom.id] = classroom                                                        # Add to runningClasses (dict) with id to be able to track different courses
        su.set_class_id(session, classroom.id)                                                          # Add to professor's session

        return redirect(url_for('professor.classroom'))
    return render_template('openClassroom.html', form=form)

@professor.route('/classroom')
@is_logged_in_professor
@defined_session
def classroom():
    rows = runningClasses[su.get_class_id(session)].classSize[0]
    columns = runningClasses[su.get_class_id(session)].classSize[1]
    name = runningClasses[su.get_class_id(session)].room

    return render_template('classroomMap.html', rows=rows, columns=columns, name=name)

''' Socket.io'''
@socketio.on('updateCredentials')
def handle_connection():
    selectedRunningClass = runningClasses[su.get_class_id(session)]
    su.set_classRoom(session, selectedRunningClass.id)
    su.set_ownRoom(session, request.sid)
    join_room(selectedRunningClass.id)

@socketio.on('classroom_query')
def hadle_queryDoubts():
    currentClass = runningClasses[su.get_class_id(session)]
    stateJson = currentClass.JSON()
    room = su.get_ownRoom(session)
    socketio.emit('classroom_query_result', stateJson, room=room)

@socketio.on('professor_time')
def handle_time(doubtId, time):
    print(str(doubtId) + ', ' + time)