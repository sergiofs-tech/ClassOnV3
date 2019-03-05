from flask import render_template, flash, redirect, url_for, session, request, Blueprint
# from wtforms import Form, StringField, PasswordField, validators
# from passlib.hash import sha256_crypt
# from functools import wraps
from dataStructures import Doubt, Section, Assigment
from classOn.decorators import is_logged_in
from classOn import DBUtils
from classOn import sessionUtils as su
from classOn.assigment import forms
from classOn import sessionUtils as su
from flask_socketio import SocketIO, join_room, leave_room

'''Register blueprint'''
assigment = Blueprint('assigment',
                 __name__,
                 template_folder='templates',
                 static_folder='static'
                 )

group_id_aux = 0;
class_id_aux = 0;
doubts_container = [];

''' MySQL import '''
from classOn import mysql
from classOn import runningClasses
from classOn import socketio
from dataStructures import StudentGroup

def setAssigment():
    # global assigment_global                       # Used in this scope
    DB_Assigment = None
    cur = mysql.connection.cursor()
    assig_query = cur.execute("SELECT * FROM assigments")
    #close connection
    if assig_query > 0:
        # Just get's one supports just one assigment in DB
        assig = cur.fetchone()                       # Dictionary
        # Get sections
        id = assig['id']
        sections_query = cur.execute("SELECT * FROM sections WHERE assigment = %s", [id])
        if sections_query > 0:
            tmpSections = []
            sections = cur.fetchall()
            for section in sections:
                tmpSection = Section(
                    section['id'],
                    section['title'],
                    section['order_in_assigment'],
                    section['content']
                )
                tmpSections.append(tmpSection)
            DB_Assigment = Assigment(tmpSections, assig['course'])

    cur.close()
    return DB_Assigment

def ProgressPercentaje(currentPage, totalPages):
    return 100/totalPages * currentPage

@assigment.route('/<string:id>/<string:page>', methods=['GET', 'POST'])
@is_logged_in                                               # Uses the flask decorator to check if is logged in
def assigmentByID(id, page):
    page_no = int(page)                                     # Conversion to int
    assigment = DBUtils.getAssigment(id)                    # Get requested assigment (db_id -> id)
    currentClass = runningClasses[su.get_class_id(session)]

    global class_id_aux
    class_id_aux =  su.get_class_id(session)
    print('class id aux 1: ' + str(class_id_aux))

    global group_id_aux
    group_id_aux = su.get_grupo_id(session)
    print('group_id_aux 1: ' + str(group_id_aux))


    currentGroup = currentClass.studentGroups[su.get_grupo_id(session)]

    form = forms.PostDoubtForm(request.form)

    if assigment is None:
        # Doesn't exist an assigment with the requested id
        flash('Doesn\'t exists an assigment with id: ' + str(id) , 'danger')
    else:
        # If zero last one visited in session
        if page_no == 0:
            page_no = su.get_page(session)                  # Render last visited
        else:
            su.set_page(session, page_no)                   # Update session
            currentGroup.assigmentProgress = page_no        # Update group obj

        totalSections = len(assigment.sections)
        progress = ProgressPercentaje(page_no, totalSections)

        if totalSections > 0:
            if page_no > 0 and page_no <= len(assigment.sections):
                # The requested page exists
                updateGroupAssigmentProgress(page_no)     # Notify
                return render_template(
                    'assigment.html',
                    assigment=assigment,
                    progress=progress,
                    page=page_no,
                    totalSections=totalSections,
                    section=assigment.sections_dict()[page_no - 1],  # -1 Because the computer starts counting at 0
                    form=form
                )
            else:
                # Error
                flash('Requested page out of bounds', 'danger')
        else:
            # Error
            flash('No sections in current assigment', 'danger')

''' SOCKET.IO '''
@socketio.on('updateCredentials')
def handle_connection():
    selectedRunningClass = runningClasses[su.get_class_id(session)]
    su.set_classRoom(session, selectedRunningClass.id)
    su.set_ownRoom(session, request.sid)
    join_room(selectedRunningClass.id)

@socketio.on('changePage')
def updateGroupAssigmentProgress(progress):
    '''
    Updates the assigment progress to all the interested.
    IMPROVE: In order to improve this, we can create groups to send the info only to interested clients.
    :param groupID:
    :param progress:
    :return:
    '''
    print('updateGroupAssigmentProgress()')
    selectedRunningClass = runningClasses[su.get_class_id(session)]
    currentGroup = selectedRunningClass.studentGroups[su.get_grupo_id(session)]
    currentGroup.assigmentProgress = progress
    su.set_classRoom(session, selectedRunningClass.id)
    handle_assigmentChangePage(currentGroup)

def handle_assigmentChangePage(group : StudentGroup):
    room = su.get_classRoom(session)
    socketio.emit('assigment_changeProgress', group.JSON())

@socketio.on('doubt_post')
def handle_postDoubt(text, groupId):
    '''
    New doubt from a student. Stores the doubt in the system and send it to all other students and professor
    :param text:
    :return:
    '''
    print('HANDLE_ POST DOUBT')
    print('DUDA group_id_aux 2: ' + str(group_id_aux))
    print('DUDA class id aux 2: ' + str(class_id_aux))

    currentClass = runningClasses[class_id_aux]
    group = currentClass.studentGroups[groupId]
    page_no = group.assigmentProgress

    doubtText = text
    doubt = Doubt(doubtText, currentClass.assigment.sections[page_no - 1], group)
    doubt.postToDB()
    currentClass.addDoubt(doubt)

    group.doubts.append(doubt)

    # Notify to Professor and Students
    # room = su.get_classRoom(session)
    socketio.emit('doubt_new', doubt.JSON())

@socketio.on('get_doubts1')
def handle_get_doubts():

    print('HANDLE_ get_doubts')
    socketio.emit('get_doubts2', doubts_container)

@socketio.on('set_doubts')
def handle_set_doubts(doubts):

    print('HANDLE_ set_doubts')
    global doubts_container
    doubts_container = doubts

@socketio.on('get_user')
def handle_getUser():

    print('HANDLE_ GET USER')
    currentClass = runningClasses[class_id_aux]
    currentGroup = currentClass.studentGroups[group_id_aux]
    socketio.emit('get_user', currentGroup.JSON())


@socketio.on('doubt_query')
def hadle_queryDoubts():
    '''
    Handles a petition for all doubts and answers in the system. Sends the doubts to how asked for them.
    :return:
    '''
    print('handle_queryDoubts')
    # currentClass = runningClasses[su.get_class_id(session)]
    # doubtsJson = currentClass.JSON()                                # JSON string with doubts structure
    # room = su.get_ownRoom(session)                                  # Who asked for doubts
    # socketio.emit('doubt_query_result', doubtsJson, room=room)

@socketio.on('answer_post')
def handle_answerPost(doubtId, answer):
    # $$$$ Professors are not supported to solve doubts
    currentClass = runningClasses[su.get_class_id(session)]
    solvedDoubt = currentClass.getDoubt(doubtId)                    # We are using variables in memory
    solver = DBUtils.getStudentBy_id(su.get_student_id(session))    # Student solver
    room = su.get_classRoom(session)                                # Room to send the response

    # Update currentClass.doubts and db
    solvedDoubt.add_Answer(answer, solver)                          # Do not use DBUtils.

    answerJson = '{"doubtid":' + str(doubtId) + ',"text":"' + answer + '"}'
    socketio.emit('new_answer', answerJson, room=room)

@socketio.on('solve_doubt')
def handle_solvedDoubt(data):
    print('handle_solvedDoubt')
    currentClass = runningClasses[class_id_aux]     
    currentGroup = currentClass.studentGroups[group_id_aux]
    data= currentGroup
    socketio.emit('the_doubt_solved', data)